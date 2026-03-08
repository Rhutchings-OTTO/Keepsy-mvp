# Keepsy CRO Audit — Conversion Rate Optimisation Report

**Date:** 2026-03-08
**Auditor:** CRO Analysis (Claude)
**Scope:** Full codebase review — all pages, components, checkout flow, email lifecycle
**Lens:** A customer considering buying a personalised gift for the first time

---

## Executive Summary

Keepsy has a visually polished, emotionally resonant brand. The copy, colour palette, and motion system are all at a high standard. However, the path from homepage to completed purchase has several conversion killers that will suppress orders: an animated entry gateway that blocks the homepage before users see any product; a checkout button in the cart drawer that sends users back to `/create` instead of Stripe; a gap between where customers are told to shop and where actual purchasing happens; and a near-total absence of earned social proof (all reviews appear to be hand-written data rather than imported from a real review platform). These issues are high-impact and mostly fixable in under a day of engineering work.

---

## 1. TRUST AND CREDIBILITY

### 1.1 Reviews and Testimonials — Hardcoded, Not Earned

**Finding:** All reviews throughout the site — on the landing page (`LandingPage.tsx`), the shop catalog (`CatalogClient.tsx`), the product detail page (`ProductPreviewClient.tsx`), the community page (`community/page.tsx`), and the `TestimonialGrid` component — are hardcoded static data in the source files. No integration with Trustpilot, Google Reviews, Okendo, Yotpo, or any third-party review platform exists. The community page claims "every review below is from a real Keepsy customer" and "no scripts, no filters" — but the reviews are literally defined as TypeScript constants in the component file.

The `FeaturedProductCard` on the landing page hardcodes `(100+)` for every product regardless of the actual review count. The catalog's `ProductCard` also shows `(100+)` as a hardcoded string.

**Impact on conversion:** HIGH. A first-time gift buyer researching the brand will not find Keepsy on Trustpilot or Google. Savvy shoppers (and increasingly, shoppers using AI assistants) cross-reference review claims. If they cannot verify the reviews, trust collapses.

**Recommendation:** Integrate a real review platform. Trustpilot or Okendo can be embedded in days. At minimum, import real verified reviews from your order data and expose them with verifiable dates and order references. Remove the phrase "every review below is from a real Keepsy customer" until this is backed by genuine data.

**Difficulty:** Medium (integration 1–2 days; data collection is ongoing)

---

### 1.2 Returns Policy — Not Visible Before Checkout

**Finding:** The refund policy (`/refunds`) is an excellent, customer-friendly page: 14-day window, replace or full refund for damaged/defective items, clear language. However, it is only accessible from the footer — it is never surfaced inline on the product page, in the cart drawer, or at any point during the `/create` flow before the Stripe redirect. The `CheckoutSummaryEnhancer` component has an inline FAQ with a "Refunds" entry that says only "If there is an issue, contact support and we will review the order with you" — which is vaguer and weaker than the actual policy.

The actual policy is custom-made goods with no change-of-mind return. This is a high-friction disclosure that will cause chargebacks and complaints if customers discover it only after ordering. Surfacing it proactively, framed positively ("we stand behind every print"), will reduce post-purchase dissatisfaction and actually increase confidence to buy.

**Impact on conversion:** HIGH. Personalised gift buyers are nervous about ordering something they cannot see. Clear, visible returns messaging ("We fix any quality issues — no quibble") reduces hesitation at the point of adding to cart.

**Recommendation:** Add a one-line inline trust note with a link to the full policy directly above the checkout CTA in both the cart drawer and the Step 3 product configuration panel. E.g.: "Every order is backed by our 30-day quality guarantee — if there's a problem, we'll fix it."

**Difficulty:** Easy (30 minutes of UI work)

---

### 1.3 Trust Badges Near Purchase Buttons — Good on Product Page, Missing in Cart

**Finding:** The product detail page (`ProductPreviewClient.tsx`) shows three trust badges directly below the primary CTA: Free Shipping, 30-Day Returns, Handmade With Care. The `TrustBar` component is used in the `/create` flow. The landing page has a full trust grid section with six badges.

However, the cart drawer (`CartDrawer.tsx`) only shows a single line of small text: "Secure Checkout · Handmade With Care · 30-Day Returns" below the checkout button — which is close to invisible at `text-[11px] text-charcoal/40`. This is the highest-intent moment in the entire funnel.

**Impact on conversion:** MEDIUM. Trust signals matter most when a customer's finger is on the checkout button and hesitation peaks.

**Recommendation:** Replace the faint text line in the cart drawer footer with the `TrustBar` component (three icon+label tiles). This is a direct component swap with no design work needed.

**Difficulty:** Easy (15-minute code change)

---

### 1.4 Contact Method Visibility — Good in Footer, Absent from Key Moments

**Finding:** `support@keepsy.store` is displayed in the site footer (`SiteFooter.tsx`) and on the refund page. The support email is also in the refund page's "Support Response" panel. However, there is no live chat widget, no phone number, and no contact link visible during the purchase flow (Step 3 or the cart drawer).

**Impact on conversion:** LOW–MEDIUM. For a first-time buyer about to spend $25–$55 on a personalised item, knowing they can contact a real person reduces abandonment.

**Recommendation:** Add a single "Questions? Email us" link with the support address to the Step 3 panel footer and the cart drawer footer, adjacent to the trust text that already exists there.

**Difficulty:** Easy

---

### 1.5 Delivery Times on Product Pages — Not Present

**Finding:** The product detail page (`ProductPreviewClient.tsx`) shows three trust badges but none of them states delivery time. The shipping page (`/shipping`) has clear times: UK 2–3 business days after dispatch, US 3–6 business days after dispatch, with 2–4 day production. This means a UK customer could realistically receive their order in 4–7 business days total — which is genuinely fast.

The FAQ component used on the `/create` page says only "Typical dispatch is 2–4 business days. See full details on our shipping page." The `OccasionBanner` in the create flow does not mention shipping windows.

No product page surfaces the expected delivery date range (e.g. "Order today — estimated delivery 14–17 March").

**Impact on conversion:** HIGH. For gift purchasing, the question "Will this arrive in time?" is the primary purchase-blocking anxiety. Etsy, Not On The High Street, and all major gift retailers show estimated delivery dates prominently. Not showing this is a significant missed opportunity.

**Recommendation:** Add a dynamic "Estimated delivery: [date range]" line directly below the price on the product detail page and above the checkout button in the cart drawer. This requires a small utility function using the existing production + shipping windows from the shipping page. A simple "Order today, estimated delivery in 4–7 business days (UK) / 5–10 (US)" would suffice as a static starting point.

**Difficulty:** Easy–Medium (static copy is Easy; dynamic date calculation is Medium)

---

## 2. URGENCY AND MOTIVATION

### 2.1 Occasion-Based Urgency — Well-Conceived but Partially Deployed

**Finding:** `OccasionBanner.tsx` uses `getUpcomingOccasion()` to detect upcoming holidays (Valentine's Day, Mother's Day, Father's Day, Halloween, Christmas) within a 45-day lookahead window and surfaces occasion-aware prompt templates. `PromoBanner.tsx` reads from `siteConfig.ts` and shows timed promotional banners — but the two promos configured are both in November/December 2026, meaning the banner is effectively invisible for most of the year.

`getSeasonalUrgency()` in `siteConfig.ts` generates occasion-specific urgency copy (e.g. "Christmas cutoff approaching") but it does not appear to be rendered anywhere in the current UI — there is no component that calls it and displays its output to the user.

The `AnnouncementBar` in `SiteHeader.tsx` is dismissed by default (it starts `dismissed: true` using `localStorage`). A first-time visitor who has never been to the site will see an empty `localStorage` value and the bar will be visible — but the bar copy is generic: "Fast shipping on every order · Free shipping over £75 (UK) / $75 (US)". There is no urgency hook.

**Impact on conversion:** MEDIUM. The infrastructure exists (occasion detection, urgency copy) but it is not being used to motivate purchase timing.

**Recommendation:**
1. Wire `getSeasonalUrgency()` output to the `AnnouncementBar` when a seasonal event is within the lookahead window.
2. Add more promos to `siteConfig.ts` to cover the full calendar year (Mother's Day, Father's Day, Valentine's Day, Halloween).
3. On the Step 3 product configuration panel, when an occasion is upcoming within 14 days, surface a "Heads up — order by [date] to arrive before [occasion]" message.

**Difficulty:** Easy–Medium (connecting existing functions is Easy; building the date-logic UI is Medium)

---

### 2.2 Scarcity Signals — Fake and Potentially Harmful

**Finding:** The shop catalog (`CatalogClient.tsx`) uses a `PurchaseToast` component that fires a fake "Jennifer from Ohio just ordered Black Hoodie — 7 min ago" notification on a 15–20 second random interval. The underlying data (`TOAST_COMBOS`) is entirely fabricated — it is hardcoded static data with no connection to real order activity.

The `CatalogClient` also shows "Popular this week" text on every product card, hardcoded. The `soldThisWeek` values in the product data (e.g. 72 for the mug, 98 for the card) are never actually displayed numerically to the user — instead a generic "Popular this week" label is shown.

**Impact on conversion:** This is a compliance issue as much as a CRO issue. Fake urgency toasts and fabricated "sold this week" figures are deceptive commercial practices under UK ASA rules and FTC guidelines in the US. If discovered by a customer or journalist, this destroys brand trust. The irony is that the trust signals the site is trying to build (quality, authenticity) are undercut by the fakery.

**Recommendation:** Either (a) remove the purchase toast entirely and replace it with a genuine recent orders feed from your database, or (b) remove it entirely. If you have real order data, show real numbers. Do not show fake notifications. The "Popular this week" label should be removed or replaced with something honest (e.g. "Bestseller" based on actual sales rank).

**Difficulty:** Medium to replace with real data; Easy to remove

---

### 2.3 Gift-Giving Angle — Well Leveraged in Copy, Weakly at Decision Points

**Finding:** The landing page copy ("Gifts They'll Never Forget"), the hero bullets, the review copy, and the occasion tiles all lean heavily into the gifting angle. The `GiftingStep` component in the create flow asks for recipient name, relationship, occasion, delivery date, and gift message — this is excellent. The cart drawer includes an "Add Gift Note" feature.

However, the primary CTA on the product page is "Start Creating" — a process-focused label. On the shop catalog, the CTA is "Personalise Now". Neither of these speaks to the emotional outcome (giving a gift someone will love). Compare with: "Make Their Gift" or "Create Their Gift."

**Impact on conversion:** LOW–MEDIUM. Headline copy and emotional framing are strong throughout. The CTA copy is a small but measurable friction point.

**Recommendation:** A/B test "Start Creating →" vs. "Make Their Gift →" on the product page CTA. A/B test "Personalise Now" vs. "Create Their Gift" on catalog cards.

**Difficulty:** Easy

---

## 3. FRICTION REDUCTION

### 3.1 Click Path from Homepage to Completed Purchase

**Finding:** The current customer journey is:

1. **Homepage** — Blocked by the `PremiumGateway` region selector (full-screen animated 3D cloud flyover, ~2.5 second transition, required before seeing any content)
2. **Homepage content** — "Shop the Collection" or "Create Your Own" CTAs
3. **Shop page** — Product grid with "Personalise Now" CTA (links to `/create?product=...`)
4. **Create page Step 1** — Enter prompt or upload photo, select product
5. **Create page Step 2** — Design confirmation / refine
6. **Create page Step 3** — Product selector, color, size, mockup preview, subtotal
7. **Stripe checkout** — Address, payment (redirects to Stripe-hosted page)
8. **Success page** — Order confirmed

That is 6 distinct screens before payment entry, plus the mandatory gateway. For a gift shopper who already knows what they want (e.g. a personalised mug), this is a very long funnel. By comparison, Etsy personalised product pages allow a customer to add to cart from the product listing in 2 clicks.

**Impact on conversion:** HIGH. Every additional step reduces conversion by approximately 10–20%.

**Recommendation:**
- Make the region selector non-blocking: pre-detect region via IP geolocation and allow users to change it, but do not hold the homepage hostage to a mandatory selection with a 2.5-second animation.
- Consider adding a "Buy direct" shortcut from the shop catalog that skips the /create step and goes to a product detail page where the customer can enter their prompt and go straight to checkout, reducing the funnel to 4 steps.

**Difficulty:** Medium (gateway change); Hard (direct-purchase shortcut)

---

### 3.2 Cart Checkout Button Does Not Checkout

**Finding:** In `CartDrawer.tsx`, the "Checkout" button's `onClick` handler navigates to `/create` instead of initiating the Stripe checkout flow:

```
onClick={() => {
  // TODO: wire up Stripe checkout
  window.location.href = "/create";
}}
```

This is a critical bug. A customer who adds items to the cart via the cart drawer, opens the drawer, and clicks "Checkout" is redirected to the beginning of the creation flow — not to payment. Their cart items persist in localStorage, but the experience is broken and confusing.

**Impact on conversion:** CRITICAL. Any customer who uses the cart flow and tries to check out via the cart drawer currently cannot complete a purchase.

**Recommendation:** Wire the cart drawer checkout button to `handleCartCheckout()` or dispatch the same checkout flow used in Step 4 of `MerchGeneratorPlatform.tsx`. The checkout API function `checkoutViaKeepsyAPI` already exists and is functional.

**Difficulty:** Easy (30-minute fix)

---

### 3.3 Guest Checkout — Available via Stripe, Not Confirmed or Advertised

**Finding:** The Stripe checkout session in `route.ts` uses `payment_method_types: ["card"]` and `shipping_address_collection` — but there is no explicit `customer_creation: "if_required"` or `phone_number_collection` or explicit guest mode configuration visible in the reviewed section. Stripe's hosted checkout supports guest checkout by default (no Stripe account needed), but this is not communicated anywhere on the Keepsy site before checkout.

No page says "No account needed" or "Guest checkout available." The `/account` page exists but account creation does not appear to be part of the purchase flow.

**Impact on conversion:** MEDIUM. "Do I need to create an account?" is a top-3 abandonment reason in e-commerce. Stating "No account required" near the checkout CTA removes this anxiety.

**Recommendation:** Add "No account required" as a sub-line beneath the checkout button in both the cart drawer and the Step 3 panel. Three words, zero engineering.

**Difficulty:** Easy

---

### 3.4 Shipping Costs — "Calculated at Checkout" Creates Uncertainty

**Finding:** The cart drawer shows "Shipping: Calculated at checkout" when the subtotal is below $75. While the `FreeShippingBar` component creates a progress bar toward the free shipping threshold, it does not tell customers what the standard shipping cost actually is.

The shipping page (`/shipping`) only says "Standard shipping rates apply below that threshold and are calculated at checkout" — it gives no actual shipping price figures.

**Impact on conversion:** MEDIUM. "Calculated at checkout" is a known abandonment trigger. Customers dislike hidden shipping costs.

**Recommendation:** Add actual shipping price estimates (e.g. "Standard shipping: $4.99 UK / $6.99 US") to the shipping page, the cart drawer below-threshold message, and the product detail page. These figures can be pulled from your Printful rates.

**Difficulty:** Easy (copy change once you have the figures)

---

## 4. PRODUCT PRESENTATION

### 4.1 Design Preview Before Purchase — Excellent

**Finding:** The core product experience — generating a design and previewing it applied to the actual product mockup (mug, tee, hoodie, card) before purchasing — is the product's primary differentiator and is implemented well. `MockupRenderer`, `MockupStage`, `HoodieMockupLayered`, and the layered mockup system all work to show the customer their design on the product. The "Start Creating" step on the product page leads directly to this flow.

The hero bullet "See it on the product before you buy" is one of the three highlighted value propositions on the landing page — and the product delivers on it.

**Impact:** This is a strength. Keep it front and centre.

---

### 4.2 Product Images — Generic, No Lifestyle Photography

**Finding:** The shop catalog (`CatalogClient.tsx`) references product images at paths like `/images/products/hoodie-white.jpg`, `/images/products/mug.jpg`. The landing page references `/images/featured/grandma-hoodie.jpg`, `/images/hero/mug-hero.jpg`. These appear to be lifestyle images.

However, the product detail page (`ProductPreviewClient.tsx`) shows a blank mockup (no artwork applied) from the `MockupRenderer` system when visited from `/product/[type]` — `generatedImage={null}` and `hasArtwork={false}`. The "You May Also Like" section uses Unsplash stock images of generic mugs, t-shirts, etc.

There are no multiple product angles. There are no lifestyle shots showing real people using or receiving the products on the product detail page.

**Impact on conversion:** MEDIUM. Single product image (blank mockup) is the minimum viable presentation. Lifestyle shots of happy gift recipients improve aspiration and emotional connection.

**Recommendation:** On the product detail page, show 2–3 lifestyle images (people receiving, unwrapping, or using the product) in a simple image carousel alongside the blank mockup. The `ProductGallery` component exists but does not appear to be used on the product detail page.

**Difficulty:** Medium (requires photography assets; component wiring is Easy)

---

### 4.3 Sizing Information — Present but Not Prominent

**Finding:** `ProductPreviewClient.tsx` shows size buttons (S, M, L, XL, 2XL) for apparel but there is no size guide accessible from this page. On the `/create` flow Step 3, there is a "View size guide" button that opens `SizeGuideDrawer`. This component exists at `/components/products/SizeGuideDrawer.tsx` (referenced in imports) but was not fully reviewed.

The product description on the product detail page is sourced from `selectedProduct.description` (from `lib/products`) and appended with "Personalised just for her — every detail crafted with care." No mention of fabric weight, fit type (unisex/fitted), or washing instructions.

**Impact on conversion:** MEDIUM. Apparel sizing uncertainty is a top reason for abandonment. "Just for her" language also potentially alienates male buyers or buyers purchasing for men.

**Recommendation:**
1. Add the "View size guide" link to the product detail page (currently only in the create flow).
2. Add basic fabric/fit information (e.g. "Heavyweight 380gsm fleece, unisex relaxed fit") to the product description fields.
3. Audit the "just for her" copy — if Keepsy sells to all demographics, this is exclusionary.

**Difficulty:** Easy

---

### 4.4 Price Consistency — Discrepancy Between Landing Page and Shop

**Finding:** The landing page (`LandingPage.tsx`) lists starting prices in `PRODUCT_IMAGES`: Mugs from $24, Cards from $4, Tees from $32, Hoodies from $54. `FEATURED_PRODUCTS` shows: mug $24.99, card pack $18.99, hoodie $54.99, tee $32.99.

The `ProductGrid` in `ProductGrid.tsx` shows prices in GBP only: card from £8, hoodie from £40, mug from £14, tee from £29.

The `CatalogClient` shows: hoodie $54.99, tee $29.99 (USD), mug $24.99, card $8.99.

The landing page card is listed as "From $4" but the cheapest card in the catalog is $8.99. The landing page shows a "Custom Photo Card Pack" at $18.99 — so it's unclear what the "From $4" refers to. This is misleading.

**Impact on conversion:** MEDIUM. Price inconsistency erodes trust and may cause legal issues if the landing page price cannot be fulfilled.

**Recommendation:** Audit and align all price display. Ensure "From $X" prices on the landing page match the lowest available price for that product type in the catalog.

**Difficulty:** Easy

---

## 5. SOCIAL PROOF

### 5.1 No Real-Time or Verifiable Social Proof

(See also 1.1 above)

**Finding:** Beyond the hardcoded reviews already discussed, there is no Instagram UGC feed, no TikTok integration, no real-time order counter, and no third-party trust seal. The community page asks customers to "tag us on Instagram" but there is no Instagram feed displayed anywhere on the site.

The social links in `SiteFooter.tsx` point to `instagram.com/keepsy.store`, `pinterest.com/keepsystore`, and `facebook.com/keepsystore` — but the existence and activity level of these accounts was not verified.

**Impact on conversion:** HIGH. Gift shoppers look for validation that real people have received real products. User-generated content is the most powerful form of social proof for personalised goods.

**Recommendation:**
1. Implement an Instagram feed widget showing real tagged posts on the community page and homepage.
2. If volume is low, run an early-customer campaign offering a $5 credit for a tagged post.
3. Set up a post-delivery email that asks for a photo review (this infrastructure is nearly complete — the delivered email in `orderEmails.tsx` exists but does not currently include a photo review CTA).

**Difficulty:** Medium (Instagram embed is Easy; post-purchase UGC campaign is Medium)

---

### 5.2 Review Platform Integration — Not Present

**Finding:** No Trustpilot, Feefo, Google Reviews, or other third-party platform badge appears anywhere on the site. The community page stats show "Hundreds — Verified reviews" which is unverifiable to the customer.

**Impact on conversion:** HIGH for new visitors who search the brand name before purchasing.

**Recommendation:** Set up a Trustpilot free plan, send review invitations via the existing order confirmation email flow, and embed the Trustpilot star widget in the site header or above checkout CTAs once 50+ reviews are collected.

**Difficulty:** Easy to set up; Medium to accumulate reviews

---

## 6. ABANDONED CART AND RE-ENGAGEMENT

### 6.1 No Abandoned Cart Recovery

**Finding:** Cart state is persisted in `localStorage` under the key `keepsy_cart_v2`. There is no email capture tied to cart addition, no Klaviyo or similar integration, and no abandoned cart email sequence. When a customer adds a designed product to the cart and leaves the site, there is no automated mechanism to bring them back.

The email system (`orderEmails.tsx`) handles post-purchase lifecycle (confirmed, in production, shipped, delivered) but there is no pre-purchase email touchpoint at all beyond the newsletter sign-up.

**Impact on conversion:** HIGH. Industry average abandoned cart recovery rates are 5–15% of abandoned carts. For a business at MVP stage this is likely the single highest-ROI improvement available.

**Recommendation:**
1. Add email capture before or at cart add (a lightweight "Enter your email to save your design" prompt).
2. If a customer generates a design but does not purchase within 30 minutes, trigger an email with their design image and a link back to complete the order. The design URL is already stored in the cart item (`designUrl` field).
3. Integrate Klaviyo or a similar platform — many have free tiers up to 250 contacts.

**Difficulty:** Medium (email capture UI is Easy; Klaviyo integration and automation is Medium)

---

### 6.2 Exit-Intent Trigger — Exists but Weak

**Finding:** `ExitGuardian.tsx` fires when the mouse leaves the top of the viewport (`clientY < 5`). It shows a modal saying "Wait. Your masterpiece is still cooling in the kiln. If you leave now, the pigment might fade." with a "Continue Creating" button.

This trigger fires even on Step 1 when no design has been generated yet, making the "masterpiece" metaphor misleading. There is no offer inside the overlay (no discount code, no email capture, no "save your progress" hook). The copy is stylistically clever but contains no conversion incentive.

**Impact on conversion:** LOW (currently). The component exists but is unlikely to recover meaningful sales in its current form.

**Recommendation:** Upgrade the exit intent overlay to include a "Save 10% — enter your email and we'll send you a code to finish your order" form. Only trigger it after the user has generated a design (Step 2+). If they are on Step 1, do not interrupt them.

**Difficulty:** Easy–Medium

---

### 6.3 Post-Purchase Re-Engagement — Good Infrastructure, Not Leveraged

**Finding:** The `OrderSuccess` component and the post-purchase email chain (confirmed → in production → shipped → delivered) are well-built. The delivered email is the only touchpoint that uses `reply-to: hello@keepsy.store` for two-way communication.

The success page after payment offers CTAs to "Create another design" and "Browse gift ideas." This is correct.

However, there is no "refer a friend" mechanism, no loyalty programme, no "share your gift" prompt, and no post-delivery review request that links to an actual review collection platform.

**Impact on conversion (repeat):** MEDIUM. Personalised gifts have high repeat purchase intent — customers who buy a Mother's Day gift often return for Christmas, Father's Day, and anniversaries. Not having a re-engagement flow leaves this on the table.

**Recommendation:** Add to the delivered email: (a) a one-click review link (Trustpilot), (b) a "10% off your next order" code, (c) a "Share your gift" button linking to a shareable product creation page. These are all additions to the existing delivered email template.

**Difficulty:** Easy

---

## Summary Table

| Finding | Impact | Difficulty | Priority |
|---|---|---|---|
| Cart checkout button goes to `/create` not Stripe | CRITICAL | Easy | P0 |
| Fake purchase toasts and hardcoded social proof | HIGH | Easy–Medium | P0 |
| No abandoned cart recovery | HIGH | Medium | P1 |
| Region-select gateway blocks all homepage content | HIGH | Medium | P1 |
| No delivery time estimates on product pages | HIGH | Easy | P1 |
| No third-party review platform integration | HIGH | Medium | P1 |
| Refund policy not visible before checkout | HIGH | Easy | P1 |
| No Instagram / UGC feed | HIGH | Medium | P2 |
| Shipping cost unknown until checkout | MEDIUM | Easy | P2 |
| Trust badges too small in cart drawer | MEDIUM | Easy | P2 |
| No "No account required" messaging | MEDIUM | Easy | P2 |
| Review count hardcoded as "(100+)" | MEDIUM | Easy | P2 |
| "Just for her" copy excluding male buyers | MEDIUM | Easy | P2 |
| Price discrepancy — landing page "From $4" vs $8.99 actual | MEDIUM | Easy | P2 |
| No size guide link on product detail page | MEDIUM | Easy | P2 |
| Seasonal urgency copy (`getSeasonalUrgency`) not rendered | MEDIUM | Easy | P3 |
| Exit intent has no offer | LOW | Easy | P3 |
| Promos only configured for Nov–Dec | LOW | Easy | P3 |
| No post-delivery review request to real platform | MEDIUM | Easy | P3 |
| No refer-a-friend or loyalty mechanism | MEDIUM | Medium | P3 |

---

## Top 5 Quick Wins (P0/P1, Easy Difficulty)

1. **Fix the cart checkout button** — change `window.location.href = "/create"` to call `handleCartCheckout()`. 30 minutes.
2. **Add delivery estimate copy** — "Order today, estimated delivery: 4–7 business days (UK) / 5–10 (US)" above every checkout CTA. 30 minutes.
3. **Add "No account required"** sub-copy beneath the checkout button. 15 minutes.
4. **Surface the refund guarantee inline** — one line with link above every checkout CTA. 30 minutes.
5. **Align landing page prices** — fix "From $4" for cards if the actual minimum is $8.99. 10 minutes.

Total engineering time for these five items: approximately 2 hours.
