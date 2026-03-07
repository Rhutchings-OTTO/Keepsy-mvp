# Keepsy — Prioritised Action Plan
**Date:** 2026-03-06 | **Derived from:** 8-domain comprehensive audit

Actions are ordered by: (1) blocking launch, (2) legal risk, (3) conversion impact, (4) effort.

---

## Phase 1: Must Fix Before Taking Any Payments (~2 weeks)

| # | Action | File(s) | Effort | Source |
|---|---|---|---|---|
| P1.1 | Implement Printify order fulfillment in Stripe webhook | `lib/inngest/functions/stripe-webhook.ts` | High | Journey-05 |
| P1.2 | Deploy cookie consent banner (Cookiebot/OneTrust) | New component | Medium | Legal-11 |
| P1.3 | Add business registration details to footer | `components/SiteFooter.tsx` | Low | Legal-11 |
| P1.4 | Rewrite Privacy Policy (disclose all processors) | `app/privacy/page.tsx` | High | Legal-11 |
| P1.5 | Rewrite Terms of Service (add 14-day cancellation) | `app/terms/page.tsx` | High | Legal-11 |
| P1.6 | Rewrite Refund Policy (explicit statutory rights) | `app/refunds/page.tsx` | Medium | Legal-11 |
| P1.7 | Replace `alert()` with toast/modal error UI | `app/MerchGeneratorPlatform.tsx:776,802,830,834` | Low | Journey-05 |
| P1.8 | Hide or implement account page | `app/account/page.tsx` | Low | Journey-05 |
| P1.9 | Validate product IDs in checkout route | `app/api/create-checkout-session/route.ts` | Low | Journey-05 |
| P1.10 | Disable "Add to Cart" button until design exists | `app/MerchGeneratorPlatform.tsx:683` | Low | Copy-01, Journey-05 |

---

## Phase 2: Before Beta (weeks 3–4)

| # | Action | File(s) | Effort | Source |
|---|---|---|---|---|
| P2.1 | Execute DPAs with Stripe, OpenAI, Supabase, Cloudinary | Legal/admin | High | Legal-11 |
| P2.2 | Add satisfaction/reprint guarantee to site | `app/LandingPage.tsx`, checkout | Low | Trust-08 |
| P2.3 | Add photo privacy statement at upload input | `components/create/CreatePageLayoutLean.tsx` | Low | Trust-08 |
| P2.4 | Add viewport meta export | `app/layout.tsx` | Low | Mobile-09 |
| P2.5 | Fix footer text contrast (raise `/58` → `/70`) | `components/SiteFooter.tsx:22` | Low | Design-02 |
| P2.6 | Add sitemap.ts | `app/sitemap.ts` | Low | SEO-07 |
| P2.7 | Add robots.txt | `public/robots.txt` | Low | SEO-07 |
| P2.8 | Add metadata to 7 pages missing it | Multiple page files | Medium | SEO-07 |
| P2.9 | Fix 11 empty `alt=""` attributes | Multiple components | Low | SEO-07 |
| P2.10 | Implement `/api/get-my-data` endpoint (GDPR right of access) | New API route | Medium | Legal-11 |
| P2.11 | Add Suspense fallbacks to all dynamic imports | `app/LandingPage.tsx`, `app/MerchGeneratorPlatform.tsx` | Low | Perf-04 |
| P2.12 | Add `prefers-reduced-motion` check to MeshGradient | `components/MeshGradientBackground.tsx` | Low | Perf-04 |
| P2.13 | Add generation progress indicator + cancel button | Generation flow | Medium | Journey-05 |
| P2.14 | Show order details on success page (from Supabase) | `components/OrderSuccess.tsx` | Medium | Journey-05, Copy-01 |
| P2.15 | Add VAT transparency to pricing | Product pages + checkout | Low | Legal-11 |

---

## Phase 3: Before Commercial Launch (weeks 5–8)

| # | Action | File(s) | Effort | Source |
|---|---|---|---|---|
| P3.1 | Expand testimonials to 6+ with Trustpilot integration | `app/LandingPage.tsx` | Medium | Trust-08, Copy-01 |
| P3.2 | Add founder/team visibility (About section) | `app/LandingPage.tsx` or `/about` | Low | Trust-08 |
| P3.3 | Add ISR to landing + product pages | `app/page.tsx`, product pages | Low | Perf-04 |
| P3.4 | Dynamically import Iridescence.tsx | `components/Iridescence.tsx` | Low | Perf-04 |
| P3.5 | Improve root title with keywords | `app/layout.tsx` | Low | SEO-07 |
| P3.6 | Add Organization JSON-LD schema | `app/layout.tsx` | Low | SEO-07 |
| P3.7 | Add Product JSON-LD to product pages | `app/product/[type]/page.tsx` | Medium | SEO-07 |
| P3.8 | Fix touch target sizes (nav 40→44px, carousel dots) | `SiteHeader.tsx`, `Carousel.tsx` | Low | Mobile-09 |
| P3.9 | Add safe area insets for fixed elements | `globals.css`, `BottomSheetNav.tsx` | Low | Mobile-09 |
| P3.10 | Fix `px-1` → `px-4` on create page | `components/create/CreatePageLayoutLean.tsx:144` | Low | Mobile-09 |
| P3.11 | Add input types/inputMode to form inputs | `components/create/CreatePageLayoutLean.tsx` | Low | Mobile-09 |
| P3.12 | Add Product Hunt launch | External | Medium | Trust-08 |
| P3.13 | Fix "Relationship" label → "Who is this for?" | `components/GiftingStep.tsx` | Low | Copy-01 |
| P3.14 | Remove/fix "coming next" in UpsellDrawer | `components/UpsellDrawer.tsx` | Low | Copy-01, Journey-05 |
| P3.15 | Add 4+ FAQ entries (blurry photo, sizing, shipping cost) | `components/FAQ.tsx` | Low | Copy-01 |
| P3.16 | Add H1 to create page (off-screen if needed) | `app/create/page.tsx` | Low | SEO-07 |
| P3.17 | Add cache headers for generation cache hits | `app/api/generate-image/route.ts:97,146,177` | Low | Perf-04 |
| P3.18 | Migrate rate limiter to Supabase `daily_usage` | `app/api/generate-image/guardrails.ts` | Medium | Legal-11 |
| P3.19 | Accessibility statement page | `app/accessibility/page.tsx` | Low | Legal-11 |
| P3.20 | Publish breach response plan | Internal doc | Low | Legal-11 |

---

## Phase 4: Post-Launch Optimisation

| # | Action | Source |
|---|---|---|
| P4.1 | API streaming for generation progress (SSE) | Perf-04 |
| P4.2 | Remove Three.js from critical path | Perf-04 |
| P4.3 | Image malware scanning on upload | Legal-11 |
| P4.4 | Auto-save draft designs to localStorage | Journey-05 |
| P4.5 | Pass gift idea context to create page (URL params) | Journey-05 |
| P4.6 | Add GDPR portability, rectification, restriction endpoints | Legal-11 |
| P4.7 | Consider replacing GSAP with Framer Motion exclusively | Perf-04 |
| P4.8 | Define explicit type scale in tailwind.config.ts | Design-02 |
| P4.9 | Payment failure copy — add actionable next step | Copy-01 |
| P4.10 | Create Instagram + social media strategy | Trust-08 |

---

## Quick Wins (< 30 min each, high impact)

These can be done today:

1. Add `robots.txt` to `public/` (5 min)
2. Add `sitemap.ts` to `app/` (15 min)
3. Add viewport meta export to `app/layout.tsx` (5 min)
4. Raise footer text opacity `/58` → `/70` (5 min)
5. Add `prefers-reduced-motion` check in MeshGradient (15 min)
6. Add Suspense loading fallbacks to dynamic imports (20 min)
7. Fix empty `alt=""` on 11 images (30 min)
8. Improve root `<title>` with keywords (5 min)
9. Add `px-4` to CreatePage container (5 min)
10. Add UpsellDrawer `max-h-[80vh] overflow-y-auto` (5 min)
