// lib/notifications.ts
// Fire-and-forget email alerts to founders via Resend.
// Never throws — used inside catch blocks and should not cause cascading failures.

import { Resend } from "resend";

const FROM = process.env.EMAIL_FROM || "Keepsy Alerts <hello@keepsy.store>";

function getFounderEmails(): string[] {
  const emails: string[] = [];
  if (process.env.FOUNDER_EMAIL_1) emails.push(process.env.FOUNDER_EMAIL_1);
  if (process.env.FOUNDER_EMAIL_2) emails.push(process.env.FOUNDER_EMAIL_2);
  return emails;
}

export type AlertSeverity = "critical" | "warning" | "info";

export async function notifyFounders(
  subject: string,
  body: string,
  severity: AlertSeverity = "warning"
): Promise<void> {
  const resendKey = process.env.RESEND_API_KEY;
  const founders = getFounderEmails();
  if (!resendKey || founders.length === 0) {
    console.warn("[notify] RESEND_API_KEY or founder emails not set, skipping alert:", subject);
    return;
  }

  const severityPrefix = severity === "critical" ? "🚨 CRITICAL: " : severity === "warning" ? "⚠️ " : "📊 ";

  try {
    const resend = new Resend(resendKey);
    await resend.emails.send({
      from: FROM,
      to: founders,
      subject: `${severityPrefix}${subject}`,
      text: `${body}\n\n---\nSent by Keepsy alert system at ${new Date().toISOString()}`,
    });
  } catch (err) {
    // Intentionally swallowed — alerts must never break the main flow
    console.error("[notify] Failed to send founder alert:", err instanceof Error ? err.message : err);
  }
}
