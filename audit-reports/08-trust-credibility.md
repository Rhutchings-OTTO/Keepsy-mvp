# Trust, Credibility & Social Proof Audit — Keepsy
**Date:** 2026-03-06 | **Branch:** main (81c4151) | **Trust Confidence Score: 4/10**

---

## Executive Summary

Keepsy has foundational trust signals but is **critically underdeveloped** in several high-impact areas. The site demonstrates emerging credibility (testimonials, security mention, clear policies) but lacks third-party validation, team visibility, comprehensive social proof, and explicit satisfaction guarantees that would substantially accelerate conversion and reduce buyer hesitation.

**Key Gaps:**
- No team/founders visibility — unknown who operates this business
- Vague "2,400+ customers" stat with no verification mechanism
- No press mentions or influencer validation
- No social media presence or links
- Minimal data security narrative despite handling personal photos
- No money-back guarantee or satisfaction promise
- No visible founder story or company mission

**Estimated conversion lift if all critical gaps fixed: +40–70%**

---

## Findings

### 1. Testimonials & Customer Reviews
**Status: EMERGING | Severity: MEDIUM**

**What's present:**
- 3 attributed reviews (Helen 54, Rachel 47, Emma 51) with specific, outcome-driven quotes ✓
- Authentic-sounding, product-specific language ✓
- Positioned prominently with clear visual hierarchy ✓

**Gaps:**
- Only 3 reviews — too few for a new brand establishing trust
- No third-party verification (Trustpilot, Google Reviews)
- No photos of reviewers — easily dismissed as fabricated
- No star ratings
- ASA risk: unverified testimonials can trigger enforcement

**Fix:**
1. Get real customers to submit verified reviews via Trustpilot
2. Add Trustpilot widget to landing page showing aggregate score
3. Expand to 6+ reviews across different products and occasions
4. Add reviewer photos (with consent)

---

### 2. No Satisfaction Guarantee
**Severity: CRITICAL**

No money-back guarantee, satisfaction promise, or "we'll fix it" pledge exists anywhere on the site. Gift buyers are spending £8–£40 on a product they can't return if unhappy with AI output quality.

**Fix:** Add prominent guarantee above the fold and at checkout:
> "Love it or we'll reprint it — guaranteed."

This single addition can increase conversion by 15–30% for first-time buyers.

---

### 3. No Team / Founder Visibility
**Severity: HIGH**

Nobody knows who runs Keepsy. No About page, no founder name, no LinkedIn link, no "made in [city]" signal. Purchasing a personalised gift requires significant trust — anonymous brands lose conversions.

**Fix:** Add an About section or page with:
- Founder name and photo (even 2–3 sentences)
- "Made in the UK" signal
- A brief mission statement ("We believe personalised gifts should be beautiful and effortless")

---

### 4. "2,400+ Customers" — Unverified
**Severity: HIGH**
**File:** `app/LandingPage.tsx` (TrustBar component)

The social proof stat appears with no context — no timeframe, no product breakdown, no way to verify. Savvy shoppers dismiss stats without proof.

**Fix:**
- Either remove it until you can verify it
- Or add context: "2,400+ gifts delivered since January 2026"
- Or replace with a verifiable metric (e.g. Trustpilot total review count)

---

### 5. No Security/Privacy Narrative for Photo Uploads
**Severity: CRITICAL**

Keepsy asks users to upload personal photos — potentially family photos, images of people, cherished memories. There is no visible statement about what happens to uploaded images: are they stored? Deleted after use? Shared with OpenAI?

This is the single highest-anxiety point in the user journey and it's unaddressed.

**Fix:** Add immediately below the photo upload input:
> "Your photo is used only to generate your design. It's never stored on our servers or shared with anyone. Deleted instantly after processing."

And add a trust shield icon with "Photos never stored" in the TrustBar.

---

### 6. No Social Media Presence
**Severity: MEDIUM**

No social links in footer, no Instagram/TikTok presence. Competitors in the personalised gift space (Moonpig, Personalised Memento Co.) use social heavily for UGC and brand trust.

**Fix:**
- Create Instagram account (primary channel for gift-inspiration content)
- Add social links to footer
- Add "Share your creation" CTA post-purchase to seed UGC

---

### 7. No Press / Media Mentions
**Severity: MEDIUM**

No "As seen in" bar, no press logos, no product hunt launch. For a new brand, even a single credible media mention dramatically increases trust.

**Fix:** Launch on Product Hunt. Reach out to gift-guide journalists. Even "Featured in Product Hunt #2 of the day" has measurable conversion impact.

---

### 8. Payment Security Messaging — Good ✓

- Stripe logo / "Secure checkout" mentioned ✓
- No card data stored on Keepsy servers ✓
- SSL/HTTPS active ✓

---

### 9. Legal Pages Exist — Good ✓

- `/privacy`, `/terms`, `/shipping`, `/refunds` all exist and are linked in footer ✓
- This alone puts Keepsy ahead of many small e-commerce competitors

---

### 10. "Delete My Data" Feature — Hidden Strength
**Severity: LOW**

A "Delete My Data" function exists in the platform — this is rare for an MVP and a genuine trust differentiator. It's currently buried in the platform UI.

**Fix:** Surface this in the privacy policy with a direct link and add a small "Privacy-first" badge to the landing page.

---

## Priority Fix Order

| # | Issue | Impact | Effort |
|---|---|---|---|
| 1 | Add satisfaction/reprint guarantee | CRITICAL | Low |
| 2 | Photo privacy statement at upload point | CRITICAL | Low |
| 3 | Expand testimonials + Trustpilot widget | HIGH | Medium |
| 4 | Add founder/team visibility | HIGH | Low |
| 5 | Verify or contextualise "2,400+" stat | HIGH | Low |
| 6 | Launch on Product Hunt for press signal | MEDIUM | Medium |
| 7 | Create Instagram + add social links | MEDIUM | Medium |
| 8 | Surface "Delete My Data" as trust feature | LOW | Low |
