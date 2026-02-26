import Stripe from "stripe";

type CheckoutBody = {
  cart?: Array<{ priceGBP?: unknown }>;
  product?: {
    priceGBP?: unknown;
    name?: unknown;
  };
  prompt?: unknown;
};

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

    const body = (await req.json()) as CheckoutBody;

    const cart = Array.isArray(body?.cart) ? body.cart : [];
    const totalGBP =
      typeof body?.product?.priceGBP === "number"
        ? body.product.priceGBP
        : cart.reduce((sum: number, item) => sum + (Number(item?.priceGBP) || 0), 0);

    if (!totalGBP || totalGBP <= 0) {
      return new Response(JSON.stringify({ error: "Invalid cart total." }), { status: 400 });
    }

    const amount = Math.round(totalGBP * 100); // pounds → pence
    const requestOrigin = req.headers.get("origin");
    const configuredSiteUrl =
      process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "https://keepsy.store";
    const baseUrl = (requestOrigin || configuredSiteUrl).replace(/\/$/, "");

    const productName = typeof body?.product?.name === "string" ? body.product.name : "Keepsy order";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "gbp",
            product_data: {
              name: productName,
              description: "Custom AI keepsake print",
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/?success=1`,
      cancel_url: `${baseUrl}/?canceled=1`,
      metadata: {
        prompt: String(body?.prompt || "").slice(0, 450),
      },
    });

    return new Response(JSON.stringify({ url: session.url }), { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Checkout error";
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
}