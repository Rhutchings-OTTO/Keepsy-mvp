# Load Resilience & Error Handling Audit
**Date:** 2026-03-08
**Scope:** `/app/api/` routes — external API calls, rate limiting, retry logic, user-facing error messages

---

## What Would Break Under 20k Concurrent Users

### 1. In-memory rate limiter (`guardrails.ts` — `usageByKey` Map)
**Severity: High**

`usageByKey` is a module-level `Map<string, UsageRecord>`. On Vercel (serverless/edge), each cold start gets its own isolated memory. At 20k concurrent users:

- Multiple Vercel function instances will run in parallel, each with their own copy of the Map.
- A user could trigger far more than their `DAILY_CAP` of 2 free generations because each instance starts with an empty Map.
- The primary path already routes through Supabase (`enforceUsageGuardsSupabase`) with a DB-level RPC (`check_and_increment_usage`), which is the correct approach. However, the **fallback** — triggered when Supabase is unavailable or the RPC returns an error — uses `enforceUsageGuardsMemory`. Under load, if Supabase experiences connection pressure, the fallback silently opens the door to unlimited generations per instance.

**Mitigation required:** The in-memory fallback cannot be made multi-instance safe without an external store. Accept the known limitation and ensure Supabase connection pooling (see external config section below) prevents the fallback path from being hit in practice.

### 2. `MAX_IN_FLIGHT_GENERATIONS = 8` concurrency cap (route.ts)
**Severity: Medium — by design, but needs visibility**

The in-flight counter (`inFlightCount` metric) is also per-instance. At 20k users across N Vercel instances, the effective cap is `8 × N`, not 8. This means the OpenAI account could receive far more parallel requests than intended if Vercel scales to many instances. OpenAI's own rate limits (requests-per-minute, tokens-per-minute) become the hard ceiling.

**Mitigation:** Set account-level rate limits in OpenAI's usage dashboard. Consider an external queue (Inngest — already present in the project at `/api/inngest`) for overflow.

### 3. `fetchWithBackoff` only retries HTTP 429, not 500/503 (guardrails.ts line 121)
**Severity: Medium — now partially mitigated**

Before this audit, `fetchWithBackoff` returned 500/503 responses immediately without retrying, leaving the error-throw path in `callGenerate`/`callEdit` to surface a generic 500 to the user. Under load spikes, OpenAI frequently returns transient 500/503 errors.

### 4. Top-level catch in route.ts did not distinguish 429 from 500 errors
**Severity: Medium — now fixed**

Before this audit, any error that bubbled up to the `catch (e)` block in `POST` passed through `normalizeOpenAIError()` which only checked for content-policy text. A rate-limit error from OpenAI would produce status 500 with the raw API error message shown to the user.

### 5. Stripe webhook Printify fulfillment — no retry on transient Printify failures
**Severity: Low — acceptable for MVP**

`uploadImageToPrintify`, `createPrintifyProduct`, and `submitPrintifyOrder` in the Stripe webhook handler have no retry logic. A transient Printify 5xx during the fulfillment pipeline sets status `needs_manual_review` and fires a founder alert. This is acceptable at current scale but would cause elevated manual intervention volume under high order throughput.

### 6. Supabase connection pressure at scale
**Severity: High at 20k users — requires external config**

Both the checkout route and the Stripe webhook perform multiple sequential Supabase queries per request. Supabase's default connection limit (direct Postgres) is low (~60 connections). At 20k concurrent users, this will exhaust connections and cause failures.

---

## Fixes Applied

### Fix A — User-friendly rate-limit error messages (`app/api/generate-image/route.ts`)

**Before:** Any error in the top-level `catch` block was passed to `normalizeOpenAIError()`, which only detected content-policy blocks. A 429 or transient error from OpenAI would surface as HTTP 500 with a raw API error message.

**After:**
- Added a check for the OpenAI SDK's numeric `.status` property before string matching. If `err.status === 429` or `err.status === 503`, the route now returns HTTP 429 with the message: _"We're experiencing high demand right now. Please wait a moment and try again."_
- Extended `normalizeOpenAIError()` to detect rate-limit language in error messages (`rate limit`, `rate_limit`, `too many requests`, `busy`, `temporarily`) and map them to HTTP 429 with the same user-friendly message.

**Files changed:**
- `/Users/roryhutchings/keepsy-mvp/app/api/generate-image/route.ts`

### Fix B — Single retry on transient OpenAI 500/503 (`lib/gen/baselineGenerate.ts`)

**Before:** `callGenerate` and `callEdit` in `baselineGenerate.ts` called `fetchWithBackoff` with `retries: 2`, but `fetchWithBackoff` only retried on HTTP 429. A 500 or 503 response was returned immediately, then thrown as an error — no retry occurred for server-side transient failures.

**After:** Added `callWithSingleRetry<T>(fn)` — a lightweight generic wrapper that catches errors with `.status === 500` or `.status === 503` (as returned by `fetchWithBackoff` throwing after reading the error body), waits 1 second, and invokes `fn` exactly once more. All other errors are re-thrown immediately. Both `callGenerate` and `callEdit` call sites are now wrapped.

This adds at most 1 extra second of latency on a transient failure before the user sees an error — a reasonable trade-off.

**Files changed:**
- `/Users/roryhutchings/keepsy-mvp/lib/gen/baselineGenerate.ts`

### Fix C — In-memory rate limiter analysis (no code change)

**Finding:** `usageByKey` in `guardrails.ts` is a plain `Map` — it resets on every cold start and is not shared across Vercel function instances. This is a known limitation of in-memory state in serverless environments.

**Why no code change was made:**
The primary enforcement path already uses Supabase's `check_and_increment_usage` RPC, which is atomic and works across all instances. The in-memory path is a declared fallback for when Supabase is unreachable — it is better to have a permissive fallback than to deny all users when the DB is down during an outage.

**Recommendation:** Ensure Supabase connection pooling is configured (see below) so the fallback is rarely triggered. Do not remove the in-memory fallback — it provides graceful degradation.

---

## What Requires External Configuration

| Item | What to Configure | Where |
|---|---|---|
| **Supabase connection pooling** | Enable PgBouncer / Supavisor in transaction mode. Use the pooler connection string (port 6543) in `SUPABASE_DB_URL` / the Supabase client. Without this, the project will exhaust direct Postgres connections above ~50 concurrent requests. | Supabase Dashboard → Settings → Database → Connection Pooling |
| **OpenAI rate limits** | Set hard caps on requests-per-minute and tokens-per-minute in the OpenAI usage dashboard to prevent runaway costs and ensure the 429 error path (now returning a friendly message) is hit before account suspension. | platform.openai.com → Usage limits |
| **Vercel concurrency / function timeout** | The image generation route has a 120s OpenAI timeout. Set `maxDuration = 120` in `next.config` or `vercel.json` for this route. Without it, Vercel's default timeout (10s on Hobby, 60s on Pro) will kill in-flight generations. | `vercel.json` → `functions` config or Next.js `export const maxDuration` |
| **Inngest queue for overflow** | Inngest is already wired into the project (`/api/inngest`). For sustained load above the in-flight cap, route generation requests through an Inngest function with concurrency controls instead of blocking in the HTTP handler. | Inngest Dashboard → Functions → Concurrency |
| **Printify fulfillment retries** | The Stripe webhook has no retry for transient Printify failures. Consider moving Printify fulfillment into an Inngest background job with built-in retries so transient failures don't require manual intervention. | `/app/api/stripe/webhook/route.ts` → extract Printify calls to Inngest |
