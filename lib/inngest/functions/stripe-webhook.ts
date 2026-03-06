import Stripe from "stripe";
import { inngest } from "../client";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { sendAtelierCreationEmail } from "@/lib/emails/sendAtelierEmail";
import { clearDesignCacheForOrder } from "@/lib/cache/designCache";

export const stripeWebhookProcess = inngest.createFunction(
  {
    id: "stripe-webhook-process",
    name: "Process Stripe Webhook Event",
    retries: 3,
  },
  { event: "stripe/webhook.received" },
  async ({ event, step }) => {
    const { eventId, eventType, payload } = event.data as {
      eventId: string;
      eventType: string;
      payload: Stripe.Event;
    };

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      console.warn("[stripe-webhook] Supabase not configured, skipping");
      return { skipped: "supabase_not_configured" };
    }

    const alreadyProcessed = await step.run("check-and-persist-event", async () => {
      const { data: existing } = await supabase
        .from("stripe_events")
        .select("id")
        .eq("stripe_event_id", eventId)
        .maybeSingle();
      if (existing) return true;
      const { error } = await supabase.from("stripe_events").insert({
        stripe_event_id: eventId,
        event_type: eventType,
        payload: payload as unknown as Record<string, unknown>,
      });
      if (error) {
        if (error.code === "23505") return true;
        throw new Error("Failed to persist Stripe event: " + error.message);
      }
      return false;
    });

    if (alreadyProcessed) return { skipped: "duplicate" };

    if (eventType === "checkout.session.completed") {
      const session = payload.data.object as Stripe.Checkout.Session;
      const secretKey = process.env.STRIPE_SECRET_KEY;
      if (!secretKey) throw new Error("STRIPE_SECRET_KEY not set");

      const stripe = new Stripe(secretKey, { apiVersion: "2026-02-25.clover" });

      const [lineItems] = await Promise.all([
        step.run("fetch-line-items", () =>
          stripe.checkout.sessions.listLineItems(session.id, { limit: 100 })
        ),
      ]);

      const amountTotal = (session.amount_total ?? 0) / 100;
      const orderRef =
        session.metadata?.order_ref || session.client_reference_id || `order_${session.id}`;
      const prompt = session.metadata?.prompt || "";
      const designUrl = session.metadata?.design_url || null;

      await step.run("upsert-order", async () => {
        const { error: orderErr } = await supabase.from("orders").upsert(
          {
            order_ref: orderRef,
            stripe_session_id: session.id,
            status: "paid",
            currency: session.currency || "gbp",
            total_gbp: amountTotal,
            prompt,
            generated_image_url: designUrl,
          },
          { onConflict: "order_ref" }
        );
        if (orderErr) throw new Error("Failed to upsert order: " + orderErr.message);
      });

      await step.run("upsert-order-items", async () => {
        await supabase.from("order_items").delete().eq("order_ref", orderRef);
        if (lineItems.data.length > 0) {
          const { error: itemsErr } = await supabase.from("order_items").insert(
            lineItems.data.map((item) => ({
              order_ref: orderRef,
              product_name: item.description || "Keepsy item",
              quantity: item.quantity || 1,
              unit_price_gbp: (item.price?.unit_amount ?? 0) / 100,
              line_total_gbp: (item.amount_total ?? 0) / 100,
            }))
          );
          if (itemsErr) throw new Error("Failed to insert order items: " + itemsErr.message);
        }
      });

      const customerEmail =
        (session.customer_details?.email as string) || (session.customer_email as string) || null;

      await step.run("send-atelier-email", async () => {
        if (customerEmail) {
          await sendAtelierCreationEmail({
            to: customerEmail,
            designPrompt: prompt || undefined,
            orderRef,
          });
        }
      });

      await step.run("clear-design-cache", () => clearDesignCacheForOrder(designUrl));
    }

    if (eventType === "checkout.session.async_payment_failed") {
      const session = payload.data.object as Stripe.Checkout.Session;
      const orderRef = session.metadata?.order_ref || session.client_reference_id;
      await step.run("update-order-failed", async () => {
        const query = supabase
          .from("orders")
          .update({ status: "failed", stripe_session_id: session.id });
        const { error } = orderRef
          ? await query.eq("order_ref", orderRef)
          : await query.eq("stripe_session_id", session.id);
        if (error) throw new Error("Failed to update order status: " + error.message);
      });
    }

    if (eventType === "checkout.session.expired") {
      const session = payload.data.object as Stripe.Checkout.Session;
      const orderRef = session.metadata?.order_ref || session.client_reference_id;
      await step.run("update-order-cancelled", async () => {
        const query = supabase
          .from("orders")
          .update({ status: "cancelled", stripe_session_id: session.id });
        const { error } = orderRef
          ? await query.eq("order_ref", orderRef)
          : await query.eq("stripe_session_id", session.id);
        if (error) throw new Error("Failed to update order status: " + error.message);
      });
    }

    return { processed: true, eventType };
  }
);
