import { getPrintifyOrder } from "@/lib/printify";
import { after } from "next/server";
import { recordOrderEvent, type OrderEventType } from "@/lib/orders/events";
import {
  enqueueOwnerNotification,
  drainOwnerNotifications,
} from "@/lib/notifications/outbox";
/**
 * Printify Webhook Handler
 * ────────────────────────
 * Endpoint: POST /api/webhooks/printify
 * Register this URL in Printify dashboard → Settings → Webhooks
 *
 * Events handled:
 *   - order:sent-to-production → triggers In Production email
 *   - order:shipment:created   → triggers Shipped email with tracking
 *   - order:shipment:delivered / order:completed → triggers Delivered email
 *
 * Printify webhook docs: https://developers.printify.com/#webhooks
 *
 * Signature verification: Set PRINTIFY_WEBHOOK_SECRET in Vercel env vars.
 * Printify signs payloads with HMAC-SHA256 in the X-Pfy-Signature header.
 *
 * TODO — Duplicate email prevention for "in_production":
 *   The Stripe webhook sets status="in_production" immediately after submitting
 *   to Printify. When Printify later fires order:sent-to-production, the order
 *   is already "in_production" in our DB. We skip the email in that case via the
 *   idempotency check below. If you want to send the email on Printify confirmation
 *   instead of the Stripe submission, remove the status check and add a
 *   sent_production_email BOOLEAN column to dedup:
 *     ALTER TABLE orders ADD COLUMN IF NOT EXISTS sent_production_email BOOLEAN DEFAULT FALSE;
 */

import { createHmac, timingSafeEqual } from "crypto";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import {
  sendInProductionEmail,
  sendShippedEmail,
  sendDeliveredEmail,
} from "@/lib/emails/orderEmails";
import { notifyFounders } from "@/lib/notifications";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

// TODO: Add these columns to Supabase if not present:
//   ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number TEXT;
//   ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_url TEXT;

const MAX_BODY_BYTES = 64 * 1024;

const IN_PRODUCTION_STATUSES = new Set([
  "in_production",
  "shipped",
  "delivered",
]);
const SHIPPED_STATUSES = new Set(["shipped", "delivered"]);

function verifySignature(
  rawBody: string,
  signature: string,
  secret: string,
): boolean {
  const expected = createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("hex");
  const expectedBuf = Buffer.from(expected, "hex");
  const receivedBuf = Buffer.from(signature.replace(/^sha256=/, ""), "hex");
  if (expectedBuf.length !== receivedBuf.length) return false;
  return timingSafeEqual(expectedBuf, receivedBuf);
}

export async function POST(req: Request): Promise<Response> {
  const ok200 = () =>
    new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  // ── Size guard ───────────────────────────────────────────────────────────
  const contentLength = parseInt(req.headers.get("content-length") ?? "0", 10);
  if (contentLength > MAX_BODY_BYTES) {
    return new Response(JSON.stringify({ error: "Payload too large" }), {
      status: 413,
      headers: { "Content-Type": "application/json" },
    });
  }

  // ── Read raw body ────────────────────────────────────────────────────────
  let rawBody: string;
  try {
    rawBody = await req.text();
  } catch {
    return new Response(JSON.stringify({ error: "Failed to read body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (Buffer.byteLength(rawBody, "utf8") > MAX_BODY_BYTES)
    return new Response("Payload too large", { status: 413 });

  // ── Signature verification ───────────────────────────────────────────────
  const webhookSecret = process.env.PRINTIFY_WEBHOOK_SECRET;
  if (webhookSecret) {
    const signature = req.headers.get("x-pfy-signature") ?? "";
    if (!signature || !verifySignature(rawBody, signature, webhookSecret)) {
      console.warn("[printify-webhook] Invalid signature — rejecting request");
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
  } else if (process.env.NODE_ENV === "production") {
    console.error(
      "[printify-webhook] PRINTIFY_WEBHOOK_SECRET not set — rejecting all requests for security",
    );
    return new Response(JSON.stringify({ error: "Webhook not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // ── Parse payload ────────────────────────────────────────────────────────
  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const eventType = payload.type as string | undefined;
  const resource = payload.resource as Record<string, unknown> | undefined;

  if (!eventType || !resource) {
    console.log("[printify-webhook] Missing event type or resource — ignoring");
    return ok200();
  }

  const printifyOrderId = resource.id as string | undefined;
  if (!printifyOrderId) {
    console.log(
      "[printify-webhook] No printify order ID in payload — ignoring event:",
      eventType,
    );
    return ok200();
  }

  console.log(
    "[printify-webhook] Received event:",
    eventType,
    "printifyOrderId:",
    printifyOrderId,
  );

  // ── Supabase ─────────────────────────────────────────────────────────────
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    console.error(
      "[printify-webhook] Supabase not configured — cannot process event",
    );
    return new Response("Database unavailable", { status: 503 });
  }

  try {
    const { data: auditOrder, error: auditLookupError } = await supabase
      .from("orders")
      .select("order_ref,status,printify_status")
      .eq("printify_order_id", printifyOrderId)
      .maybeSingle();
    if (auditLookupError) throw new Error("Order lookup unavailable");
    // Hooks cover the entire Printify shop, including unrelated integrations.
    // Only ask for redelivery of a missing order when its external reference
    // identifies it as a Keepsy checkout; never block hooks for other shops' work.
    if (
      !auditOrder &&
      [
        "order:created",
        "order:sent-to-production",
        "order:shipment:created",
        "order:shipment:delivered",
      ].includes(eventType)
    ) {
      const missing = await getPrintifyOrder(printifyOrderId);
      if (!missing.external_id?.startsWith("order_")) return ok200();
      return new Response("Keepsy order not ready; retry", { status: 503 });
    }
    // A shipment callback is not proof that the whole order is complete.
    const providerOrder =
      auditOrder && eventType.startsWith("order:shipment:")
        ? await getPrintifyOrder(printifyOrderId)
        : null;
    const fullyShipped = providerOrder?.status === "fulfilled";
    const fullyDelivered =
      fullyShipped &&
      !!providerOrder?.shipments?.length &&
      providerOrder.shipments.every((p) => !!p.delivered_at);
    const eventData = resource.data as
      | {
          carrier?: {
            code?: string;
            tracking_number?: string;
            tracking_url?: string;
          };
          skus?: string[];
        }
      | undefined;
    const auditTypes: Record<string, OrderEventType> = {
      "order:created": "printify_received",
      "order:sent-to-production": "in_production",
      "order:shipment:created": fullyShipped ? "shipped" : "shipment_created",
      "order:shipment:delivered": fullyDelivered
        ? "delivered"
        : "shipment_delivered",
    };
    // Printify can deliver its callback before our submission response is saved.
    if (!auditOrder && auditTypes[eventType])
      return new Response("Order not ready; retry", { status: 503 });
    if (auditOrder && auditTypes[eventType]) {
      const result = await recordOrderEvent(supabase, {
        orderRef: auditOrder.order_ref,
        type: auditTypes[eventType],
        source: "printify",
        externalId: printifyOrderId,
        data: {
          trackingNumber: eventData?.carrier?.tracking_number,
          trackingUrl: eventData?.carrier?.tracking_url,
          skus: eventData?.skus,
          providerOccurredAt: payload.created_at,
          fullyShipped,
          fullyDelivered,
        },
        idempotencyKey: String(payload.id || eventType + ":" + printifyOrderId),
      });
      if (!result.ok) throw new Error("Order timeline unavailable");
      await enqueueOwnerNotification(supabase, {
        key:
          "printify:" + String(payload.id || eventType + ":" + printifyOrderId),
        kind: "fulfilment",
        orderRef: auditOrder.order_ref,
        title: "Keepsy order update",
        body:
          auditOrder.order_ref +
          ": " +
          auditTypes[eventType].replace(/_/g, " "),
        severity: "info",
      });
      after(async () => {
        await drainOwnerNotifications(supabase);
      });
    }
    // Never move a delivered/shipped order backwards on a delayed callback.
    const rank: Record<string, number> = {
      paid: 0,
      in_production: 1,
      shipped: 2,
      delivered: 3,
    };
    const targetRank: Record<string, number> = {
      "order:created": -1,
      "order:sent-to-production": 1,
      "order:shipment:created": 2,
      "order:shipment:delivered": 3,
    };
    if (
      auditOrder &&
      (rank[auditOrder.status] ?? -1) > (targetRank[eventType] ?? 99)
    )
      return ok200();
    if (
      auditOrder &&
      eventType === "order:shipment:delivered" &&
      !fullyDelivered
    ) {
      const { error } = await supabase
        .from("orders")
        .update({ printify_status: "partially_delivered" })
        .eq("order_ref", auditOrder.order_ref)
        .neq("status", "delivered");
      if (error) throw new Error("Could not record partial delivery");
      return ok200();
    }
    if (auditOrder && eventType === "order:shipment:created" && !fullyShipped) {
      const { error } = await supabase
        .from("orders")
        .update({
          printify_status: "partially_shipped",
          tracking_number: eventData?.carrier?.tracking_number || null,
          tracking_url: eventData?.carrier?.tracking_url || null,
        })
        .eq("order_ref", auditOrder.order_ref)
        .in("status", ["paid", "in_production"])
        .or("printify_status.is.null,printify_status.neq.partially_delivered");
      if (error) throw new Error("Could not record partial shipment");
      return ok200();
    }
    if (eventType === "order:created") {
      // Acknowledge receipt; no email needed at this stage
      const { error: updateError } = await supabase
        .from("orders")
        .update({ printify_status: "printify_received" })
        .eq("printify_order_id", printifyOrderId)
        .in("status", ["pending", "paid"]);
      if (updateError) throw new Error("Could not save provider status");
      console.log(
        "[printify-webhook] order:created — marked printify_received for",
        printifyOrderId,
      );
    } else if (eventType === "order:sent-to-production") {
      const { data: existing } = await supabase
        .from("orders")
        .select(
          "order_ref, customer_email, customer_name, product_type, status",
        )
        .eq("printify_order_id", printifyOrderId)
        .maybeSingle();

      if (!existing) {
        console.warn(
          "[printify-webhook] order:sent-to-production — no matching order for printifyOrderId:",
          printifyOrderId,
        );
        return ok200();
      }

      console.log(
        "[printify-webhook] order:sent-to-production — order:",
        existing.order_ref,
        "current status:",
        existing.status,
      );

      const { error: updateError } = await supabase
        .from("orders")
        .update({ printify_status: "in_production", status: "in_production" })
        .eq("printify_order_id", printifyOrderId)
        .in("status", ["paid", "in_production"]);
      if (updateError) throw new Error("Could not save production status");

      if (IN_PRODUCTION_STATUSES.has(existing.status)) {
        // Idempotency: Stripe webhook already set status=in_production after submitting to Printify.
        // Skip the email to avoid a duplicate "now in production" email.
        console.log(
          "[printify-webhook] order:sent-to-production — skipping email, status already:",
          existing.status,
        );
      } else if (existing.customer_email) {
        const sent = await sendInProductionEmail({
          to: existing.customer_email,
          orderRef: existing.order_ref,
          customerName: existing.customer_name ?? undefined,
          productName: existing.product_type ?? undefined,
        });
        console.log(
          "[printify-webhook] in-production email sent:",
          sent,
          "to:",
          existing.customer_email,
          "order:",
          existing.order_ref,
        );
      }
    } else if (eventType === "order:shipment:created") {
      const shipments = resource.shipments as
        | Array<{
            carrier?: string;
            number?: string;
            url?: string;
          }>
        | undefined;
      const tracking = eventData?.carrier
        ? {
            number: eventData.carrier.tracking_number,
            url: eventData.carrier.tracking_url,
            carrier: eventData.carrier.code,
          }
        : providerOrder?.shipments?.[0] || shipments?.[0];

      console.log(
        "[printify-webhook] order:shipment:created — printifyOrderId:",
        printifyOrderId,
        "tracking:",
        JSON.stringify(tracking),
      );

      const { data: existing } = await supabase
        .from("orders")
        .select(
          "order_ref, customer_email, customer_name, product_type, status",
        )
        .eq("printify_order_id", printifyOrderId)
        .maybeSingle();

      if (!existing) {
        console.warn(
          "[printify-webhook] order:shipment:created — no matching order for printifyOrderId:",
          printifyOrderId,
        );
        return ok200();
      }

      const { error: updateError } = await supabase
        .from("orders")
        .update({
          printify_status: "shipped",
          status: "shipped",
          tracking_number: tracking?.number ?? null,
          tracking_url: tracking?.url ?? null,
        })
        .eq("printify_order_id", printifyOrderId)
        .in("status", ["paid", "in_production", "shipped"]);
      if (updateError) throw new Error("Could not save shipment status");

      if (SHIPPED_STATUSES.has(existing.status)) {
        console.log(
          "[printify-webhook] order:shipment:created — skipping email, status already:",
          existing.status,
        );
      } else if (existing.customer_email) {
        const sent = await sendShippedEmail({
          to: existing.customer_email,
          orderRef: existing.order_ref,
          customerName: existing.customer_name ?? undefined,
          productName: existing.product_type ?? undefined,
          trackingNumber: tracking?.number ?? null,
          trackingUrl: tracking?.url ?? null,
        });
        console.log(
          "[printify-webhook] shipped email sent:",
          sent,
          "to:",
          existing.customer_email,
          "order:",
          existing.order_ref,
        );
      }
    } else if (eventType === "order:shipment:delivered") {
      const { data: existing } = await supabase
        .from("orders")
        .select(
          "order_ref, customer_email, customer_name, product_type, status",
        )
        .eq("printify_order_id", printifyOrderId)
        .maybeSingle();

      if (!existing) {
        console.warn(
          "[printify-webhook]",
          eventType,
          "— no matching order for printifyOrderId:",
          printifyOrderId,
        );
        return ok200();
      }

      console.log(
        "[printify-webhook]",
        eventType,
        "— order:",
        existing.order_ref,
        "current status:",
        existing.status,
      );

      if (existing.status === "delivered") {
        console.log(
          "[printify-webhook]",
          eventType,
          "— already delivered, skipping",
        );
        return ok200();
      }

      const { error: updateError } = await supabase
        .from("orders")
        .update({ printify_status: "delivered", status: "delivered" })
        .eq("printify_order_id", printifyOrderId);
      if (updateError) throw new Error("Could not save delivery status");

      if (existing.customer_email) {
        const sent = await sendDeliveredEmail({
          to: existing.customer_email,
          orderRef: existing.order_ref,
          customerName: existing.customer_name ?? undefined,
          productName: existing.product_type ?? undefined,
        });
        console.log(
          "[printify-webhook] delivered email sent:",
          sent,
          "to:",
          existing.customer_email,
          "order:",
          existing.order_ref,
        );
      }
    } else {
      console.log(
        "[printify-webhook] Unrecognised event type:",
        eventType,
        "— no action taken",
      );
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[printify-webhook] Processing failed:", msg);
    notifyFounders(
      `Printify webhook processing failed (${eventType})`,
      `Event: ${eventType}\nPrintify Order ID: ${printifyOrderId}\nError: ${msg}\nTimestamp: ${new Date().toISOString()}`,
      "warning",
    ).catch(() => {});
    return new Response("Retry required", { status: 503 });
  }

  return ok200();
}
