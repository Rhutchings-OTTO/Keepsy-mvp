/**
 * /api/checkout — Dynamic Stripe checkout with designUrl and productType in metadata.
 * Proxies to create-checkout-session with extended params.
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import Stripe from "stripe";
import { sha256Hex } from "@/lib/crypto/sha256";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { PRODUCT_CATALOG } from "@/lib/commerce/catalog";
import type { CatalogProduct } from "@/lib/commerce/catalog";
import { guardOrigin, guardRateLimit, getRequestId } from "@/lib/security/withSecurity";
import { parseAndValidate, schemas } from "@/lib/http/validate";

export const dynamic = "force-dynamic";
export const runtime = "edge";

const JSON_HEADERS = { "Content-Type": "application/json" };

// Module-level singleton — one Stripe client per isolate, not per request.
let _stripe: Stripe | null = null;
function getStripe(): Stripe | null {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) return null;
    _stripe = new Stripe(key, { apiVersion: "2026-02-25.clover" });
  }
  return _stripe;
}

const lineItemSchema = z.object({
  productId: z.string().max(64).regex(/^[a-zA-Z0-9_-]+$/),
  name: z.string().max(200),
  color: z.string().max(64).optional(),
  size: z.string().max(16).optional(),
  imageUrl: z.string().max(2048).optional(),
  designUrl: z.string().url().max(2048).optional(),
  unitPrice: z.number().positive(),
  quantity: schemas.quantity,
});

const schema = z
  .object({
    cart: z.array(lineItemSchema).min(1),
    currency: z.literal("gbp").optional(),
    designUrl: z.string().url().max(2048).optional(),
    productType: z.string().max(64).optional(),
  })
  .strict();

function getBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL;
  if (!url) {
    if (process.env.NODE_ENV !== "production") return "http://127.0.0.1:3000";
    throw new Error("NEXT_PUBLIC_SITE_URL or SITE_URL required for checkout.");
  }
  return url.replace(/\/$/, "");
}

export async function POST(req: Request) {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed." }), {
      status: 405,
      headers: JSON_HEADERS,
    });
  }

  const requestId = getRequestId(req);
  const originDeny = guardOrigin(req, "/api/checkout", requestId);
  if (originDeny) return originDeny;
  const rateLimitResult = await guardRateLimit(req, "/api/checkout", "POST", requestId);
  if ("response" in rateLimitResult) return rateLimitResult.response;

  try {
    const stripe = getStripe();
    if (!stripe) {
      return new Response(
        JSON.stringify({ error: "CHECKOUT_FAILED", message: "Checkout is not configured." }),
        { status: 500, headers: JSON_HEADERS }
      );
    }

    const parsed = await parseAndValidate(req, schema, 64 * 1024);
    if ("error" in parsed) {
      return new Response(JSON.stringify(parsed.error), {
        status: parsed.status,
        headers: JSON_HEADERS,
      });
    }

    const { cart, designUrl = "", productType = "" } = parsed.data;

    const cartSummary = cart.map((item) => {
      const catalog = PRODUCT_CATALOG[item.productId];
      if (!catalog || Math.abs(catalog.priceGBP - item.unitPrice) > 0.01) return null;
      return {
        ...catalog,
        quantity: item.quantity,
        color: item.color,
        size: item.size,
        imageUrl: item.imageUrl,
        designUrl: item.designUrl ?? designUrl,
      };
    });

    if (cartSummary.some((c) => c === null)) {
      return new Response(
        JSON.stringify({ error: "Checkout includes unknown or invalid product." }),
        { status: 400, headers: JSON_HEADERS }
      );
    }

    type Line = CatalogProduct & { quantity: number; color?: string; size?: string; imageUrl?: string; designUrl?: string };
    const lines = cartSummary.filter((c): c is NonNullable<typeof c> => c !== null) as Line[];
    const totalGBP = lines.reduce((s, i) => s + i.priceGBP * i.quantity, 0);

    if (totalGBP <= 0) {
      return new Response(JSON.stringify({ error: "Invalid cart total." }), {
        status: 400,
        headers: JSON_HEADERS,
      });
    }

    const baseUrl = getBaseUrl();
    const primaryProductName = lines[0]?.name ?? "Keepsy order";
    const orderRef = `order_${globalThis.crypto.randomUUID()}`;
    const primaryDesignUrl = lines[0]?.designUrl ?? designUrl;

    const idempotencySource = JSON.stringify({
      orderRef,
      cart: lines,
      totalGBP,
      date: new Date().toISOString().slice(0, 10),
    });
    const idempotencyKey = (await sha256Hex(idempotencySource)).slice(0, 32);

    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { error: orderErr } = await supabase.from("orders").upsert(
        {
          order_ref: orderRef,
          stripe_session_id: `pending_${orderRef}`,
          status: "pending",
          currency: "gbp",
          total_gbp: Number(totalGBP.toFixed(2)),
          prompt: "",
          generated_image_url: primaryDesignUrl || null,
        },
        { onConflict: "order_ref" }
      );
      if (orderErr) {
        // Non-fatal: log and continue to Stripe — order can be recovered from webhook
        console.error("[checkout] Supabase order pre-insert failed (continuing):", orderErr.message);
      } else {
        await supabase.from("order_items").delete().eq("order_ref", orderRef);
        const { error: itemsErr } = await supabase.from("order_items").insert(
          lines.map((item) => ({
            order_ref: orderRef,
            product_name: [item.name, item.size, item.color].filter(Boolean).join(" · ") || item.name,
            quantity: item.quantity,
            unit_price_gbp: item.priceGBP,
            line_total_gbp: Number((item.priceGBP * item.quantity).toFixed(2)),
          }))
        );
        if (itemsErr) {
          console.error("[checkout] Supabase order_items insert failed (continuing):", itemsErr.message);
        }
      }
    }

    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        payment_method_types: ["card"],
        shipping_address_collection: {
          allowed_countries: ["GB", "US", "CA", "AU", "DE", "FR", "NL", "SE", "NO", "DK", "IE"],
        },
        line_items: lines.map((item) => ({
          price_data: {
            currency: "gbp",
            product_data: {
              name: [item.name, item.size, item.color].filter(Boolean).join(" · ") || item.name,
              description: "Custom AI keepsake print",
              metadata: {
                productId: item.id,
                color: item.color ?? "",
                size: item.size ?? "",
                designUrl: item.designUrl ?? "",
              },
            },
            unit_amount: Math.round(item.priceGBP * 100),
          },
          quantity: item.quantity,
        })),
        success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/create?canceled=1`,
        metadata: {
          order_ref: orderRef,
          primary_product: primaryProductName,
          design_url: primaryDesignUrl,
          product_type: productType || primaryProductName,
        },
        client_reference_id: orderRef,
      },
      { idempotencyKey }
    );

    return new Response(
      JSON.stringify({ url: session.url, sessionId: session.id, orderRef }),
      { status: 200, headers: { ...JSON_HEADERS, ...rateLimitResult.headers } }
    );
  } catch (err) {
    // Always log — visible in Vercel function logs for diagnostics
    console.error("[checkout] Stripe session creation failed:", err instanceof Error ? err.message : err);
    return new Response(
      JSON.stringify({
        error: "CHECKOUT_FAILED",
        message: "Checkout couldn't start. Please try again.",
      }),
      { status: 500, headers: JSON_HEADERS }
    );
  }
}
