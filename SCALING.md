# Keepsy Scaling & Architecture Reference

## Architecture Overview

Keepsy is a Next.js 16 App Router application deployed on Vercel. It sells custom AI-generated keepsake products (greeting cards, prints, mugs) with end-to-end fulfillment via Printify.

```
Browser → Vercel Edge/Serverless → Next.js App Router
                                  ├── Supabase (Postgres)
                                  ├── Stripe (payments)
                                  ├── OpenAI (image generation)
                                  ├── Printify (print fulfillment)
                                  ├── Cloudinary (image storage)
                                  ├── Resend (transactional email)
                                  ├── Upstash Redis (rate limiting)
                                  └── Inngest (background jobs)
```

---

## Static vs Dynamic Pages

### Static pages (pre-rendered at build, ○)

| Route | Why static |
|---|---|
| `/about` | Pure content, no personalization |
| `/shop` | Product catalog, no user state |
| `/community` | Static content |
| `/gift-ideas` | Static content |
| `/privacy`, `/terms`, `/refunds`, `/shipping` | Legal copy |
| `/account` | Shell page; data loaded client-side |

### Dynamic pages (server-rendered per request, ƒ)

| Route | Why dynamic |
|---|---|
| `/` (homepage) | Reads `keepsy_region` cookie to render UK/US pricing. `cookies()` opt-in makes the route dynamic intentionally. |
| `/create` | Personalized design studio |
| `/success` | Order confirmation — per-session data |
| `/track` | Live order status from Supabase/Printify |
| All `/api/*` routes | By definition dynamic |

### Homepage ISR opportunity

The homepage is dynamic because it calls `cookies()` to read the `keepsy_region` cookie and passes an `initialRegion` prop to `LandingPage`. There are two viable approaches if homepage performance becomes a bottleneck:

1. **Cookie-aware CDN split**: Serve a statically cached page as default, then hydrate region on the client from a cookie read in a `useEffect`. This eliminates the server render for first-time visitors who have no cookie, at the cost of a layout shift on region-sensitive content (pricing).
2. **Vary header / Edge Middleware**: Use Vercel Edge Middleware to rewrite requests to a region-specific static variant (`/us` or `/uk`) based on the cookie, keeping both variants fully static. Adds routing complexity.

At current traffic levels the dynamic render is not a bottleneck; a typical SSR response is <50ms. Revisit if homepage becomes a hot path.

---

## External Service Dependencies & Failure Modes

### Stripe
- **Role**: Payment checkout, webhook delivery
- **Failure mode**: If Stripe is down, users cannot complete checkout. The `/api/create-checkout-session` route will throw and return 500.
- **Mitigation**: Stripe has 99.99% SLA. Inngest deduplicates webhook replay using `stripe_events` table (unique constraint on `stripe_event_id`), so retried webhooks are idempotent.
- **Data at risk**: None — orders are only written after Stripe confirms payment.

### Printify
- **Role**: Print-on-demand fulfillment (image upload, product creation, order submission)
- **Failure mode**: A hang or timeout on any Printify API call inside an Inngest step causes that step to fail and Inngest retries it (up to 3 times). A 30-second AbortController timeout is applied to every call in `printifyFetch`, preventing indefinite hangs.
- **Mitigation**: If all retries fail, the order is marked `needs_manual_review` in Supabase. No auto-refund is triggered. Support can re-submit manually or via a one-off script.
- **Rate limits**: Printify 429s are retried with backoff automatically (`Retry-After` header respected).

### OpenAI (gpt-image-1 / DALL-E 3)
- **Role**: AI image generation and editing
- **Failure mode**: If OpenAI is down, `/api/generate-image` returns 503 to the browser. The user can retry from the studio.
- **Mitigation**: `fetchWithBackoff` in `guardrails.ts` wraps all OpenAI calls with:
  - 2 retries with exponential backoff + jitter
  - 120-second timeout on `/v1/images/generations`
  - 90-second timeout on `/v1/images/edits`
  - In-flight deduplication (same prompt reuses existing promise)
  - Max 8 concurrent generations per serverless instance (`MAX_IN_FLIGHT_GENERATIONS`)

### Supabase (Postgres)
- **Role**: Orders, order items, stripe events (idempotency), user profiles, usage tracking
- **Failure mode**: If Supabase is unavailable, Inngest steps that write to the DB will throw and be retried. The generate-image guardrails fall back to in-memory usage tracking.
- **Mitigation**: `getSupabaseAdmin()` returns `null` if env vars are missing and all callers handle the null case gracefully with a logged warning.

### Resend
- **Role**: Transactional email (order confirmation)
- **Failure mode**: If Resend is down, the `send-atelier-email` Inngest step throws. Inngest retries it up to 3 times.
- **Impact**: Low — a missed email does not affect order fulfillment. If all retries fail the order still proceeds; the customer just doesn't receive a confirmation email.

### Cloudinary
- **Role**: Permanent design image storage (URL passed to Printify)
- **Failure mode**: If Cloudinary upload fails, `uploadImageToCloudinary` returns `{ ok: false }` and `baselineGenerate` falls back to the raw `imageDataUrl` (base64 data URL). Printify can still receive this URL but it is large and may fail for very large images.
- **Mitigation**: Ensure Cloudinary credentials are always set in production. Consider adding a hard error if `designUrl` is a base64 data URL longer than a threshold.

### Upstash Redis
- **Role**: Rate limiting for generation endpoints (5 per 10 min sliding window per IP)
- **Failure mode**: If Upstash is unreachable, `checkAtelierCapacity` returns `{ success: true, reset: 0 }` (permissive fallback). The in-memory rate limiter in `rateLimit.ts` then applies as a secondary control.
- **Note**: The in-memory fallback is per-instance and resets on cold start — it is not a substitute for Redis under sustained load.

### Inngest
- **Role**: Background job processing for Stripe webhooks and Printify fulfillment steps
- **Failure mode**: If the Inngest service is unavailable, webhook events queued via `/api/inngest` will fail to be received. Stripe will retry delivery.
- **Mitigation**: Stripe retries webhooks for up to 3 days with exponential backoff. Inngest itself has high availability and persists job state.

---

## Rate Limiting Configuration

All rate limits are per client key (visitor ID → forwarded IP → real IP → "anonymous").

### Upstash Redis (production, sliding window)

| Endpoint | Limit | Window |
|---|---|---|
| `/api/generate-image` (POST) | 5 requests | 10 minutes |
| `/api/generate` (POST) | 5 requests | 10 minutes |

### In-memory fallback (all environments when Upstash not configured)

| Endpoint / Category | Limit | Window |
|---|---|---|
| `/api/generate-image` (POST) | 5 | 60 seconds |
| `/api/generate` (POST) | 5 | 60 seconds |
| `generate-hourly` | 20 | 1 hour |
| `/api/create-checkout-session` (POST) | 10 | 60 seconds |
| `/api/checkout` (POST) | 10 | 60 seconds |
| `/api/upload` (POST) | 10 | 60 seconds |
| `upload-hourly` | 60 | 1 hour |
| `/api/delete-my-data` (POST) | 5 | 60 seconds |
| `/api/debug/status` (GET) | 30 | 60 seconds |
| `/api/admin/mockup-placement*` | 30 | 60 seconds |
| POST default (all other POSTs) | 30 | 60 seconds |
| GET default (all other GETs) | 120 | 60 seconds |

### Generation usage guardrails (per user key, Supabase-backed)

| Tier | Daily cap | Min interval |
|---|---|---|
| free | 3 generations/day | 10 seconds |
| paid | 25 generations/day | 10 seconds |

Falls back to in-memory tracking if Supabase is unavailable.

### Endpoints not covered by Upstash

The Stripe webhook endpoint (`/api/stripe-webhook`) and Inngest endpoint (`/api/inngest`) are not in the Upstash rate limit config. The Stripe webhook is protected by signature verification; Inngest by its own signing key. These do not need IP-based rate limiting.

The `/api/track` order tracking endpoint currently falls back to the `get-default` (120/min) in-memory limit. Under high load this could be tightened.

---

## Inngest Configuration

### Function: `stripe-webhook-process`

| Setting | Value | Reason |
|---|---|---|
| `retries` | 3 | Handles transient Printify / Supabase failures |
| `concurrency` | 20 | Caps simultaneous order processing runs; prevents Printify API overload |
| `throttle` | 5 per 1s | Smooths burst traffic; prevents 1000 simultaneous Printify calls during a flash sale |

### Steps and their retry behavior

Each `step.run(...)` call is individually retried by Inngest. If `printify-submit-order` fails after all retries, the order is set to `needs_manual_review`. The idempotency check (`check-and-persist-event`) uses a unique constraint on `stripe_event_id` to prevent duplicate processing.

---

## Capacity Estimates

### Vercel Serverless

| Resource | Default limit | Notes |
|---|---|---|
| Concurrent executions | 1,000 | Vercel Hobby/Pro default; Enterprise raises this |
| Execution duration | 60s (Hobby), 300s (Pro) | Long OpenAI calls (up to 120s) require Pro tier |
| Payload size | 4.5 MB | Large base64 images approach this limit |

### OpenAI

- `gpt-image-1` generation takes 20–90 seconds per image. With 8 concurrent in-flight generations per serverless instance and multiple warm instances, concurrent generation capacity scales with active function instances.
- At Vercel Pro (300s timeout), the 120s generate timeout fits comfortably.

### Printify

- No documented public rate limit. The `printifyFetch` function retries on 429 with backoff. The Inngest `throttle: { limit: 5, period: "1s" }` caps submission rate at 5 orders/second across all concurrent Inngest workers.

### Supabase

- Free tier: 500 MB storage, 2 GB bandwidth/month, 60 connections (pooled via pgBouncer).
- Pro tier: 8 GB storage, 250 GB bandwidth, 200 direct connections.
- At MVP scale, the free tier is sufficient. At 10k+ orders/month, upgrade to Pro.

---

## Scaling Checklist

### When traffic reaches ~1k orders/month

- [ ] Upgrade Supabase to Pro tier (connection pooling, higher throughput)
- [ ] Confirm Vercel plan is Pro (300s function timeout required for OpenAI)
- [ ] Set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` in production (Upstash free tier handles ~10k requests/day)
- [ ] Monitor Inngest dashboard for step failure rates on Printify steps

### When traffic reaches ~10k orders/month

- [ ] Add Supabase read replica for order tracking queries (`/api/track`)
- [ ] Move generation cache from in-memory `Map` to Redis (currently resets on cold start, meaning repeated identical prompts hit OpenAI on each new instance)
- [ ] Add Cloudinary transformation caching / CDN for design images
- [ ] Review Printify SLA and consider a second print provider as failover
- [ ] Implement a dead-letter queue for Inngest jobs in `needs_manual_review` state (alert → Slack / PagerDuty)

### When traffic reaches ~100k orders/month

- [ ] Upgrade Upstash to pay-as-you-go (sliding window rate limiter scales without config changes)
- [ ] Add Supabase connection pooling via PgBouncer in transaction mode
- [ ] Consider splitting the Inngest function into separate image-upload, product-create, and order-submit functions for finer retry control and parallelism
- [ ] Add observability: OpenTelemetry → Grafana / Datadog for p95 latency on generation and fulfillment steps
- [ ] Review Vercel concurrent execution quota; request Enterprise limit increase if approaching 1,000

### General resilience improvements (priority order)

- [ ] Alert when orders enter `needs_manual_review` (currently only logged)
- [ ] Add a `/api/admin/retry-fulfillment` endpoint for re-triggering Printify steps without Stripe replay
- [ ] Store Cloudinary upload failures in Supabase so failed uploads can be retried independently
- [ ] Add integration tests for Stripe webhook happy path and Printify timeout scenario
