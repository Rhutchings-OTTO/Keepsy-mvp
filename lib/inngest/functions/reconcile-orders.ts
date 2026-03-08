/**
 * Stripe Webhook Reconciliation Cron
 * ─────────────────────────────────────────────────────────────
 * Runs every 6 hours to catch orders that Stripe marked as paid
 * but whose webhook was never delivered (or was delivered but
 * failed before the order row could be updated).
 *
 * Flow:
 *  1. Query Supabase for orders still in "pending" status that
 *     are older than 30 minutes.
 *  2. For each, ask Stripe whether the checkout session actually
 *     completed.
 *  3. If Stripe says "complete" → replay the fulfillment pipeline
 *     by sending a synthetic stripe/webhook.received Inngest event
 *     (same path as the real webhook handler).
 *  4. Notify founders for any order that needed reconciliation.
 */

import Stripe from "stripe";
import { inngest } from "../client";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { notifyFounders } from "@/lib/notifications";

// ─── Stripe singleton ──────────────────────────────────────────────────────

let _stripe: Stripe | null = null;
function getStripe(): Stripe | null {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) return null;
    _stripe = new Stripe(key, { apiVersion: "2026-02-25.clover" });
  }
  return _stripe;
}

// ─── Scheduled reconciliation function ────────────────────────────────────

export const reconcileOrders = inngest.createFunction(
  {
    id: "reconcile-pending-orders",
    name: "Reconcile Pending Orders (Stripe vs Supabase)",
    retries: 2,
    concurrency: [{ limit: 1 }], // only one reconciliation run at a time
  },
  [
    { cron: "0 */6 * * *" }, // every 6 hours on schedule
    { event: "keepsy/reconcile.requested" }, // manual trigger via admin API
  ],
  async ({ step }) => {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      console.warn("[reconcile] Supabase not configured, skipping");
      return { skipped: "supabase_not_configured" };
    }

    const stripe = getStripe();
    if (!stripe) {
      console.warn("[reconcile] STRIPE_SECRET_KEY not set, skipping");
      return { skipped: "stripe_not_configured" };
    }

    // Step 1: Fetch stale pending orders (older than 30 minutes)
    const stalePendingOrders = await step.run("fetch-stale-pending-orders", async () => {
      const cutoff = new Date(Date.now() - 30 * 60 * 1000).toISOString(); // 30 minutes ago

      const { data, error } = await supabase
        .from("orders")
        .select("id, order_ref, stripe_session_id, customer_email, created_at")
        .eq("status", "pending")
        .lt("created_at", cutoff)
        .order("created_at", { ascending: true })
        .limit(50); // cap per run to avoid thundering herd

      if (error) {
        throw new Error("[reconcile] Failed to query pending orders: " + error.message);
      }

      console.log(`[reconcile] Found ${data?.length ?? 0} stale pending orders`);
      return data ?? [];
    });

    if (stalePendingOrders.length === 0) {
      return { reconciled: 0, checked: 0 };
    }

    // Step 2: Check each order against Stripe
    const reconciled: string[] = [];
    const skipped: string[] = [];

    for (const order of stalePendingOrders) {
      if (!order.stripe_session_id) {
        skipped.push(order.order_ref);
        continue;
      }

      await step.run(`check-stripe-session-${order.order_ref}`, async () => {
        let session: Stripe.Checkout.Session;
        try {
          session = await stripe.checkout.sessions.retrieve(order.stripe_session_id, {
            expand: ["line_items.data.price.product"],
          });
        } catch (err) {
          console.warn(
            `[reconcile] Could not retrieve Stripe session ${order.stripe_session_id} for order ${order.order_ref}:`,
            err instanceof Error ? err.message : String(err)
          );
          return;
        }

        if (session.status === "complete" && session.payment_status === "paid") {
          console.warn(
            `[reconcile] Order ${order.order_ref} is pending in DB but complete in Stripe — replaying fulfillment`
          );

          // Re-send the Inngest event that the real webhook would have sent.
          // The stripe-webhook-process function is idempotent (checks stripe_events
          // for duplicates) so replaying a previously-processed event is safe.
          await inngest.send({
            name: "stripe/webhook.received",
            data: {
              eventId: `reconcile_${order.order_ref}_${Date.now()}`,
              eventType: "checkout.session.completed",
              payload: {
                id: `reconcile_${order.order_ref}`,
                type: "checkout.session.completed",
                data: { object: session },
              } as unknown as Stripe.Event,
            },
          });

          reconciled.push(order.order_ref);
        } else {
          // Stripe session not complete — truly pending/abandoned
          console.log(
            `[reconcile] Order ${order.order_ref} Stripe session status=${session.status} payment_status=${session.payment_status} — no action needed`
          );
        }
      });
    }

    // Step 3: Notify founders if any orders needed reconciliation
    if (reconciled.length > 0) {
      await step.run("notify-founders-reconciliation", async () => {
        await notifyFounders(
          `Reconciliation: ${reconciled.length} order(s) replayed`,
          [
            `The Stripe webhook reconciliation cron found ${reconciled.length} order(s) that were`,
            `marked "pending" in Supabase but "complete" in Stripe.`,
            ``,
            `Fulfillment has been re-triggered for:`,
            ...reconciled.map((ref) => `  • ${ref}`),
            ``,
            `These orders should now progress through the normal fulfillment pipeline.`,
            `Check the Inngest dashboard for processing status.`,
          ].join("\n"),
          "warning"
        );
      });
    }

    console.log(
      `[reconcile] Done. Checked: ${stalePendingOrders.length}, Replayed: ${reconciled.length}, Skipped (no session_id): ${skipped.length}`
    );

    return {
      checked: stalePendingOrders.length,
      reconciled: reconciled.length,
      skipped: skipped.length,
      reconciledRefs: reconciled,
    };
  }
);
