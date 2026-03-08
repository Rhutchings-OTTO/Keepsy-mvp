/**
 * Email subscription endpoint.
 * - Creates a unique Stripe promo code (KEEPSY-XXXX, 10% off, single use)
 * - Saves subscriber to Supabase
 * - Adds to Resend audience
 * - Sends a welcome email with the promo code
 */
import Stripe from "stripe";
import { Resend } from "resend";
import { WelcomeEmail } from "@/lib/emails/WelcomeEmail";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { guardOrigin, guardRateLimit, getRequestId } from "@/lib/security/withSecurity";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const JSON_HEADERS = { "Content-Type": "application/json" };

// Stripe singleton
let _stripe: Stripe | null = null;
function getStripe(): Stripe | null {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) return null;
    _stripe = new Stripe(key, { apiVersion: "2026-02-25.clover" });
  }
  return _stripe;
}

// Resend singleton
let _resend: Resend | null = null;
function getResend(): Resend | null {
  if (!_resend) {
    const key = process.env.RESEND_API_KEY;
    if (!key) return null;
    _resend = new Resend(key);
  }
  return _resend;
}

// Cache the shared welcome coupon ID — one coupon, many unique promo codes
let _welcomeCouponId: string | null = null;

async function getOrCreateWelcomeCoupon(stripe: Stripe): Promise<string> {
  if (_welcomeCouponId) return _welcomeCouponId;

  // Look for an existing coupon named "WELCOME10"
  const coupons = await stripe.coupons.list({ limit: 100 });
  const existing = coupons.data.find(
    (c) => c.name === "WELCOME10" && c.percent_off === 10 && c.valid
  );
  if (existing) {
    _welcomeCouponId = existing.id;
    return existing.id;
  }

  const coupon = await stripe.coupons.create({
    name: "WELCOME10",
    percent_off: 10,
    duration: "once",
  });
  _welcomeCouponId = coupon.id;
  return coupon.id;
}

function generatePromoCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "KEEPSY-";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function POST(req: Request) {
  const requestId = getRequestId(req);
  const originDeny = guardOrigin(req, "/api/subscribe", requestId);
  if (originDeny) return originDeny;
  const rateLimitResult = await guardRateLimit(req, "/api/subscribe", "POST", requestId);
  if ("response" in rateLimitResult) return rateLimitResult.response;

  let email: string;
  try {
    const body = await req.json() as { email?: unknown };
    email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request body." }), {
      status: 400,
      headers: JSON_HEADERS,
    });
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return new Response(JSON.stringify({ error: "Please enter a valid email address." }), {
      status: 400,
      headers: JSON_HEADERS,
    });
  }

  const supabase = getSupabaseAdmin();

  // Check for existing subscriber
  if (supabase) {
    const { data: existing } = await supabase
      .from("subscribers")
      .select("email")
      .eq("email", email)
      .maybeSingle();

    if (existing) {
      return new Response(
        JSON.stringify({ success: true, alreadySubscribed: true, message: "You're already subscribed!" }),
        { status: 200, headers: JSON_HEADERS }
      );
    }
  }

  // Generate a unique Stripe promo code
  let promoCode = "KEEPSY10"; // fallback
  const stripe = getStripe();
  if (stripe) {
    try {
      const couponId = await getOrCreateWelcomeCoupon(stripe);
      const code = generatePromoCode();
      const promo = await stripe.promotionCodes.create({
        promotion: { type: "coupon", coupon: couponId },
        code,
        max_redemptions: 1,
      });
      promoCode = promo.code;
    } catch (err) {
      console.error("[subscribe] Stripe promo code creation failed:", err);
      // Continue with fallback code
    }
  }

  // Save to Supabase subscribers table
  if (supabase) {
    const { error: insertError } = await supabase.from("subscribers").upsert(
      { email, promo_code: promoCode, subscribed_at: new Date().toISOString() },
      { onConflict: "email" }
    );
    if (insertError) {
      console.error("[subscribe] Supabase insert failed:", insertError.message);
    }
  }

  // Add to Resend audience
  const resend = getResend();
  const audienceId = process.env.RESEND_AUDIENCE_ID;
  if (resend && audienceId) {
    try {
      await resend.contacts.create({ email, audienceId, unsubscribed: false });
    } catch (err) {
      console.error("[subscribe] Resend contacts.create failed:", err);
    }
  }

  // Send welcome email
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "https://keepsy.store").replace(/\/$/, "");
  if (resend) {
    try {
      await resend.emails.send({
        from: "Keepsy <hello@keepsy.store>",
        to: email,
        subject: "Your exclusive 10% discount code",
        react: WelcomeEmail({ discountCode: promoCode, siteUrl }),
      });
    } catch (err) {
      console.error("[subscribe] Resend email send failed:", err);
      // Don't fail the request — subscriber is saved, they can get the code via support
    }
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { ...JSON_HEADERS, ...rateLimitResult.headers },
  });
}
