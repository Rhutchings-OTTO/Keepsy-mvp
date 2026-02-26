import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-06-20",
});

export async function POST(req: Request) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: "Missing STRIPE_SECRET_KEY" }, { status: 500 });
    }

    const { product, prompt, imageDataUrl, currency } = await req.json();

    if (!product?.name || !product?.priceGBP || !imageDataUrl) {
      return NextResponse.json({ error: "Missing product or image" }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    // Stripe Checkout session create. :contentReference[oaicite:6]{index=6}
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/`,
      line_items: [
        {
          price_data: {
            currency: currency || "gbp",
            product_data: {
              name: product.name,
              images: [imageDataUrl], // for Stripe display (works best with hosted URLs; data URL may not show everywhere)
            },
            unit_amount: Math.round(Number(product.priceGBP) * 100),
          },
          quantity: 1,
        },
      ],
      metadata: {
        product_id: product.id,
        prompt: String(prompt || "").slice(0, 450),
        // In production, store image in S3/R2 and pass a real URL here.
        image_data_url: imageDataUrl.slice(0, 450),
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Stripe error" }, { status: 500 });
  }
}