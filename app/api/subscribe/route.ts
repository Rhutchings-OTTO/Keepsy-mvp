import { after } from "next/server";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import {
  guardOrigin,
  guardRateLimit,
  getRequestId,
} from "@/lib/security/withSecurity";
import { parseAndValidate } from "@/lib/http/validate";
import { recordConsent, countPaidOrdersForEmail } from "@/lib/crm/contacts";
import { CURRENT_NEWSLETTER_CONSENT_VERSION } from "@/lib/crm/consentText";
import {
  issueWelcomeCode,
  isWelcomeIssuanceConfigured,
  canonicalEmail,
} from "@/lib/commerce/discounts";
import { clientIpFromHeaders, hashIp, safeUserAgent } from "@/lib/crm/ipHash";
import { enqueueEmail, enqueueTips, drainEmailQueue } from "@/lib/email/queue";
import { getSiteUrl } from "@/lib/crm/site";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const schema = z
  .object({
    email: z.string().email().max(254),
    consent: z.literal(true),
    consentTextVersion: z.literal(CURRENT_NEWSLETTER_CONSENT_VERSION),
    source: z.enum(["homepage", "footer", "create-exit", "checkout"]),
    honeypot: z.string().max(0).optional(),
  })
  .strict();
export async function POST(req: Request) {
  const rid = getRequestId(req);
  const denied = guardOrigin(req, "/api/subscribe", rid);
  if (denied) return denied;
  const rl = await guardRateLimit(req, "/api/subscribe", "POST", rid);
  if ("response" in rl) return rl.response;
  const parsed = await parseAndValidate(req, schema, 4096);
  if ("error" in parsed)
    return Response.json(parsed.error, { status: parsed.status });
  const db = getSupabaseAdmin();
  if (
    !db ||
    !isWelcomeIssuanceConfigured() ||
    !process.env.RESEND_API_KEY ||
    process.env.EMAIL_QUEUE_ENABLED !== "true"
  )
    return Response.json(
      {
        error:
          "Email signup is temporarily unavailable. Please try again soon.",
      },
      { status: 503 },
    );
  try {
    const b = parsed.data;
    const { contact } = await recordConsent(db, {
      email: b.email,
      source: b.source,
      decision: "opt_in",
      textVersion: b.consentTextVersion,
      ipHash: await hashIp(clientIpFromHeaders(req.headers)),
      userAgent: safeUserAgent(req.headers.get("user-agent")),
    });
    if (contact.marketing_status !== "opted_in")
      return Response.json({ ok: true, state: "queued" });
    if ((await countPaidOrdersForEmail(db, b.email)) > 0) {
      await enqueueTips(db, contact);
      return Response.json({ ok: true, state: "existing_customer" });
    }
    const canonical = canonicalEmail(b.email);
    const { data: existingCode, error: lookupError } = await db
      .from("discount_codes")
      .select("code,expires_at")
      .eq("email_canonical", canonical)
      .eq("offer_id", "welcome10")
      .maybeSingle();
    let code = existingCode;
    if (lookupError) throw new Error("Code lookup failed");
    if (!code) {
      const issued = await issueWelcomeCode();
      const result = await db
        .from("discount_codes")
        .insert({
          code: issued.code,
          offer_id: issued.offerId,
          percent: issued.percent,
          email: b.email.toLowerCase(),
          email_canonical: canonical,
          text_version: issued.textVersion,
          issued_source: b.source,
          issued_at: issued.issuedAt,
          expires_at: issued.expiresAt,
        })
        .select("code,expires_at")
        .single();
      if (result.error && result.error.code !== "23505")
        throw new Error("Cannot issue code");
      code = result.data;
      if (!code) {
        const again = await db
          .from("discount_codes")
          .select("code,expires_at")
          .eq("email_canonical", canonical)
          .eq("offer_id", "welcome10")
          .single();
        code = again.data;
      }
    }
    if (!code) throw new Error("Code unavailable");
    await enqueueEmail(db, {
      contactId: contact.id,
      email: contact.email,
      key: "welcome:" + contact.id,
      template: "welcome",
      payload: {
        code: code.code,
        expiresAt: code.expires_at,
        siteUrl: getSiteUrl(),
      },
    });
    await enqueueTips(db, contact);
    after(async () => {
      await drainEmailQueue(db);
    });
    return Response.json(
      { ok: true, state: "queued" },
      { headers: rl.headers },
    );
  } catch {
    return Response.json(
      { error: "We couldn't save your signup. Please try again." },
      { status: 503 },
    );
  }
}
