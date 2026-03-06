/**
 * Stripe checkout session creation.
 * ALWAYS returns JSON (success or error).
 *
 * Required Vercel env vars:
 * - STRIPE_SECRET_KEY
 * - NEXT_PUBLIC_SITE_URL or SITE_URL (for redirects)
 * Optional: Supabase for order persistence
 */
import Stripe from "stripe";
import { z } from "zod";
import { sha256Hex } from "@/lib/crypto/sha256";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { PRODUCT_CATALOG } from "@/lib/commerce/catalog";
import type { CatalogProduct } from "@/lib/commerce/catalog";
import { guardOrigin, guardRateLimit, getRequestId } from "@/lib/security/withSecurity";
import { parseAndValidate, schemas } from "@/lib/http/validate";

export const dynamic = "force-dynamic";
export const runtime = "edge";

const JSON_HEADERS = { "Content-Type": "application/json" };

const lineItemSchema = z.object({
  productId: z.string().max(64).regex(/^[a-zA-Z0-9_-]+$/),
  name: z.string().max(200),
  color: z.string().max(64).optional(),
  size: z.string().max(16).optional(),
  imageUrl: z.string().max(256).optional(),
  unitPrice: z.number().positive(),
  quantity: schemas.quantity,
});

const checkoutSchema = z
  .object({
    cart: z.array(lineItemSchema).min(1),
    currency: z.literal("gbp").optional(),
    imageDataUrl: z.string().max(256).optional(),
    designUrl: z.string().max(2048).optional(),
    productType: z.string().max(64).optional(),
  })
  .strict();

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

export async function POST(req: Request) {
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed. Use POST." }),
      { status: 405, headers: JSON_HEADERS }
    );
  }
  const requestId = getRequestId(req);
  const originDeny = guardOrigin(req, "/api/create-checkout-session", requestId);
  if (originDeny) return originDeny;
  const rateLimitResult = await guardRateLimit(req, "/api/create-checkout-session", "POST", requestId);
  if ("response" in rateLimitResult) return rateLimitResult.response;

  try {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      if (process.env.NODE_ENV !== "production") {
        console.error("[checkout] STRIPE_SECRET_KEY is missing. Add it to .env.local (local) or Vercel env vars (production).");
      }
      return new Response(
        JSON.stringify({
          error: "CHECKOUT_FAILED",
          message: "Payment is not configured. Add STRIPE_SECRET_KEY to your environment variables.",
        }),
        { status: 500, headers: JSON_HEADERS }
      );
    }

    const CHECKOUT_MAX_BYTES = 64 * 1024;
    const parsed = await parseAndValidate(req, checkoutSchema, CHECKOUT_MAX_BYTES);
    if ("error" in parsed) {
      return new Response(JSON.stringify(parsed.error), {
        status: parsed.status,
        headers: JSON_HEADERS,
      });
    }
    const body = parsed.data;

    const stripe = new Stripe(secretKey, {
      apiVersion: "2026-02-25.clover",
    });

    const cart = body.cart;
    const cartSummary = cart.map((item) => {
      const catalogItem = PRODUCT_CATALOG[item.productId];
      if (!catalogItem) return null;
      if (Math.abs(catalogItem.priceGBP - item.unitPrice) > 0.01) return null;
      return {
        ...catalogItem,
        quantity: item.quantity,
        color: item.color,
        size: item.size,
        imageUrl: item.imageUrl,
      };
    });

    if (cartSummary.some((item) => item === null)) {
      return new Response(JSON.stringify({ error: "Checkout includes unknown or invalid product." }), {
        status: 400,
        headers: JSON_HEADERS,
      });
    }

    type CartLine = CatalogProduct & { quantity: number; color?: string; size?: string; imageUrl?: string };
    const safeCartSummary = cartSummary.filter((item): item is NonNullable<typeof item> => item !== null) as CartLine[];
    const totalGBP = safeCartSummary.reduce((sum, item) => sum + item.priceGBP * item.quantity, 0);

    if (totalGBP <= 0) {
      return new Response(JSON.stringify({ error: "Invalid cart total." }), {
        status: 400,
        headers: JSON_HEADERS,
      });
    }

    let baseUrl: string;
    try {
      baseUrl = getBaseUrl();
    } catch (e) {
      if (process.env.NODE_ENV !== "production") {
        console.error("[checkout] SITE_URL missing:", (e as Error).message);
      }
      return new Response(
        JSON.stringify({
          error: "CHECKOUT_FAILED",
          message: "Redirect URL not configured. Set NEXT_PUBLIC_SITE_URL or SITE_URL (e.g. https://keepsy.store).",
        }),
        { status: 500, headers: JSON_HEADERS }
      );
    }
    const primaryProductName = safeCartSummary[0]?.name || "Keepsy order";
    const orderRef = `order_${globalThis.crypto.randomUUID()}`;
    const imageDataUrl = body.imageDataUrl ?? safeCartSummary[0]?.imageUrl ?? "";
    const designUrl = body.designUrl ?? "";
    const productType = body.productType ?? primaryProductName;

    const idempotencySource = JSON.stringify({
      orderRef,
      cart: safeCartSummary,
      totalGBP,
      date: new Date().toISOString().slice(0, 10),
    });
    const idempotencyKey = (await sha256Hex(idempotencySource)).slice(0, 32);

    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { error: orderInsertError } = await supabase.from("orders").upsert(
        {
          order_ref: orderRef,
          stripe_session_id: `pending_${orderRef}`,
          status: "pending",
          currency: "gbp",
          total_gbp: Number(totalGBP.toFixed(2)),
          prompt: "",
          generated_image_url: null,
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
          safeCartSummary.map((item) => ({
            order_ref: orderRef,
            product_name: [item.name, item.size, item.color].filter(Boolean).join(" · ") || item.name,
            quantity: item.quantity,
            unit_price_gbp: item.priceGBP,
            line_total_gbp: Number((item.priceGBP * item.quantity).toFixed(2)),
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
        payment_method_types: ["card"],
        line_items: safeCartSummary.map((item) => {
          const meta: Record<string, string> = {
            productId: item.id,
            color: item.color ?? "",
          };
          if (item.size) meta.size = item.size;
          meta.imageUrl = item.imageUrl ? "1" : "0";
          return {
            price_data: {
              currency: "gbp",
              product_data: {
                name: [item.name, item.size, item.color].filter(Boolean).join(" · ") || item.name,
                description: "Custom AI keepsake print",
                metadata: meta,
              },
              unit_amount: Math.round(item.priceGBP * 100),
            },
            quantity: item.quantity,
          };
        }),
        success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/create?canceled=1`,
        metadata: {
          order_ref: orderRef,
          primary_product: primaryProductName,
          has_image: imageDataUrl ? "1" : "0",
          design_url: designUrl || "",
          product_type: productType,
        },
        client_reference_id: orderRef,
      },
      { idempotencyKey }
    );

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...rateLimitResult.headers,
    };
    return new Response(JSON.stringify({ url: session.url, sessionId: session.id, orderRef }), {
      status: 200,
      headers,
    });
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    if (process.env.NODE_ENV !== "production") {
      console.error("[checkout] Error:", errMsg);
    }
    const isStripeError = errMsg.toLowerCase().includes("stripe") || errMsg.includes("api_key");
    return new Response(
      JSON.stringify({
        error: "CHECKOUT_FAILED",
        message: isStripeError && process.env.NODE_ENV !== "production"
          ? `Stripe error: ${errMsg}`
          : "Checkout couldn't start. Please try again.",
      }),
      { status: 500, headers: JSON_HEADERS }
    );
  }
}