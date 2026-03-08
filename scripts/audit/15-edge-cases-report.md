# Keepsy Edge Cases & Failure Modes Audit

**Date:** 2026-03-08
**Scope:** `app/api/`, `app/` (pages/components), `lib/`
**Auditor:** Senior developer review — resilience and error handling

---

## Summary

The codebase has a solid foundation: Stripe webhook idempotency is well-implemented, Printify has retry logic with timeouts, and most API failures degrade gracefully. The critical gaps are concentrated in (1) the silent silent swallow of Stripe webhook processing errors that can lose orders permanently, (2) the checkout double-submit window, (3) missing order reconciliation if a Stripe webhook never arrives, and (4) the Printify webhook `order:shipment:created` race condition that can send duplicate shipped emails.

---

## EMPTY STATES

---

### ES-01 — /shop catalog with no visible products after filtering

**Scenario:** User selects a category filter that returns zero results (e.g., future scenario where category is removed from data or PRODUCTS array is empty).

**Current behaviour:** `CatalogClient.tsx` renders a `sorted.length === 0` empty state block with "No products found", a description "Try a different filter.", and a "Clear filters" button that resets to `all`. (`CatalogClient.tsx` lines 444–457)

**Expected behaviour:** Handled. The empty state is helpful and actionable.

**Risk:** Low — no issue.

**Note:** The PRODUCTS array is a hardcoded constant in the client component. If the array were ever empty at the `all` category level (not just after filtering), the empty state would still render but the "Clear filters" button would do nothing useful. The hero stat counter `{PRODUCTS.length}` would display `0`. Low risk but worth noting.

---

### ES-02 — /track with invalid or tampered order reference

**Scenario:** User visits `/track?ref=nonexistent` or manually types a fake ref.

**Current behaviour:** `app/track/page.tsx` calls `.maybeSingle()` on Supabase; if `order` is null it renders a `<NotFound>` component with the message `No order found for reference "${ref}".` — this includes the raw user-supplied `ref` value interpolated directly into the UI string. (line 55)

**Expected behaviour:** Handled gracefully, though the raw ref is echoed back.

**Risk:** Low — Supabase `maybeSingle()` is safe. However, the raw `ref` value from the URL is rendered directly into the page title area with no length cap. A very long or specially-crafted ref (up to URL length limits) would be displayed verbatim. While Next.js auto-escapes JSX interpolations, this is worth capping.

**Suggested fix:**
```typescript
// In track/page.tsx
const ref = (Array.isArray(params.ref) ? params.ref[0] : params.ref)?.slice(0, 128);
```

---

### ES-03 — /account has no real order history

**Scenario:** Any user visits `/account`.

**Current behaviour:** The page (`app/account/page.tsx`) does not query Supabase at all. It renders a static `GalleryOfThePossible` component with placeholder copy: "Your personal design library will appear here. Until then, explore polished examples and start your first gift." There is no authentication, no order lookup, and no personalisation.

**Expected behaviour:** This is a planned feature ("Coming soon" copy is present), so the current state is intentional. However there is a risk: the page implies a logged-in account experience that does not exist. If a customer is directed here expecting their order history, they will find nothing.

**Risk:** Medium — user confusion and potential support contacts. No crash risk.

**Note:** No orders are lost, but a user who bookmarks `/account` expecting their order history will be confused. Consider redirecting to `/track` or adding a note explaining that account features are coming.

---

### ES-04 — Image generation returns no image (b64_json missing)

**Scenario:** OpenAI returns a 200 response but `data[0].b64_json` is absent.

**Current behaviour:** In `lib/gen/baselineGenerate.ts` `callGenerate()`, line 119: `if (!b64) throw new Error("No image returned")`. This propagates up through `baselineGenerate()` as an unhandled exception, which is caught in the route handler's outer `catch (e)` block (`generate-image/route.ts` lines 264–271). The client receives `{ ok: false, error: "No image returned" }` with HTTP 500. `MerchGeneratorPlatform` maps this to the generic "Failed to generate image" message.

**Expected behaviour:** Handled — error surfaces to user. The message "No image returned" could be friendlier (e.g. "The studio couldn't create an image this time. Please try again.").

**Risk:** Low — functionally correct.

**Suggested fix:** Add a specific mapping in `getFriendlyGenerationError()` in `MerchGeneratorPlatform.tsx`:
```typescript
if (lower.includes("no image returned")) {
  return "The studio couldn't create an image this time. Please try again.";
}
```

---

## API FAILURES

---

### AF-01 — OpenAI API is down or returns 5xx

**Scenario:** OpenAI's API returns a network error, DNS failure, or 500/503.

**Current behaviour:** `fetchWithBackoff` in `guardrails.ts` retries up to 3 times on 429 responses with exponential backoff, and has a 120s timeout. For 500/503, line 113 in `baselineGenerate.ts` checks: `if (resp.status === 503 || resp.status === 429) throw new Error("Our atelier is temporarily busy...")`. A plain 500 would fall through to the generic `throw new Error(errMsg)`. The outer route handler catches all exceptions and returns HTTP 500 to the client.

**Risk:** Low — retries exist on 429/503. A hard outage will surface a user-visible error.

**Gap:** `fetchWithBackoff` only retries on 429, not on 500 or 503 (see line 118: `if (response.status !== 429 || attempt === retries) return response`). So 500s from OpenAI are returned immediately without retrying. The per-call retry logic in `MerchGeneratorPlatform.tsx` (lines 576–592) does retry on 503 at the client layer (2 attempts), but this is after a full roundtrip.

**Suggested fix:** In `guardrails.ts` `fetchWithBackoff`, also retry on 500 and 503:
```typescript
const shouldRetry = (response.status === 429 || response.status === 500 || response.status === 503) && attempt < retries;
if (!shouldRetry) return response;
```

---

### AF-02 — Stripe API is unreachable during checkout session creation

**Scenario:** Stripe is down or times out when `stripe.checkout.sessions.create()` is called.

**Current behaviour:** `create-checkout-session/route.ts` wraps the Stripe SDK call in a `try/catch` (lines 245–256). Any exception results in HTTP 500 with `{ error: "CHECKOUT_FAILED", message: "Checkout couldn't start. Please try again." }`. The error is logged via `console.error` with the full message for Vercel log visibility. The pre-inserted Supabase order record (status: "pending") is **not cleaned up** if Stripe fails.

**Risk:** Medium — orphaned `pending` orders accumulate in Supabase. No real-money impact (payment never started), but the database will have ghost records.

**Suggested fix:** Add cleanup of the pre-inserted order on Stripe failure:
```typescript
} catch (err: unknown) {
  // Clean up the pre-inserted pending order
  if (supabase && orderRef) {
    await supabase.from("orders").delete().eq("order_ref", orderRef).eq("status", "pending");
  }
  // ... existing error response
}
```
Alternatively, only insert the Supabase record after the Stripe session is created successfully.

---

### AF-03 — Stripe API has no timeout configured

**Scenario:** Stripe SDK hangs indefinitely (slow network, no response).

**Current behaviour:** The Stripe SDK is instantiated as `new Stripe(secretKey, { apiVersion: "2026-02-25.clover" })` with no `timeout` option. The Vercel edge/serverless function timeout is the only protection (typically 10–60s depending on plan).

**Risk:** Medium — in practice Stripe is reliable, but a slow call could consume the entire function timeout.

**Suggested fix:** Configure a Stripe SDK timeout:
```typescript
const stripe = new Stripe(secretKey, {
  apiVersion: "2026-02-25.clover",
  timeout: 10000, // 10 seconds
});
```

---

### AF-04 — Printify unreachable during fulfillment (Stripe webhook)

**Scenario:** Printify API is down or times out during `uploadImageToPrintify`, `createPrintifyProduct`, or `submitPrintifyOrder`.

**Current behaviour:** `lib/printify.ts` has a 30s timeout per request and up to 3 retries for 429 responses. Non-429 errors throw immediately. In the Stripe webhook handler (`stripe/webhook/route.ts`), the entire Printify pipeline is wrapped in a try/catch (lines 302–406). Failure sets `printify_status: "needs_manual_review"` and calls `notifyFounders()` with a critical alert.

In the **Inngest** path (`lib/inngest/functions/stripe-webhook.ts`), `step.run("printify-submit-order")` re-throws on failure (line 291: `throw err`), which triggers Inngest's built-in retry (configured as `retries: 3` on the function). This is the correct pattern.

**Risk:** Low — both paths handle this. Manual review path exists.

**Gap:** The direct Stripe webhook path (non-Inngest) does **not** retry Printify on transient 500 errors — it goes straight to `needs_manual_review`. The Inngest path retries properly.

**Suggested fix:** Ensure production is routed through Inngest for Printify fulfillment, or add a retry loop in the direct webhook handler similar to `printifyFetch`'s 429 retry logic, but extended to 500/503.

---

### AF-05 — Supabase unreachable

**Scenario:** Supabase is misconfigured, network timeout, or service outage.

**Current behaviour:**
- `getSupabaseAdmin()` (`lib/supabaseAdmin.ts`) returns `null` if env vars are missing — callers check for null and degrade gracefully.
- Supabase query errors are checked with `if (error)` in most places and logged.
- The Stripe webhook `processEvent` returns early if `!supabase` (line 125–128), **silently skipping the entire event** — this means the order is never saved and Printify is never triggered.
- The `/api/orders/status` route returns a `processing` fallback response if Supabase is null.
- The `/track` page returns "Order tracking is temporarily unavailable."
- The Printify webhook handler returns 200 with a log message if `!supabase`.

**Risk:** Critical — if Supabase goes down after a payment completes, the Stripe webhook will silently skip the event. Stripe retries webhooks for 3 days, so if Supabase recovers, the event will eventually be processed. However, there is a window where the customer has paid but no order record exists. The Inngest path is more resilient here.

**Gap:** There is no alerting when Supabase is unavailable during webhook processing. The `console.warn` is the only signal.

**Suggested fix:** In `stripe/webhook/route.ts`, add a founder notification when Supabase is unavailable:
```typescript
if (!supabase) {
  console.warn("[stripe-webhook] Supabase not configured, skipping event:", event.id);
  // Alert on critical webhook skip
  // Note: can't use notifyFounders here as it also uses Resend — log to an external service or use a different alert channel
  return; // Stripe will retry — this is acceptable if Supabase is temporarily down
}
```

---

### AF-06 — Resend unreachable when sending transactional email

**Scenario:** Resend API is down or key is invalid when sending order confirmation or lifecycle emails.

**Current behaviour:**
- `sendOrderConfirmationEmail()` returns `{ ok: false, error: "..." }` on failure and logs the error. The Stripe webhook logs `[email] order confirmation email failed` but continues without throwing. (lines 290–293 in `stripe/webhook/route.ts`)
- `sendInProductionEmail`, `sendShippedEmail`, `sendDeliveredEmail` all return `false` on failure and log the error — they do not retry.
- `getResend()` returns `null` if `RESEND_API_KEY` is missing — callers skip silently with a `console.error` log.

**Risk:** Medium — customers miss transactional emails. No money or fulfillment impact.

**Gap:** No retry on email failure. A transient Resend outage means the email is permanently lost.

**Suggested fix:** Add a `notifyFounders()` call on confirmation email failure so founders can manually send the email:
```typescript
if (!emailResult.ok) {
  console.error("[email] order confirmation email failed:", emailResult.error);
  notifyFounders(
    `Order confirmation email failed for ${orderRef}`,
    `Customer: ${customerEmail}\nOrder: ${orderRef}\nError: ${emailResult.error}`,
    "warning"
  ).catch(() => {});
}
```

---

## RACE CONDITIONS

---

### RC-01 — Double-click on the Generate button

**Scenario:** User clicks "Generate" twice rapidly before the first request returns.

**Current behaviour:** In `MerchGeneratorPlatform.tsx`, `handleGenerate()` sets `isGenerating: true` and `isBusy: true` via `flushSync()` immediately (lines 552–556). Before starting a new generation, it aborts any in-flight request: `generateAbortRef.current?.abort()` (line 557). The button is disabled while `isGenerating` is true (enforced via `disabled={isGenerating || isBusy}` in the render layer — confirmed by the `aria-busy={isGenerating}` on the container).

**Risk:** Low — the abort-and-restart pattern works. However, the second click races with the `flushSync` state update. If the second click fires in the same event loop tick before React re-renders with `isGenerating: true`, two requests may be initiated.

**Gap:** `flushSync` forces a synchronous render, but a programmatic or very fast double-click could still fire the handler twice if the button is not disabled before the second click is registered.

**Suggested fix:** Add a `useRef` guard:
```typescript
const isGeneratingRef = useRef(false);
const handleGenerate = async () => {
  if (isGeneratingRef.current) return;
  isGeneratingRef.current = true;
  try {
    // ... existing logic
  } finally {
    isGeneratingRef.current = false;
  }
};
```

---

### RC-02 — Double-click on the Checkout button

**Scenario:** User clicks "Checkout" twice rapidly.

**Current behaviour:** `handleCheckout()` and `handleCartCheckout()` both set `isSecuring: true` and `isBusy: true` synchronously at the top of the function (lines 781–782 and 808–809). The checkout button is disabled while `isSecuring` or `isBusy` is true (rendered elsewhere in the JSX). Once the Stripe session URL is returned, `window.location.href = url` navigates away.

**Risk:** Low–Medium — the state guards are present but not atomic. If both clicks land before the first `setIsSecuring(true)` call completes a React re-render, two checkout sessions could be created. Each creates a separate Stripe session and a separate Supabase order record. The Stripe idempotency key is derived from `orderRef + cart + date` (line 150–156 in `create-checkout-session`), but **each click generates a new `orderRef` via `crypto.randomUUID()`** (line 145), so two clicks produce two distinct idempotency keys and two Stripe sessions.

**Risk:** High — user could accidentally pay twice for the same order if they double-click checkout and both browser tabs/navigations complete.

**Suggested fix:** Add a ref guard to `runCheckout`:
```typescript
const checkoutInProgressRef = useRef(false);
const runCheckout = async (mode: "single" | "cart") => {
  if (checkoutInProgressRef.current) return;
  checkoutInProgressRef.current = true;
  try {
    await (mode === "cart" ? handleCartCheckout() : handleCheckout());
  } finally {
    checkoutInProgressRef.current = false;
  }
};
```
Also, generate `orderRef` before the Supabase pre-insert and reuse it consistently, so a second call within a short window could be caught by a unique constraint.

---

### RC-03 — Stripe webhook fires twice for the same event

**Scenario:** Stripe retries a webhook delivery (network glitch or our handler returned non-200).

**Current behaviour:** The Stripe webhook handler (`stripe/webhook/route.ts`) checks the `stripe_events` table for the event ID before processing (lines 131–139). It inserts the event record and handles the PostgreSQL `23505` unique-constraint error as a duplicate signal (line 149). This is correct idempotency behaviour. The Inngest path (`lib/inngest/functions/stripe-webhook.ts`) also has the same check in `step.run("check-and-persist-event")`.

**Risk:** Low — idempotency is properly handled.

---

### RC-04 — Printify webhook fires twice for the same order:shipment:created event

**Scenario:** Printify retries a webhook (non-200 response or network failure).

**Current behaviour:** The Printify webhook handler (`app/api/webhooks/printify/route.ts`) checks `SHIPPED_STATUSES.has(existing.status)` before sending the shipped email (line 212). If status is already "shipped" or "delivered", it skips the email. The status is updated to "shipped" via `supabase.from("orders").update(...)` (lines 204–210) before the email is sent.

**Risk:** Low–Medium — there is a TOCTOU (time-of-check-time-of-use) window. The sequence is:

1. Check: `existing.status` is fetched.
2. Update: status set to "shipped".
3. Email: sent if status was not already "shipped".

If two concurrent webhook deliveries both complete step 1 before either completes step 2, both will pass the `SHIPPED_STATUSES.has()` check and both will send the email.

**Suggested fix:** Use a Supabase conditional update to make the email trigger atomic:
```typescript
// Update only if status is not already shipped/delivered
const { data: updated } = await supabase
  .from("orders")
  .update({ printify_status: "shipped", status: "shipped", ... })
  .eq("printify_order_id", printifyOrderId)
  .not("status", "in", '("shipped","delivered")')
  .select("order_ref, customer_email, customer_name, product_type")
  .maybeSingle();

// Only send email if the update actually changed a row
if (updated?.customer_email) {
  await sendShippedEmail({ ... });
}
```
The same pattern applies to `order:sent-to-production` and `order:shipment:delivered`.

---

## INPUT EDGE CASES

---

### IC-01 — Extremely long design prompt

**Scenario:** User submits a prompt of maximum length (1200 chars per `Constraints.PROMPT_MAX_LEN`).

**Current behaviour:** The Zod schema in `generate-image/route.ts` enforces `z.string().max(Constraints.PROMPT_MAX_LEN)` (1200 chars). `minimalSanitize()` also enforces `PROMPT_MAX_LEN = 1000` in `baselineGenerate.ts`. The OpenAI moderation call in `thinModeration.ts` caps at `MAX_PROMPT_LEN = 1000`. The artistic director append (`applyArtisticDirection`) has `maxTotalLength: 1500`. There is a mismatch: the API accepts up to 1200 chars, `baselineGenerate` trims to 1000, and the route-level validation is the outer gate.

**Risk:** Low — no crash, but prompt is silently truncated from 1200 → 1000 without user notification.

**Suggested fix:** Align constants. Either set `PROMPT_MAX_LEN` uniformly to 1000 in both `validate.ts` and `baselineGenerate.ts`, or increase `baselineGenerate`'s limit to match the API schema.

---

### IC-02 — Special characters in the prompt (Unicode, emoji, injection attempts)

**Scenario:** User submits a prompt with emoji, Unicode, HTML tags, or prompt injection characters.

**Current behaviour:** `minimalSanitize()` only strips ASCII control characters `[\x00-\x1f\x7f]`. Unicode, emoji, HTML, and common prompt injection patterns (e.g., `ignore previous instructions`) pass through unmodified. The OpenAI moderation API is called for hard content blocks.

**Risk:** Low for crashes — OpenAI handles these gracefully. Medium for prompt injection — a crafted prompt could attempt to override the artistic director system prompt appended in `applyArtisticDirection()`.

**Note:** Pure prompt injection into an image generation API is lower risk than into a text completion API since the model generates pixels, not text commands. The existing moderation layer is sufficient for harmful content.

---

### IC-03 — Empty prompt submission

**Scenario:** User submits an empty or whitespace-only prompt.

**Current behaviour:** `minimalSanitize()` in `baselineGenerate.ts` (line 49): `if (!limited) return { ok: false, error: "Prompt cannot be empty." }`. The route handler also calls `minimalSanitize` and returns HTTP 400 with `{ ok: false, code: "empty", userMessage: "Prompt cannot be empty.", ... }` (lines 123–127 of `generate-image/route.ts`). The frontend `handleGenerate` also has an early return: `if (!effectivePrompt && !uploadedImage) return` (line 544).

**Risk:** Low — handled at multiple layers with user-friendly messages.

---

### IC-04 — fromPersistedCart with malformed localStorage

**Scenario:** Corrupt or manually edited `keepsy_cart_v2` in localStorage.

**Current behaviour:** `fromPersistedCart()` in `MerchGeneratorPlatform.tsx` (lines 147–170) wraps `JSON.parse` without a try/catch. If the stored value is not valid JSON, `JSON.parse` throws, which propagates up to the `useEffect` caller which has a wrapping `try/catch` (`} catch { // ignore malformed local cart snapshots }`).

**Risk:** Low — correctly handled.

---

## PAYMENT EDGE CASES

---

### PE-01 — Payment succeeds but Stripe webhook never fires

**Scenario:** Stripe sends the `checkout.session.completed` event but it never reaches the application (DNS failure, Vercel outage at that moment, webhook misconfiguration).

**Current behaviour:** Stripe automatically retries webhook delivery for up to 3 days. There is **no active reconciliation mechanism** — the application only processes orders reactively via webhooks. If all retries fail (extremely rare), the customer has paid but no order record exists in Supabase, no email is sent, and no Printify order is created.

**Risk:** High (low probability but high impact).

**Gap:** No cron job or manual reconciliation tool to detect paid Stripe sessions without corresponding Supabase orders.

**Suggested fix:** Add a nightly reconciliation job (e.g., Inngest scheduled function or Vercel cron) that:
1. Queries Stripe for sessions completed in the past 48h.
2. Cross-references with Supabase `orders` table.
3. Triggers fulfillment for any sessions missing a matching order.

```typescript
// Example Inngest scheduled function
export const reconcileOrders = inngest.createFunction(
  { id: "reconcile-orders", name: "Nightly order reconciliation" },
  { cron: "0 2 * * *" }, // 2am daily
  async ({ step }) => {
    // Query Stripe for recent completed sessions not in Supabase
    // ...
  }
);
```

---

### PE-02 — User closes browser mid-checkout (between Stripe redirect and webhook)

**Scenario:** User is sent to Stripe, completes payment, but closes the browser before returning to `/success` or before the webhook fires.

**Current behaviour:** The Stripe webhook fires independently of browser activity — it is a server-to-server call. Payment is confirmed and the webhook processes normally. The `checkout.session.expired` event handles the case where the user closes before paying.

**Risk:** Low — webhook delivery is independent of client browser state. Handled correctly.

---

### PE-03 — /success page renders before Stripe webhook completes

**Scenario:** User lands on `/success?session_id=...` before the `checkout.session.completed` webhook has been processed (race between Stripe's redirect and webhook delivery).

**Current behaviour:** `app/success/page.tsx` queries Supabase for `stripe_session_id = sessionId`. If the order is not yet found (webhook hasn't processed), `status` defaults to `"processing"`. The page renders: "We're finalising your order and preparing your design for print." — acceptable UX.

**Risk:** Low — status polling would improve UX (show a spinner, then refresh when status changes), but the current static rendering is acceptable for an MVP.

---

### PE-04 — Printify fulfillment succeeds but Supabase update fails

**Scenario:** `submitPrintifyOrder` succeeds (order is live in Printify) but the subsequent `supabase.update()` to set `printify_order_id` and `status: "in_production"` fails.

**Current behaviour:** In `stripe/webhook/route.ts` (lines 369–376), the Supabase update after `submitPrintifyOrder` is not guarded — if it throws, it's caught by the outer catch block which sets `printify_status: "needs_manual_review"`. This creates a state where Printify has the order but Supabase shows `needs_manual_review`, causing a false alert to founders.

In the Inngest path (`stripe-webhook.ts`), the `printify-submit-order` step wraps both the Printify call and the Supabase update — if the Supabase update fails, Inngest will retry the entire step, which will attempt to call `submitPrintifyOrder` again. Printify uses `externalId: orderRef` for deduplication, so a duplicate submission should be safe, but this is not explicitly tested.

**Risk:** Medium — false `needs_manual_review` alerts, or potential duplicate Printify order submission on Inngest retry.

**Suggested fix:** Separate the Printify order submission and the Supabase update into distinct Inngest steps so retries of the Supabase update don't re-call Printify.

---

## NETWORK

---

### NW-01 — No timeout on Stripe SDK calls

See AF-03 above.

---

### NW-02 — No timeout on Resend API calls

**Scenario:** Resend API hangs indefinitely.

**Current behaviour:** `resend.emails.send()` uses the Resend SDK with no explicit timeout configured. Resend's default SDK timeout is 60 seconds.

**Risk:** Low — email sending occurs in the webhook handler after payment. A hang would delay webhook response, potentially causing Stripe to retry. Stripe waits 30s before considering a webhook failed.

**Gap:** The webhook handler returns HTTP 200 unconditionally after the outer try/catch, but the Resend call happens inside `processEvent()` which is awaited before returning 200. A Resend hang of >30s would cause Stripe to retry the webhook.

**Suggested fix:** Wrap email sending in `Promise.race()` with a timeout:
```typescript
const EMAIL_TIMEOUT_MS = 8000;
const emailWithTimeout = Promise.race([
  sendOrderConfirmationEmail({ ... }),
  new Promise<EmailResult>((_, reject) =>
    setTimeout(() => reject(new Error("Email timeout")), EMAIL_TIMEOUT_MS)
  ),
]);
const emailResult = await emailWithTimeout.catch((e) => ({ ok: false, error: e.message }));
```

---

### NW-03 — In-memory rate limit state is lost on serverless restart

**Scenario:** Vercel serverless function cold-starts reset the `windows` Map in `lib/security/rateLimit.ts` and `usageByKey` Map in `guardrails.ts`.

**Current behaviour:** Both maps are module-level variables that reset on cold start. The Upstash Redis layer mitigates this for generation endpoints when configured, but falls back to in-memory if Upstash is unavailable.

**Risk:** Medium — in practice, cold starts are frequent on serverless. A user could exceed the rate limit by triggering cold starts between requests. The 10-second minimum interval guard (`MIN_INTERVAL_MS`) would also be bypassed.

**Note:** This is a fundamental serverless architecture constraint. Full mitigation requires Upstash being always configured.

---

### NW-04 — Cloudinary upload has no explicit timeout

**Scenario:** Cloudinary API hangs during image upload in `lib/uploadImage.ts`.

**Current behaviour:** `cloudinary.uploader.upload()` is called with no timeout option. The Cloudinary SDK uses its own default timeout (typically 60s). The upload happens inside `baselineGenerate()`, which is awaited within the 120s AbortController timeout set on the OpenAI fetch. However, the Cloudinary upload is **not** covered by the AbortController signal — only the OpenAI fetch is.

**Risk:** Medium — a Cloudinary hang of >120s (from user's perspective) would only be caught by the Next.js function timeout (Vercel: up to 60s on Pro, 300s on Enterprise). In practice, if Cloudinary hangs, the user will get an eventual timeout, `designUrl` will be empty, and Printify fulfillment will be skipped silently.

**Suggested fix:**
```typescript
// In lib/uploadImage.ts, wrap upload with a timeout
const uploadWithTimeout = Promise.race([
  cloudinary.uploader.upload(imageDataUrl, { ... }),
  new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("Cloudinary upload timeout after 20s")), 20_000)
  ),
]);
const result = await uploadWithTimeout;
```

---

## ADDITIONAL FINDINGS

---

### ADD-01 — splitName with single-word name

**Scenario:** Stripe returns a customer name with only one word (e.g., "Madonna" or a nickname).

**Current behaviour:** `splitName()` in `lib/printify.ts` (lines 334–337): if there is only one part, it returns `{ first_name: parts[0], last_name: parts[0] }` — duplicating the name for both fields.

**Risk:** Low — Printify will accept it. The customer's full name appears as both first and last name, which may look odd on the package label (e.g., "Madonna Madonna").

**Suggested fix:**
```typescript
if (parts.length === 1) return { first_name: parts[0], last_name: "." };
```
Or use a placeholder last name to satisfy Printify's requirements without duplication.

---

### ADD-02 — design_url truncated in Stripe metadata

**Scenario:** A Cloudinary URL for a design exceeds 500 characters (Stripe metadata value limit is 500 chars).

**Current behaviour:** In `create-checkout-session/route.ts`, the `designUrl` is passed directly as `metadata.design_url` (line 225). Cloudinary URLs with transformation parameters can exceed 500 characters. The `checkoutSchema` validates `designUrl` up to 2048 characters. If the URL is >500 chars, Stripe will reject the session creation with a validation error, which is caught by the outer try/catch and returns a generic `CHECKOUT_FAILED` error to the user.

**Risk:** High — long design URLs would silently break checkout. The customer gets "Checkout couldn't start. Please try again." with no indication of the real cause.

**Suggested fix:** Truncate or strip the `fl_immutable_cache` transformation from the URL before storing in Stripe metadata, or store the order ref and look up the URL from Supabase in the webhook:
```typescript
// In create-checkout-session route
const metadataDesignUrl = (designUrl || "").slice(0, 490); // Stripe limit is 500
```
Also add explicit validation and logging:
```typescript
if (designUrl && designUrl.length > 490) {
  console.warn("[checkout] designUrl exceeds Stripe metadata limit, truncating:", designUrl.length);
}
```

---

### ADD-03 — Unrecognised productId falls back to "card" silently

**Scenario:** A product type that doesn't match "card", "mug", "tee", or "hoodie" is passed to `getProductRegionKey()`.

**Current behaviour:** `lib/printify-blueprints.ts` `getProductRegionKey()` (line 211): `return "card"` as the fallback. An unknown product type silently produces a greeting card Printify order.

**Risk:** Medium — if a new product is added to the catalog without updating `printify-blueprints.ts`, orders will be silently fulfilled as greeting cards.

**Suggested fix:**
```typescript
// Throw or log a warning instead of silent fallback
console.error(`[printify] Unknown productId "${productId}" — falling back to card. Add mapping to printify-blueprints.ts`);
notifyFounders(`Unknown Printify product type: ${productId}`, ..., "warning").catch(() => {});
return "card";
```

---

### ADD-04 — PRINTIFY_WEBHOOK_SECRET not set in production

**Scenario:** `PRINTIFY_WEBHOOK_SECRET` environment variable is not configured in production.

**Current behaviour:** In `app/api/webhooks/printify/route.ts` (lines 86–98): if `webhookSecret` is falsy in production, the code logs `console.warn` but **skips signature verification entirely**, accepting any POST request as a valid Printify webhook.

**Risk:** High — any external actor who knows the endpoint URL can trigger order status changes and send transactional emails to customers without a valid Printify signature.

**Suggested fix:** Make this a hard failure in production:
```typescript
if (!webhookSecret) {
  if (process.env.NODE_ENV === "production") {
    console.error("[printify-webhook] PRINTIFY_WEBHOOK_SECRET not set — rejecting all requests for security");
    return new Response(JSON.stringify({ error: "Webhook not configured" }), { status: 500 });
  }
  console.warn("[printify-webhook] PRINTIFY_WEBHOOK_SECRET not set — skipping signature check (dev only)");
}
```

---

## Risk Summary

| ID     | Area               | Risk     | Status    |
|--------|--------------------|----------|-----------|
| AF-05  | Supabase down      | Critical | Open      |
| RC-02  | Checkout double-submit | High | Open   |
| PE-01  | Missed webhook reconciliation | High | Open |
| ADD-02 | Stripe metadata URL truncation | High | Open |
| ADD-04 | Printify webhook secret | High | Open |
| AF-02  | Orphaned pending orders | Medium | Open |
| AF-03  | Stripe SDK no timeout | Medium | Open |
| AF-06  | Email failures silent | Medium | Open |
| RC-04  | Printify webhook dedup TOCTOU | Medium | Open |
| PE-04  | Printify/Supabase state split | Medium | Open |
| NW-02  | Resend timeout in webhook | Medium | Open |
| NW-03  | In-memory rate limit cold start | Medium | Open |
| NW-04  | Cloudinary no timeout | Medium | Open |
| ADD-01 | splitName single word | Low | Open |
| ADD-03 | Unknown productId silent fallback | Medium | Open |
| AF-01  | OpenAI no retry on 500 | Low | Open |
| RC-01  | Generate double-click | Low | Open |
| ES-02  | Track ref echo | Low | Open |
| IC-01  | Prompt length mismatch | Low | Open |
| ES-03  | Account page no auth | Medium | By design |
| RC-03  | Stripe webhook idempotency | Low | Handled |
| PE-02  | Browser close mid-checkout | Low | Handled |
| IC-03  | Empty prompt | Low | Handled |

---

*Generated by automated codebase audit — all line references correspond to the codebase state as of 2026-03-08.*
