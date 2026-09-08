/**
 * Stripe checkout session creation.
 * ALWAYS returns JSON (success or error).
 *
 * Server-authoritative: prices come from lib/commerce/catalog.ts, variants are
 * validated against the Printify blueprint maps, and every line's print
 * source (design_url / cropped_image_url / source_kind) is persisted to
 * `order_items` so the webhook can fulfil EVERY line, not just the first.
 *
 * Required Vercel env vars:
 * - STRIPE_SECRET_KEY
 * - NEXT_PUBLIC_SITE_URL or SITE_URL (for redirects)
 * Optional: Supabase for order persistence; Supabase auth for order ownership.
 */
import Stripe from "stripe";
import { z } from "zod";
import { sha256Hex } from "@/lib/crypto/sha256";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getSessionUser } from "@/lib/supabase/server";
import { FREE_SHIPPING_THRESHOLD, SHIPPING_FEE, roundMoney, type Currency } from "@/lib/commerce/pricing";
import { priceCart } from "@/lib/commerce/checkoutPricing";
import { guardOrigin, guardRateLimit, getRequestId } from "@/lib/security/withSecurity";
import { parseAndValidate, schemas } from "@/lib/http/validate";

export const dynamic = "force-dynamic";
export const runtime = "edge";

const JSON_HEADERS = { "Content-Type": "application/json" };

let _stripe: Stripe | null = null;
function getStripe(): Stripe | null {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) return null;
    _stripe = new Stripe(key, { apiVersion: "2026-02-25.clover" });
  }
  return _stripe;
}

const httpsUrl = z.string().url().max(2048).refine((u) => u.startsWith("https://"), "Must be an https URL");

const lineItemSchema = z.object({
  productId: z.string().max(64).regex(/^[a-zA-Z0-9_-]+$/),
  name: z.string().max(200),
  color: z.string().max(64).optional(),
  size: z.string().max(16).optional(),
  /** Legacy boolean flag ("1") or a short https URL; never a data URL. */
  imageUrl: z.string().max(2048).optional(),
  /** Permanent https print source for THIS line. */
  designUrl: httpsUrl.optional(),
  croppedImageUrl: httpsUrl.optional(),
  sourceKind: z.enum(["ai", "original"]).optional(),
  addonId: z.string().max(32).optional(),
  unitPrice: z.number().positive(),
  quantity: schemas.quantity,
});

export type CheckoutLineInput = z.infer<typeof lineItemSchema>;

const checkoutSchema = z
  .object({
    cart: z.array(lineItemSchema).min(1).max(40),
    currency: z.enum(["gbp", "usd"]).optional(),
    imageDataUrl: z.string().max(256).optional(),
    designUrl: httpsUrl.optional(),
    croppedImageUrl: httpsUrl.optional(),
    productType: z.string().max(64).optional(),
  })
  .strict();

type CheckoutRequest = z.infer<typeof checkoutSchema>;

function getBaseUrl() {
  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL;
  if (!configuredSiteUrl) {
    if (process.env.NODE_ENV !== "production") {
      return "http://127.0.0.1:3000";
    }
    throw new Error("NEXT_PUBLIC_SITE_URL or SITE_URL is required for checkout redirects.");
  }
  return configuredSiteUrl.replace(/\/$/, "");
}

function json(body: unknown, status: number, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), { status, headers: { ...JSON_HEADERS, ...extraHeaders } });
}

export async function POST(req: Request) {
  const requestId = getRequestId(req);
  const originDeny = guardOrigin(req, "/api/create-checkout-session", requestId);
  if (originDeny) return originDeny;
  const rateLimitResult = await guardRateLimit(req, "/api/create-checkout-session", "POST", requestId);
  if ("response" in rateLimitResult) return rateLimitResult.response;

  try {
    const stripe = getStripe();
    if (!stripe) {
      if (process.env.NODE_ENV !== "production") {
        console.error("[checkout] STRIPE_SECRET_KEY is missing. Add it to .env.local (local) or Vercel env vars (production).");
      }
      return json({ error: "CHECKOUT_FAILED", message: "Payment is not configured. Add STRIPE_SECRET_KEY to your environment variables." }, 500);
    }

    const CHECKOUT_MAX_BYTES = 128 * 1024;
    const parsed = await parseAndValidate(req, checkoutSchema, CHECKOUT_MAX_BYTES);
    if ("error" in parsed) return json(parsed.error, parsed.status);
    const body = parsed.data;
    const currency: Currency = body.currency ?? "gbp";

    const priced = priceCart(body.cart as CheckoutRequest["cart"], currency, { designUrl: body.designUrl, croppedImageUrl: body.croppedImageUrl });
    if (!priced.ok) return json({ error: priced.error, message: priced.message }, priced.status);
    const lines = priced.lines;

    const totalGBP = roundMoney(lines.reduce((sum, item) => sum + item.priceGBP * item.quantity, 0));
    const subtotal = roundMoney(lines.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0));
    if (subtotal <= 0) return json({ error: "Invalid cart total." }, 400);
    const shippingFee = SHIPPING_FEE[currency];
    const shippingRequired = subtotal < FREE_SHIPPING_THRESHOLD;

    // Canvas orders MUST include a size — otherwise fulfilment cannot pick a variant.
    const canvasMissingSize = lines.find((item) => item.id.startsWith("canvas") && !(item.size && item.size.trim()));
    if (canvasMissingSize) {
      return json({ error: "MISSING_CANVAS_SIZE", message: `Canvas orders require a size selection (${canvasMissingSize.name}).` }, 400);
    }
    const linesWithoutDesign = lines.filter((l) => !l.designUrl);
    if (linesWithoutDesign.length > 0) {
      return json({ error: "MISSING_PRINT_IMAGE", message: "Please add a design or upload a photo for every item before checkout." }, 400);
    }

    let baseUrl: string;
    try {
      baseUrl = getBaseUrl();
    } catch (e) {
      if (process.env.NODE_ENV !== "production") console.error("[checkout] SITE_URL missing:", (e as Error).message);
      return json({ error: "CHECKOUT_FAILED", message: "Redirect URL not configured. Set NEXT_PUBLIC_SITE_URL or SITE_URL (e.g. https://keepsy.store)." }, 500);
    }

    const primaryProductName = lines[0]?.name || "Keepsy order";
    const orderRef = `order_${globalThis.crypto.randomUUID()}`;
    const primaryDesignUrl = body.designUrl ?? lines[0]?.designUrl ?? "";
    const primaryCroppedUrl = body.croppedImageUrl ?? lines[0]?.croppedImageUrl ?? "";
    const productType = lines[0]?.id ?? body.productType ?? primaryProductName;

    // Signed-in customers own their orders; guests check out exactly as before.
    const user = await getSessionUser();

    const idempotencySource = JSON.stringify({ orderRef, lines, totalGBP, date: new Date().toISOString().slice(0, 10) });
    const idempotencyKey = (await sha256Hex(idempotencySource)).slice(0, 32);

    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { error: orderInsertError } = await supabase.from("orders").upsert(
        {
          order_ref: orderRef,
          stripe_session_id: `pending_${orderRef}`,
          status: "pending",
          currency,
          total_gbp: totalGBP,
          prompt: "",
          generated_image_url: primaryDesignUrl || null,
          cropped_image_url: primaryCroppedUrl || null,
          ...(user ? { user_id: user.id } : {}),
        },
        { onConflict: "order_ref" }
      );

      if (orderInsertError) {
        if (process.env.NODE_ENV !== "production") {
          console.warn("[checkout] Supabase order pre-insert failed (continuing):", orderInsertError.message);
        }
      } else {
        await supabase.from("order_items").delete().eq("order_ref", orderRef);
        const { error: itemInsertError } = await supabase.from("order_items").insert(
          lines.map((item) => ({
            order_ref: orderRef,
            product_name: [item.name, item.size, item.color].filter(Boolean).join(" · ") || item.name,
            quantity: item.quantity,
            unit_price_gbp: item.priceGBP,
            line_total_gbp: roundMoney(item.priceGBP * item.quantity),
            product_id: item.id,
            size: item.size ?? null,
            color: item.color ?? null,
            design_url: item.designUrl ?? null,
            cropped_image_url: item.croppedImageUrl ?? null,
            source_kind: item.sourceKind ?? null,
            addon_id: item.addonId ?? null,
          }))
        );
        if (itemInsertError && process.env.NODE_ENV !== "production") {
          console.warn("[checkout] Supabase order_items insert failed (continuing):", itemInsertError.message);
        }
      }
    }

    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        // NOTE: Klarna and Clearpay must be enabled in the Stripe Dashboard under
        // Settings > Payment methods before they will appear at checkout.
        payment_method_types: ["card", "klarna", "afterpay_clearpay"],
        billing_address_collection: "required",
        shipping_address_collection: { allowed_countries: ["US", "GB"] },
        ...(user?.email ? { customer_email: user.email } : {}),
        line_items: [
          ...lines.map((item) => {
            // Stripe metadata values are capped at 500 chars; Cloudinary URLs are ~130.
            const meta: Record<string, string> = {
              productId: item.id,
              color: item.color ?? "",
              size: item.size ?? "",
              designUrl: (item.designUrl ?? "").slice(0, 490),
              croppedImageUrl: (item.croppedImageUrl ?? "").slice(0, 490),
              sourceKind: item.sourceKind ?? "",
              addonId: item.addonId ?? "",
            };
            return {
              price_data: {
                currency,
                product_data: {
                  name: [item.name, item.size, item.color].filter(Boolean).join(" · ") || item.name,
                  description: item.sourceKind === "original" ? "Your photo, printed as it is" : "Custom keepsake print",
                  metadata: meta,
                },
                unit_amount: Math.round(item.unitPrice * 100),
              },
              quantity: item.quantity,
            };
          }),
          ...(shippingRequired
            ? [{
                price_data: {
                  currency,
                  product_data: { name: "Standard Shipping" },
                  unit_amount: Math.round(shippingFee * 100),
                },
                quantity: 1 as const,
              }]
            : []),
        ],
        success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/create?canceled=1`,
        metadata: {
          order_ref: orderRef,
          primary_product: primaryProductName,
          has_image: body.imageDataUrl || lines.some((l) => l.designUrl) ? "1" : "0",
          design_url: primaryDesignUrl.slice(0, 490),
          cropped_image_url: primaryCroppedUrl.slice(0, 490),
          product_type: productType,
          variant_size: lines[0]?.size ?? "",
          variant_color: lines[0]?.color ?? "",
          line_count: String(lines.length),
          ...(user ? { user_id: user.id } : {}),
        },
        client_reference_id: orderRef,
        allow_promotion_codes: true,
      },
      { idempotencyKey }
    );

    return json({ url: session.url, sessionId: session.id, orderRef }, 200, rateLimitResult.headers);
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error("[checkout] Stripe session creation failed:", errMsg);
    return json({ error: "CHECKOUT_FAILED", message: "Checkout couldn't start. Please try again." }, 500);
  }
}
