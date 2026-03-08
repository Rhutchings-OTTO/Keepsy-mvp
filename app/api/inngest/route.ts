import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { stripeWebhookProcess } from "@/lib/inngest/functions/stripe-webhook";
import { reconcileOrders } from "@/lib/inngest/functions/reconcile-orders";
import { postDeliveryFollowUp } from "@/lib/inngest/functions/post-delivery-follow-up";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [stripeWebhookProcess, reconcileOrders, postDeliveryFollowUp],
});
