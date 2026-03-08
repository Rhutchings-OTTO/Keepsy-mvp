# Keepsy MVP — Security Audit Report

**Date:** 2026-03-08
**Auditor:** Senior Application Security Engineer
**Scope:** All API routes, middleware, auth/session handling, secrets management, input validation, data exposure, RLS

---

## Executive Summary

The codebase has a competent security baseline: Stripe webhook signatures are verified, rate limiting exists on all routes, Zod schemas validate inputs with size guards, and security headers are set in middleware. The main attack surface is concentrated in five areas: an **unauthenticated order-status endpoint** that leaks any order by session ID, **no RLS policies** in the Supabase migrations allowing the service-role key to be the only access barrier, a **conditional Printify webhook** that silently skips signature verification when the secret is unset, **client-spoofable rate-limit keys**, and **PII logged in production** (customer email in the Stripe webhook handler).

---

## Findings

---

### FINDING 01 — UNAUTHENTICATED ORDER STATUS ENDPOINT LEAKS PII

**Severity:** High
**File:** `app/api/orders/status/route.ts`
**Immediate action required:** Yes

**What's vulnerable:**
`GET /api/orders/status?session_id=<id>` looks up any order by Stripe session ID and returns `order_ref`, `stripe_session_id`, `currency`, `total_gbp`, `createdAt`, `updatedAt`, and all line items. There is no authentication, no user-binding, and no origin guard (only rate limiting). Stripe session IDs are not secret by design — they appear in success-page URLs (`/success?session_id={CHECKOUT_SESSION_ID}`). Anyone who learns a session ID (browser history, shared links, server logs) can retrieve that order's details and associated products.

The `sessionId` schema (`z.string().min(1).max(128)`) performs no format validation beyond length, so brute-forcing `cs_test_*` / `cs_live_*` patterns is low-cost against the in-memory rate limiter.

**How to fix:**
1. Require a one-time token or signed parameter (e.g., HMAC of `session_id + secret`) in the URL, generated at checkout time and stored in the order row.
2. Alternatively, use a short-lived JWT issued at payment success that proves the client just completed that session.
3. At minimum, add `guardOrigin` to this route — it currently lacks the origin check applied to checkout/generate routes.
4. Consider moving PII fields (`customer_email`, `customer_name`) out of the public response entirely.

---

### FINDING 02 — NO RLS POLICIES ON ANY SUPABASE TABLE

**Severity:** High
**Files:** `supabase/migrations/20260226_gatekeeper.sql`, `supabase/migrations/20260228_orders_and_perf.sql`
**Immediate action required:** Yes (before enabling `anon` or `authenticated` Supabase roles)

**What's vulnerable:**
Neither migration contains `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` or any `CREATE POLICY` statements for any table (`orders`, `order_items`, `stripe_events`, `user_profiles`, `daily_usage`, `deletion_requests`, `perf_metrics`). All server-side code correctly uses `SUPABASE_SERVICE_ROLE_KEY` (which bypasses RLS by design), so in the current architecture this is not directly exploitable. However:

- If the `NEXT_PUBLIC_SUPABASE_URL` (which is public) is combined with the `anon` key (which is also often public by convention), any user could query all orders directly via the Supabase REST or realtime APIs.
- A future client-side Supabase feature or a misconfigured SDK initialisation using the anon key would expose all rows.
- The Supabase Dashboard will show all tables as unprotected, which increases blast radius if any credential is compromised.

**How to fix:**
```sql
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deletion_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perf_metrics ENABLE ROW LEVEL SECURITY;
-- No anon SELECT policies; only service_role can access.
```
This makes RLS the safety net even if the service-role key is accidentally used in a client context.

---

### FINDING 03 — PRINTIFY WEBHOOK SILENTLY SKIPS SIGNATURE VERIFICATION IN PRODUCTION

**Severity:** High
**File:** `app/api/webhooks/printify/route.ts` (lines 86–98)
**Immediate action required:** Yes

**What's vulnerable:**
```typescript
const webhookSecret = process.env.PRINTIFY_WEBHOOK_SECRET;
if (webhookSecret) {
  // verify signature
} else if (process.env.NODE_ENV === "production") {
  console.warn("... skipping signature check");
}
```
If `PRINTIFY_WEBHOOK_SECRET` is not set in production, the endpoint accepts **any** POST request as a legitimate Printify event. An attacker who knows the endpoint URL can POST crafted events to trigger email sends (shipped/delivered), update order statuses, or cause the founders-alert system to fire. There is no fallthrough 401 — it falls through to `ok200()`. The body size check and rate limit provide weak mitigation only.

**How to fix:**
```typescript
if (!webhookSecret) {
  if (process.env.NODE_ENV === "production") {
    return new Response(JSON.stringify({ error: "Webhook not configured" }), { status: 500 });
  }
  // dev-only: warn and continue
  console.warn("[printify-webhook] No secret set — accepting all events in dev");
}
```
Also: ensure `PRINTIFY_WEBHOOK_SECRET` is documented as required in the deployment checklist.

---

### FINDING 04 — ADMIN ROUTE `/api/admin/mockup-placement` BYPASSES AUTH WHEN KEY IS UNSET

**Severity:** High
**File:** `app/api/admin/mockup-placement/route.ts` (lines 14–25)
**Immediate action required:** Yes

**What's vulnerable:**
```typescript
function assertAdminAccess(req: Request) {
  if (process.env.MOCKUP_CALIBRATION_ENABLED !== "true") {
    return NextResponse.json({ error: "disabled" }, { status: 403 });
  }
  const requiredKey = process.env.MOCKUP_CALIBRATION_KEY;
  if (!requiredKey) return null;  // <-- auth bypass when key is not set
  // ...
}
```
When `MOCKUP_CALIBRATION_ENABLED=true` but `MOCKUP_CALIBRATION_KEY` is not configured, the function returns `null` (access granted) instead of 403/401. This means the POST handler can overwrite `lib/mockups/placements.json` — a file that is read by the live placement renderer — without any authentication. This is an arbitrary file-write to a known path within the application's working directory.

By contrast, the sibling route `/api/admin/mockup-placements/route.ts` correctly returns 403 when the key is absent.

**How to fix:**
```typescript
const requiredKey = process.env.MOCKUP_CALIBRATION_KEY;
if (!requiredKey) {
  return NextResponse.json({ error: "Admin key not configured." }, { status: 403 });
}
```

---

### FINDING 05 — RATE LIMIT KEY IS CLIENT-CONTROLLED (x-visitor-id)

**Severity:** Medium
**Files:** `lib/security/rateLimit.ts` (line 94–98), `app/api/generate-image/guardrails.ts` (line 21–25)
**Immediate action required:** No (mitigated by Upstash IP-based fallback for generation)

**What's vulnerable:**
`getClientKey()` uses `x-visitor-id` as the primary identifier:
```typescript
return visitorId || forwardedFor || realIp || "anonymous";
```
The `x-visitor-id` header is set by the client (generated in `localStorage`). Any requester can set this to an arbitrary value — for example, a new UUID per request — to bypass the in-memory rate limiter for all non-generation endpoints (checkout, delete-my-data, admin routes). For generation endpoints, Upstash Redis uses the IP as key, providing a real control. But checkout (`/api/checkout`, `/api/create-checkout-session`) uses only the in-memory limiter keyed by the spoofable visitor ID, allowing an attacker to spam checkout session creation at will (each costs an API call to Stripe).

**How to fix:**
- For all endpoints, extract IP from `x-forwarded-for` as the primary rate-limit key, not `x-visitor-id`.
- `x-visitor-id` should only be used as an additional identifier for usage analytics, not as the primary throttle key.
- Apply Upstash Redis rate limiting to checkout endpoints as well, not just generation.

---

### FINDING 06 — CUSTOMER EMAIL LOGGED IN PLAINTEXT IN PRODUCTION

**Severity:** Medium
**File:** `app/api/stripe/webhook/route.ts` (lines 209–213)
**Immediate action required:** No (but fix before scale)

**What's vulnerable:**
```typescript
console.log(
  "[webhook] Processing checkout.session.completed for order:", orderRef,
  "email:", customerEmail,  // PII logged unconditionally
  "designUrl:", designUrl
);
```
This runs in production for every successful payment. Customer email addresses are written to Vercel function logs, which are retained and potentially accessible to multiple team members and the Vercel platform. This is a GDPR/UK-GDPR concern — personal data in logs should be either omitted, hashed, or masked. The Printify webhook handler (`route.ts` lines 173, 223, 262) also logs `existing.customer_email` unconditionally.

**How to fix:**
Replace with a masked version for production:
```typescript
const logEmail = process.env.NODE_ENV === "production"
  ? customerEmail?.replace(/(.{2}).*(@.*)/, "$1***$2") ?? "unknown"
  : customerEmail;
console.log("[webhook] Processing order:", orderRef, "email:", logEmail);
```

---

### FINDING 07 — CSP USES `unsafe-inline` AND `unsafe-eval`

**Severity:** Medium
**File:** `middleware.ts` (line 25)
**Immediate action required:** No

**What's vulnerable:**
```typescript
"script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
```
Both `'unsafe-inline'` and `'unsafe-eval'` are present, which defeats the XSS protection that CSP provides. Any injected inline script would execute. `'unsafe-eval'` is particularly dangerous as it enables `eval()`, `Function()`, and similar runtime code execution APIs. Next.js with Turbopack/webpack requires `'unsafe-eval'` in development but production builds should not need it.

**How to fix:**
Use a nonce-based CSP. Next.js supports this via the middleware:
```typescript
const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
response.headers.set("x-nonce", nonce);
// script-src 'nonce-${nonce}' 'strict-dynamic'
```
This requires marking all `<script>` elements with the nonce. For Stripe, `https://js.stripe.com` with a nonce is sufficient. Remove `'unsafe-eval'` in production. This is a medium-term refactor but worthwhile before launch.

---

### FINDING 08 — MIDDLEWARE RUNS ON ALL ROUTES INCLUDING STRIPE WEBHOOK (NO MATCHER)

**Severity:** Low
**File:** `middleware.ts`
**Immediate action required:** No

**What's vulnerable:**
The middleware has no `export const config = { matcher: [...] }`. This means it runs on every request including `/_next/static/*`, image optimisation, and — more relevantly — `POST /api/stripe/webhook`. The middleware calls `NextResponse.next()` which does not read or buffer the body, so Stripe's raw body for HMAC verification is not affected. However:
- Adding security headers to webhook routes is harmless overhead.
- Any future middleware that reads/transforms the request body on this route would break Stripe signature verification.
- CSP headers on API routes are unnecessary.

**How to fix:**
Add a matcher to exclude webhook routes and static assets:
```typescript
export const config = {
  matcher: ["/((?!api/webhooks|api/stripe/webhook|_next/static|_next/image|favicon).*)"],
};
```

---

### FINDING 09 — SUPABASE_SERVICE_ROLE_KEY USED FROM NEXT_PUBLIC_SUPABASE_URL

**Severity:** Low (informational)
**File:** `lib/supabaseAdmin.ts`
**Immediate action required:** No

**What's vulnerable:**
`NEXT_PUBLIC_SUPABASE_URL` is exposed to the browser bundle by convention (the `NEXT_PUBLIC_` prefix). The `SUPABASE_SERVICE_ROLE_KEY` is correctly kept server-side only. The combination is safe as long as:
1. No client-side code ever imports `lib/supabaseAdmin.ts` (currently true).
2. The service role key is never accidentally moved to a `NEXT_PUBLIC_` variable.

The `lib/env.ts` validation schema includes `SUPABASE_SERVICE_ROLE_KEY` but does not enforce that it is never accessed client-side at the type level.

**How to fix:**
Add a build-time guard to `lib/supabaseAdmin.ts`:
```typescript
if (typeof window !== "undefined") {
  throw new Error("supabaseAdmin must not be imported in client code.");
}
```
This gives a fast, visible failure if someone accidentally server-imports this in a Client Component.

---

### FINDING 10 — PRINTIFY SIGNATURE COMPARISON IS NOT CONSTANT-TIME

**Severity:** Low
**File:** `app/api/webhooks/printify/route.ts` (lines 48–56)
**Immediate action required:** No

**What's vulnerable:**
```typescript
function verifySignature(rawBody: string, signature: string, secret: string): boolean {
  const expected = createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
  const expectedBuf = Buffer.from(expected, "hex");
  const receivedBuf = Buffer.from(signature.replace(/^sha256=/, ""), "hex");
  if (expectedBuf.length !== receivedBuf.length) return false;
  return expectedBuf.equals(receivedBuf);  // not constant-time
}
```
`Buffer.equals()` is not guaranteed to be constant-time (it short-circuits on the first differing byte), making a timing side-channel theoretically possible. In practice this is extremely low risk over a network connection, but it is incorrect by principle.

**How to fix:**
```typescript
import { timingSafeEqual } from "crypto";
return timingSafeEqual(expectedBuf, receivedBuf);
```
Note: `timingSafeEqual` requires both buffers to be the same length; the length check before it is correct and should remain.

---

### FINDING 11 — IN-MEMORY RATE LIMITER DOES NOT PERSIST ACROSS FUNCTION INSTANCES

**Severity:** Low (architectural)
**File:** `lib/security/rateLimit.ts` (line 10)
**Immediate action required:** No

**What's vulnerable:**
The `windows` Map is in-memory per serverless function instance. On Vercel, multiple instances run concurrently, so a user can effectively multiply their request budget by the number of concurrent cold-start instances. This affects all non-generation endpoints (checkout, admin, health, etc.). For generation endpoints, Upstash Redis provides cross-instance state. For checkout (10 req/60s limit), an attacker with multiple connections could hit 10 × N instances before being limited.

**How to fix:**
Extend the Upstash Redis rate limiter to cover checkout and other sensitive POST endpoints, not just generation. The infrastructure is already present in `lib/ratelimit/upstash.ts`.

---

### FINDING 12 — HEALTH ENDPOINT REVEALS CONFIGURATION STATE PUBLICLY

**Severity:** Low
**File:** `app/api/health/route.ts`
**Immediate action required:** No

**What's vulnerable:**
`GET /api/health` is publicly accessible (rate-limited but no auth) and returns:
```json
{ "checks": { "supabase": "ok", "stripe_key": "ok", "printify_key": "ok", "resend_key": "ok" } }
```
While it does not expose key values, it reveals which third-party services are configured and which are missing. A "missing" Printify key tells an attacker that Printify fulfillment will silently skip — useful reconnaissance.

**How to fix:**
Either require a `DEBUG_PANEL_KEY` for this endpoint, or limit the response to an opaque `{ "status": "ok" | "degraded" }` without the per-service breakdown in public responses.

---

## Summary Table

| # | Severity | Route / File | Issue | Fix Required |
|---|----------|-------------|-------|--------------|
| 01 | **High** | `/api/orders/status` | Unauthenticated order lookup by session ID leaks PII | Yes |
| 02 | **High** | Supabase migrations | No RLS on any table | Yes |
| 03 | **High** | `/api/webhooks/printify` | Signature verification skipped silently when secret unset | Yes |
| 04 | **High** | `/api/admin/mockup-placement` | Auth bypass when `MOCKUP_CALIBRATION_KEY` is unset | Yes |
| 05 | **Medium** | Rate limiter (all routes) | Client-controlled `x-visitor-id` as primary rate-limit key | No |
| 06 | **Medium** | `/api/stripe/webhook` | Customer email logged in plaintext in production | No |
| 07 | **Medium** | `middleware.ts` | CSP contains `unsafe-inline` and `unsafe-eval` | No |
| 08 | **Low** | `middleware.ts` | No matcher — middleware runs on webhook routes | No |
| 09 | **Low** | `lib/supabaseAdmin.ts` | No guard against client-side import of service-role client | No |
| 10 | **Low** | `/api/webhooks/printify` | Signature comparison not constant-time | No |
| 11 | **Low** | `lib/security/rateLimit.ts` | In-memory limiter does not persist across serverless instances | No |
| 12 | **Low** | `/api/health` | Health endpoint reveals configuration state publicly | No |

---

## What Is Already Good

- **Stripe webhook**: `constructEventAsync` with HMAC-SHA256 is correctly used; raw body is not parsed before verification; payload size is capped.
- **Input validation**: Zod schemas with `.strict()` on all API routes; body size guards consistently applied.
- **Secret management**: No hardcoded secrets found; `.gitignore` correctly excludes `.env*`; `lib/env.ts` validates key formats at startup.
- **HTTPS / HSTS**: Enforced in middleware for production with `max-age=31536000; includeSubDomains; preload`.
- **Security headers**: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, `COOP`, `CORP` all set.
- **`poweredByHeader: false`** in `next.config.ts` — removes server fingerprinting.
- **Price verification**: Checkout routes validate `unitPrice` against the server-side `PRODUCT_CATALOG` — client cannot manipulate prices.
- **Idempotency**: Stripe events deduplicated in `stripe_events` table; checkout sessions use SHA256-keyed idempotency keys.
- **No XSS vectors found**: No `dangerouslySetInnerHTML` usage anywhere in the codebase.
- **No hardcoded secrets found**: Secret scan script (`scripts/secret-scan.mjs`) present; no `sk_live_`, `sk_test_`, or `sk-` patterns found in tracked files.

---

## Recommended Fix Priority

**This week (pre-launch):**
1. Finding 04 — Fix the admin route auth bypass (one line change)
2. Finding 03 — Hard-fail on missing `PRINTIFY_WEBHOOK_SECRET` in production
3. Finding 02 — Add `ENABLE ROW LEVEL SECURITY` to all tables in a new migration

**Before customer traffic:**
4. Finding 01 — Add authentication to order status endpoint
5. Finding 06 — Mask PII in production logs

**Post-launch hardening:**
6. Finding 05 — Migrate checkout to Upstash rate limiting
7. Finding 07 — Implement nonce-based CSP
8. Findings 09–12 — Low priority architectural improvements
