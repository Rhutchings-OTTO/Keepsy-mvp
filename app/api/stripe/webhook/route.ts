import Stripe from "stripe";
import { schemas } from "@/lib/http/validate";
import { logSecurityEvent } from "@/lib/security/auditLog";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { sendOrderConfirmationEmail } from "@/lib/emails/orderEmails";
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

export const runtime = "nodejs";

const MAX_WEBHOOK_BODY = schemas.webhookMaxBytes;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function regionFromCountry(country: string | null | undefined): "US" | "UK" {
  return country === "GB" ? "UK" : "US";
}

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

// ─── Route handler ────────────────────────────────────────────────────────────

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

  const contentLength = req.headers.get("content-length");
  if (contentLength) {
    const len = parseInt(contentLength, 10);
    if (!Number.isNaN(len) && len > MAX_WEBHOOK_BODY) {
      logSecurityEvent({ type: "body_too_large", endpoint: "/api/stripe/webhook", size: len });
      return new Response(
        JSON.stringify({ error: "Webhook payload too large." }),
        { status: 413 }
      );
    }
  }

  const stripe = new Stripe(secretKey, { apiVersion: "2026-02-25.clover" });
  const payload = await req.text();
  if (payload.length > MAX_WEBHOOK_BODY) {
    logSecurityEvent({ type: "body_too_large", endpoint: "/api/stripe/webhook", size: payload.length });
    return new Response(JSON.stringify({ error: "Webhook payload too large." }), { status: 413 });
  }

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(payload, signature, webhookSecret);
  } catch (error) {
    logSecurityEvent({ type: "webhook_sig_fail", reason: "Invalid signature" });
    const message = error instanceof Error ? error.message : "Invalid webhook signature.";
    return new Response(JSON.stringify({ error: message }), { status: 400 });
  }

  // Always return 200 after signature verification — catch all downstream errors
  // so Stripe does not retry on application-level failures.
  try {
    await processEvent(event, stripe, payload);
  } catch (err) {
    console.error(
      "[stripe-webhook] Unhandled error processing event:",
      event.id,
      event.type,
      err instanceof Error ? err.message : err
    );
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
}

// ─── Event processor ──────────────────────────────────────────────────────────

async function processEvent(
  event: Stripe.Event,
  stripe: Stripe,
  rawPayload: string
): Promise<void> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    console.warn("[stripe-webhook] Supabase not configured, skipping event:", event.id);
    return;
  }

  // Idempotency — skip if already processed
  const { data: existing } = await supabase
    .from("stripe_events")
    .select("id")
    .eq("stripe_event_id", event.id)
    .maybeSingle();

  if (existing) {
    console.log("[stripe-webhook] Duplicate event, skipping:", event.id);
    return;
  }

  const { error: insertErr } = await supabase.from("stripe_events").insert({
    stripe_event_id: event.id,
    event_type: event.type,
    payload: JSON.parse(rawPayload) as Record<string, unknown>,
  });

  if (insertErr) {
    if (insertErr.code === "23505") {
      console.log("[stripe-webhook] Duplicate event (race condition), skipping:", event.id);
      return;
    }
    // Non-fatal — log but continue
    console.error("[stripe-webhook] Failed to persist event record:", insertErr.message);
  }

  if (event.type === "checkout.session.completed") {
    await handleCheckoutCompleted(
      event.data.object as Stripe.Checkout.Session,
      stripe,
      supabase
    );
    return;
  }

  if (event.type === "checkout.session.async_payment_failed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderRef = session.metadata?.order_ref || session.client_reference_id;
    const q = supabase.from("orders").update({ status: "failed", stripe_session_id: session.id });
    const { error } = orderRef
      ? await q.eq("order_ref", orderRef)
      : await q.eq("stripe_session_id", session.id);
    if (error) console.error("[stripe-webhook] Failed to mark order failed:", error.message);
    return;
  }

  if (event.type === "checkout.session.expired") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderRef = session.metadata?.order_ref || session.client_reference_id;
    const q = supabase.from("orders").update({ status: "cancelled", stripe_session_id: session.id });
    const { error } = orderRef
      ? await q.eq("order_ref", orderRef)
      : await q.eq("stripe_session_id", session.id);
    if (error) console.error("[stripe-webhook] Failed to mark order cancelled:", error.message);
    return;
  }

  // payment_intent.succeeded and all other events: no action needed
}

// ─── checkout.session.completed ───────────────────────────────────────────────

async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
  stripe: Stripe,
  supabase: NonNullable<ReturnType<typeof getSupabaseAdmin>>
): Promise<void> {
  const orderRef =
    session.metadata?.order_ref || session.client_reference_id || `order_${session.id}`;
  const prompt = session.metadata?.prompt || "";
  const designUrl = session.metadata?.design_url || null;
  const amountTotal = (session.amount_total ?? 0) / 100;

  const customerEmail =
    (session.customer_details?.email as string) ||
    (session.customer_email as string) ||
    null;

  console.log(
    "[webhook] Processing checkout.session.completed for order:", orderRef,
    "email:", customerEmail,
    "designUrl:", designUrl
  );

  const customerName =
    session.collected_information?.shipping_details?.name ??
    session.customer_details?.name ??
    null;
  const shippingAddr =
    session.collected_information?.shipping_details?.address ??
    session.customer_details?.address ??
    null;

  // Fetch line items with expanded product metadata
  let lineItems: Stripe.ApiList<Stripe.LineItem> = {
    object: "list",
    data: [],
    has_more: false,
    url: "",
  };
  try {
    lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
      limit: 100,
      expand: ["data.price.product"],
    });
  } catch (err) {
    console.error(
      "[stripe-webhook] Failed to fetch line items:",
      err instanceof Error ? err.message : err
    );
  }

  // Upsert order
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
  if (orderErr) {
    console.error("[stripe-webhook] Failed to upsert order:", orderErr.message);
  }

  // Upsert order items
  if (lineItems.data.length > 0) {
    await supabase.from("order_items").delete().eq("order_ref", orderRef);
    const { error: itemsErr } = await supabase.from("order_items").insert(
      lineItems.data.map((item) => ({
        order_ref: orderRef,
        product_name: item.description || "Keepsy item",
        quantity: item.quantity || 1,
        unit_price_gbp: (item.price?.unit_amount ?? 0) / 100,
        line_total_gbp: (item.amount_total ?? 0) / 100,
      }))
    );
    if (itemsErr) {
      console.error("[stripe-webhook] Failed to upsert order items:", itemsErr.message);
    }
  }

  // Send confirmation email
  if (customerEmail) {
    const emailResult = await sendOrderConfirmationEmail({
      to: customerEmail,
      orderRef,
      customerName: customerName ?? undefined,
      productName: lineItems.data[0]?.description ?? undefined,
      designPrompt: prompt || undefined,
    });
    console.log("[email] send result:", emailResult);
    if (!emailResult.ok) {
      console.error("[email] order confirmation email failed for", customerEmail, "error:", emailResult.error);
    }
  }

  // Printify fulfillment
  if (!designUrl || !process.env.PRINTIFY_API_TOKEN) {
    console.warn("[printify] Skipping fulfillment — missing designUrl or PRINTIFY_API_TOKEN");
    await clearDesignCacheForOrder(designUrl);
    return;
  }

  try {
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

    const shippingCountry =
      session.collected_information?.shipping_details?.address?.country ??
      session.customer_details?.address?.country;
    const region = regionFromCountry(shippingCountry);

    // Upload design image to Printify
    const printifyImageId = await uploadImageToPrintify(designUrl, `keepsy-${orderRef}.png`);
    await supabase
      .from("orders")
      .update({ printify_image_id: printifyImageId, printify_status: "image_uploaded" })
      .eq("order_ref", orderRef);

    // Create Printify product
    const { config, variantId } = getPrintifyVariantId(productId, region, color, size);
    const printifyProductId = await createPrintifyProduct({
      title: `Keepsy ${productId} — ${orderRef}`,
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
        printify_product_id: printifyProductId,
        printify_status: "product_created",
        product_type: productId,
        variant_size: size ?? null,
        variant_color: color ?? null,
        region,
      })
      .eq("order_ref", orderRef);

    // Submit Printify order
    try {
      const address = buildPrintifyAddress(session);
      console.log("[printify] Submitting order — args:", JSON.stringify({
        externalId: orderRef,
        productId: printifyProductId,
        variantId,
        quantity,
        shippingAddress: address,
      }));
      const printifyOrderId = await submitPrintifyOrder({
        externalId: orderRef,
        productId: printifyProductId,
        variantId,
        quantity,
        shippingAddress: address,
      });
      console.log("[printify] Order submitted successfully, printifyOrderId:", printifyOrderId);
      await supabase
        .from("orders")
        .update({
          printify_order_id: printifyOrderId,
          printify_status: "sent_to_printify",
          status: "in_production",
        })
        .eq("order_ref", orderRef);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[printify] Failed to submit order:", msg, JSON.stringify(err, Object.getOwnPropertyNames(err)));
      await supabase
        .from("orders")
        .update({ printify_status: "needs_manual_review" })
        .eq("order_ref", orderRef);
      notifyFounders(
        `Printify fulfilment failed for order ${orderRef}`,
        `Order: ${orderRef}\nError: ${msg}\nCustomer email: ${customerEmail ?? "unknown"}\nAction needed: manually process at https://app.printify.com`,
        "critical"
      ).catch(() => {});
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[printify] Fulfillment pipeline failed:", msg);
    await supabase
      .from("orders")
      .update({ printify_status: "needs_manual_review" })
      .eq("order_ref", orderRef)
      .then(
        () => {},
        () => {}
      );
    notifyFounders(
      `Printify fulfillment pipeline failed for order ${orderRef}`,
      `Order: ${orderRef}\nError: ${msg}\nCustomer email: ${customerEmail ?? "unknown"}`,
      "critical"
    ).catch(() => {});
  }

  await clearDesignCacheForOrder(designUrl);
}
