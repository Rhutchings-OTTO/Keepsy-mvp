import Stripe from "stripe";
import { schemas } from "@/lib/http/validate";
import { logSecurityEvent } from "@/lib/security/auditLog";
import { inngest } from "@/lib/inngest/client";

export const runtime = "edge";

const MAX_WEBHOOK_BODY = schemas.webhookMaxBytes;

export async function POST(req: Request) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secretKey || !webhookSecret) {
    return new Response(JSON.stringify({ error: "Missing Stripe webhook configuration." }), {
      status: 500,
    });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return new Response(JSON.stringify({ error: "Missing Stripe signature." }), { status: 400 });
  }

  const contentLength = req.headers.get("content-length");
  if (contentLength) {
    const len = parseInt(contentLength, 10);
    if (!Number.isNaN(len) && len > MAX_WEBHOOK_BODY) {
      logSecurityEvent({ type: "body_too_large", endpoint: "/api/stripe/webhook", size: len });
      return new Response(
        JSON.stringify({ error: "Webhook payload too large." }),
        { status: 413 }
      );
    }
  }

  const stripe = new Stripe(secretKey, { apiVersion: "2026-02-25.clover" });
  const payload = await req.text();
  if (payload.length > MAX_WEBHOOK_BODY) {
    logSecurityEvent({ type: "body_too_large", endpoint: "/api/stripe/webhook", size: payload.length });
    return new Response(JSON.stringify({ error: "Webhook payload too large." }), { status: 413 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (error) {
    logSecurityEvent({ type: "webhook_sig_fail", reason: "Invalid signature" });
    const message = error instanceof Error ? error.message : "Invalid webhook signature.";
    return new Response(JSON.stringify({ error: message }), { status: 400 });
  }

  const eventPayload = JSON.parse(payload) as Stripe.Event;
  await inngest.send({
    name: "stripe/webhook.received",
    data: {
      eventId: event.id,
      eventType: event.type,
      payload: eventPayload,
    },
  });

  return new Response(JSON.stringify({ received: true }), { status: 200 });
}
