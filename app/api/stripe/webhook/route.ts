import Stripe from "stripe";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

async function updateOrderStatusForSession(
  session: Stripe.Checkout.Session,
  status: "paid" | "failed" | "cancelled",
  supabase: ReturnType<typeof getSupabaseAdmin>
) {
  if (!supabase) return;
  const orderRef = session.metadata?.order_ref || session.client_reference_id;
  const updatePayload = { status, stripe_session_id: session.id };
  const query = supabase.from("orders").update(updatePayload);
  const { error } = orderRef
    ? await query.eq("order_ref", orderRef)
    : await query.eq("stripe_session_id", session.id);
  if (error) {
    throw new Error("Failed to update order status.");
  }
}

export async function POST(req: Request) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secretKey || !webhookSecret) {
    return new Response(JSON.stringify({ error: "Missing Stripe webhook configuration." }), {
      status: 500,
    });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return new Response(JSON.stringify({ error: "Missing Stripe signature." }), { status: 400 });
  }

  const stripe = new Stripe(secretKey, { apiVersion: "2026-02-25.clover" });
  const payload = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid webhook signature.";
    return new Response(JSON.stringify({ error: message }), { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return new Response(JSON.stringify({ ok: true, skipped: "supabase_not_configured" }), { status: 200 });
  }

  const { data: existingEvent, error: existingEventError } = await supabase
    .from("stripe_events")
    .select("id")
    .eq("stripe_event_id", event.id)
    .maybeSingle();
  if (existingEventError) {
    return new Response(JSON.stringify({ error: "Failed to persist Stripe event." }), { status: 500 });
  }
  if (existingEvent) {
    return new Response(JSON.stringify({ received: true, duplicate: true }), { status: 200 });
  }

  const { error: eventInsertError } = await supabase.from("stripe_events").insert({
    stripe_event_id: event.id,
    event_type: event.type,
    payload: JSON.parse(payload),
  });
  if (eventInsertError) {
    return new Response(JSON.stringify({ error: "Failed to persist Stripe event." }), { status: 500 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 100 });
    const amountTotal = (session.amount_total ?? 0) / 100;

    const orderRef = session.metadata?.order_ref || session.client_reference_id || `order_${session.id}`;
    const prompt = session.metadata?.prompt || "";

    const { error: orderUpsertError } = await supabase.from("orders").upsert(
      {
        order_ref: orderRef,
        stripe_session_id: session.id,
        status: "paid",
        currency: session.currency || "gbp",
        total_gbp: amountTotal,
        prompt,
        generated_image_url: null,
      },
      { onConflict: "order_ref" }
    );
    if (orderUpsertError) {
      return new Response(JSON.stringify({ error: "Failed to update order status." }), { status: 500 });
    }

    const { error: deleteItemsError } = await supabase.from("order_items").delete().eq("order_ref", orderRef);
    if (deleteItemsError) {
      return new Response(JSON.stringify({ error: "Failed to refresh order items." }), { status: 500 });
    }
    if (lineItems.data.length > 0) {
      const { error: insertItemsError } = await supabase.from("order_items").insert(
        lineItems.data.map((item) => ({
          order_ref: orderRef,
          product_name: item.description || "Keepsy item",
          quantity: item.quantity || 1,
          unit_price_gbp: (item.price?.unit_amount ?? 0) / 100,
          line_total_gbp: (item.amount_total ?? 0) / 100,
        }))
      );
      if (insertItemsError) {
        return new Response(JSON.stringify({ error: "Failed to persist webhook line items." }), {
          status: 500,
        });
      }
    }
  }
  if (event.type === "checkout.session.async_payment_failed") {
    const session = event.data.object as Stripe.Checkout.Session;
    await updateOrderStatusForSession(session, "failed", supabase);
  }
  if (event.type === "checkout.session.expired") {
    const session = event.data.object as Stripe.Checkout.Session;
    await updateOrderStatusForSession(session, "cancelled", supabase);
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
}
