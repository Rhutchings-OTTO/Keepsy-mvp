# Stripe Webhook — Asynchronous Processing

The Stripe webhook returns **200 OK immediately** after signature verification. Heavy work (DB saves, email, cache) runs in the background via [Inngest](https://inngest.com).

## Flow

1. **Webhook** (`/api/stripe/webhook` or `/api/webhooks/stripe`): Verifies signature → sends event to Inngest → returns 200.
2. **Inngest** (`/api/inngest`): Runs `stripe-webhook-process` function which:
   - Persists event to `stripe_events`
   - For `checkout.session.completed`: upserts order, order_items, sends Atelier creation email, clears design cache
   - For `async_payment_failed` / `expired`: updates order status

## Required Env Vars

```bash
# Inngest (from dashboard: app.inngest.com)
INNGEST_SIGNING_KEY=signkey-prod-...
INNGEST_EVENT_KEY=event_key_...  # optional for sending from server

# Resend (for Atelier emails)
RESEND_API_KEY=re_...
EMAIL_FROM="Keepsy <hello@keepsy.store>"  # optional, defaults to above
```

## Local Development

```bash
npx inngest-cli@latest dev
```

Then run `npm run dev`. Inngest Dev Server at `http://localhost:8288` will receive events from your app.

## Production

1. Deploy to Vercel.
2. In [Inngest Dashboard](https://app.inngest.com): add your app, set Serve URL to `https://yourdomain.com/api/inngest`.
3. Add `INNGEST_SIGNING_KEY` to Vercel env vars.
4. Stripe will not timeout; payments complete regardless of DB latency.
