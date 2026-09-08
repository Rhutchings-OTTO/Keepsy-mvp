import Stripe from "stripe";
import { schemas } from "@/lib/http/validate";
import { logSecurityEvent } from "@/lib/security/auditLog";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { sendOrderConfirmationEmail } from "@/lib/emails/orderEmails";
import { clearDesignCacheForOrder } from "@/lib/cache/designCache";
import { splitName, type PrintifyAddress } from "@/lib/printify";
import { notifyFounders } from "@/lib/notifications";
import { fulfilOrderLines, SubmitUncertainError, type FulfilmentLine } from "@/lib/fulfilment/printifyFulfilment";
import {
  linesFromOrderItems,
  linesFromStripeLineItems,
  orderItemRowsFromStripeLineItems,
  type OrderItemRow,
} from "@/lib/fulfilment/orderLines";

export const runtime = "nodejs";
// Multi-line fulfilment does several image composites + Printify calls inline.
// Vercel: honoured up to the plan's ceiling (Hobby 60s, Pro 300s).
export const maxDuration = 300;

const MAX_WEBHOOK_BODY = schemas.webhookMaxBytes;

// Module-level singleton — one Stripe client per Node.js worker, not per request.
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2026-02-25.clover",
});

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
    throw new Error("No complete shipping/billing address on Stripe session — cannot fulfil order.");
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
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!process.env.STRIPE_SECRET_KEY || !webhookSecret) {
    return new Response(JSON.stringify({ error: "Missing Stripe webhook configuration." }), { status: 500 });
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
      return new Response(JSON.stringify({ error: "Webhook payload too large." }), { status: 413 });
    }
  }

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

  // Return 200 after signature verification — catch downstream errors so Stripe
  // does not retry on application-level failures. The one exception: if we could
  // not record the event id for idempotency, ask Stripe to redeliver (500) rather
  // than processing without a dedup record.
  try {
    const outcome = await processEvent(event, stripe, payload);
    if (outcome === "dedup_unavailable") {
      return new Response(JSON.stringify({ error: "Event store unavailable, retry later." }), { status: 500 });
    }
  } catch (err) {
    console.error("[stripe-webhook] Unhandled error processing event:", event.id, event.type, err instanceof Error ? err.message : err);
    // Release this event's claim on a transient failure. The order-level claim
    // and submit_uncertain state independently prevent duplicate print orders.
    const db = getSupabaseAdmin();
    if (db) await db.from("stripe_events").delete().eq("stripe_event_id", event.id);
    return new Response(JSON.stringify({ error: "Processing unavailable, retry later." }), { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
}

// ─── Event processor ──────────────────────────────────────────────────────────

async function processEvent(event: Stripe.Event, stripe: Stripe, rawPayload: string): Promise<"ok" | "dedup_unavailable"> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    console.warn("[stripe-webhook] Supabase not configured, retry event:", event.id);
    return "dedup_unavailable";
  }

  // Idempotency — skip if already processed
  const { data: existing } = await supabase
    .from("stripe_events")
    .select("id")
    .eq("stripe_event_id", event.id)
    .maybeSingle();

  if (existing) {
    console.log("[stripe-webhook] Duplicate event, skipping:", event.id);
    return "ok";
  }

  const { error: insertErr } = await supabase.from("stripe_events").insert({
    stripe_event_id: event.id,
    event_type: event.type,
    payload: JSON.parse(rawPayload) as Record<string, unknown>,
  });

  if (insertErr) {
    if (insertErr.code === "23505") {
      console.log("[stripe-webhook] Duplicate event (race condition), skipping:", event.id);
      return "ok";
    }
    // Without a dedup record a redelivery would fulfil twice — let Stripe retry later instead.
    console.error("[stripe-webhook] Failed to persist event record:", insertErr.message);
    return "dedup_unavailable";
  }

  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.payment_status && session.payment_status !== "paid" && session.payment_status !== "no_payment_required") {
      // Delayed-notification payment methods: the money has not arrived yet. Record, don't ship.
      const orderRef = session.metadata?.order_ref || session.client_reference_id;
      console.log("[stripe-webhook] Session completed but unpaid — waiting for async_payment_succeeded:", session.id);
      const q = supabase.from("orders").update({ status: "pending", stripe_session_id: session.id });
      const { error } = orderRef ? await q.eq("order_ref", orderRef) : await q.eq("stripe_session_id", session.id);
      if (error) console.error("[stripe-webhook] Failed to record unpaid session:", error.message);
      return "ok";
    }
    await handleCheckoutCompleted(session, stripe, supabase);
    return "ok";
  }

  if (event.type === "checkout.session.async_payment_failed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderRef = session.metadata?.order_ref || session.client_reference_id;
    const q = supabase.from("orders").update({ status: "failed", stripe_session_id: session.id });
    const { error } = orderRef ? await q.eq("order_ref", orderRef) : await q.eq("stripe_session_id", session.id);
    if (error) console.error("[stripe-webhook] Failed to mark order failed:", error.message);
    return "ok";
  }

  if (event.type === "checkout.session.expired") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderRef = session.metadata?.order_ref || session.client_reference_id;
    const q = supabase.from("orders").update({ status: "cancelled", stripe_session_id: session.id });
    const { error } = orderRef ? await q.eq("order_ref", orderRef) : await q.eq("stripe_session_id", session.id);
    if (error) console.error("[stripe-webhook] Failed to mark order cancelled:", error.message);
    return "ok";
  }
  return "ok";
}

// ─── checkout.session.completed ───────────────────────────────────────────────

async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
  stripe: Stripe,
  supabase: NonNullable<ReturnType<typeof getSupabaseAdmin>>
): Promise<void> {
  const orderRef = session.metadata?.order_ref || session.client_reference_id || `order_${session.id}`;
  const prompt = session.metadata?.prompt || "";
  const sessionDesignUrl = session.metadata?.design_url || null;

  // Prefer the full URLs stored in Supabase at checkout over Stripe metadata
  // (metadata values are truncated to 490 chars).
  let croppedImageUrl = session.metadata?.cropped_image_url || null;
  let designUrl = sessionDesignUrl;
  {
    const { data: orderAsset, error: assetError } = await supabase
      .from("orders")
      .select("cropped_image_url, generated_image_url, printify_order_id")
      .eq("order_ref", orderRef)
      .maybeSingle();
    if (assetError) throw new Error("Cannot read order state: " + assetError.message);
    if (orderAsset?.printify_order_id) return;
    if (orderAsset?.cropped_image_url) croppedImageUrl = orderAsset.cropped_image_url as string;
    if (orderAsset?.generated_image_url) designUrl = orderAsset.generated_image_url as string;
  }
  const amountTotal = (session.amount_total ?? 0) / 100;

  const customerEmail = (session.customer_details?.email as string) || (session.customer_email as string) || null;

  const logEmail =
    process.env.NODE_ENV === "production"
      ? (customerEmail?.replace(/(.{2}).*(@.*)/, "$1***$2") ?? "unknown")
      : customerEmail;
  console.log("[webhook] Processing checkout.session.completed for order:", orderRef, "email:", logEmail);

  const customerName = session.collected_information?.shipping_details?.name ?? session.customer_details?.name ?? null;
  const shippingAddr = session.collected_information?.shipping_details?.address ?? session.customer_details?.address ?? null;

  // Fetch line items with expanded product metadata
  let lineItems: Stripe.ApiList<Stripe.LineItem> = { object: "list", data: [], has_more: false, url: "" };
  try {
    lineItems = await stripe.checkout.sessions.listLineItems(session.id, { limit: 100, expand: ["data.price.product"] });
  } catch (err) {
    throw new Error("Failed to fetch line items: " + (err instanceof Error ? err.message : String(err)));
  }

  // Upsert order. user_id comes from Stripe metadata (set at checkout from the server session) so an
  // order still gets its owner even when the checkout pre-insert failed; it matches the pre-insert value.
  const metadataUserId = session.metadata?.user_id;
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
      ...(metadataUserId && /^[0-9a-f-]{36}$/i.test(metadataUserId) ? { user_id: metadataUserId } : {}),
    },
    { onConflict: "order_ref" }
  );
  if (orderErr) throw new Error("Failed to upsert order: " + orderErr.message);

  // Order items: keep the rich rows written at checkout; only rebuild from Stripe when they are missing.
  const { data: existingItems } = await supabase
    .from("order_items")
    .select("product_id, size, color, quantity, design_url, cropped_image_url, source_kind")
    .eq("order_ref", orderRef);
  const richRows = ((existingItems ?? []) as OrderItemRow[]).filter((r) => r.product_id);

  if (richRows.length === 0 && lineItems.data.length > 0) {
    await supabase.from("order_items").delete().eq("order_ref", orderRef);
    const { error: itemsErr } = await supabase
      .from("order_items")
      .insert(orderItemRowsFromStripeLineItems(orderRef, lineItems.data));
    if (itemsErr) throw new Error("Failed to upsert order items: " + itemsErr.message);
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
    if (!emailResult.ok) {
      console.error("[email] order confirmation email failed for", logEmail, "error:", emailResult.error);
    }
  }

  // ── Fulfilment: every paid line ─────────────────────────────────────────────
  const fallback = { designUrl, croppedImageUrl };
  const lines: FulfilmentLine[] =
    richRows.length > 0
      ? linesFromOrderItems(richRows, fallback)
      : linesFromStripeLineItems(lineItems.data, fallback);

  if (!process.env.PRINTIFY_API_TOKEN) {
    console.warn("[printify] Skipping fulfilment — PRINTIFY_API_TOKEN not set");
    await clearDesignCacheForOrder(designUrl);
    return;
  }
  if (lines.length === 0 || lines.some((l) => !l.designUrl)) {
    const msg = lines.length === 0 ? "no fulfilable lines found" : "one or more lines have no print image URL";
    console.warn(`[printify] Order ${orderRef} needs manual review — ${msg}`);
    await supabase.from("orders").update({ printify_status: "needs_manual_review" }).eq("order_ref", orderRef);
    notifyFounders(
      `Order ${orderRef} needs manual fulfilment`,
      `Order: ${orderRef}\nReason: ${msg}\nCustomer email: ${customerEmail ?? "unknown"}`,
      "critical"
    ).catch(() => {});
    await clearDesignCacheForOrder(designUrl);
    return;
  }

  const shippingCountry =
    session.collected_information?.shipping_details?.address?.country ?? session.customer_details?.address?.country;
  const region = regionFromCountry(shippingCountry);

  try {
    const address = buildPrintifyAddress(session);
    const result = await fulfilOrderLines({ orderRef, region, lines, address, supabase });
    console.log("[printify] Order submitted successfully:", orderRef, "printifyOrderId:", result.printifyOrderId, "lines:", result.lines.length);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[printify] Fulfilment pipeline failed:", msg);
    if (!(err instanceof SubmitUncertainError)) {
      // (submit_uncertain is already recorded by the pipeline and must not be auto-retried)
      await supabase
        .from("orders")
        .update({ printify_status: "needs_manual_review" })
        .eq("order_ref", orderRef)
        .then(() => {}, () => {});
    }
    notifyFounders(
      `Printify fulfilment ${err instanceof SubmitUncertainError ? "UNCERTAIN" : "failed"} for order ${orderRef}`,
      `Order: ${orderRef}\nError: ${msg}\nCustomer email: ${customerEmail ?? "unknown"}\nAction needed: check https://app.printify.com for external_id=${orderRef} before re-submitting.`,
      "critical"
    ).catch(() => {});
  }

  await clearDesignCacheForOrder(designUrl);
}
