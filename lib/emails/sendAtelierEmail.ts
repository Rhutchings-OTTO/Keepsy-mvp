/**
 * Sends Atelier "creation" email after checkout.
 * Uses Resend when RESEND_API_KEY is set; no-op otherwise.
 */
import { Resend } from "resend";
import { AtelierCreationEmail } from "@/lib/emails/atelierTemplates";
import { getAtelierEmailPlain, type AtelierEmailParams } from "@/content/atelierEmails";

const FROM = process.env.EMAIL_FROM || "Keepsy <hello@keepsy.store>";
const RESEND_API_KEY = process.env.RESEND_API_KEY;

export async function sendAtelierCreationEmail(params: AtelierEmailParams & { to: string }): Promise<boolean> {
  if (!RESEND_API_KEY) {
    if (process.env.NODE_ENV !== "production") {
      console.log("[email] RESEND_API_KEY not set, skipping Atelier creation email to", params.to);
    }
    return false;
  }

  const resend = new Resend(RESEND_API_KEY);
  const { subject, body } = getAtelierEmailPlain("creation", params);

  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: params.to,
      subject,
      react: AtelierCreationEmail(params),
      text: body,
    });
    if (error) {
      console.error("[email] Atelier creation send failed:", error);
      return false;
    }
    return true;
  } catch (e) {
    console.error("[email] Atelier creation send error:", e);
    return false;
  }
}
