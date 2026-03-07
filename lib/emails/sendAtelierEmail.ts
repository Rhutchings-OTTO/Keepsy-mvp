/**
 * Sends Atelier "creation" email after checkout.
 * Uses Resend when RESEND_API_KEY is set; no-op otherwise.
 */
import { Resend } from "resend";
import { AtelierCreationEmail } from "@/lib/emails/atelierTemplates";
import { getAtelierEmailPlain, type AtelierEmailParams } from "@/content/atelierEmails";

export type EmailResult = { ok: boolean; error?: string };

/**
 * @deprecated No longer called from the Stripe webhook — replaced by sendOrderConfirmationEmail
 * in lib/emails/orderEmails.tsx. Can be safely removed once confirmed no other callers exist.
 */
export async function sendAtelierCreationEmail(
  params: AtelierEmailParams & { to: string }
): Promise<EmailResult> {
  const resendApiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "Keepsy <hello@keepsy.store>";

  if (!resendApiKey) {
    console.error("[email] RESEND_API_KEY not set, skipping Atelier creation email to", params.to);
    return { ok: false, error: "RESEND_API_KEY not set" };
  }

  const resend = new Resend(resendApiKey);
  const { subject, body } = getAtelierEmailPlain("creation", params);

  try {
    const { error } = await resend.emails.send({
      from,
      to: params.to,
      subject,
      react: AtelierCreationEmail(params),
      text: body,
    });

    if (error) {
      console.error("[email] Atelier creation send failed:", error);
      return { ok: false, error: JSON.stringify(error) };
    }
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : JSON.stringify(e);
    console.error("[email] Atelier creation send error:", e);
    return { ok: false, error: msg };
  }
}
