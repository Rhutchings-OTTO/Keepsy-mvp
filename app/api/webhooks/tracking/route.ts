/**
 * Tracking / Delivery Webhook
 * ────────────────────────────
 * Endpoint: POST /api/webhooks/tracking
 *
 * A simple delivery-confirmation endpoint that can be called by:
 *   - AfterShip webhooks
 *   - 17track webhooks
 *   - A manual admin trigger
 *   - Any service that can POST JSON when a package is delivered
 *
 * Request body: { "order_ref": "KSY-xxx", "status": "delivered" }
 * Auth: Authorization: Bearer <TRACKING_WEBHOOK_SECRET>
 *
 * Example manual trigger:
 *   curl -X POST https://keepsy.store/api/webhooks/tracking \
 *     -H "Content-Type: application/json" \
 *     -H "Authorization: Bearer YOUR_TRACKING_WEBHOOK_SECRET" \
 *     -d '{"order_ref": "KSY-abc123", "status": "delivered"}'
 *
 * Environment variable required:
 *   TRACKING_WEBHOOK_SECRET — a random secret string (generate with: openssl rand -hex 32)
 */

import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { sendDeliveredEmail } from "@/lib/emails/orderEmails";
import { notifyFounders } from "@/lib/notifications";

export const runtime = "nodejs";

export async function POST(req: Request): Promise<Response> {
  // ── Auth ─────────────────────────────────────────────────────────────────
  const secret = process.env.TRACKING_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[tracking-webhook] TRACKING_WEBHOOK_SECRET not set");
    return new Response(JSON.stringify({ error: "Webhook not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const auth = req.headers.get("authorization") ?? "";
  if (auth !== `Bearer ${secret}`) {
    console.warn("[tracking-webhook] Unauthorized request");
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // ── Parse body ───────────────────────────────────────────────────────────
  let body: { order_ref?: string; status?: string };
  try {
    body = await req.json() as { order_ref?: string; status?: string };
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { order_ref, status } = body;
  if (!order_ref || status !== "delivered") {
    return new Response(
      JSON.stringify({ error: "order_ref and status='delivered' are required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  console.log("[tracking-webhook] Delivery notification for order:", order_ref);

  // ── Supabase ─────────────────────────────────────────────────────────────
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return new Response(JSON.stringify({ error: "Database not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { data: order, error: fetchErr } = await supabase
    .from("orders")
    .select("order_ref, customer_email, customer_name, product_type, status")
    .eq("order_ref", order_ref)
    .maybeSingle();

  if (fetchErr || !order) {
    console.warn("[tracking-webhook] Order not found:", order_ref);
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (order.status === "delivered") {
    console.log("[tracking-webhook] Order already delivered, skipping:", order_ref);
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  // ── Update status ────────────────────────────────────────────────────────
  const { error: updateErr } = await supabase
    .from("orders")
    .update({ status: "delivered", printify_status: "delivered" })
    .eq("order_ref", order_ref);

  if (updateErr) {
    console.error("[tracking-webhook] Failed to update order status:", updateErr.message);
  }

  // ── Send delivered email ─────────────────────────────────────────────────
  if (order.customer_email) {
    const sent = await sendDeliveredEmail({
      to: order.customer_email,
      orderRef: order.order_ref,
      customerName: order.customer_name ?? undefined,
      productName: order.product_type ?? undefined,
    });
    console.log("[tracking-webhook] delivered email sent:", sent, "to:", order.customer_email);
  }

  notifyFounders(
    "Order delivered",
    `Order ${order_ref} has been marked as delivered via tracking webhook`,
    "info"
  ).catch(() => {});

  console.log("[tracking-webhook] Order marked delivered:", order_ref);
  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
