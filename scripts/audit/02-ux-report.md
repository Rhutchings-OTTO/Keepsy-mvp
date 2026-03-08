# Keepsy UX Audit — Customer Journey Report
**Date:** 2026-03-08
**Auditor:** Claude Sonnet 4.6 (code-only audit — no live site access)
**Files reviewed:** app/page.tsx, app/LandingPage.tsx, app/shop/CatalogClient.tsx, app/MerchGeneratorPlatform.tsx, components/create/CreatePageLayoutLean.tsx, components/create/PromptHelperCollapsible.tsx, components/create/IdeasForYou.tsx, components/generation/DesignConfirmation.tsx, app/success/page.tsx, components/OrderSuccess.tsx, app/track/page.tsx, lib/emails/orderEmails.tsx, app/shipping/page.tsx, components/PremiumGateway.tsx, components/product/ProductPreviewClient.tsx

---

## Journey 1 — First-Time Visitor (Landing Page)

### What the hero says
H1: **"Gifts / They'll / Never / Forget."**
Subhead: "Turn your favourite photos and memories into beautiful, personalised keepsakes — mugs, cards, tees, hoodies."
Bullets: "See it on the product before you buy", "Handmade with care, every single order", "Shipped to US & UK"
Primary CTA: "Shop the Collection" | Secondary CTA: "Create Your Own"

### What works well
- **Value prop lands in ~2 seconds.** The four-word headline is bold and emotional; the subheading fills in the what (photos/memories → keepsakes). No ambiguity about what Keepsy sells.
- **Dual CTAs serve different mindsets.** "Shop the Collection" covers browsers; "Create Your Own" covers gift-givers ready to act. Both are visible above the fold.
- **Social proof is continuous.** Stars + "Thousands of happy customers" appear immediately under the headline, before the user has to scroll. The marquee bar reinforces trust without taking up permanent real estate.
- **Review quality is strong.** Six full-length testimonials with specific occasions (Memorial Gift, Mother's Day) are emotionally resonant and specific.
- **How It Works is honest and short.** Three steps ("Choose → Make It Personal → We Do the Rest") set accurate expectations.
- **Email capture has a concrete incentive.** "Get 10% Off Your First Order" is clearer than generic newsletter signups.

### Friction points
1. **The region gateway blocks everything.** New visitors who haven't set a region cookie see a full-screen region selector (PremiumGateway) before they can read a single word of the landing page. The 2.5-second animated cloud-flight transition then adds delay. A user on mobile who instinctively hits Back will lose the page entirely — there is no way to dismiss or skip the gateway if no region cookie exists, and `onClose` is only passed if `region` is already set.
2. **Product images may be missing.** Hero product cards use `onError={() => setVisible(false)}` — a missing image silently collapses the card. On a first visit, four missing images would render an empty right column in the hero, destroying the visual split-layout.
3. **Featured products link to /shop, not the product detail page.** The "Shop Now" button on every featured product card sends users to `/shop` — not to the specific product. A user who clicks the "Best Mom Ever Mug" card and lands on the full catalog (no mug selected, no scroll position) will feel the navigation was broken.
4. **The email capture form is not wired to any backend.** `handleEmailSubmit` sets `emailSubmitted = true` and shows a success message, but performs no API call. Users who sign up receive no discount code. This is a trust-eroding dead-end.
5. **"Join women who love thoughtful gifting" is exclusionary.** This microcopy under the email field segments out male shoppers, non-binary users, and people buying for recipients other than women. It is inconsistent with the inclusive tone of the rest of the page.

### Recommendations
| Priority | Recommendation |
|----------|---------------|
| Quick Win | Add a small "Skip / Continue without selecting" link on the region gateway, or auto-detect region from Accept-Language and only show the gateway as a confirmation. |
| Quick Win | Fix "Shop Now" on featured product cards to deep-link to `/create?product=mug` (etc.) rather than the generic /shop. |
| Important | Wire the email capture form to a real backend (Resend / Mailchimp). Show the user the actual 10% code in the success message, not just a promise to check their inbox. |
| Important | Add defensive fallback imagery or a placeholder state to product collection cards so the hero layout doesn't collapse on image errors. |
| Important | Rewrite the email capture microcopy to be inclusive: "Join thousands of thoughtful gifters" or similar. |
| Nice to Have | Consider A/B testing the hero CTA order — "Create Your Own" may convert better as the primary CTA given Keepsy's AI-generate differentiator. |

---

## Journey 2 — Product Discovery (/shop)

### What works well
- **Category filter + sort are both present.** Users can filter by All / Mugs / Tees / Hoodies / Cards with pill buttons, and sort by Most Popular / Price Low–High / Price High–Low. The filter bar is sticky, which is a good pattern on longer catalogs.
- **Social proof is persistent.** Every product card shows star ratings and review counts. "Bestseller" and "New" badges help orient the browsing hierarchy.
- **"Popular this week" nudge is subtle.** The `soldThisWeek` property drives a social-proof label without fabricating an exact number in the UI.
- **Purchase activity toasts add urgency** without being aggressive — they appear 8–12 seconds after load, not immediately.
- **Empty state is handled.** If filters produce no results, a "No products found" message with a "Clear filters" button is shown.

### Friction points
1. **Review counts are hardcoded and inconsistent.** The catalog shows "(100+)" on every card regardless of the actual `reviewCount` in the product data (e.g., mug has 1,847 reviews, card has 2,341). The UI shows "(100+)" for all. This is misleading and undermines trust if spotted.
2. **Clicking a product card goes directly to /create, not a product detail page.** `productHref()` returns `/create?product=mug&color=white`. There is no intermediate product detail page from the catalog — users skip straight to the creation flow. This removes the opportunity to read about the product, see quality photos, check specs, and be convinced before committing to the AI generation step.
3. **No price range filter.** With items ranging from £8.99 (card) to £54.99 (hoodie), a price filter would help budget-conscious shoppers.
4. **No size/color pre-selection in catalog.** The catalog shows hoodie variants (white, black, blue) as separate products. Clicking "Personalise Now" on a blue hoodie passes `color=blue`, but the create page defaults to the first product's colors — the color selection from the catalog is not reliably threaded through (depends on how `initialQuery.color` is handled, which it is not: `readParam` in create/page.tsx reads product, prompt, style, occasion, success, canceled — not color).
5. **The "8 Products" stat in the hero banner is the actual product array length.** This is fine today but will become stale if new products are added; it's a dynamic count from `PRODUCTS.length`, which is correct, but only 8 items feels thin as a catalog and the "Thousands of Reviews" stat next to it feels incongruent at MVP scale.
6. **Social proof toasts use hardcoded fictional data** (Sarah from Texas, Jennifer from Ohio). This is a dark pattern if these are presented as real-time purchases. If they are disclosed nowhere as "examples," they risk regulatory scrutiny under consumer protection law.

### Recommendations
| Priority | Recommendation |
|----------|---------------|
| Quick Win | Fix review count display — show the actual `reviewCount` value from product data, or use a consistent real-reviews-only number. |
| Quick Win | Thread the `color` param through the catalog → create URL so the color selected in the catalog is pre-selected in the create flow. |
| Important | Add a product detail page (or at minimum a slide-over drawer) between catalog card and create flow. Customers need photos, materials info, and care instructions before they invest time generating a design. |
| Important | Either replace the purchase toast data with real Supabase query results, or remove the feature entirely. Fabricated "live" activity toasts are a dark pattern. |
| Nice to Have | Add a price range filter or at minimum a "Gifts under £25 / $25" quick filter. |

---

## Journey 3 — Design Creation (/create)

### Step-by-step flow from code

**Step 1 — Prompt & product selection (CreatePageLayoutLean)**
User sees: an eyebrow label ("Make a thoughtful personalised gift"), a large headline ("Create something personal in a way that feels easy"), three process reassurance chips ("Write one simple sentence / Preview your design / Only order if it looks right"), a two-tab input panel ("Describe a gift" / "Use a photo"), a textarea with placeholder examples, a collapsed "Tips for best results" details element, a "Generate preview" button, and an estimation note ("Most designs are ready in 10 to 20 seconds").

Below the main input: "Need ideas?" section with PromptHelperCollapsible + IdeasForYou; a "Choose your product" grid (T-shirt, Mug, Card, Hoodie); a Before/After carousel; and user feedback reviews.

**Step 2 — Design confirmation (DesignConfirmation)**
User sees: the generated image large, a binary choice ("I'd like to make a few changes" / "Show me how this will look on my gift"), and a collapsible refinement panel with helper chips (Softer colours, Watercolor, etc.), a textarea, and up to 3 refinements.

**Step 3 — Mockup placement (MerchGeneratorPlatform step 3)**
User sees: the generated design composited on a product mockup (left), and a right panel with product switcher, color swatches, size selector (apparels), subtotal, optional gifting details, Add to Cart + Save buttons.

**Step 4 — Checkout panel (MerchGeneratorPlatform step 4)**
User sees: a checkout card ("You're about to buy: [product]" + "Pay £X.XX" button) and an order summary card (thumbnail, item name, free shipping row, total, gift-ready note).

### What works well
- **The prompt input is well scaffolded.** Placeholder examples ("A warm floral mug design for Mum's birthday") are specific enough to model good prompts without restricting creativity. Both "Describe" and "Use a photo" modes are one tap away from each other.
- **PromptHelperCollapsible is a strong progressive-disclosure pattern.** Novice users who don't know what to type can build a structured prompt via dropdowns (Who / Style / Mood / Background) without it being in the way for confident users.
- **IdeasForYou chip suggestions are region-aware.** Holiday and occasion chips are pulled from `REGION_CONTENT[region]`, which is a thoughtful detail.
- **Generation error handling is user-friendly.** Safety block messages include suggested alternative prompts; content rewrites show a before/after comparison.
- **The generation loading overlay sets expectations.** It references the 10–20 second wait time and is communicated before generation starts.
- **The DesignConfirmation step is binary and decisive.** The two large buttons ("Tweak it" vs. "See it on my gift") present a clear fork without overwhelming options.
- **Refinement limit is clearly communicated.** "Tweaks left: 3" is displayed inline; when exhausted, a "Start fresh" escape is offered.
- **The mockup preview (Step 3) is a genuine conversion driver.** Seeing their design on the actual product before committing to purchase is the core differentiator; the MockupRenderer is prominently featured.

### Friction points
1. **Product selection happens in two different places.** The user picks a product in Step 1 (product tiles below the prompt). Then in Step 3 they can switch product again via a separate product switcher. These are not visually linked. A user who selects "Mug" in Step 1 and generates a square design may arrive at Step 3 thinking they're set, then discover they need to re-select. The step 1 selection feeds `selectedProductType` but the default in state is `PRODUCT_LIST[2]` (card), not what Step 1's UI selects — the two are reconciled only via `onProductSelect`, which is correct, but visually the product selection being below the fold in Step 1 means many users will miss it.
2. **The "Save" button in Step 3 is a non-functional placeholder.** The button (heart icon) renders but has no `onClick` handler that does anything persistent — saving a design is purely local (design vault), with no account. A user who clicks "Save" and later clears their browser will lose their design.
3. **No shipping estimate before the checkout step.** Shipping cost and delivery timeframe are not surfaced until Step 4 (checkout panel), which shows "Free" in the summary. But this only holds above the free-shipping threshold (£75 / $75 per the shipping page). Orders below the threshold will have shipping charges added at Stripe checkout — a surprise the pre-checkout panel does not warn about.
4. **Step 3 product re-selection does not re-render the mockup prompt clearly.** When a user switches from Card to Hoodie in Step 3, the mockup updates but there is no indication that the design may need to be regenerated or that the aspect ratio is now different. The design that looked right on a card may look wrong on a hoodie — and there's no "Regenerate for this product" CTA.
5. **"Delete My Data" appears prominently at the bottom of every create page.** The button (`text-xs`, underlined, at the very bottom of the create page) is a required GDPR affordance, but placing it on the creation canvas (where users are mid-flow) breaks the visual hierarchy and can feel alarming to first-time users who see it unexpectedly.
6. **The GiftingStep (FF.giftingFlow)** is behind a feature flag and conditionally rendered. If the flag is off, there is no gifting details section at all — users have no way to add a gift message or special instructions. This is a meaningful gap for a gift-focused product.

### Recommendations
| Priority | Recommendation |
|----------|---------------|
| Quick Win | Consolidate product selection to one place — either Step 1 (before generation, so the AI can optimize for the format) or Step 3 (after, when they see the mockup), not both. If keeping Step 1, add a visible "currently making a [Mug]" badge to the generate button. |
| Quick Win | Add a delivery estimate line ("Estimated delivery: 5–10 business days") and a threshold note ("Free shipping on orders over £75") to the Step 4 checkout panel, before the user clicks "Pay". |
| Important | Implement account-based design saving (or at minimum a share-link for the generated design URL) so the "Save" button is not a dead end. |
| Important | When a user switches products in Step 3, surface a contextual prompt: "Your design was made for a [card]. Regenerate for [hoodie]?" — or show a visual warning if the design aspect ratio doesn't match the product. |
| Important | Move "Delete My Data" to the footer or a dedicated Privacy/Account page, not the mid-flow canvas. |
| Nice to Have | Enable the GiftingStep feature flag so customers can add a message — this is table-stakes for a gift product. |

---

## Journey 4 — Checkout

### Path from code
Create (Step 3) → Add to Cart → Cart drawer opens → Step 4 auto-renders → "Pay £X.XX" button → `checkoutViaKeepsyAPI()` → Stripe Checkout (external) → returns to `/create?success=1` or `/create?canceled=1`.

Alternatively: Step 3 → "Pay £X.XX" directly (single-item checkout, skipping cart) → same Stripe flow.

If `FF.upsells` is true: an `UpsellDrawer` intercepts before checkout.

### What works well
- **The path from design to payment is genuinely short.** 4 steps (prompt → confirm → configure → pay) with no account creation required. This is a significant conversion advantage.
- **The checkout panel is clean and uncluttered.** Order summary shows: thumbnail, item name, subtotal, shipping (labeled "Free"), total, and a "gift-ready print & packaging" reassurance note.
- **The "Securing your Masterpiece" overlay is a good loading state.** It prevents double-clicks and communicates that something is happening while the Stripe session is being created.
- **Canceled checkout is handled gracefully.** If the user returns from Stripe with `canceled=1`, they see "Checkout canceled. Your design is still here whenever you want to continue." — the design is not lost.
- **The Terms of Service link is present** in the checkout panel, satisfying basic legal requirements.

### Friction points
1. **Shipping cost is not shown before Stripe.** The checkout panel shows "Shipping: Free" — but this only applies above £75/$75. Orders below the threshold will have a shipping fee added by Stripe at the checkout page. This is the single biggest trust risk in the checkout flow: the customer clicks "Pay £24.99" and arrives at Stripe to find the total is higher.
2. **Currency is hardcoded to GBP in the checkout payload.** `checkoutViaKeepsyAPI` sends `currency: "gbp"` regardless of the user's selected region. A US customer selecting USD on the gateway will be charged in GBP at Stripe. This is a functional bug but also a UX trust issue.
3. **The Step 4 checkout page has no header navigation.** After adding to cart and reaching Step 4, the standard site header is absent. There is no way to navigate to shipping info, FAQ, or contact without breaking the flow. A discreet "Questions? hello@keepsy.store" link or shipping info tooltip would reduce checkout abandonment.
4. **The UpsellDrawer is behind FF.upsells.** When enabled, it intercepts between "Pay" and Stripe without the user expecting it. Depending on implementation, this could feel like a bait-and-switch interruption right at the payment point.
5. **No cart icon in the create page header during Step 1–3.** The cart state is managed locally but there is no persistent cart indicator in the create page header. A user who adds a second design would not know their first item is still in the cart unless they remember from the confirmation.

### Recommendations
| Priority | Recommendation |
|----------|---------------|
| Quick Win | Fix the `currency` field to respect the user's selected region (`"usd"` for US, `"gbp"` for UK). This is a functional bug with direct revenue and trust implications. |
| Quick Win | Show actual shipping cost (or "Free" threshold trigger) in the Step 4 summary — pull this from the same logic used on the shipping page. If shipping is always free during MVP, state that explicitly and remove the threshold caveat from the shipping page. |
| Important | Add a "Need help?" escape link (email address) to the Step 4 checkout panel. |
| Important | Add a persistent cart count badge visible from Step 1–3 so multi-item shoppers have awareness of their cart. |
| Nice to Have | Consider showing a delivery date estimate ("Order by [date] for delivery by [date]") rather than just "5–10 business days" — this is a proven conversion driver for time-sensitive gifts. |

---

## Journey 5 — Post-Purchase (Success & Emails)

### What the customer sees
**Success page (`/success?session_id=...`):**
- If `status === "paid"`: Full `OrderSuccess` component — animated checkmark, confetti, "It's On Its Way!" headline, estimated delivery (5–10 business days), "Track Your Order" button (links to `/track?ref=...`), design preview (if `generatedImageUrl` is available), "What Happens Next" three-step explainer (design to print → printed & packed → shipped to door), and a "Make Another Memory?" CTA strip.
- If `status !== "paid"` (pending/processing/failed): A simpler page with order ref, status badge, line items, and CTAs to "Create another design" or "Browse gift ideas."

**Order tracking (`/track?ref=...`):**
A four-step progress stepper (Order Confirmed → In Production → Shipped → Delivered) with live status from Supabase, plus tracking number/URL if available.

**Email lifecycle:**
1. **Order Confirmed** — "Your vision is taking form." Sent on Stripe webhook. Includes order ref, product name, design prompt, and tracking link.
2. **In Production** — "Your creation is being made." Includes "Estimated delivery: 5–10 business days" and tracking link.
3. **Shipped** — "Your order has shipped." Includes tracking number and direct courier link.
4. **Delivered** — "Your piece has arrived." Invites reply-to feedback; links to "Create Another Keepsake."

### What works well
- **The paid success screen is a genuine delight.** Confetti, animated checkmark, emotional headline ("It's On Its Way!"), design preview, and clear "What Happens Next" steps — this is one of the strongest screens in the product. It turns a transactional moment into an emotional one.
- **The full email lifecycle is in place.** Four emails covering the complete production and delivery arc is thorough; most competitors only send confirmation + shipped. The "Delivered" email with a soft feedback request is a smart post-purchase move.
- **The order tracking page is genuinely useful.** A four-step stepper with live Supabase data, courier tracking link when available, and estimated delivery — this is everything a gift-buyer needs to feel in control.
- **Brand voice in emails is consistent.** "The Keepsy Atelier" sign-off and theatrical language ("our machines are currently calibrating the pigment density") is distinctive and consistent with the premium brand.
- **The confirmation email includes the design prompt.** This personal touch ("your 'warm floral mug design for Mum's birthday' design is being prepared") makes a form email feel tailored.

### Friction points
1. **The success page route depends on Supabase timing.** The success page fetches order status from Supabase on render. If the Stripe webhook has not yet completed (which is common — webhook delivery can lag by seconds to minutes), `status` will be `"processing"` and the user sees the generic "Order Received — We're finalising your order" page rather than the delightful OrderSuccess component. First impressions of the post-purchase moment may routinely be the wrong page.
2. **Tracking URL requires the order ref.** The success screen links to `/track?ref={orderRef}`, but `orderRef` is only available if Supabase already has the order. In the processing state (see above), `orderRef` may be null — the "Track Your Order" button would then not render, leaving the customer no way to follow up without emailing support.
3. **No estimated delivery date on the order confirmation email.** The first email ("Your vision is taking form") is warm and beautifully written, but it does not include an estimated delivery date. The "In Production" email does — but for a customer who is anxious about a gift arriving before a specific occasion, the delay before that second email arrives matters.
4. **The delivered email has no review/UGC call to action.** The email asks customers to "reply to this email and let us know" — this is good for private feedback, but there is no ask to leave a public review, share on social media, or post in the community. Given that the site's social proof is the main conversion driver, this is a missed acquisition loop.
5. **The "processing" and "pending" success page states are visually under-developed.** The generic state shows a "Thank you for your order!" heading and an "Order Received" label, but no animated indicator or auto-refresh. A customer on a slow webhook might sit on this page indefinitely without any sense that something is happening.

### Recommendations
| Priority | Recommendation |
|----------|---------------|
| Quick Win | Add an estimated delivery date to the order confirmation email — even a range ("Expected to arrive by [date + 10 business days]") reduces post-purchase anxiety dramatically. |
| Quick Win | Add a public review / social share ask to the delivered email: "Leave us a review" with a link, or "Share your creation on Instagram @keepsy". |
| Important | Implement a client-side polling mechanism (or use Stripe's redirect + session status API) on the success page so that if the order is still `processing`, the page auto-refreshes every 3–5 seconds until `status === "paid"`, then morphs to the OrderSuccess component. This prevents first-time customers from seeing the wrong page. |
| Important | Ensure `orderRef` is always passed from the Stripe session redirect URL to the success page (either via metadata or via the checkout session's `client_reference_id`), so the "Track Your Order" button is always available. |
| Nice to Have | On the processing/pending success page, add a progress indicator animation and copy like "We're just finalising your order — this usually takes a few seconds" to set expectations and reduce support contacts. |

---

## Cross-Cutting Issues

| Issue | Journeys Affected | Priority |
|-------|------------------|----------|
| No global navigation between key pages (Shop / Create / Track) at the top of the create or success screens — users must use the browser back button or know the URL | 3, 4, 5 | Important |
| The site header (SiteHeader component) is not used on the create or success pages — there is no nav link to return to the home page from mid-flow | 3, 4, 5 | Important |
| Review counts across the site are inconsistent — landing page says "847 reviews" for mom-mug, catalog shows "(100+)" for the same product, product detail page shows different data | 1, 2 | Quick Win |
| "Powered by AI" and "Printing by Printful" appear in the landing page footer — this is more transparent than many competitors, which is positive, but it may raise questions about quality control that the rest of the page doesn't address | 1 | Nice to Have |
| No FAQ component is accessible from the create or checkout flows — there is a FAQ.tsx component but it appears only on other pages | 3, 4 | Important |

---

## Summary Scorecard

| Journey | Score | Biggest Blocker |
|---------|-------|-----------------|
| 1 — First visit | 7/10 | Region gateway blocks full-screen on every first visit; email capture not wired up |
| 2 — Product discovery | 6/10 | No product detail page; catalog → create skips the persuasion step; fictional purchase toasts |
| 3 — Design creation | 8/10 | Duplicate product selection points; non-functional Save button; missing shipping info pre-checkout |
| 4 — Checkout | 7/10 | Currency hardcoded to GBP; no shipping cost disclosure pre-Stripe; no navigation escape |
| 5 — Post-purchase | 7/10 | Webhook timing means OrderSuccess may not render; no auto-refresh on processing state |

**Overall:** The core "describe → generate → preview → pay" loop is genuinely strong and differentiated. The biggest UX debt is concentrated at the entry point (gateway friction), the discovery layer (missing product pages), and the post-purchase confidence moment (webhook timing). Fixing the currency bug and the success page polling issue should be treated as urgent rather than UX improvements — they affect real money and real first impressions at the moment of highest customer emotion.
