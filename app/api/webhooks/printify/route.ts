/**
 * Printify webhook handler.
 *
 * Listens for order lifecycle events from Printify and updates Supabase.
 * Validates requests using HMAC-SHA256 signature (X-Pfy-Signature header).
 *
 * Events handled:
 *   order:created          → printify_status = "printify_received"
 *   order:sent-to-production → printify_status = "in_production", status = "in_production"
 *   order:shipment:created  → printify_status = "shipped", status = "shipped" + tracking
 *   order:shipment:delivered → printify_status = "delivered", status = "delivered"
 */

import { createHmac } from "crypto";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_BODY_BYTES = 64 * 1024;

function verifySignature(rawBody: string, signature: string, secret: string): boolean {
  const expected = createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("hex");
  // Constant-time compare using Buffer.equals to prevent timing attacks
  const expectedBuf = Buffer.from(expected, "hex");
  const receivedBuf = Buffer.from(signature.replace(/^sha256=/, ""), "hex");
  if (expectedBuf.length !== receivedBuf.length) return false;
  return expectedBuf.equals(receivedBuf);
}

export async function POST(req: Request): Promise<Response> {
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
      console.warn("[printify-webhook] Invalid signature");
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
  } else {
    // Warn in production if secret is missing, but don't block (for initial rollout)
    if (process.env.NODE_ENV === "production") {
      console.warn("[printify-webhook] PRINTIFY_WEBHOOK_SECRET not set — skipping signature check");
    }
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
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const printifyOrderId = resource.id as string | undefined;
  if (!printifyOrderId) {
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  // ── Update Supabase ──────────────────────────────────────────────────────
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    if (eventType === "order:created") {
      await supabase
        .from("orders")
        .update({ printify_status: "printify_received" })
        .eq("printify_order_id", printifyOrderId);

    } else if (eventType === "order:sent-to-production") {
      await supabase
        .from("orders")
        .update({ printify_status: "in_production", status: "in_production" })
        .eq("printify_order_id", printifyOrderId);

    } else if (eventType === "order:shipment:created") {
      const shipments = resource.shipments as Array<{
        carrier?: string;
        number?: string;
        url?: string;
      }> | undefined;
      const tracking = shipments?.[0];

      await supabase
        .from("orders")
        .update({
          printify_status: "shipped",
          status: "shipped",
          tracking_number: tracking?.number ?? null,
          tracking_url: tracking?.url ?? null,
        })
        .eq("printify_order_id", printifyOrderId);

    } else if (eventType === "order:shipment:delivered") {
      await supabase
        .from("orders")
        .update({ printify_status: "delivered", status: "delivered" })
        .eq("printify_order_id", printifyOrderId);
    }
  } catch (err) {
    console.error("[printify-webhook] Supabase update failed:", err instanceof Error ? err.message : err);
    // Return 200 so Printify doesn't retry — log the failure instead
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
