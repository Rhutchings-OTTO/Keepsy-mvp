import Stripe from "stripe";
import { inngest } from "../client";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { sendAtelierCreationEmail } from "@/lib/emails/sendAtelierEmail";
import { clearDesignCacheForOrder } from "@/lib/cache/designCache";
import { splitName, type PrintifyAddress } from "@/lib/printify";
import { notifyFounders } from "@/lib/notifications";
import { fulfilOrderLines, SubmitUncertainError } from "@/lib/fulfilment/printifyFulfilment";
import {
  linesFromOrderItems,
  linesFromStripeLineItems,
  orderItemRowsFromStripeLineItems,
  type OrderItemRow,
} from "@/lib/fulfilment/orderLines";

// ─── Stripe singleton ─────────────────────────────────────────────────────

// Created once per worker process rather than once per Inngest step invocation.
let _stripe: Stripe | null = null;
function getStripe(): Stripe | null {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) return null;
    _stripe = new Stripe(key, { apiVersion: "2026-02-25.clover" });
  }
  return _stripe;
}

// ─── Helpers ──────────────────────────────────────────────────────────────

/** Derive UK vs US from Stripe shipping/billing country. */
function regionFromCountry(country: string | null | undefined): "US" | "UK" {
  return country === "GB" ? "UK" : "US";
}

/** Build a Printify-shaped address from a Stripe session. */
function buildPrintifyAddress(session: Stripe.Checkout.Session): PrintifyAddress {
  const shipping = session.collected_information?.shipping_details;
  const billing = session.customer_details;
  const addr = shipping?.address ?? billing?.address;
  const name = shipping?.name ?? billing?.name ?? "Keepsy Customer";
  const email = billing?.email ?? "";

  if (!addr?.line1 || !addr?.city || !addr?.country || !addr?.postal_code) {
    throw new Error(
      "No complete shipping/billing address on Stripe session — cannot fulfil order."
    );
  }

  const { first_name, last_name } = splitName(name);

  return {
    first_name,
    last_name,
    email,
    phone: billing?.phone ?? undefined,
    country: addr.country,
    region: addr.state ?? undefined,
    address1: addr.line1,
    address2: addr.line2 ?? undefined,
    city: addr.city,
    zip: addr.postal_code,
  };
}

// ─── Main Inngest function ─────────────────────────────────────────────────

export const stripeWebhookProcess = inngest.createFunction(
  {
    id: "stripe-webhook-process",
    name: "Process Stripe Webhook Event",
    retries: 3,
    concurrency: [{ limit: 20 }],
    throttle: { limit: 5, period: "1s" },
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

    // ── checkout.session.completed ─────────────────────────────────────────
    if (eventType === "checkout.session.completed" || eventType === "checkout.session.async_payment_succeeded") {
      const session = payload.data.object as Stripe.Checkout.Session;
      const stripe = getStripe();
      if (!stripe) throw new Error("STRIPE_SECRET_KEY not set");

      if (session.payment_status && session.payment_status !== "paid" && session.payment_status !== "no_payment_required") {
        console.log("[stripe-webhook] Session not paid yet — not fulfilling:", session.id, session.payment_status);
        return { skipped: "unpaid" };
      }

      // Expand price.product so we can access per-item metadata (productId, size, color)
      const [lineItems] = await Promise.all([
        step.run("fetch-line-items", () =>
          stripe.checkout.sessions.listLineItems(session.id, {
            limit: 100,
            expand: ["data.price.product"],
          })
        ),
      ]);

      const amountTotal = (session.amount_total ?? 0) / 100;
      const orderRef =
        session.metadata?.order_ref || session.client_reference_id || `order_${session.id}`;
      const prompt = session.metadata?.prompt || "";
      const designUrl = session.metadata?.design_url || null;

      const customerEmail =
        (session.customer_details?.email as string) || (session.customer_email as string) || null;
      const customerName =
        session.collected_information?.shipping_details?.name ??
        session.customer_details?.name ??
        null;
      const shippingAddr =
        session.collected_information?.shipping_details?.address ??
        session.customer_details?.address ??
        null;

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
            customer_email: customerEmail,
            customer_name: customerName,
            shipping_address: shippingAddr ? JSON.stringify(shippingAddr) : null,
          },
          { onConflict: "order_ref" }
        );
        if (orderErr) throw new Error("Failed to upsert order: " + orderErr.message);
      });

      await step.run("upsert-order-items", async () => {
        const { data: existingRows } = await supabase
          .from("order_items")
          .select("product_id")
          .eq("order_ref", orderRef);
        const hasRichRows = (existingRows ?? []).some((r) => (r as { product_id?: string | null }).product_id);
        if (hasRichRows) return; // keep the per-line print sources written at checkout
        await supabase.from("order_items").delete().eq("order_ref", orderRef);
        if (lineItems.data.length > 0) {
          const { error: itemsErr } = await supabase
            .from("order_items")
            .insert(orderItemRowsFromStripeLineItems(orderRef, lineItems.data));
          if (itemsErr) throw new Error("Failed to insert order items: " + itemsErr.message);
        }
      });

      await step.run("send-atelier-email", async () => {
        if (customerEmail) {
          await sendAtelierCreationEmail({
            to: customerEmail,
            designPrompt: prompt || undefined,
            orderRef,
          });
        }
      });

      // ── Printify fulfilment — shared pipeline, every paid line ────────────
      if (!process.env.PRINTIFY_API_TOKEN) {
        console.warn("[printify] Skipping fulfilment — PRINTIFY_API_TOKEN not set");
      } else {
        const shippingCountry =
          session.collected_information?.shipping_details?.address?.country ??
          session.customer_details?.address?.country;
        const region = regionFromCountry(shippingCountry);

        await step.run("printify-fulfil-all-lines", async () => {
          const { data: orderRow } = await supabase
            .from("orders")
            .select("cropped_image_url, generated_image_url")
            .eq("order_ref", orderRef)
            .maybeSingle();
          const fallback = {
            designUrl: (orderRow?.generated_image_url as string | null) ?? designUrl,
            croppedImageUrl: (orderRow?.cropped_image_url as string | null) ?? null,
          };
          const { data: rows } = await supabase
            .from("order_items")
            .select("product_id, size, color, quantity, design_url, cropped_image_url, source_kind")
            .eq("order_ref", orderRef);
          const richRows = ((rows ?? []) as OrderItemRow[]).filter((r) => r.product_id);
          const lines =
            richRows.length > 0
              ? linesFromOrderItems(richRows, fallback)
              : linesFromStripeLineItems(lineItems.data, fallback);

          if (lines.length === 0 || lines.some((l) => !l.designUrl)) {
            await supabase
              .from("orders")
              .update({ printify_status: "needs_manual_review" })
              .eq("order_ref", orderRef);
            return { skipped: "no_fulfilable_lines" };
          }

          try {
            const address = buildPrintifyAddress(session);
            const result = await fulfilOrderLines({ orderRef, region, lines, address, supabase });
            return { printifyOrderId: result.printifyOrderId, lines: result.lines.length, alreadyFulfilled: result.alreadyFulfilled ?? false };
          } catch (err) {
            // Mark for manual review — do NOT auto-refund and do NOT let Inngest retry the step:
            // a retry could create a duplicate physical order. Operators use /api/admin/retry-order.
            const msg = err instanceof Error ? err.message : String(err);
            console.error("[printify] Failed to fulfil order:", msg);
            if (!(err instanceof SubmitUncertainError)) {
              await supabase
                .from("orders")
                .update({ printify_status: "needs_manual_review" })
                .eq("order_ref", orderRef);
            }
            notifyFounders(
              `Printify fulfilment ${err instanceof SubmitUncertainError ? "UNCERTAIN" : "failed"} for order ${orderRef}`,
              `Order: ${orderRef}\nError: ${msg}\nCustomer email: ${customerEmail ?? "unknown"}\nAction needed: check https://app.printify.com for external_id=${orderRef} before re-submitting.`,
              "critical"
            ).catch(() => {});
            return { failed: true, reason: msg };
          }
        });
      }

      await step.run("clear-design-cache", () => clearDesignCacheForOrder(designUrl));
    }

    // ── checkout.session.async_payment_failed ──────────────────────────────
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

    // ── checkout.session.expired ───────────────────────────────────────────
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
