/**
 * Admin: Manual Order Retry
 * ─────────────────────────────────────────────────────────────
 * Re-triggers the full Printify fulfilment pipeline for a single
 * order that is stuck in printify_status = "needs_manual_review".
 *
 * Protected by the ADMIN_API_KEY environment variable.
 *
 * Usage:
 *   curl -X POST https://keepsy.store/api/admin/retry-order \
 *     -H "x-admin-key: <ADMIN_API_KEY>" \
 *     -H "Content-Type: application/json" \
 *     -d '{"order_ref": "order_78cb96d7-..."}'
 *
 *   # or by numeric ID:
 *   -d '{"id": 35}'
 */

import { NextResponse } from "next/server";
import Stripe from "stripe";
import { inngest } from "@/lib/inngest/client";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

let _stripe: Stripe | null = null;
function getStripe(): Stripe | null {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) return null;
    _stripe = new Stripe(key, { apiVersion: "2026-02-25.clover" });
  }
  return _stripe;
}

export async function POST(req: Request) {
  // ── Auth guard ──────────────────────────────────────────────────────────────
  const adminKey = process.env.ADMIN_API_KEY;
  if (!adminKey) {
    return NextResponse.json(
      { error: "ADMIN_API_KEY not configured on this server." },
      { status: 500 }
    );
  }

  const incomingKey = req.headers.get("x-admin-key");
  if (!incomingKey || incomingKey !== adminKey) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  // ── Parse body ──────────────────────────────────────────────────────────────
  let body: { order_ref?: string; id?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.order_ref && !body.id) {
    return NextResponse.json(
      { error: "Provide either order_ref or id in the request body." },
      { status: 400 }
    );
  }

  // ── Lookup order ────────────────────────────────────────────────────────────
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase not configured." }, { status: 500 });
  }

  const { data: order, error: lookupErr } = body.order_ref
    ? await supabase
        .from("orders")
        .select("id, order_ref, stripe_session_id, status, printify_status, customer_email")
        .eq("order_ref", body.order_ref)
        .maybeSingle()
    : await supabase
        .from("orders")
        .select("id, order_ref, stripe_session_id, status, printify_status, customer_email")
        .eq("id", body.id as number)
        .maybeSingle();

  if (lookupErr) {
    return NextResponse.json({ error: "Database error: " + lookupErr.message }, { status: 500 });
  }
  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  // ── Guard: only retry paid + needs_manual_review orders ────────────────────
  if (order.status !== "paid" && order.status !== "in_production") {
    return NextResponse.json(
      {
        error: `Order status is "${order.status}" — retry is only valid for paid orders.`,
        order_ref: order.order_ref,
      },
      { status: 422 }
    );
  }
  if (order.printify_status !== "needs_manual_review") {
    return NextResponse.json(
      {
        error: `Order printify_status is "${order.printify_status}" — retry is only for orders in needs_manual_review.`,
        order_ref: order.order_ref,
      },
      { status: 422 }
    );
  }

  // ── Verify Stripe session is genuinely paid ─────────────────────────────────
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "STRIPE_SECRET_KEY not configured." }, { status: 500 });
  }

  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.retrieve(order.stripe_session_id, {
      expand: ["line_items.data.price.product"],
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: "Could not retrieve Stripe session: " + msg },
      { status: 502 }
    );
  }

  if (session.payment_status !== "paid") {
    return NextResponse.json(
      {
        error: `Stripe session payment_status is "${session.payment_status}" — not safe to retry fulfilment.`,
        stripe_session_id: order.stripe_session_id,
      },
      { status: 422 }
    );
  }

  // ── Reset printify_status so the Inngest function re-runs all steps ─────────
  await supabase
    .from("orders")
    .update({ printify_status: "pending_retry" })
    .eq("order_ref", order.order_ref);

  // ── Send Inngest event — unique eventId bypasses stripe_events dedup ────────
  const retryEventId = `admin_retry_${order.order_ref}_${Date.now()}`;
  try {
    await inngest.send({
      name: "stripe/webhook.received",
      data: {
        eventId: retryEventId,
        eventType: "checkout.session.completed",
        payload: {
          id: retryEventId,
          type: "checkout.session.completed",
          data: { object: session },
        } as unknown as Stripe.Event,
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    // Roll back status change if Inngest send fails
    await supabase
      .from("orders")
      .update({ printify_status: "needs_manual_review" })
      .eq("order_ref", order.order_ref);
    return NextResponse.json(
      { error: "Failed to send Inngest event: " + msg },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    order_ref: order.order_ref,
    customer_email: order.customer_email,
    message:
      "Fulfilment pipeline re-triggered. Check the Inngest dashboard for processing status.",
    inngest_event_id: retryEventId,
  });
}
