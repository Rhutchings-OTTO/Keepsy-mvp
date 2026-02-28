# Keepsy MVP

Keepsy is an AI-powered personalized gift storefront built with Next.js. Users can:

- Describe an image or upload a photo to transform with OpenAI image generation.
- Preview the generated design on product mockups (tee, mug, card, hoodie).
- Add items to cart and checkout through Stripe.

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local` with required variables:

```bash
OPENAI_API_KEY=...
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
SITE_URL=http://localhost:3000
```

3. Optional variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
PERF_DASHBOARD_KEY=...
NEXT_PUBLIC_DEV_DATE=2026-12-10
```

4. Run app:

```bash
npm run dev
```

## Webhook Setup (Stripe)

- Local webhook endpoint: `http://localhost:3000/api/stripe/webhook`
- Configure Stripe to send `checkout.session.completed`.
- Ensure `STRIPE_WEBHOOK_SECRET` matches the endpoint secret from Stripe.

## Database Migrations (Supabase)

Apply both SQL files in `supabase/migrations`:

- `20260226_gatekeeper.sql`
- `20260228_orders_and_perf.sql`

These create guardrail, order, webhook idempotency, and metrics tables.

## Production Readiness Status

Completed:

- OpenAI generation + image edit flow
- Stripe Checkout session creation with server-trusted product pricing
- Stripe webhook ingestion and order persistence scaffolding
- Cart + create-flow deep-linking from occasion/product pages
- Success page backed by persisted order status
- Payment failure/expiry order status transitions in webhook handlers

Remaining intentional final step:

- Printify API order execution after webhook-confirmed payment.

## Production Checklist

- Set `NEXT_PUBLIC_SITE_URL` and `SITE_URL` to your production origin.
- Set `STRIPE_WEBHOOK_SECRET` from the live Stripe endpoint.
- Apply Supabase migrations before first production checkout.
- Set `PERF_DASHBOARD_KEY` to protect `/perf` and `/api/health/perf` in production.
- Keep Printify integration disabled until you connect and test fulfillment webhooks.
