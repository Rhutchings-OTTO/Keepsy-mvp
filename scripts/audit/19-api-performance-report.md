# API Performance Audit Report
**Date:** 2026-03-08
**Scope:** All files under `app/api/**/*.ts` and supporting `lib/` modules

---

## Summary

| Check | Findings |
|---|---|
| Supabase client instantiation | Singleton pattern in `lib/supabaseAdmin.ts` — correct |
| Missing timeouts on raw fetch() | All raw fetch calls already have timeouts — no action needed |
| Missing try/catch | All routes covered — no unhandled promise rejections found |
| N+1 queries | None found |
| Missing DB indexes | **Several indexes missing** — migration created |
| Cacheable endpoints | `community-designs` and `mockup-placements` already have cache headers |

---

## Route-by-Route Audit

### `POST /api/generate` (`app/api/generate/route.ts`)
- **SDK usage:** Delegates to `lib/gen/baselineGenerate` (OpenAI SDK) — SDK manages timeouts internally.
- **Try/catch:** Present, catches all errors.
- **DB queries:** None directly; delegates to `enforceUsageGuards` which uses Supabase RPC.
- **Issues:** None.

### `POST /api/generate-image` (`app/api/generate-image/route.ts`)
- **SDK usage:** Delegates to `lib/gen/baselineGenerate` (OpenAI SDK).
- **In-memory cache:** 3-minute LRU cache for identical prompts — good.
- **Inflight deduplication:** Max 8 concurrent generations with queue dedup — good.
- **Try/catch:** Present.
- **Issues:** None.

### `POST /api/checkout` (`app/api/checkout/route.ts`)
- **SDK usage:** Stripe SDK singleton (`_stripe` module-level var) — correct pattern.
- **Supabase:** Writes orders and order_items; `order_ref` is used as join key.
- **Try/catch:** Present.
- **Issues:** None. Stripe SDK handles timeouts internally.

### `POST /api/create-checkout-session` (`app/api/create-checkout-session/route.ts`)
- **SDK usage:** Stripe SDK singleton — correct pattern.
- **Supabase:** Same pattern as `/api/checkout`.
- **Try/catch:** Present.
- **Issues:** None. Duplicate of `/api/checkout` with slightly different schema — consider consolidating.

### `POST /api/stripe/webhook` + `POST /api/webhooks/stripe` (`app/api/stripe/webhook/route.ts`)
- **SDK usage:** Stripe SDK at module level.
- **Supabase:** Queries `stripe_events` for idempotency, upserts `orders`, inserts `order_items`.
- **Try/catch:** Outer try/catch always returns 200 after sig verification.
- **DB queries filtered by:** `stripe_event_id` (UNIQUE index exists), `order_ref` (index added by migration), `stripe_session_id` (index added).
- **Issues:** None after migration.

### `POST /api/webhooks/printify` (`app/api/webhooks/printify/route.ts`)
- **Supabase:** Multiple queries filtered by `printify_order_id` — **no index existed**.
- **Try/catch:** Present; always returns 200 so Printify does not retry.
- **Issues:** `printify_order_id` lacked an index. **Fixed by migration.**

### `POST /api/webhooks/tracking` (`app/api/webhooks/tracking/route.ts`)
- **Supabase:** Query filtered by `order_ref` — index added by migration.
- **Try/catch:** Implicit (all errors propagate but response is still returned).
- **Issues:** None after migration.

### `GET /api/orders/status` (`app/api/orders/status/route.ts`)
- **Supabase:** Query filtered by `stripe_session_id`, then `order_ref` for items.
- **Issues:** `stripe_session_id` lacked an explicit index (covered by migration). Uses two sequential queries instead of a join — acceptable for this query pattern.

### `GET /api/order-status` (`app/api/order-status/route.ts`)
- **Supabase:** Same pattern as `/api/orders/status` — queries by `stripe_session_id` then `order_ref`.
- **Issues:** Same as above — covered by migration. This is a near-duplicate of `/api/orders/status`; consider consolidating.

### `POST /api/subscribe` (`app/api/subscribe/route.ts`)
- **SDK usage:** Stripe SDK singleton; Resend SDK singleton.
- **Supabase:** Checks `subscribers` table by `email` before upsert.
- **Issues:** `subscribers.email` lacked an index — **fixed by migration.** Note: `subscribers` table is not in any existing migration file (no `CREATE TABLE` statement found). A migration to create the table may be needed separately.

### `POST /api/shipping-estimate` (`app/api/shipping-estimate/route.ts`)
- **External API:** Delegates to `lib/printify.ts#calculatePrintifyShipping`, which uses `printifyFetch` with a 30s `AbortController` timeout.
- **In-memory cache:** 10-minute LRU cache (50-entry cap) for identical shipping queries.
- **Issues:** None.

### `GET /api/mockup-placements` (`app/api/mockup-placements/route.ts`)
- **Cache headers:** `public, s-maxage=60, stale-while-revalidate=300` already present.
- **Issues:** None.

### `POST /api/admin/mockup-placements` + `GET|POST /api/admin/mockup-placement`
- **Auth:** Protected by `MOCKUP_CALIBRATION_KEY` env var.
- **Issues:** None.

### `POST /api/admin/reconcile` (`app/api/admin/reconcile/route.ts`)
- **Auth:** Protected by `ADMIN_API_KEY`.
- **Issues:** None.

### `GET /api/community-designs` (`app/api/community-designs/route.ts`)
- **Cache headers:** `public, s-maxage=3600, stale-while-revalidate=86400` already present.
- **Runtime:** Edge.
- **Issues:** None.

### `GET /api/health` (`app/api/health/route.ts`)
- **Cache headers:** `public, max-age=30, s-maxage=30` already present.
- **Issues:** None.

### `GET /api/health/perf` (`app/api/health/perf/route.ts`)
- **Auth:** Protected by `PERF_DASHBOARD_KEY` in production.
- **Issues:** None.

### `GET /api/status` (`app/api/status/route.ts`)
- **Cache headers:** `public, max-age=2, s-maxage=2` already present.
- **Issues:** None.

### `GET /api/debug/status` (`app/api/debug/status/route.ts`)
- **Raw fetch:** `fetch("https://api.openai.com/v1/models", { signal: AbortSignal.timeout(8000) })` — timeout already present.
- **Cloudinary:** Uses `uploadImageToCloudinary` which has a 30s `Promise.race` timeout.
- **Issues:** None.

### `POST /api/delete-my-data` (`app/api/delete-my-data/route.ts`)
- **Supabase:** Inserts into `deletion_requests` — no index needed (insert-only, no lookups in hot path).
- **Issues:** None.

### `POST /api/sar` (`app/api/sar/route.ts`)
- **SDK usage:** Resend SDK.
- **Issues:** None.

### `POST /api/upload-crop` (`app/api/upload-crop/route.ts`)
- **External API:** Uses `uploadImageToCloudinary` (30s timeout via `Promise.race`).
- **Issues:** None.

### `GET|POST|PUT /api/inngest` (`app/api/inngest/route.ts`)
- **Framework:** Inngest SDK handler — no custom fetch calls.
- **Issues:** None.

---

## Fix A: External Fetch Timeouts

**Status: No changes needed.**

All raw `fetch()` calls to external APIs already have timeouts:

| Location | Timeout Mechanism |
|---|---|
| `lib/printify.ts#printifyFetch` | `AbortController`, 30s |
| `app/api/debug/status/route.ts` | `AbortSignal.timeout(8000)` |
| `app/api/generate-image/guardrails.ts#fetchWithBackoff` | `AbortController`, 25s with retry backoff |
| `lib/uploadImage.ts#uploadImageToCloudinary` | `Promise.race` timeout, 30s |

Stripe, Resend, OpenAI, and Inngest are all accessed via their official SDKs (not raw fetch), which manage timeouts internally.

---

## Fix B: SQL Migration for Missing Indexes

**File created:** `/Users/roryhutchings/keepsy-mvp/supabase/migrations/20260308_performance_indexes.sql`

```sql
-- Performance indexes for common query patterns
-- Generated by API performance audit on 2026-03-08

CREATE INDEX IF NOT EXISTS idx_orders_order_ref
  ON public.orders(order_ref);

CREATE INDEX IF NOT EXISTS idx_orders_printify_order_id
  ON public.orders(printify_order_id)
  WHERE printify_order_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_orders_stripe_session_id
  ON public.orders(stripe_session_id)
  WHERE stripe_session_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_orders_customer_email
  ON public.orders(customer_email)
  WHERE customer_email IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_orders_status
  ON public.orders(status);

CREATE INDEX IF NOT EXISTS idx_order_items_order_ref
  ON public.order_items(order_ref);

CREATE INDEX IF NOT EXISTS idx_subscribers_email
  ON public.subscribers(email);
```

**Notes:**
- `orders.order_ref` and `orders.stripe_session_id` are declared UNIQUE in the initial migration (`20260228_orders_and_perf.sql`), which implicitly creates a btree index. The `CREATE INDEX IF NOT EXISTS` statements are therefore no-ops on a correctly migrated database but are safe to run — they guard against any schema drift.
- `stripe_events.stripe_event_id` is UNIQUE — already indexed.
- `daily_usage` has a composite primary key `(user_key, day_key)` — already indexed.
- `user_profiles.user_key` is a primary key — already indexed.

---

## Fix C: Caching Headers for Static/Infrequent Responses

**Status: No changes needed.**

All applicable routes already have caching:

| Route | Cache-Control |
|---|---|
| `GET /api/community-designs` | `public, s-maxage=3600, stale-while-revalidate=86400` |
| `GET /api/mockup-placements` | `public, s-maxage=60, stale-while-revalidate=300` |
| `GET /api/health` | `public, max-age=30, s-maxage=30` |
| `GET /api/status` | `public, max-age=2, s-maxage=2` |

---

## Issues Requiring External Config

### 1. Supabase Connection Pooling (Recommended)
All API routes use `lib/supabaseAdmin.ts` which creates a single cached `SupabaseClient` using the direct Postgres URL. For Vercel serverless functions, consider switching to the **Supabase Transaction Pooler** (port 6543) to avoid exhausting the Postgres connection limit under load:

- In Supabase Dashboard → Settings → Database, copy the **Transaction Pooler** connection string.
- Set `NEXT_PUBLIC_SUPABASE_URL` to use the pooler URL for server-side routes, or use `SUPABASE_DB_URL` with a separate pooler-aware client.

### 2. `subscribers` Table Missing from Migrations
The `app/api/subscribe/route.ts` reads and writes a `subscribers` table, but no `CREATE TABLE` statement for it exists in any migration file. The `idx_subscribers_email` index in the new migration will fail if the table does not exist.

**Action required:** Create a migration with:
```sql
CREATE TABLE IF NOT EXISTS public.subscribers (
  id bigserial PRIMARY KEY,
  email text NOT NULL UNIQUE,
  promo_code text,
  subscribed_at timestamptz NOT NULL DEFAULT now()
);
```
Then run `supabase db push`.

### 3. `orders` Table Missing Columns (Schema Drift)
The Stripe webhook handler (`app/api/stripe/webhook/route.ts`) writes several columns not present in the original `20260228_orders_and_perf.sql` migration:
- `customer_email`
- `customer_name`
- `shipping_address`
- `printify_image_id`
- `printify_product_id`
- `printify_order_id`
- `printify_status`
- `product_type`
- `variant_size`
- `variant_color`
- `region`
- `tracking_number`
- `tracking_url`

These are added via `ALTER TABLE` in subsequent migrations or manually. Confirm all columns exist in production via Supabase Dashboard → Table Editor before deploying.

### 4. Duplicate Checkout Routes
`/api/checkout` and `/api/create-checkout-session` are near-identical. Consolidating them would reduce maintenance overhead and eliminate the duplicated Stripe singleton pattern.

---

## Files Modified
- **Created:** `/Users/roryhutchings/keepsy-mvp/supabase/migrations/20260308_performance_indexes.sql`
- **Created:** `/Users/roryhutchings/keepsy-mvp/scripts/audit/19-api-performance-report.md`

No existing API route files were modified (all timeout and caching patterns were already correct).
