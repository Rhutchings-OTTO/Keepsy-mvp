/**
 * POST /api/subscribe
 * Adds an email to the Resend audience and sends a welcome email with a 10% discount code.
 */
import { Resend } from "resend";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const FROM = process.env.EMAIL_FROM || "Keepsy <hello@keepsy.store>";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://keepsy.store";
const DISCOUNT_CODE = "WELCOME10";

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

  if (!email || !isValidEmail(email)) {
    return Response.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  const resend = getResend();
  if (!resend) {
    console.error("[subscribe] RESEND_API_KEY not set");
    return Response.json({ error: "Email service not configured." }, { status: 500 });
  }

  // Add to Resend audience (non-fatal if RESEND_AUDIENCE_ID is missing)
  const audienceId = process.env.RESEND_AUDIENCE_ID;
  if (audienceId) {
    try {
      await resend.contacts.create({ email, audienceId });
    } catch (err) {
      console.warn("[subscribe] Failed to add contact to audience:", err);
    }
  }

  // Send welcome email with discount code
  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: email,
      subject: "Your 10% discount code from Keepsy",
      text: `Welcome to Keepsy!\n\nHere is your 10% discount code: ${DISCOUNT_CODE}\n\nUse it at checkout on your first order.\n\nShop now: ${SITE_URL}/shop\n\n— The Keepsy Team\n\nUnsubscribe: mailto:hello@keepsy.store?subject=unsubscribe`,
      html: `<!DOCTYPE html>
<html>
<body style="font-family: Georgia, serif; background-color: #F9F8F6; color: #2D2926; margin: 0; padding: 40px 20px;">
  <div style="max-width: 520px; margin: 0 auto;">
    <p style="font-size: 11px; font-weight: 700; letter-spacing: 0.22em; text-transform: uppercase; color: #C4714A; margin-bottom: 12px;">Welcome to Keepsy</p>
    <h1 style="font-family: Georgia, serif; font-size: 26px; font-weight: 700; color: #2D2926; margin: 0 0 20px; line-height: 1.2;">Here&rsquo;s your 10% off code.</h1>
    <p style="font-size: 15px; line-height: 1.7; color: rgba(45,41,38,0.75); margin: 0 0 24px;">
      Thank you for joining the Keepsy family. Use the code below at checkout to claim 10% off your first order.
    </p>
    <div style="background-color: #F5EDE0; border-radius: 12px; padding: 20px 28px; text-align: center; margin-bottom: 28px;">
      <p style="font-size: 13px; color: rgba(45,41,38,0.55); margin: 0 0 8px; letter-spacing: 0.1em; text-transform: uppercase;">Your discount code</p>
      <p style="font-size: 28px; font-weight: 700; letter-spacing: 0.08em; color: #C4714A; margin: 0;">${DISCOUNT_CODE}</p>
    </div>
    <a href="${SITE_URL}/shop" style="display: inline-block; background-color: #2B4038; color: #fff; font-size: 14px; font-weight: 600; padding: 12px 28px; border-radius: 10px; text-decoration: none; margin-bottom: 28px;">Shop the Collection</a>
    <hr style="border-top: 1px solid rgba(45,41,38,0.08); margin: 28px 0;" />
    <p style="font-size: 13px; color: rgba(45,41,38,0.5); line-height: 1.6;">
      You&rsquo;re receiving this because you signed up for Keepsy updates.
      <a href="mailto:hello@keepsy.store?subject=unsubscribe" style="color: #C4714A;">Unsubscribe</a> at any time.
    </p>
    <p style="font-size: 13px; color: rgba(45,41,38,0.45); margin-top: 24px;">— The Keepsy Team</p>
  </div>
</body>
</html>`,
      headers: { "List-Unsubscribe": "<mailto:hello@keepsy.store?subject=unsubscribe>" },
    });

    if (error) {
      console.error("[subscribe] Failed to send welcome email:", error);
      return Response.json({ error: "Failed to send email. Please try again." }, { status: 500 });
    }
  } catch (err) {
    console.error("[subscribe] Welcome email error:", err);
    return Response.json({ error: "Failed to send email. Please try again." }, { status: 500 });
  }

  return Response.json({ success: true });
}
