/**
 * Post-Delivery Follow-Up Email — Day 7
 * ─────────────────────────────────────────────────────────────
 * Runs daily. Queries for orders with status="delivered" where
 * delivered_at is between 7 and 8 days ago AND where
 * post_delivery_email_sent is false (or null).
 *
 * Sends a warm "How did it turn out?" email and marks the order
 * so the email is never sent twice.
 */

import { inngest } from "../client";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { sendPostDeliveryFollowUpEmail } from "@/lib/emails/orderEmails";
import { notifyFounders } from "@/lib/notifications";

export const postDeliveryFollowUp = inngest.createFunction(
  {
    id: "post-delivery-follow-up",
    name: "Post-Delivery Follow-Up Email (Day 7)",
    retries: 2,
    concurrency: [{ limit: 1 }],
  },
  { cron: "0 10 * * *" }, // daily at 10:00 UTC
  async ({ step }) => {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      console.warn("[post-delivery] Supabase not configured, skipping");
      return { skipped: "supabase_not_configured" };
    }

    // Step 1: Find delivered orders in the 7–8 day window with no follow-up sent yet
    const eligibleOrders = await step.run("fetch-eligible-orders", async () => {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from("orders")
        .select("id, order_ref, customer_email, customer_name, product_type, delivered_at, post_delivery_email_sent")
        .eq("status", "delivered")
        .eq("post_delivery_email_sent", false)
        .gte("delivered_at", eightDaysAgo)
        .lte("delivered_at", sevenDaysAgo)
        .not("customer_email", "is", null)
        .order("delivered_at", { ascending: true })
        .limit(100);

      if (error) {
        throw new Error("[post-delivery] Failed to query eligible orders: " + error.message);
      }

      console.log(`[post-delivery] Found ${data?.length ?? 0} eligible orders for Day 7 follow-up`);
      return data ?? [];
    });

    if (eligibleOrders.length === 0) {
      return { sent: 0, failed: 0 };
    }

    let sent = 0;
    let failed = 0;

    // Step 2: Send email + mark each order
    for (const order of eligibleOrders) {
      await step.run(`send-follow-up-${order.order_ref}`, async () => {
        if (!order.customer_email) return;

        const productName = order.product_type
          ? `Keepsy ${order.product_type.charAt(0).toUpperCase()}${order.product_type.slice(1)}`
          : undefined;

        const ok = await sendPostDeliveryFollowUpEmail({
          to: order.customer_email,
          orderRef: order.order_ref,
          customerName: order.customer_name ?? undefined,
          productName,
        });

        if (ok) {
          // Mark as sent so we never send twice
          const { error: updateErr } = await supabase
            .from("orders")
            .update({ post_delivery_email_sent: true })
            .eq("order_ref", order.order_ref);

          if (updateErr) {
            console.warn(
              `[post-delivery] Email sent but failed to mark order ${order.order_ref}:`,
              updateErr.message
            );
          } else {
            sent++;
            console.log(`[post-delivery] Follow-up sent for order ${order.order_ref}`);
          }
        } else {
          failed++;
          console.warn(`[post-delivery] Failed to send follow-up for order ${order.order_ref}`);
        }
      });
    }

    // Step 3: Notify founders if there were failures
    if (failed > 0) {
      await step.run("notify-founders-failures", async () => {
        await notifyFounders(
          `Post-delivery follow-up: ${failed} email(s) failed to send`,
          [
            `The Day 7 follow-up cron ran and encountered ${failed} failure(s).`,
            `Successfully sent: ${sent}`,
            `Failed: ${failed}`,
            ``,
            `Check the Inngest dashboard for individual step errors.`,
          ].join("\n"),
          "warning"
        );
      });
    }

    console.log(`[post-delivery] Done. Sent: ${sent}, Failed: ${failed}`);
    return { sent, failed };
  }
);
