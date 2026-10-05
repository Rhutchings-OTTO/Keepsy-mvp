import { z } from "zod";
import { after } from "next/server";
import { requireOwner } from "@/lib/admin/ownerAuth";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { guardOrigin, getRequestId } from "@/lib/security/withSecurity";
import { drainEmailQueue } from "@/lib/email/queue";
import { getSiteUrl } from "@/lib/crm/site";
const schema = z
  .object({
    action: z.enum(["preview", "queue"]),
    id: z.string().uuid().optional(),
    subject: z.string().trim().min(1).max(150),
    body: z.string().trim().min(1).max(6000),
  })
  .strict();
export async function POST(req: Request) {
  const denied = guardOrigin(req, "/api/email/campaigns", getRequestId(req));
  if (denied) return denied;
  const a = await requireOwner();
  if (!a.ok) return a.response;
  const b = schema.safeParse(await req.json().catch(() => null));
  if (!b.success)
    return Response.json(
      { error: "Check the subject and message." },
      { status: 400 },
    );
  const db = getSupabaseAdmin();
  if (!db) return Response.json({ error: "Unavailable" }, { status: 503 });
  try {
    const { count, error: countError } = await db
      .from("contacts")
      .select("id", { head: true, count: "exact" })
      .eq("marketing_status", "opted_in");
    if (countError) throw countError;
    if (b.data.action === "preview") {
      const { data, error } = await db
        .from("campaigns")
        .insert({
          name: b.data.subject,
          subject: b.data.subject,
          content: {
            subject: b.data.subject,
            headline: b.data.subject,
            body: b.data.body,
            ctaLabel: "Create a gift",
            ctaUrl: getSiteUrl() + "/create",
            siteUrl: getSiteUrl(),
          },
          created_by: a.owner.email,
        })
        .select("id")
        .single();
      if (error) throw error;
      return Response.json({ id: data.id, count: count || 0 });
    }
    if (!b.data.id)
      return Response.json(
        { error: "Save and review first." },
        { status: 400 },
      );
    const { data: campaign, error } = await db
      .from("campaigns")
      .select("*")
      .eq("id", b.data.id)
      .single();
    if (error || !campaign) throw new Error("Missing draft");
    if (
      campaign.subject !== b.data.subject ||
      campaign.content.body !== b.data.body
    )
      return Response.json(
        { error: "The draft changed. Review it again." },
        { status: 409 },
      );
    if (!["draft", "ready", "sending"].includes(campaign.status))
      return Response.json(
        { error: "This campaign cannot be sent." },
        { status: 409 },
      );
    if (process.env.EMAIL_QUEUE_ENABLED !== "true")
      return Response.json(
        {
          error:
            "Email sending is paused. Configure the sender and delivery webhook first.",
        },
        { status: 503 },
      );
    // Deterministic recipient keys make repeated requests safe; no campaign is marked ready until enqueue succeeds.
    for (let offset = 0; offset < (count || 0); offset += 500) {
      const { data: contacts, error } = await db
        .from("contacts")
        .select("id,email")
        .eq("marketing_status", "opted_in")
        .order("id")
        .range(offset, offset + 499);
      if (error) throw error;
      if (contacts?.length) {
        const { error: queueError } = await db.from("email_queue").upsert(
          contacts.map((c) => ({
            contact_id: c.id,
            to_email: c.email,
            dedupe_key: "campaign:" + campaign.id + ":" + c.id,
            campaign_id: campaign.id,
            template_key: "campaign-generic",
            payload: campaign.content,
          })),
          { onConflict: "dedupe_key", ignoreDuplicates: true },
        );
        if (queueError) throw queueError;
      }
    }
    const { error: updateError } = await db
      .from("campaigns")
      .update({ status: "ready" })
      .eq("id", campaign.id);
    if (updateError) throw updateError;
    after(async () => {
      await drainEmailQueue(db);
    });
    return Response.json({ ok: true });
  } catch {
    return Response.json(
      { error: "Campaign could not be saved. Please retry." },
      { status: 503 },
    );
  }
}
