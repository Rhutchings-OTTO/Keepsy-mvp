# Messaging & Copywriting Audit — Keepsy
**Date:** 2026-03-06 | **Branch:** main (81c4151) | **Overall: 8/10**

---

## Executive Summary

Keepsy demonstrates a **strong, consistent voice** with excellent clarity and emotional resonance. The messaging is sophisticated without being jargon-heavy, benefits-focused, and well-tailored to the gift-giving context. However, there are opportunities to strengthen value proposition differentiation, improve error messages, and clarify technical processes.

---

## Findings

### 1. Headline & Value Proposition
**Severity: MEDIUM**
**File:** `app/LandingPage.tsx`

**Current headline:** "Turn a photo or memory into a premium keepsake."
**Current subheadline:** "Keepsy creates finished artwork and shows it on the actual product, so the whole process feels simple, warm and easy to trust."

The headline is benefit-focused but doesn't answer "Why Keepsy vs. alternatives?" The differentiators — preview on real product, polished artwork vs photo-drop — are buried in the subheadline.

**Recommendation:**
- Option A: "Turn memories into gifts you'll love — see the design before you buy."
- Option B: "Create premium keepsakes. See them on the actual product first."

---

### 2. Tagline — Regional Risk
**Severity: LOW**
**File:** `app/LandingPage.tsx` (header badge)

**Current:** "Personalised gifts without the faff"

"Faff" is British slang — risks confusion for US visitors. Footer uses the stronger "Beautiful personalised gifts, made simple."

**Recommendation:** Regionalise: US copy → "Personalised gifts, stress-free." Or standardise globally to the footer version.

---

### 3. Hero Bullets — Feature vs Benefit
**Severity: LOW**

**Current:**
1. "Write your idea in everyday language"
2. "Upload a photo if you already have one"
3. "Preview it on cards, mugs, hoodies and tees"

Describe what you *do*, not what you *gain*.

**Recommendation:**
1. "Express your vision in plain words — no design experience needed"
2. "Add a photo to personalise it further"
3. "See your design on the real product before you commit"

---

### 4. How It Works — Excellent ✓
**Severity: NONE**

Steps are benefits-driven, emotional, and specific. "Genuinely gift-worthy" is particularly strong. No changes needed.

---

### 5. Social Proof / Testimonials
**Severity: HIGH**
**File:** `app/LandingPage.tsx`

3 testimonials are specific, credible, and outcome-driven (ages included, product mentioned, emotional response). Excellent quality.

**Gap:** Only 3 reviews for a new brand. More volume = more trust.

**Recommendation:** Expand to 5-6 testimonials across different products (card, mug, hoodie) and occasions (birthday, anniversary, Mother's Day).

---

### 6. Error Messages
**Severity: CRITICAL (HIGH impact)**
**File:** `app/MerchGeneratorPlatform.tsx`

Current errors are functional but too generic:
- "Failed to generate. Please try again."
- "We couldn't send that prompt. Please try again."

These are nearly identical and give users no direction.

**Recommendation — Error taxonomy:**

| Error Type | Recommended Copy |
|---|---|
| Technical/retryable | "Hmm, that didn't work. Please try again in a moment." |
| Safety block | "That wasn't safe to process. Try a different image or simpler wording." |
| Rate limit | "You've used your daily generations. Resets at midnight UTC." |
| Validation | "JPG or PNG only. (You uploaded [filetype])" |
| Service busy | "Our studio is at capacity. Try again in 5 minutes." |

---

### 7. Form Labels & Microcopy
**Severity: MEDIUM**
**File:** `components/GiftingStep.tsx`

- "Relationship" is ambiguous — relationship to giver or recipient? → Change to "Who is this for?"
- "Include message in package" checkbox with "(Gift message saved for your order)" parenthetical is confusing → "Print this message on the packaging" + helper text "Message saved to your order either way"

---

### 8. Cart Validation Message
**Severity: CRITICAL**
**File:** `app/MerchGeneratorPlatform.tsx:683`

**Current:** "Generate a design before adding an item to cart." — shown as error after click.

Button should be **disabled** with helper text before a design exists, not triggering a post-click error.

**Recommendation:** Disable button → show "Generate a design first" on hover. Only show error if user bypasses disabled state.

---

### 9. Success Page — Missing Timeline
**Severity: HIGH**
**File:** `components/OrderSuccess.tsx`

"Expect a digital update as it takes physical form." — vague about when.

**Recommendation:** "We'll send tracking details within 48 hours, and your gift will ship by [date]." Add a "Track your order" CTA once backend supports it.

---

### 10. Payment Messages
**Severity: MEDIUM**
**File:** `app/success/page.tsx`

- Success: "Payment received" is ambiguous (processing vs confirmed?) → "Payment confirmed ✓ Your order is secure."
- Failure: "Payment issue detected" has no actionable next step → "Payment declined. Please try again or contact support@keepsy.store."
- Hide technical session IDs from users — only show order ref.

---

### 11. Upsell/Add-ons Copy
**Severity: MEDIUM**
**File:** `components/UpsellDrawer.tsx`

- "Saved as Add-ons (coming next)" — looks broken even if it works → remove "coming next" or be explicit: "Feature arriving next week"
- "+ small extra" pricing is vague → be specific: "+ £2.50"
- "Priority print handling" needs definition → "Priority handling (expedited quality check, ships 1 day sooner)"

---

### 12. FAQ — Coverage Gaps
**Severity: LOW**
**File:** `components/FAQ.tsx`

Current FAQs: speed (10 mins), shipping (2-4 days), refunds. Missing user anxieties:
- "What if my photo is blurry?"
- "Can I change my design after ordering?"
- "What sizes/colours are available?"
- "How much is shipping?"

**Recommendation:** Add 4 more FAQs covering the above.

---

### 13. Checkout Trust Copy
**Severity: LOW**
**File:** `components/CheckoutSummaryEnhancer.tsx`

- Shipping FAQ: "Vary by location and season" → too vague; add ballpark: "typically 2-5 business days UK"
- Refund FAQ: "We will review" is passive → "Something wrong? We'll fix it or refund you."
- Add: "Payment methods: card, Apple Pay, Google Pay — never stored on our servers."

---

### 14. "Premium" Overuse
**Severity: LOW**

"Premium" appears in headline, subheadline, and trust points — risks losing impact.

**Recommendation:** Alternate with "polished," "refined," "craft-grade," "gift-worthy."

---

### 15. Legal Pages
**Severity: MEDIUM**

- Terms: "Neural engine," "bespoke nature of generative printing" — poetic but could confuse
- Privacy: "Delete My Data control" — doesn't tell users where to find it; add direct link
- Refunds: "Within 14 days" — calendar or business days? Specify.

---

## Priority Recommendations

| # | Action | Impact | Effort |
|---|---|---|---|
| 1 | Error message taxonomy | HIGH | Medium |
| 2 | Disable cart button until design exists | HIGH | Low |
| 3 | Specify timeline on success page | HIGH | Low |
| 4 | Payment failure — add next step action | HIGH | Low |
| 5 | Expand FAQ to 8+ entries | MEDIUM | Low |
| 6 | Fix "Relationship" form label | MEDIUM | Low |
| 7 | Remove/clarify "coming next" in upsell | MEDIUM | Low |
| 8 | Strengthen headline with preview differentiation | MEDIUM | Low |
| 9 | Regionalise "faff" tagline | LOW | Low |
| 10 | Reduce "premium" repetition | LOW | Low |
