# Keepsy MVP — Master Audit Summary
**Compiled:** 2026-03-08
**Source reports:** 01-QA · 02-UX · 03-Copy · 04-Design · 05-Mobile · 06-SEO · 07-Accessibility · 08-Security · 09-Performance · 10-CRO · 11-Pricing · 12-Behavioural-Pricing · 14-Legal · 15-Edge-Cases

---

## Overall Assessment

The codebase is functionally complete and structurally sound. The core generate→preview→pay loop works end-to-end and is genuinely differentiated. However, there are critical security vulnerabilities, legal compliance gaps, and a broken checkout path (CartDrawer button navigates to `/create` instead of Stripe) that must be fixed before scaling traffic.

---

## ALL FINDINGS — Sorted by Priority

### CRITICAL

| ID | Source | Finding | File(s) |
|----|--------|---------|---------|
| C-01 | Security | Admin route `/api/admin/mockup-placement` grants access when `MOCKUP_CALIBRATION_KEY` is unset — arbitrary file write | `app/api/admin/mockup-placement/route.ts` |
| C-02 | Security | Printify webhook silently skips signature verification when `PRINTIFY_WEBHOOK_SECRET` is not set — any POST accepted | `app/api/webhooks/printify/route.ts` |
| C-03 | Security | Unauthenticated order status endpoint leaks PII by Stripe session ID | `app/api/orders/status/route.ts` |
| C-04 | Security | No RLS policies on any Supabase table — anon key could expose all orders | Supabase migrations |
| C-05 | Edge Cases | Stripe webhook silently skips when Supabase is unavailable — orders lost | `app/api/stripe/webhook/route.ts` |
| C-06 | Edge Cases | `design_url` can exceed Stripe's 500-char metadata limit, silently breaking checkout | `app/api/create-checkout-session/route.ts` |
| C-07 | Legal | Privacy Policy missing 80% of required UK GDPR disclosures | `app/privacy/page.tsx` |
| C-08 | Legal | Terms of Service is brand copy — missing all mandatory consumer-law provisions | `app/terms/page.tsx` |
| C-09 | Legal | Refund Policy does not state the 14-day statutory right to cancel | `app/refunds/page.tsx` |
| C-10 | Legal | No cookie consent banner (PECR violation — cookies set without notice) | `components/SiteChrome.tsx` |
| C-11 | Legal | No Cookie Policy page | Missing file |
| C-12 | Legal | No business registration details (Companies Act / E-Commerce Regs) | Footer |
| C-13 | CRO | Cart drawer "Checkout" button navigates to `/create` instead of Stripe — checkout broken | `components/CartDrawer.tsx` |
| C-14 | Copy | Terms of Service body is fictional marketing copy with legally dubious material claims | `app/terms/page.tsx` |
| C-15 | SEO | No `sitemap.xml` — Google cannot reliably discover all pages | Missing |
| C-16 | SEO | No `robots.txt` — internal/dev routes are crawlable | Missing |
| C-17 | SEO | `/create` page has no metadata — highest-conversion page invisible to search | `app/create/page.tsx` |
| C-18 | SEO | `/product/[type]` pages have no metadata — transactional keywords uncovered | `app/product/[type]/page.tsx` |
| C-19 | Accessibility | No skip-to-content link (WCAG 2.4.1) | `components/SiteChrome.tsx` |
| C-20 | Accessibility | `--ink-muted` (3.8:1) and `--ink-faint` (2.2:1) fail WCAG AA contrast | `app/globals.css` |
| C-21 | Accessibility | Mobile menu overlay has no focus trap (WCAG 2.1.2) | `components/SiteHeader.tsx` |

---

### HIGH

| ID | Source | Finding | File(s) |
|----|--------|---------|---------|
| H-01 | Security | Customer email logged in plaintext in Stripe webhook handler | `app/api/stripe/webhook/route.ts` |
| H-02 | Security | Rate-limit key is client-controlled (`x-visitor-id` header) | `lib/security/rateLimit.ts` |
| H-03 | Edge Cases | Double-click checkout creates two Stripe sessions — user could pay twice | `app/MerchGeneratorPlatform.tsx` |
| H-04 | Edge Cases | No webhook reconciliation — if Stripe webhook never fires, order is permanently lost | Missing cron/reconciliation |
| H-05 | CRO | Fake purchase toasts and hardcoded social proof (consumer protection risk) | `app/shop/CatalogClient.tsx` |
| H-06 | CRO | No delivery time estimates anywhere in purchase flow | Multiple |
| H-07 | CRO | "30-Day Returns" trust badge conflicts with 14-day policy (legally misleading) | `app/LandingPage.tsx`, `app/about/AboutClient.tsx` |
| H-08 | SEO | Root canonical set to "/" only — all sub-pages inherit homepage canonical | `app/layout.tsx` |
| H-09 | SEO | 7 page titles double-append "— Keepsy" due to template conflict | Multiple `page.tsx` |
| H-10 | SEO | No JSON-LD structured data anywhere on the site | Missing |
| H-11 | SEO | 11 images with empty `alt=""` attributes | Multiple components |
| H-12 | SEO | `/create` page has no H1 | `app/create/page.tsx` |
| H-13 | Design | `BottomSheetNav` overlaps page content — no bottom padding on `<main>` | `components/SiteChrome.tsx` |
| H-14 | Design | `MerchGeneratorPlatform` headings use `font-black` — breaks typographic system | `app/MerchGeneratorPlatform.tsx` |
| H-15 | Mobile | Announcement bar dismiss button is 20×20 px (WCAG minimum 44×44 px) | `components/SiteHeader.tsx` |
| H-16 | Mobile | Main prompt textarea missing explicit `font-size: 16px` — triggers iOS zoom | `components/create/CreatePageLayoutLean.tsx` |
| H-17 | Mobile | `PremiumGateway` Three.js cloud scene runs on entry — blocks mid-range Android | `components/PremiumGateway.tsx` |
| H-18 | Mobile | Shop filter bar causes horizontal overflow at 375 px | `app/shop/CatalogClient.tsx` |
| H-19 | Mobile | Step 3 `DesignVaultSidebar` breaks layout at 375 px | `app/MerchGeneratorPlatform.tsx` |
| H-20 | Accessibility | `text-charcoal/55` and lower fail WCAG AA contrast on white backgrounds | Multiple |
| H-21 | Accessibility | Marquee `text-white/85` on terracotta fails WCAG AA contrast | `app/LandingPage.tsx` |
| H-22 | Accessibility | Email input on landing page has no accessible label | `app/LandingPage.tsx` |
| H-23 | Accessibility | Sort dropdown in shop has no accessible label | `app/shop/CatalogClient.tsx` |
| H-24 | Accessibility | Checkout error messages not announced to screen readers | `app/MerchGeneratorPlatform.tsx` |
| H-25 | Accessibility | Checkout "Securing" overlay has no `role="status"` | `app/MerchGeneratorPlatform.tsx` |
| H-26 | Accessibility | `GiftAssistantWidget` missing ARIA roles and labels | `components/GiftAssistantWidget.tsx` |
| H-27 | Copy | Footer shows "Made with love in the USA" — factually wrong for a UK/US brand | `components/SiteFooter.tsx` |
| H-28 | Copy | "🇺🇸 Made & Shipped with Love" in marquee — US-only framing | `app/LandingPage.tsx` |
| H-29 | Copy | `CartDrawer.tsx` checkout button has `// TODO: wire up Stripe checkout` — dev note visible | `components/CartDrawer.tsx` |
| H-30 | Copy | `UpsellDrawer` shows "Saved as Add-ons (coming next)" — internal note visible to users | `components/UpsellDrawer.tsx` |
| H-31 | Copy | Review counts hardcoded as "(100+)" — ignores actual review data | `app/shop/CatalogClient.tsx` |
| H-32 | Copy | Error page has duplicate "Something went wrong" in eyebrow and H1 | `app/error.tsx` |
| H-33 | Performance | `MockupStage` fires uncached API call on every mount (`cache: "no-store"`) | `components/mockups/MockupStage.tsx` |
| H-34 | Performance | `quality={100}` on mockup base layer — 2–4× larger image than needed | `components/mockups/BaseMockupLayer.tsx` |
| H-35 | Performance | Homepage forced into full CSR — no server-rendered content above fold | `app/LandingPage.tsx` |
| H-36 | Legal | Email marketing signup has no consent language or privacy link | Footer / LandingPage |
| H-37 | Legal | `"30-Day Returns"` badge vs 14-day policy — inconsistency | `app/LandingPage.tsx` |
| H-38 | Pricing | Price discrepancy: shop displays £54.99 hoodie but checkout charges £40 | Multiple files |
| H-39 | UX | Currency hardcoded to GBP in checkout — US customers charged in GBP | `app/api/create-checkout-session/route.ts` |
| H-40 | UX | Email capture form not wired to any backend | `app/LandingPage.tsx` |
| H-41 | UX | Success page webhook timing race — `OrderSuccess` may not render | `app/success/page.tsx` |

---

### MEDIUM

| ID | Source | Finding | File(s) |
|----|--------|---------|---------|
| M-01 | Security | CSP uses `unsafe-inline` and `unsafe-eval` | `middleware.ts` |
| M-02 | Security | Middleware has no matcher — runs on webhook routes unnecessarily | `middleware.ts` |
| M-03 | Security | Supabase service-role client has no guard against client-side import | `lib/supabaseAdmin.ts` |
| M-04 | Security | Printify signature comparison not constant-time | `app/api/webhooks/printify/route.ts` |
| M-05 | Security | Health endpoint reveals configuration state publicly | `app/api/health/route.ts` |
| M-06 | Edge Cases | Orphaned pending order records when Stripe session creation fails | `app/api/create-checkout-session/route.ts` |
| M-07 | Edge Cases | Printify webhook `order:shipment:created` TOCTOU — duplicate emails possible | `app/api/webhooks/printify/route.ts` |
| M-08 | Edge Cases | Email failures are silent — no retry or founder notification | `lib/emails/orderEmails.tsx` |
| M-09 | Edge Cases | Cloudinary upload has no explicit timeout | `lib/uploadImage.ts` |
| M-10 | Edge Cases | Unknown `productId` silently falls back to "card" in Printify | `lib/printify-blueprints.ts` |
| M-11 | Edge Cases | `splitName` duplicates single-word names (e.g. "Madonna Madonna") | `lib/printify.ts` |
| M-12 | CRO | No abandoned cart recovery mechanism | — |
| M-13 | CRO | Shipping cost "Calculated at checkout" creates uncertainty | Multiple |
| M-14 | CRO | Trust badges too small/faint in cart drawer | `components/CartDrawer.tsx` |
| M-15 | CRO | No "No account required" messaging near checkout | Multiple |
| M-16 | CRO | Hardcoded fictional purchase toasts (dark pattern / consumer protection risk) | `app/shop/CatalogClient.tsx` |
| M-17 | SEO | No `generateStaticParams` on product pages — dynamic render instead of CDN | `app/product/[type]/page.tsx` |
| M-18 | SEO | Root OG title is just "Keepsy" — no keywords | `app/layout.tsx` |
| M-19 | SEO | Meta descriptions under-optimised on key pages | Multiple |
| M-20 | Design | Cart drawer shadow uses Unicode minus sign (U+2212) — Tailwind JIT silent bug | `components/CartDrawer.tsx` |
| M-21 | Design | About page two CTAs look identical — no visual hierarchy | `app/about/AboutClient.tsx` |
| M-22 | Design | Footer links have no colour change or keyboard focus state on hover | `components/SiteFooter.tsx` |
| M-23 | Design | Social icon hover uses JS DOM mutation instead of CSS | `components/SiteFooter.tsx` |
| M-24 | Design | `charcoal/35–40` text fails WCAG AA contrast at small sizes | Multiple |
| M-25 | Mobile | `GiftAssistantWidget` hidden behind BottomSheetNav (`bottom-4`) | `components/GiftAssistantWidget.tsx` |
| M-26 | Mobile | `PurchaseToast` hidden behind BottomSheetNav at `bottom-6` | `app/shop/CatalogClient.tsx` |
| M-27 | Mobile | Cart drawer quantity buttons — 28 px touch targets | `components/CartDrawer.tsx` |
| M-28 | Mobile | `GiftingStep` form inputs trigger iOS zoom (`text-sm`) | `components/GiftingStep.tsx` |
| M-29 | Mobile | Hero `min-h-[90vh]` pushes CTAs below fold on small phones | `app/LandingPage.tsx` |
| M-30 | Accessibility | Carousel dot navigation missing `aria-current` | `components/ui/Carousel.tsx` |
| M-31 | Accessibility | Refinement loading spinner not announced to screen readers | `components/generation/DesignConfirmation.tsx` |
| M-32 | Accessibility | Product selector buttons in MerchGeneratorPlatform missing `aria-pressed` | `app/MerchGeneratorPlatform.tsx` |
| M-33 | Accessibility | Mobile menu overlay lacks `role="dialog"` / `aria-modal` | `components/SiteHeader.tsx` |
| M-34 | Accessibility | Marquee animation has no `prefers-reduced-motion` override | `app/LandingPage.tsx` |
| M-35 | Copy | "Join women who love thoughtful gifting" — gendering excludes male/NB buyers | Footer, LandingPage |
| M-36 | Copy | Email address inconsistency across site (3 addresses, 2 domains) | Multiple pages |
| M-37 | Copy | Delivery estimate inconsistency (5–10 vs 5–7 vs 2–6 days) | Multiple pages |
| M-38 | Copy | GenerativeLoader loading microcopy is pseudo-technical jargon | `components/GenerativeLoader.tsx` |
| M-39 | Copy | "0 Waste" stat on About page is greenwashing-adjacent | `app/about/AboutClient.tsx` |
| M-40 | Copy | RegionSelector heading "View your local Keepsy experience" is vague | `components/RegionSelector.tsx` |
| M-41 | Copy | Community page metadata title is generic | `app/community/page.tsx` |
| M-42 | Performance | Stripe client re-instantiated on every checkout request | 3 API route files |
| M-43 | Performance | Sequential Supabase queries on success page (N+1) | `app/success/page.tsx` |
| M-44 | Performance | `MeshGradientBackground` WebGL shader runs on all pages continuously | `components/SiteChrome.tsx` |
| M-45 | Legal | International data transfer (OpenAI → US) not disclosed in Privacy Policy | `app/privacy/page.tsx` |
| M-46 | Legal | GDPR data subject rights (access, rectification, portability) not implemented | — |
| M-47 | Legal | Testimonials unverified (consumer protection risk) | Multiple |
| M-48 | Legal | Footer says "Fulfilled by Printful" — code uses Printify | `components/SiteFooter.tsx` |
| M-49 | Pricing | Landing page shows "From $4" for cards but minimum actual price is £8.99 | `app/LandingPage.tsx` |
| M-50 | QA | Account page is a placeholder with no real functionality | `app/account/page.tsx` |

---

### LOW

| ID | Source | Finding | File(s) |
|----|--------|---------|---------|
| L-01 | Security | In-memory rate limiter state resets on serverless cold-start | `lib/security/rateLimit.ts` |
| L-02 | Security | Health endpoint reveals config state without authentication | `app/api/health/route.ts` |
| L-03 | QA | Duplicate Stripe webhook routes (`/api/webhooks/stripe` and `/api/stripe/webhook`) | Both route files |
| L-04 | QA | Legacy API routes `app/api/generate` and `app/api/checkout` still exist | Both route files |
| L-05 | Design | Zombie `Hero.tsx` component — unused, dead code | `components/Hero.tsx` |
| L-06 | Design | Legacy `ivory`/`obsidian` colour tokens still used in 2 components | `components/TextureLoupe.tsx`, `components/RealisticHoodie.tsx` |
| L-07 | Design | `text-gold` Tailwind class bypasses CSS variable / Atelier Mode | Multiple |
| L-08 | Design | About page `inline-flex` + `inline-block` duplicate classes | `app/about/AboutClient.tsx` |
| L-09 | Performance | `gsap` dependency in `package.json` — zero usage found in codebase | `package.json` |
| L-10 | Performance | `ogl` library not dynamically imported — included in main bundle | `components/Iridescence.tsx` |
| L-11 | Performance | `product/[type]` pages missing `generateStaticParams` | `app/product/[type]/page.tsx` |
| L-12 | Mobile | Aurora blob animations have no `prefers-reduced-motion` | `app/globals.css` |
| L-13 | Mobile | Page-level Framer Motion components don't check `useReducedMotion` | Multiple |
| L-14 | Accessibility | `PromptHelperCollapsible` toggle missing `aria-controls` | `components/create/PromptHelperCollapsible.tsx` |
| L-15 | Accessibility | Nav focus ring uses `ring-black/20` — insufficient contrast | `components/SiteHeader.tsx` |
| L-16 | Accessibility | `SizeGuideDrawer` tab buttons missing `aria-controls` / `tabpanel` | `components/products/SizeGuideDrawer.tsx` |
| L-17 | Copy | Emoji in email capture success message inconsistent with premium brand | Footer, LandingPage |
| L-18 | Copy | "⚡" emoji in announcement bar | `components/SiteHeader.tsx` |
| L-19 | Copy | "Back to prompt" is AI jargon — customers don't think in prompts | `components/generation/DesignConfirmation.tsx` |
| L-20 | Copy | "Guided prompt builder" label is internal jargon | `components/GuidedPromptPanel.tsx` |
| L-21 | Copy | Only 3 FAQs — very thin; one is factually inaccurate | `components/FAQ.tsx` |
| L-22 | Copy | Confirmation email "calibrating pigment density" — overly technical | `lib/emails/orderEmails.tsx` |
| L-23 | SEO | Internal tool pages (`/debug`, `/perf`) have no `noindex` tag | Those pages |

---

## Grouped / Repeated Findings

These issues were flagged by multiple agents independently, confirming their importance:

| Issue | Flagged By |
|-------|-----------|
| Cart drawer checkout button broken (`→ /create`) | CRO (P0), UX, Behavioural-Pricing, Copy |
| Fake purchase toasts / fabricated social proof | CRO, UX, Legal |
| Currency hardcoded to GBP (US users charged in GBP) | UX, Behavioural-Pricing, Legal |
| Delivery time estimates missing from purchase flow | CRO, UX |
| "30-Day Returns" badge vs 14-day policy | CRO, Legal |
| `BottomSheetNav` overlapping content | Design, Mobile |
| Product page metadata missing | SEO, Performance |
| `generateStaticParams` missing on product pages | SEO, Performance |
| Email address inconsistency (3 emails, 2 domains) | Copy, Legal |
| Printify webhook no secret = accepts all requests | Security, Edge Cases |
| Review counts hardcoded as "(100+)" | Copy, CRO, UX |
| Admin auth bypass when key unset | Security, Edge Cases |

---

## Action Plan

---

### PHASE 1 — Fix Now (Critical & High Priority, Quick to Implement)

These are either critical security/legal issues with a quick code fix, or high-CRO blockers with <1h of engineering work each.

| # | Fix | File(s) | Effort | Notes |
|---|-----|---------|--------|-------|
| 1.1 | Fix admin route auth bypass (return 403 when key unset) | `app/api/admin/mockup-placement/route.ts` | Quick Fix | 1-line change |
| 1.2 | Fix Printify webhook: hard-fail in production when secret unset | `app/api/webhooks/printify/route.ts` | Quick Fix | ~5 lines |
| 1.3 | Truncate `design_url` to 490 chars before Stripe metadata | `app/api/create-checkout-session/route.ts` | Quick Fix | 1-line change |
| 1.4 | Add `supabaseAdmin` client-side import guard | `lib/supabaseAdmin.ts` | Quick Fix | 3 lines |
| 1.5 | Mask customer email in production logs | `app/api/stripe/webhook/route.ts` | Quick Fix | ~5 lines |
| 1.6 | Create `app/sitemap.ts` | `app/sitemap.ts` (new) | Quick Fix | ~25 lines |
| 1.7 | Create `app/robots.ts` | `app/robots.ts` (new) | Quick Fix | ~20 lines |
| 1.8 | Add metadata + H1 to `/create` page | `app/create/page.tsx` | Quick Fix | ~15 lines |
| 1.9 | Add `generateMetadata` + `generateStaticParams` to product pages | `app/product/[type]/page.tsx` | Quick Fix | ~40 lines |
| 1.10 | Fix 7 broken page titles (remove `| Keepsy` suffix from template pages) | 7 `page.tsx` files | Quick Fix | 7 one-line changes |
| 1.11 | Fix per-page canonical URLs on existing metadata pages | 7+ `page.tsx` files | Quick Fix | ~7 changes |
| 1.12 | Add skip-to-content link (WCAG 2.4.1) | `components/SiteChrome.tsx` | Quick Fix | ~10 lines |
| 1.13 | Fix announcement bar dismiss button touch target (p-2.5) | `components/SiteHeader.tsx` | Quick Fix | 1-line change |
| 1.14 | Fix `quality={100}` on mockup base layer → `quality={85}` | `components/mockups/BaseMockupLayer.tsx` | Quick Fix | 1-line change |
| 1.15 | Add `Cache-Control` header to `/api/mockup-placements` | `app/api/mockup-placements/route.ts` | Quick Fix | ~3 lines |
| 1.16 | Remove `cache: "no-store"` from `MockupStage` fetch | `components/mockups/MockupStage.tsx` | Quick Fix | 1-line change |
| 1.17 | Add `aria-label` to sort `<select>` in shop | `app/shop/CatalogClient.tsx` | Quick Fix | 1 attribute |
| 1.18 | Add `aria-label` / `<label>` to landing page email input | `app/LandingPage.tsx` | Quick Fix | ~3 lines |
| 1.19 | Fix error page duplicate "Something went wrong" eyebrow | `app/error.tsx` | Quick Fix | 1-line change |
| 1.20 | Fix footer "Made with love in the USA" copy | `components/SiteFooter.tsx` | Quick Fix | 1-line change |
| 1.21 | Fix "🇺🇸 Made & Shipped with Love" in marquee | `app/LandingPage.tsx` | Quick Fix | 1-line change |
| 1.22 | Fix marquee text contrast (`text-white/85` → `text-white`) | `app/LandingPage.tsx` | Quick Fix | 1-line change |
| 1.23 | Add `prefers-reduced-motion` to marquee animation | `app/LandingPage.tsx` | Quick Fix | ~3 lines |
| 1.24 | Add `role="alert"` to checkout error message | `app/MerchGeneratorPlatform.tsx` | Quick Fix | 1 attribute |
| 1.25 | Add `role="status"` to "Securing" checkout overlay | `app/MerchGeneratorPlatform.tsx` | Quick Fix | 1 attribute |
| 1.26 | Fix cart drawer Unicode minus in shadow class | `components/CartDrawer.tsx` | Quick Fix | 1-char fix |
| 1.27 | Add `aria-current` to Carousel dot navigation | `components/ui/Carousel.tsx` | Quick Fix | 1 attribute |
| 1.28 | Fix footer "Fulfilled by Printful" → "Printify" | `components/SiteFooter.tsx` | Quick Fix | 1-word change |
| 1.29 | Fix `inline-block` duplicate class on About page CTAs | `app/about/AboutClient.tsx` | Quick Fix | Remove attribute |
| 1.30 | Add `noindex` metadata to `/debug`, `/perf`, `/success`, `/track` | Those pages | Quick Fix | ~4 changes |

---

### PHASE 2 — Fix This Week (Important, More Work)

| # | Fix | File(s) | Effort | Notes |
|---|-----|---------|--------|-------|
| 2.1 | Wire cart drawer checkout button to Stripe checkout API | `components/CartDrawer.tsx` | Half Day | Requires understanding cart state flow |
| 2.2 | Add `BottomSheetNav` bottom padding to `<main>` | `components/SiteChrome.tsx` | Half Day | Also fix `GiftAssistantWidget` + `PurchaseToast` z/bottom offset |
| 2.3 | Fix GiftingStep inputs font-size (iOS zoom) | `components/GiftingStep.tsx` | Quick Fix | Add `fontSize: "16px"` |
| 2.4 | Fix product page price inconsistency (align catalog.ts with display) | Multiple | Half Day | Pricing agent already did this — verify |
| 2.5 | Add mobile focus trap to mobile nav overlay | `components/SiteHeader.tsx` | Half Day | Use `focus-trap-react` or custom hook |
| 2.6 | Add per-page OG metadata to `/shop`, `/gift-ideas`, `/about`, `/community` | 4 `page.tsx` files | Half Day | ~15 lines per file |
| 2.7 | Add Organization + WebSite JSON-LD to root layout | `app/layout.tsx` | Half Day | ~25 lines |
| 2.8 | Add Product JSON-LD to product pages | `app/product/[type]/page.tsx` | Half Day | ~40 lines |
| 2.9 | Fix `--ink-muted` and `--ink-faint` contrast tokens | `app/globals.css` | Half Day | Raise opacity, check visual regression |
| 2.10 | Move Stripe instantiation to module scope | 3 API route files | Half Day | Standard Stripe pattern |
| 2.11 | Fix `design_url` Stripe metadata truncation with proper logging | `app/api/create-checkout-session/route.ts` | Quick Fix | Already in Phase 1 |
| 2.12 | Fix double-click checkout race condition (useRef guard) | `app/MerchGeneratorPlatform.tsx` | Half Day | Add ref guard |
| 2.13 | Add cookie consent banner (legal requirement) | `components/CookieBanner.tsx` (new) | Half Day | Legal agent already created this |
| 2.14 | Surface delivery time estimate in purchase flow | Multiple CTAs | Half Day | Static copy first |
| 2.15 | Fix "No account required" copy near checkout buttons | Multiple | Quick Fix | Copy-only change |
| 2.16 | Remove or replace fake purchase toasts with real data (or remove entirely) | `app/shop/CatalogClient.tsx` | Half Day | Removal is easiest |
| 2.17 | Fix `splitName` single-word name duplication | `lib/printify.ts` | Quick Fix | 2-line fix |
| M-48 | Fix footer "Fulfilled by Printful" → Printify | `components/SiteFooter.tsx` | Quick Fix | Already in Phase 1 |
| 2.18 | Fix `UnknownproductId` silent fallback — add logging + founder alert | `lib/printify-blueprints.ts` | Quick Fix | ~5 lines |
| 2.19 | Add timeout to Cloudinary upload | `lib/uploadImage.ts` | Half Day | Wrap in `Promise.race` |
| 2.20 | Add `generateStaticParams` to product pages | `app/product/[type]/page.tsx` | Quick Fix | Already in Phase 1 (1.9) |

---

### PHASE 3 — Fix Later (Nice-to-Have, Longer-Term)

| # | Fix | Effort | Notes |
|---|-----|--------|-------|
| 3.1 | Add RLS policies to all Supabase tables | Full Day | SQL migration |
| 3.2 | Build nightly Stripe webhook reconciliation cron | Full Day | Inngest scheduled function |
| 3.3 | Wire email capture form to Resend/Mailchimp backend | Full Day | Backend + consent flow |
| 3.4 | Implement abandoned cart email recovery | Multi-Day | Requires email capture + Klaviyo |
| 3.5 | Replace Three.js gateway with CSS transition (mobile) | Half Day | Performance win for new visitors |
| 3.6 | Implement nonce-based CSP (remove `unsafe-inline`) | Multi-Day | Next.js nonce setup |
| 3.7 | Split LandingPage into RSC + client islands | Multi-Day | Major performance win |
| 3.8 | Implement Klarna/Clearpay via Stripe | Half Day | Payment method config |
| 3.9 | Implement real review platform (Trustpilot/Okendo) | Full Day | Third-party integration |
| 3.10 | Add Supabase Auth / magic-link for accounts | Multi-Day | Auth infrastructure |
| 3.11 | Implement Subject Access Request (SAR) process | Full Day | GDPR compliance |
| 3.12 | Add Instagram UGC feed to community page | Full Day | Social proof |
| 3.13 | Move product catalog from hardcoded array to Supabase | Full Day | Operations flexibility |
| 3.14 | Fix `SiteChrome` client component boundary | Full Day | Performance refactor |
| 3.15 | Add `ogl` dynamic import and remove unused `gsap` | Half Day | Bundle size reduction |
| 3.16 | Add `prefers-reduced-motion` to all page-level Framer Motion | Full Day | Accessibility + performance |
| 3.17 | Build OAuth / account page with order history | Multi-Day | Feature build |
| 3.18 | Implement post-delivery review/UGC email with Trustpilot link | Half Day | CRO win |
| 3.19 | Add delivery date calculator to purchase flow | Full Day | CRO win, requires date logic |
| 3.20 | Success page: add client-side polling for webhook timing | Half Day | UX improvement |

---

## Top 5 Most Impactful Changes for Conversions

These five changes would have the highest immediate impact on conversion rate:

### 1. Fix the cart drawer checkout button (Phase 1 → Phase 2)
**Impact: CRITICAL.** The "Checkout" button in the cart drawer currently sends users to `/create` instead of Stripe. Any customer using the cart flow cannot complete a purchase. Estimated conversion lift: enables the entire cart-based checkout path (currently 0% completion via cart).
**Files:** `components/CartDrawer.tsx`

### 2. Add delivery time estimates near every CTA
**Impact: HIGH.** "Will this arrive in time?" is the #1 gift-buyer anxiety. Etsy shows estimated delivery prominently. Adding "Order today — estimated delivery 4–7 business days (UK)" above checkout buttons costs 30 minutes and could improve conversion by 8–15%.
**Files:** `components/CartDrawer.tsx`, Step 3 panel, product pages

### 3. Remove fake purchase toasts / replace review counts with real data
**Impact: HIGH (trust + legal).** The fake "Jennifer from Ohio just ordered" toasts are a consumer protection risk under UK ASA and FTC rules. If discovered, they destroy brand trust. Remove the toasts entirely (or replace with real order data) and fix the hardcoded "(100+)" review count.
**Files:** `app/shop/CatalogClient.tsx`

### 4. Add "No account required" messaging + surface refund guarantee
**Impact: HIGH.** "Do I need to create an account?" is a top-3 abandonment reason. Three words ("No account required") beneath the checkout button removes this anxiety. Simultaneously surfacing the quality guarantee ("We fix any issues — no quibble") reduces hesitation at the moment of highest intent.
**Files:** Cart drawer, Step 3 panel

### 5. Fix currency consistency (GBP displayed as $ in cart + USD shown to UK users first)
**Impact: HIGH (trust + revenue).** The cart drawer previously displayed GBP prices with a `$` symbol. US customers are charged in GBP regardless of their region selection. Both erode trust at the most critical moment. The behavioural pricing agent fixed the `$` → `£` display bug. The currency-at-checkout bug (always GBP) needs fixing at the API level.
**Files:** `app/api/create-checkout-session/route.ts`, `components/CartDrawer.tsx`

---

## Status of Previously Implemented Fixes

The following fixes were **already implemented by previous audit agents** and should be verified in the build:

- **Pricing alignment** (Agent 11): `catalog.ts`, `products.ts`, `ProductGrid.tsx`, `CatalogClient.tsx`, `LandingPage.tsx` — all prices now consistent
- **ExitGuardian rewrite** (Agent 12): Loss-aversion copy, "Keep My Design" CTA
- **UpsellDrawer copy** (Agent 12): Real prices on add-ons, savings % on bundles
- **CartDrawer currency fix** (Agent 12): `$` → `£` throughout
- **CheckoutSummaryEnhancer** (Agent 12): Bold price, "one-of-a-kind" descriptor, Klarna nudge
- **OrderSuccess copy** (Agent 12): Post-purchase repeat CTA
- **DesignConfirmation badge** (Agent 12): "One of a kind" overlay
- **Legal pages rewrite** (Agent 14): `privacy`, `terms`, `refunds` — rewrites attempted; `cookies` page created; `CookieBanner` component created

---

*This summary was compiled from 14 audit reports. All file paths are relative to `/Users/roryhutchings/keepsy-mvp`.*
