import Stripe from "stripe";

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

    const body = await req.json();

    const cart = Array.isArray(body?.cart) ? body.cart : [];
    const totalGBP =
      typeof body?.product?.priceGBP === "number"
        ? body.product.priceGBP
        : cart.reduce((sum: number, item: any) => sum + (Number(item?.priceGBP) || 0), 0);

    if (!totalGBP || totalGBP <= 0) {
      return new Response(JSON.stringify({ error: "Invalid cart total." }), { status: 400 });
    }

    const amount = Math.round(totalGBP * 100); // pounds → pence
    const origin = req.headers.get("origin") || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "gbp",
            product_data: {
              name: body?.product?.name || "Keepsy order",
              description: "Custom AI keepsake print",
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/?success=1`,
      cancel_url: `${origin}/?canceled=1`,
      metadata: {
        prompt: String(body?.prompt || "").slice(0, 450),
      },
    });

    return new Response(JSON.stringify({ url: session.url }), { status: 200 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || "Checkout error" }), { status: 500 });
  }
}