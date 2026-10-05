import { Resend } from "resend";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getContactById, isSuppressed } from "@/lib/crm/contacts";
import type { EmailQueueRow } from "@/lib/crm/types";
import { renderTemplate, type TemplateKey } from "./templates";
import {
  getEmailFrom,
  getSiteUrl,
  unsubscribePageUrl,
  unsubscribeOneClickUrl,
} from "@/lib/crm/site";

export async function enqueueEmail(
  db: SupabaseClient,
  input: {
    contactId: string;
    email: string;
    key: string;
    template: TemplateKey;
    payload?: Record<string, unknown>;
    dueAt?: string;
    campaignId?: string;
  },
) {
  const { error } = await db.from("email_queue").upsert(
    {
      contact_id: input.contactId,
      to_email: input.email,
      dedupe_key: input.key,
      template_key: input.template,
      payload: input.payload || {},
      next_attempt_at: input.dueAt || new Date().toISOString(),
      campaign_id: input.campaignId || null,
    },
    { onConflict: "dedupe_key", ignoreDuplicates: true },
  );
  if (error) throw new Error("Cannot queue email: " + error.message);
}
export async function enqueueTips(
  db: SupabaseClient,
  contact: { id: string; email: string; first_name?: string | null },
) {
  await enqueueEmail(db, {
    contactId: contact.id,
    email: contact.email,
    key: "tips:" + contact.id,
    template: "onboarding-tips",
    payload: { siteUrl: getSiteUrl(), firstName: contact.first_name },
    dueAt: new Date(Date.now() + 3 * 86400000).toISOString(),
  });
}
export function mayEmail(status: string, suppressed: boolean) {
  return status === "opted_in" && !suppressed;
}
export async function drainEmailQueue(db: SupabaseClient) {
  if (process.env.EMAIL_QUEUE_ENABLED !== "true" || !process.env.RESEND_API_KEY)
    return { enabled: false, sent: 0 };
  const { data, error } = await db.rpc("claim_email_queue", { batch_size: 10 });
  if (error) throw new Error("Email queue unavailable");
  const resend = new Resend(process.env.RESEND_API_KEY);
  let sent = 0;
  for (const row of (data || []) as EmailQueueRow[]) {
    try {
      const contact = await getContactById(db, row.contact_id);
      if (
        !contact ||
        !mayEmail(
          contact.marketing_status,
          await isSuppressed(db, contact.email),
        )
      ) {
        await db
          .from("email_queue")
          .update({
            status: "skipped",
            skip_reason: "No current marketing consent",
            lease_until: null,
          })
          .eq("id", row.id);
        continue;
      }
      if (row.campaign_id) {
        const { data: campaign } = await db
          .from("campaigns")
          .select("status")
          .eq("id", row.campaign_id)
          .single();
        if (!campaign || !["ready", "sending"].includes(campaign.status)) {
          await db
            .from("email_queue")
            .update({
              status: "queued",
              attempts: Math.max(0, row.attempts - 1),
              first_attempt_at:
                row.attempts === 1 ? null : row.first_attempt_at,
              lease_until: null,
              next_attempt_at: new Date(Date.now() + 3600000).toISOString(),
            })
            .eq("id", row.id);
          continue;
        }
      }
      const rendered = await renderTemplate(row.template_key, row.payload, {
        unsubscribeUrl: unsubscribePageUrl(contact.unsubscribe_token),
      });
      const result = await resend.emails.send(
        {
          from: getEmailFrom(),
          to: row.to_email,
          ...rendered,
          headers: {
            "List-Unsubscribe":
              "<" + unsubscribeOneClickUrl(contact.unsubscribe_token) + ">",
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          },
        },
        { idempotencyKey: "keepsy-email/" + row.id },
      );
      if (result.error || !result.data?.id)
        throw new Error(
          result.error?.message || "Email provider did not acknowledge",
        );
      const { error: saveError } = await db
        .from("email_queue")
        .update({
          status: "sent",
          provider_message_id: result.data.id,
          sent_at: new Date().toISOString(),
          consent_checked_at: new Date().toISOString(),
          lease_until: null,
          last_error: null,
        })
        .eq("id", row.id);
      if (saveError)
        throw new Error("Delivery accepted; acknowledgement needs retry");
      sent++;
    } catch (e) {
      await db
        .from("email_queue")
        .update({
          status: "failed",
          lease_until: null,
          last_error:
            e instanceof Error ? e.message.slice(0, 300) : "Delivery failed",
          next_attempt_at: new Date(
            Date.now() + Math.min(60, 2 ** row.attempts) * 60000,
          ).toISOString(),
        })
        .eq("id", row.id);
    }
  }
  return { enabled: true, sent };
}
