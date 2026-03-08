/**
 * POST /api/sar
 * Handles GDPR Subject Access Requests by emailing hello@keepsy.store with the request details.
 */
import { Resend } from "resend";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const FROM = process.env.EMAIL_FROM || "Keepsy <hello@keepsy.store>";
const SAR_RECIPIENT = "hello@keepsy.store";

const VALID_REQUEST_TYPES = [
  "Access my data",
  "Delete my data",
  "Correct my data",
  "Data portability",
];

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const email =
    body && typeof body === "object" && "email" in body
      ? String((body as { email: unknown }).email).trim()
      : "";

  const requestType =
    body && typeof body === "object" && "requestType" in body
      ? String((body as { requestType: unknown }).requestType).trim()
      : "";

  if (!email || !isValidEmail(email)) {
    return Response.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  if (!requestType || !VALID_REQUEST_TYPES.includes(requestType)) {
    return Response.json({ error: "Please select a valid request type." }, { status: 400 });
  }

  const resend = getResend();
  if (!resend) {
    console.error("[sar] RESEND_API_KEY not set");
    return Response.json({ error: "Email service not configured." }, { status: 500 });
  }

  const submittedAt = new Date().toUTCString();

  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: SAR_RECIPIENT,
      replyTo: email,
      subject: `GDPR Subject Access Request: ${requestType} — ${email}`,
      text: `New GDPR Subject Access Request\n\nEmail: ${email}\nRequest Type: ${requestType}\nSubmitted: ${submittedAt}\n\nPlease respond within 30 days as required by UK GDPR.\n\nYou can reply directly to this email to contact the requester.`,
      html: `<!DOCTYPE html>
<html>
<body style="font-family: Georgia, serif; background-color: #F9F8F6; color: #2D2926; margin: 0; padding: 40px 20px;">
  <div style="max-width: 520px; margin: 0 auto;">
    <p style="font-size: 11px; font-weight: 700; letter-spacing: 0.22em; text-transform: uppercase; color: #C4714A; margin-bottom: 12px;">GDPR Request</p>
    <h1 style="font-family: Georgia, serif; font-size: 22px; font-weight: 700; color: #2D2926; margin: 0 0 20px; line-height: 1.2;">Subject Access Request Received</h1>
    <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
      <tr>
        <td style="padding: 10px 12px; background: #F0EBE4; font-weight: 600; width: 140px; border-radius: 6px 0 0 6px;">Email</td>
        <td style="padding: 10px 12px; background: #F0EBE4;">${email}</td>
      </tr>
      <tr>
        <td style="padding: 10px 12px; font-weight: 600;">Request Type</td>
        <td style="padding: 10px 12px;">${requestType}</td>
      </tr>
      <tr>
        <td style="padding: 10px 12px; background: #F0EBE4; font-weight: 600;">Submitted</td>
        <td style="padding: 10px 12px; background: #F0EBE4;">${submittedAt}</td>
      </tr>
    </table>
    <hr style="border-top: 1px solid rgba(45,41,38,0.08); margin: 28px 0;" />
    <p style="font-size: 14px; color: rgba(45,41,38,0.7); line-height: 1.7;">
      You must respond to this request within <strong>30 days</strong> as required by UK GDPR (Art. 12).
      Reply to this email to contact the requester directly.
    </p>
  </div>
</body>
</html>`,
    });

    if (error) {
      console.error("[sar] Failed to send SAR email:", error);
      return Response.json({ error: "Failed to submit request. Please try again." }, { status: 500 });
    }
  } catch (err) {
    console.error("[sar] SAR email error:", err);
    return Response.json({ error: "Failed to submit request. Please try again." }, { status: 500 });
  }

  return Response.json({ success: true });
}
