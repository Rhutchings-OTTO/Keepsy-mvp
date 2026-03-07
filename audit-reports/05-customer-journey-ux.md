# Customer Journey & UX Audit — Keepsy
**Date:** 2026-03-06 | **Branch:** main (81c4151)

---

## Executive Summary

Keepsy's creation flow has an elegant surface design but contains **critical functional gaps** that will cause real customer failures at launch. The most severe: orders are charged but never fulfilled (no Printify integration), native `alert()` dialogs replace proper UI error handling, and the account page is an empty shell. The pre-generation and browsing experience is strong; the post-purchase experience is broken.

---

## Findings

### 1. `alert()` Used for Checkout Errors
**Severity: CRITICAL**
**File:** `app/MerchGeneratorPlatform.tsx:776, 802, 830, 834`

Native browser `alert()` calls are used for checkout errors. This is a jarring, unbranded UX pattern that breaks the premium feel and is inaccessible on some assistive technologies.

**Fix:** Replace all `alert()` calls with inline toast notifications or modal error components consistent with the existing design system.

---

### 2. No Printify Order Fulfillment
**Severity: CRITICAL**

Orders are charged via Stripe but never sent to Printify for printing/fulfillment. Customers will pay and receive nothing.

**Fix:** Implement Printify order creation in the Stripe webhook handler (`lib/inngest/functions/stripe-webhook.ts`) after successful payment confirmation.

---

### 3. No Generation Progress Indicator
**Severity: CRITICAL**

Image generation has a 120-second timeout with no progress feedback. Users see a static spinner and have no way to cancel. On slow connections or busy API periods, this creates an anxiety-inducing wait with no escape.

**Fix:**
- Add step-by-step progress messages ("Creating your artwork...", "Applying finishing touches...")
- Add a cancel button that aborts the generation request
- Consider Server-Sent Events for real-time progress (see Performance audit)

---

### 4. Invalid Product IDs Silently Succeed
**Severity: CRITICAL**
**File:** `app/api/create-checkout-session/route.ts`

Passing an invalid product type to the checkout session route succeeds silently — no validation error is thrown. A Stripe checkout is created with incorrect line items.

**Fix:** Add strict product ID validation at the route entry point and return a 400 error with a descriptive message for unknown product types.

---

### 5. Account Page Is a Non-Functional Placeholder
**Severity: CRITICAL**
**File:** `app/account/page.tsx`

The account page renders as an empty shell. Users who sign up/log in see nothing useful — no order history, no saved designs, no profile management. This will create significant support volume post-launch.

**Fix:** Either implement minimum viable account features (order history from Supabase `orders` table) or hide the account page entirely until ready.

---

### 6. No Post-Purchase Order Confirmation Details
**Severity: HIGH**
**File:** `components/OrderSuccess.tsx`

The success page shows a generic message with no order number, item summary, or expected delivery date. Customers have no confirmation of what they purchased.

**Fix:** Query the Supabase `orders` table using the Stripe session ID (available in the URL) and display: order ID, product(s), delivery estimate, and email confirmation notice.

---

### 7. Cart Add Button Active Before Design Exists
**Severity: HIGH**
**File:** `app/MerchGeneratorPlatform.tsx:683`

The "Add to Cart" button is clickable before any design has been generated, triggering a post-click error message. The button should be disabled with a tooltip explaining why.

**Fix:** Disable the button until `generatedImageUrl` is populated. Show "Generate a design first" as helper text beneath the disabled button.

---

### 8. No Empty State for Gift Ideas Page
**Severity: HIGH**
**File:** `app/gift-ideas/page.tsx`

If the gift ideas API returns an empty result, the page shows a blank grid with no explanation or CTA.

**Fix:** Add an empty state component with messaging like "No ideas found for this occasion — try a different one" and a link back to the create flow.

---

### 9. Mobile: Create Flow Exits on Back Navigation
**Severity: HIGH**

On mobile, pressing the browser back button during the multi-step create flow navigates away entirely rather than going to the previous step. Users lose all their input.

**Fix:** Intercept browser history with `useRouter` and handle back navigation within the flow steps.

---

### 10. Upsell Drawer — "Coming Next" Label
**Severity: MEDIUM**
**File:** `components/UpsellDrawer.tsx`

The "Saved as Add-ons (coming next)" label appears broken/incomplete even if the feature works. This erodes trust right before checkout.

**Fix:** Remove the "coming next" parenthetical entirely or replace with "Available at checkout."

---

### 11. No Saved Designs / Drafts
**Severity: MEDIUM**

Users who generate a design and then accidentally navigate away lose their creation permanently. No draft saving exists.

**Fix:** Auto-save the generated image URL and prompt to `localStorage` (or Supabase if logged in) so users can resume.

---

### 12. Gift Ideas → Create Flow — Context Lost
**Severity: MEDIUM**

Clicking a gift idea navigates to `/create` but drops all context (occasion, recipient, budget). The create page starts blank.

**Fix:** Pass gift idea context as URL query params and pre-populate the creation form fields.

---

### 13. No Loading State on Product Page Images
**Severity: LOW**
**File:** `app/product/[type]/page.tsx`

Product images load without a skeleton/placeholder, causing layout shift as images appear.

**Fix:** Add `placeholder="blur"` or a skeleton component to all product page images.

---

### 14. Checkout Flow — Good ✓

- Stripe checkout redirect is fast and reliable ✓
- Success/cancel URL handling is correct ✓
- Price display is clear before checkout ✓

---

### 15. Landing Page Journey — Good ✓

- Hero → CTA → How it works → Testimonials → FAQ is a logical conversion funnel ✓
- Scroll animations are smooth and don't block content ✓
- Gift Ideas nav provides clear alternative entry point ✓

---

## Priority Fix Order

| # | Issue | Severity | Effort |
|---|---|---|---|
| 1 | Implement Printify fulfillment in webhook | CRITICAL | High |
| 2 | Replace `alert()` with toast/modal errors | CRITICAL | Low |
| 3 | Add generation progress + cancel button | CRITICAL | Medium |
| 4 | Validate product IDs in checkout route | CRITICAL | Low |
| 5 | Hide or implement account page | CRITICAL | Medium |
| 6 | Show order details on success page | HIGH | Medium |
| 7 | Disable cart button pre-generation | HIGH | Low |
| 8 | Gift Ideas empty state | HIGH | Low |
| 9 | Fix mobile back-navigation in create flow | HIGH | Medium |
| 10 | Remove "coming next" from upsell | MEDIUM | Low |
| 11 | Auto-save draft designs | MEDIUM | Medium |
| 12 | Pass gift idea context to create page | MEDIUM | Low |
