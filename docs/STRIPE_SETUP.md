# Stripe Payment Setup

If checkout shows an error when you click "Pay", follow these steps to configure Stripe.

## 1. Get your Stripe API keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com) and sign in
2. Switch to **Test mode** (toggle in the top-right) for development
3. Go to **Developers → API keys**
4. Copy the **Secret key** (starts with `sk_test_` for test mode, `sk_live_` for live)

## 2. Set environment variables

### Local development (.env.local)

Create or edit `.env.local` in the project root:

```bash
# Required for checkout
STRIPE_SECRET_KEY=sk_test_...your_key_here
NEXT_PUBLIC_SITE_URL=http://localhost:3000
SITE_URL=http://localhost:3000

# Optional: for order persistence and webhooks
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

### Production (Vercel)

1. Go to your Vercel project → **Settings → Environment Variables**
2. Add:
   - `STRIPE_SECRET_KEY` = your Secret key (`sk_live_...` for production)
   - `NEXT_PUBLIC_SITE_URL` = `https://keepsy.store` (or your domain)
   - `SITE_URL` = `https://keepsy.store`
   - `STRIPE_WEBHOOK_SECRET` = from Stripe webhook endpoint (see step 4)

## 3. Restart / redeploy

- **Local**: Restart `npm run dev` after adding env vars
- **Vercel**: Redeploy the project (or push a commit) after adding env vars

## 4. Webhook (optional, for order persistence)

To persist orders when payment completes:

1. In Stripe Dashboard → **Developers → Webhooks → Add endpoint**
2. Endpoint URL: `https://your-domain.com/api/webhooks/stripe` (or `/api/stripe/webhook`)
3. Events to send: `checkout.session.completed`, `checkout.session.expired`, `checkout.session.async_payment_failed`
4. Copy the **Signing secret** (starts with `whsec_`) and set `STRIPE_WEBHOOK_SECRET`

## Common errors

| Error | Fix |
|-------|-----|
| "Payment is not configured. Add STRIPE_SECRET_KEY..." | Add `STRIPE_SECRET_KEY` to .env.local or Vercel env vars |
| "Redirect URL not configured..." | Add `NEXT_PUBLIC_SITE_URL` and `SITE_URL` to your env |
| "Invalid or missing Origin header" | Ensure your domain is in the allowed origins (keepsy.store, *.vercel.app, localhost) |
| Stripe API error | Verify your secret key is correct and has no extra spaces |
