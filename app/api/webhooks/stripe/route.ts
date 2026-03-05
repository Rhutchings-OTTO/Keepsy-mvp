/**
 * Stripe webhook endpoint — /api/webhooks/stripe
 * Re-exports the canonical webhook handler from /api/stripe/webhook.
 * Configure Stripe to send events to this URL or /api/stripe/webhook.
 */
export { POST } from "@/app/api/stripe/webhook/route";
