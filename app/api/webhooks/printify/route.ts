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

import { createHmac } from "crypto";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import {
  sendInProductionEmail,
  sendShippedEmail,
  sendDeliveredEmail,
} from "@/lib/emails/orderEmails";
import { notifyFounders } from "@/lib/notifications";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// TODO: Add these columns to Supabase if not present:
//   ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number TEXT;
//   ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_url TEXT;

const MAX_BODY_BYTES = 64 * 1024;

const IN_PRODUCTION_STATUSES = new Set(["in_production", "shipped", "delivered"]);
const SHIPPED_STATUSES = new Set(["shipped", "delivered"]);

function verifySignature(rawBody: string, signature: string, secret: string): boolean {
  const expected = createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("hex");
  const expectedBuf = Buffer.from(expected, "hex");
  const receivedBuf = Buffer.from(signature.replace(/^sha256=/, ""), "hex");
  if (expectedBuf.length !== receivedBuf.length) return false;
  return expectedBuf.equals(receivedBuf);
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
    console.warn("[printify-webhook] PRINTIFY_WEBHOOK_SECRET not set — skipping signature check");
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
    console.log("[printify-webhook] No printify order ID in payload — ignoring event:", eventType);
    return ok200();
  }

  console.log("[printify-webhook] Received event:", eventType, "printifyOrderId:", printifyOrderId);

  // ── Supabase ─────────────────────────────────────────────────────────────
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    console.error("[printify-webhook] Supabase not configured — cannot process event");
    return ok200();
  }

  try {
    if (eventType === "order:created") {
      // Acknowledge receipt; no email needed at this stage
      await supabase
        .from("orders")
        .update({ printify_status: "printify_received" })
        .eq("printify_order_id", printifyOrderId);
      console.log("[printify-webhook] order:created — marked printify_received for", printifyOrderId);

    } else if (eventType === "order:sent-to-production") {
      const { data: existing } = await supabase
        .from("orders")
        .select("order_ref, customer_email, customer_name, product_type, status")
        .eq("printify_order_id", printifyOrderId)
        .maybeSingle();

      if (!existing) {
        console.warn("[printify-webhook] order:sent-to-production — no matching order for printifyOrderId:", printifyOrderId);
        return ok200();
      }

      console.log("[printify-webhook] order:sent-to-production — order:", existing.order_ref, "current status:", existing.status);

      await supabase
        .from("orders")
        .update({ printify_status: "in_production", status: "in_production" })
        .eq("printify_order_id", printifyOrderId);

      if (IN_PRODUCTION_STATUSES.has(existing.status)) {
        // Idempotency: Stripe webhook already set status=in_production after submitting to Printify.
        // Skip the email to avoid a duplicate "now in production" email.
        console.log("[printify-webhook] order:sent-to-production — skipping email, status already:", existing.status);
      } else if (existing.customer_email) {
        const sent = await sendInProductionEmail({
          to: existing.customer_email,
          orderRef: existing.order_ref,
          customerName: existing.customer_name ?? undefined,
          productName: existing.product_type ?? undefined,
        });
        console.log("[printify-webhook] in-production email sent:", sent, "to:", existing.customer_email, "order:", existing.order_ref);
        notifyFounders(
          "Order in production",
          `Order ${existing.order_ref} is now being produced`,
          "info"
        ).catch(() => {});
      }

    } else if (eventType === "order:shipment:created") {
      const shipments = resource.shipments as Array<{
        carrier?: string;
        number?: string;
        url?: string;
      }> | undefined;
      const tracking = shipments?.[0];

      console.log("[printify-webhook] order:shipment:created — printifyOrderId:", printifyOrderId, "tracking:", JSON.stringify(tracking));

      const { data: existing } = await supabase
        .from("orders")
        .select("order_ref, customer_email, customer_name, product_type, status")
        .eq("printify_order_id", printifyOrderId)
        .maybeSingle();

      if (!existing) {
        console.warn("[printify-webhook] order:shipment:created — no matching order for printifyOrderId:", printifyOrderId);
        return ok200();
      }

      await supabase
        .from("orders")
        .update({
          printify_status: "shipped",
          status: "shipped",
          tracking_number: tracking?.number ?? null,
          tracking_url: tracking?.url ?? null,
        })
        .eq("printify_order_id", printifyOrderId);

      if (SHIPPED_STATUSES.has(existing.status)) {
        console.log("[printify-webhook] order:shipment:created — skipping email, status already:", existing.status);
      } else if (existing.customer_email) {
        const sent = await sendShippedEmail({
          to: existing.customer_email,
          orderRef: existing.order_ref,
          customerName: existing.customer_name ?? undefined,
          productName: existing.product_type ?? undefined,
          trackingNumber: tracking?.number ?? null,
          trackingUrl: tracking?.url ?? null,
        });
        console.log("[printify-webhook] shipped email sent:", sent, "to:", existing.customer_email, "order:", existing.order_ref);
        notifyFounders(
          "Order shipped",
          `Order ${existing.order_ref} shipped. Tracking: ${tracking?.number ?? "N/A"}`,
          "info"
        ).catch(() => {});
      }

    } else if (eventType === "order:shipment:delivered" || eventType === "order:completed") {
      const { data: existing } = await supabase
        .from("orders")
        .select("order_ref, customer_email, customer_name, product_type, status")
        .eq("printify_order_id", printifyOrderId)
        .maybeSingle();

      if (!existing) {
        console.warn("[printify-webhook]", eventType, "— no matching order for printifyOrderId:", printifyOrderId);
        return ok200();
      }

      console.log("[printify-webhook]", eventType, "— order:", existing.order_ref, "current status:", existing.status);

      if (existing.status === "delivered") {
        console.log("[printify-webhook]", eventType, "— already delivered, skipping");
        return ok200();
      }

      await supabase
        .from("orders")
        .update({ printify_status: "delivered", status: "delivered" })
        .eq("printify_order_id", printifyOrderId);

      if (existing.customer_email) {
        const sent = await sendDeliveredEmail({
          to: existing.customer_email,
          orderRef: existing.order_ref,
          customerName: existing.customer_name ?? undefined,
          productName: existing.product_type ?? undefined,
        });
        console.log("[printify-webhook] delivered email sent:", sent, "to:", existing.customer_email, "order:", existing.order_ref);
        notifyFounders(
          "Order delivered",
          `Order ${existing.order_ref} has been delivered`,
          "info"
        ).catch(() => {});
      }

    } else {
      console.log("[printify-webhook] Unrecognised event type:", eventType, "— no action taken");
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[printify-webhook] Processing failed:", msg);
    notifyFounders(
      `Printify webhook processing failed (${eventType})`,
      `Event: ${eventType}\nPrintify Order ID: ${printifyOrderId}\nError: ${msg}\nTimestamp: ${new Date().toISOString()}`,
      "warning"
    ).catch(() => {});
    // Always return 200 so Printify does not retry
  }

  return ok200();
}
