import Stripe from "stripe";
import { createHash } from "crypto";
import { z } from "zod";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { PRODUCT_CATALOG } from "@/lib/commerce/catalog";
import type { CatalogProduct } from "@/lib/commerce/catalog";
import { guardOrigin, guardRateLimit, getRequestId } from "@/lib/security/withSecurity";
import { parseAndValidate, schemas } from "@/lib/http/validate";

const checkoutSchema = z
  .object({
    cart: z
      .array(
        z.object({
          id: z.string().max(64).regex(/^[a-zA-Z0-9_-]+$/),
          quantity: schemas.quantity,
        })
      )
      .optional(),
    product: z.object({ id: z.string().max(64) }).optional(),
    prompt: z.string().max(500).optional(),
    imageDataUrl: z.string().max(500_000).optional(),
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
  const requestId = getRequestId(req);
  const originDeny = guardOrigin(req, "/api/create-checkout-session", requestId);
  if (originDeny) return originDeny;
  const rateLimitResult = guardRateLimit(req, "/api/create-checkout-session", "POST", requestId);
  if ("response" in rateLimitResult) return rateLimitResult.response;

  try {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      return new Response(
        JSON.stringify({
          error:
            "STRIPE_SECRET_KEY is missing. Add it in Vercel → Project → Settings → Environment Variables, then redeploy.",
        }),
        { status: 500 }
      );
    }

    const parsed = await parseAndValidate(req, checkoutSchema);
    if ("error" in parsed) {
      return new Response(JSON.stringify(parsed.error), {
        status: parsed.status,
        headers: { "Content-Type": "application/json" },
      });
    }
    const body = parsed.data;

    const stripe = new Stripe(secretKey, {
      apiVersion: "2026-02-25.clover",
    });

    const parsedCart =
      body.cart?.filter((item) => PRODUCT_CATALOG[item.id]) ?? [];
    const requestedProductId = body.product?.id;
    const fallbackCart =
      requestedProductId && PRODUCT_CATALOG[requestedProductId]
        ? [{ id: requestedProductId, quantity: 1 as const }]
        : [];
    const cart = parsedCart.length > 0 ? parsedCart : fallbackCart;

    if (cart.length === 0) {
      return new Response(JSON.stringify({ error: "No valid items in checkout request." }), { status: 400 });
    }

    const cartSummary = cart.map((item) => {
      const catalogItem = PRODUCT_CATALOG[item.id];
      if (!catalogItem) return null;
      return {
        ...catalogItem,
        quantity: item.quantity,
      };
    });

    if (cartSummary.some((item) => item === null)) {
      return new Response(JSON.stringify({ error: "Checkout includes unknown product." }), { status: 400 });
    }

    const safeCartSummary = cartSummary.filter((item): item is CatalogProduct & { quantity: number } => item !== null);
    const totalGBP = safeCartSummary.reduce((sum, item) => sum + item.priceGBP * item.quantity, 0);

    if (totalGBP <= 0) {
      return new Response(JSON.stringify({ error: "Invalid cart total." }), { status: 400 });
    }

    const baseUrl = getBaseUrl();
    const primaryProductName = safeCartSummary[0]?.name || "Keepsy order";
    const orderRef = `order_${globalThis.crypto.randomUUID()}`;
    const prompt = body.prompt ?? "";
    const imageDataUrl = body.imageDataUrl ?? "";

    const idempotencySource = JSON.stringify({
      orderRef,
      cart: safeCartSummary,
      totalGBP,
      prompt: prompt.slice(0, 450),
      date: new Date().toISOString().slice(0, 10),
    });
    const idempotencyKey = createHash("sha256").update(idempotencySource).digest("hex").slice(0, 32);

    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { error: orderInsertError } = await supabase.from("orders").upsert(
        {
          order_ref: orderRef,
          stripe_session_id: `pending_${orderRef}`,
          status: "pending",
          currency: "gbp",
          total_gbp: Number(totalGBP.toFixed(2)),
          prompt: prompt.slice(0, 450),
          generated_image_url: null,
        },
        { onConflict: "order_ref" }
      );

      if (orderInsertError) {
        return new Response(JSON.stringify({ error: "Failed to create pending order record." }), {
          status: 500,
        });
      }

      await supabase.from("order_items").delete().eq("order_ref", orderRef);
      const { error: itemInsertError } = await supabase.from("order_items").insert(
        safeCartSummary.map((item) => ({
          order_ref: orderRef,
          product_name: item.name,
          quantity: item.quantity,
          unit_price_gbp: item.priceGBP,
          line_total_gbp: Number((item.priceGBP * item.quantity).toFixed(2)),
        }))
      );
      if (itemInsertError) {
        return new Response(JSON.stringify({ error: "Failed to persist pending order items." }), {
          status: 500,
        });
      }
    }

    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        payment_method_types: ["card"],
        line_items: safeCartSummary.map((item) => ({
          price_data: {
            currency: "gbp",
            product_data: {
              name: item.name,
              description: "Custom AI keepsake print",
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
          prompt: prompt.slice(0, 450),
          has_image: imageDataUrl ? "1" : "0",
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
    const message = err instanceof Error ? err.message : "Checkout error";
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
}