import Stripe from "stripe";
import { createHash } from "crypto";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

type CatalogProduct = {
  id: string;
  name: string;
  priceGBP: number;
};

const PRODUCT_CATALOG: Record<string, CatalogProduct> = {
  card: { id: "card", name: "Greeting card", priceGBP: 8 },
  mug: { id: "mug", name: "Mug", priceGBP: 14 },
  tee: { id: "tee", name: "Premium tee", priceGBP: 29 },
  hoodie: { id: "hoodie", name: "Hoodie", priceGBP: 40 },
};

type CheckoutBody = {
  cart?: unknown;
  product?: unknown;
  prompt?: unknown;
  imageDataUrl?: unknown;
};

type CheckoutCartItem = {
  id: string;
  quantity: number;
};

function parseProductId(product: unknown): string | null {
  if (!product || typeof product !== "object") return null;
  const value = (product as { id?: unknown }).id;
  return typeof value === "string" ? value : null;
}

function parseCart(cart: unknown): CheckoutCartItem[] {
  if (!Array.isArray(cart)) return [];
  return cart
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const id = typeof (item as { id?: unknown }).id === "string" ? (item as { id: string }).id : null;
      const quantityRaw = (item as { quantity?: unknown }).quantity;
      const quantity = Number.isFinite(quantityRaw) ? Number(quantityRaw) : 0;
      if (!id) return null;
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) return null;
      return { id, quantity };
    })
    .filter((item): item is CheckoutCartItem => item !== null);
}

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

    // Create Stripe INSIDE the handler so builds don't crash if env vars aren't set yet
    const stripe = new Stripe(secretKey, {
      apiVersion: "2026-02-25.clover",
    });

    let body: CheckoutBody;
    try {
      body = (await req.json()) as CheckoutBody;
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body." }), { status: 400 });
    }

    const parsedCart = parseCart(body.cart);
    const requestedProductId = parseProductId(body.product);
    const fallbackCart =
      requestedProductId && PRODUCT_CATALOG[requestedProductId]
        ? [{ id: requestedProductId, quantity: 1 }]
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
    const prompt = typeof body.prompt === "string" ? body.prompt : "";
    const imageDataUrl = typeof body.imageDataUrl === "string" ? body.imageDataUrl : "";

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

    return new Response(JSON.stringify({ url: session.url, sessionId: session.id, orderRef }), { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Checkout error";
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
}