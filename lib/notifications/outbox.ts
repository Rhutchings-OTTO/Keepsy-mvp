import type { SupabaseClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import webpush from "web-push";
import { createHash } from "node:crypto";
import { ownerAllowlist } from "@/lib/admin/ownerAllowlist";
import { getEmailFrom } from "@/lib/crm/site";
export type OwnerAlert = {
  key: string;
  kind: string;
  title: string;
  body: string;
  orderRef?: string;
  severity: "info" | "warning" | "critical";
  url?: string;
};
export async function enqueueOwnerNotification(
  db: SupabaseClient,
  a: OwnerAlert,
) {
  const { error } = await db.from("notification_outbox").upsert(
    {
      dedupe_key: a.key,
      kind: a.kind,
      title: a.title,
      body: a.body,
      order_ref: a.orderRef || null,
      severity: a.severity,
      url: a.url || "/admin/orders",
    },
    { onConflict: "dedupe_key", ignoreDuplicates: true },
  );
  if (error) throw new Error("Could not queue owner alert");
}
export function validPushEndpoint(endpoint: string) {
  try {
    const u = new URL(endpoint);
    return (
      u.protocol === "https:" &&
      !u.username &&
      !u.password &&
      (!u.port || u.port === "443") &&
      [
        "fcm.googleapis.com",
        "updates.push.services.mozilla.com",
        "web.push.apple.com",
      ].some((h) => u.hostname === h || u.hostname.endsWith("." + h))
    );
  } catch {
    return false;
  }
}
type Notice = {
  id: string;
  title: string;
  body: string;
  url: string;
  attempts: number;
  channels: Record<string, boolean>;
};
export async function drainOwnerNotifications(db: SupabaseClient) {
  const hasEmail = !!process.env.RESEND_API_KEY,
    hasPush =
      !!process.env.VAPID_PUBLIC_KEY &&
      !!process.env.VAPID_PRIVATE_KEY &&
      !!process.env.VAPID_SUBJECT;
  if (!hasEmail && !hasPush) return { sent: 0, configured: false };
  const { data, error } = await db.rpc("claim_owner_notifications", {
    batch_size: 10,
  });
  if (error) throw new Error("Owner queue unavailable");
  const owners = ownerAllowlist();
  const { data: prefs } = await db
    .from("owner_alert_prefs")
    .select("user_id,email,email_enabled,push_enabled");
  const { data: subs } = await db
    .from("owner_push_subscriptions")
    .select("*")
    .is("disabled_at", null);
  if (hasPush)
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT!,
      process.env.VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!,
    );
  let sent = 0;
  for (const row of (data || []) as Notice[]) {
    const delivered = { ...(row.channels || {}) };
    let failures = 0,
      targets = 0;
    if (hasEmail)
      for (const email of owners) {
        if (prefs?.some((p) => p.email === email && p.email_enabled === false))
          continue;
        targets++;
        const key = "email:" + email;
        if (delivered[key]) continue;
        try {
          const result = await new Resend(
            process.env.RESEND_API_KEY,
          ).emails.send(
            {
              from: getEmailFrom(),
              to: email,
              subject: row.title,
              text: row.body + "\n\nhttps://www.keepsy.store" + row.url,
            },
            { idempotencyKey: "owner/" + row.id + "/" + email },
          );
          if (result.error || !result.data?.id) throw new Error("Email failed");
          delivered[key] = true;
        } catch {
          failures++;
        }
      }
    if (hasPush)
      for (const sub of subs || []) {
        const pref = prefs?.find((p) => p.user_id === sub.user_id);
        if (
          !pref ||
          !owners.includes(pref.email) ||
          pref.push_enabled === false ||
          !validPushEndpoint(sub.endpoint)
        )
          continue;
        targets++;
        const key =
          "push:" + createHash("sha256").update(sub.endpoint).digest("hex");
        if (delivered[key]) continue;
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            JSON.stringify({
              title: row.title,
              body: row.body,
              url: row.url,
              tag: row.id,
            }),
            { TTL: 3600, timeout: 10000 },
          );
          delivered[key] = true;
          await db
            .from("owner_push_subscriptions")
            .update({ last_success_at: new Date().toISOString() })
            .eq("id", sub.id);
        } catch (e) {
          const status = (e as { statusCode?: number }).statusCode;
          if (status === 404 || status === 410)
            await db
              .from("owner_push_subscriptions")
              .update({ disabled_at: new Date().toISOString() })
              .eq("id", sub.id);
          else failures++;
        }
      }
    const done = targets > 0 && failures === 0;
    const { error: save } = await db
      .from("notification_outbox")
      .update({
        status: done
          ? "sent"
          : Object.keys(delivered).length
            ? "partial"
            : "failed",
        channels: delivered,
        lease_until: null,
        sent_at: done ? new Date().toISOString() : null,
        last_error: done
          ? null
          : targets
            ? "Some channels failed"
            : "No enabled owner devices or recipients",
        next_attempt_at: new Date(
          Date.now() + Math.min(60, 2 ** row.attempts) * 60000,
        ).toISOString(),
      })
      .eq("id", row.id);
    if (done && !save) sent++;
  }
  return { sent, configured: true };
}
