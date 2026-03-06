import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { stripeWebhookProcess } from "@/lib/inngest/functions/stripe-webhook";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [stripeWebhookProcess],
});
