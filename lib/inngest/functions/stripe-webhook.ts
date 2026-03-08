import Stripe from "stripe";
import { inngest } from "../client";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { sendAtelierCreationEmail } from "@/lib/emails/sendAtelierEmail";
import { clearDesignCacheForOrder } from "@/lib/cache/designCache";
import {
  uploadImageToPrintify,
  createPrintifyProduct,
  submitPrintifyOrder,
  splitName,
  type PrintifyAddress,
} from "@/lib/printify";
import { getPrintifyVariantId } from "@/lib/printify-blueprints";
import { notifyFounders } from "@/lib/notifications";

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
    if (eventType === "checkout.session.completed") {
      const session = payload.data.object as Stripe.Checkout.Session;
      const stripe = getStripe();
      if (!stripe) throw new Error("STRIPE_SECRET_KEY not set");

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

      await step.run("send-atelier-email", async () => {
        if (customerEmail) {
          await sendAtelierCreationEmail({
            to: customerEmail,
            designPrompt: prompt || undefined,
            orderRef,
          });
        }
      });

      // ── Printify fulfilment — 4 retryable steps ──────────────────────────

      // Skip Printify if no design URL or API token not configured
      if (!designUrl || !process.env.PRINTIFY_API_TOKEN) {
        console.warn(
          "[printify] Skipping fulfilment — missing designUrl or PRINTIFY_API_TOKEN"
        );
      } else {
        // Extract product details from first line item metadata
        const firstItem = lineItems.data[0];
        const productMeta =
          typeof firstItem?.price?.product === "object" && firstItem.price.product !== null
            ? ((firstItem.price.product as Stripe.Product).metadata ?? {})
            : {};

        const productId = (productMeta.productId ?? session.metadata?.product_type ?? "card")
          .toLowerCase()
          .replace(/\s+/g, "");
        const size = productMeta.size || undefined;
        const color = productMeta.color || undefined;
        const quantity = firstItem?.quantity ?? 1;

        // Determine region from shipping address country
        const shippingCountry =
          session.collected_information?.shipping_details?.address?.country ??
          session.customer_details?.address?.country;
        const region = regionFromCountry(shippingCountry);

        // Step: Upload design image to Printify
        const printifyImageId = await step.run("printify-upload-image", async () => {
          const imageId = await uploadImageToPrintify(
            designUrl,
            `keepsy-${orderRef}.png`
          );

          await supabase
            .from("orders")
            .update({ printify_image_id: imageId, printify_status: "image_uploaded" })
            .eq("order_ref", orderRef);

          return imageId;
        });

        // Step: Create Printify product
        const printifyProductId = await step.run("printify-create-product", async () => {
          const { config, variantId } = getPrintifyVariantId(productId, region, color, size);

          const productTitle = `Keepsy ${productId} — ${orderRef}`;
          const pid = await createPrintifyProduct({
            title: productTitle,
            blueprintId: config.blueprintId,
            printProviderId: config.printProviderId,
            variantId,
            printImageId: printifyImageId,
            printPosition: config.printPosition,
            productType: productId,
          });

          await supabase
            .from("orders")
            .update({
              printify_product_id: pid,
              printify_status: "product_created",
              product_type: productId,
              variant_size: size ?? null,
              variant_color: color ?? null,
              region,
            })
            .eq("order_ref", orderRef);

          return { productId: pid, variantId };
        });

        // Step: Submit Printify order
        await step.run("printify-submit-order", async () => {
          try {
            const { variantId } = printifyProductId;
            const address = buildPrintifyAddress(session);

            const printifyOrderId = await submitPrintifyOrder({
              externalId: orderRef,
              productId: printifyProductId.productId,
              variantId,
              quantity,
              shippingAddress: address,
            });

            await supabase
              .from("orders")
              .update({
                printify_order_id: printifyOrderId,
                printify_status: "sent_to_printify",
                status: "in_production",
              })
              .eq("order_ref", orderRef);
          } catch (err) {
            // Mark for manual review — do NOT auto-refund
            const msg = err instanceof Error ? err.message : String(err);
            console.error("[printify] Failed to submit order:", msg);

            await supabase
              .from("orders")
              .update({ printify_status: "needs_manual_review" })
              .eq("order_ref", orderRef);

            // Notify founders — fire and forget, don't await
            notifyFounders(
              `Printify fulfilment failed for order ${orderRef}`,
              `Order: ${orderRef}\nError: ${msg}\nCustomer email: ${customerEmail ?? "unknown"}\nAction needed: manually process this order at https://app.printify.com`,
              "critical"
            ).catch(() => {}); // swallow any notification errors

            // Re-throw so Inngest retries this step
            throw err;
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
