# Keepsy Copy Audit — Full Site
**Date:** 2026-03-08
**Auditor:** Claude Code (Brand Voice: The Keepsy Atelier)
**Voice standard:** Premium-craft, warm, slightly theatrical, artisan but approachable. British English.

---

## Summary

The site has a genuinely strong foundation. The hero, about page, and email lifecycle are largely on-brand. Issues cluster in three areas: (1) a handful of off-brand, generic, or awkwardly literal copy moments; (2) the Terms of Service page, which has a tonal identity crisis; (3) several functional copy items — cart, error states, loading states, UpsellDrawer — that are functional but deserve more Keepsy personality.

---

## CRITICAL

### 1. Terms of Service — body copy is fiction, not law
**Location:** `/app/terms/page.tsx`

**Current copy (entire body):**
> "Our machines are currently calibrating the pigment density — every detail will be carefully rendered on premium materials before it reaches you."
> "We utilize only museum-grade inks and organic heavy-weight textiles. Our ceramics are kiln-fired…"
> "Once your order is confirmed, it enters our physical atelier. Because of the bespoke nature of generative printing, please allow our artisans 48 hours to calibrate the colors to your specific prompt."

**Issues:**
- Claims of "museum-grade inks", "kiln-fired ceramics", "organic heavy-weight textiles" are unverified marketing claims presented as legal fact. These could constitute misleading trading under UK Consumer Protection Regulations.
- "Our physical atelier" implies a physical printing studio; Keepsy uses Printful as a third-party fulfilment partner. This is factually inaccurate.
- "Calibrate the colors to your specific prompt" is technically untrue — Printful is a standard DTG/POD printer.
- The "Usage & Intellectual Property" section is the only legally substantive section and it is buried in a decorative box.
- American spelling: "calibrate the colors" should be "colours" for British English.
- The whole page presents legal terms as brand poetry. A real Terms page needs real terms.

**Suggested fix:** Rewrite the body sections as honest, readable legal copy. Retain the Keepsy aesthetic (serif heading, warm palette) but use accurate, legally sound language. The theatrical tone ("Terms of Artistry", "The Uniqueness Clause") is fine as section naming, but the body text must be factually correct. Specifically:
- Remove "museum-grade inks", "kiln-fired ceramics", "organic heavy-weight textiles" or replace with "premium quality materials"
- Replace "physical atelier" with "our print partner"
- Replace "48 hours to calibrate the colors to your specific prompt" with accurate lead time (2–4 business days production)
- Add a proper "Returns" clause pointing to /refunds
- Add jurisdiction/governing law clause (England & Wales, presumably)

**Priority: CRITICAL** — potential trading standards / consumer law exposure.

---

### 2. Error page — repeated "Something went wrong" heading and eyebrow
**Location:** `/app/error.tsx`

**Current copy:**
```
eyebrow: "Something went wrong"
h1: "Something went wrong"
```

**Issue:** The eyebrow label and the H1 are identical. This is lazy and adds nothing. Also generic — no Keepsy voice.

**Suggested replacement:**
```
eyebrow: "Atelier Interruption"
h1: "We hit a snag in the studio."
body: "Our team has been notified. Try refreshing the page, or head back to the collection."
```

**Priority: Critical** — every error state is a brand moment.

---

## HIGH

### 3. Footer (SiteFooter) — "Made with love in the USA" is geographically odd for a UK/US brand
**Location:** `/components/SiteFooter.tsx`, line 344

**Current copy:**
> "🇺🇸 Made with love in the USA"

**Issue:** Keepsy ships to both UK and US, is founded by British people (Rory and Dan), and the entire brand story (About page) is set in England. This line makes no sense. It may also be factually wrong if print fulfilment uses UK partners for UK orders.

**Suggested replacement:**
> "Made with love, shipped to your door"
> or: "Crafted for the US & UK"

**Priority: High** — contradicts the brand story on the same site.

---

### 4. LandingPage — Social proof marquee uses American flag and "Made & Shipped with Love"
**Location:** `/app/LandingPage.tsx`, SOCIAL_PROOF_ITEMS

**Current copy:**
> "🇺🇸  Made & Shipped with Love"

**Issue:** Same issue as above — the brand is not American-only. "Made & Shipped with Love" is also vague and slightly trite.

**Suggested replacement:**
> "🇬🇧🇺🇸  Shipped with Care to the US & UK"

**Priority: High**

---

### 5. LandingPage footer — "Powered by AI" conflicts with "Handmade with care"
**Location:** `/app/LandingPage.tsx`, footer area (line 907) and HERO_BULLETS (line 37)

**Current copy (footer):**
> "🇬🇧 UK & 🇺🇸 US shipping · Powered by AI"

**Hero bullet:**
> "Handmade with care, every single order"

**Issue:** "Powered by AI" in the footer and "Handmade with care" in the hero bullets are in direct tension. The brand positions itself as artisan-made; describing it as "Powered by AI" in the same breath cheapens the message. This inconsistency will confuse customers.

**Suggested fix:** Remove "Powered by AI" from the footer brand tagline. AI is a production tool, not a brand identity marker. The SiteFooter already carries "Powered by AI · Fulfilled by Printful · Payments by Stripe" in the bottom bar — that is the right place for technical attribution. Remove it from the hero footer blurb.

**Priority: High** — mixed messaging damages trust.

---

### 6. Shop CatalogClient — review count shows "(100+)" regardless of actual count
**Location:** `/app/shop/CatalogClient.tsx`, line 207 (also in LandingPage.tsx line 290)

**Current copy:**
> `(100+)` hardcoded despite having `reviewCount` data (e.g. mug: 1847 reviews)

**Issue:** The actual review counts are in the product data (1847 for the mug, 2341 for the card) but the UI shows "(100+)" on all products. This looks like placeholder text that was never connected to real data.

**Suggested fix:** Display actual review counts, or use a more specific tier ("2,300+ reviews") to drive conversion.

**Priority: High** — social proof is wasted when displayed incorrectly.

---

### 7. GiftAssistantWidget — assistant introduction is stiff and uses Americanisms
**Location:** `/components/GiftAssistantWidget.tsx`, lines 57, 60, 68

**Current copy:**
> "Hi, I am Keepsy's AI gift assistant. Tell me who this gift is for and your style."

**Issues:**
- "I am" reads like a robot/corporate chatbot, not a warm Keepsy helper.
- No personality or warmth.
- Widget label is "AI gift assistant" — lowercase, bland.

**Suggested replacement (intro message):**
> "Hello! I'm Keepsy's gift guide. Tell me who you're shopping for and I'll suggest a few ideas."

**Widget button label:**
> "Gift Ideas" or "Need inspiration?" instead of "AI gift assistant"

**Priority: High** — this is a customer-facing touchpoint on the create page.

---

### 8. CartDrawer checkout button has a TODO comment in production code
**Location:** `/components/CartDrawer.tsx`, lines 431–432

**Current code:**
```javascript
onClick={() => {
  // TODO: wire up Stripe checkout
  window.location.href = "/create";
}}
```

**Issue:** The checkout button sends users to `/create` with a TODO comment. This is likely a development placeholder that shipped. The button label says "Checkout" but the action is wrong.

**Priority: High** — this is a broken checkout flow if the cart is in active use.

---

### 9. UpsellDrawer — price hints are vague and the copy is purely functional
**Location:** `/components/UpsellDrawer.tsx`

**Current copy:**
> "Optional add-ons"
> "Saved as Add-ons (coming next). Checkout still works as usual."
> "+ small extra" / "optional add-on"
> "No bundle" / "Gift bundle" / "Premium bundle"

**Issues:**
- "Saved as Add-ons (coming next)" is unfinished product copy that should not be visible to end-users.
- "+ small extra" is too vague to drive action — should show actual prices or ranges.
- "No bundle" is negative framing.
- "Gift bundle" and "Premium bundle" lack any description of what they include.

**Suggested replacements:**
- Remove or hide "Saved as Add-ons (coming next)" — this is an internal note, not customer copy.
- Replace "+ small extra" with real prices when available, or "From $X"
- Replace "No bundle" with "Just my item"
- Add a one-line description for each bundle

**Priority: High** — if this feature is unfinished, hide it; if it is live, it needs proper copy.

---

### 10. DesignConfirmation — "Tweaks left: {n}" is too utilitarian
**Location:** `/components/generation/DesignConfirmation.tsx`, lines 177, 226

**Current copy:**
> "Tweak colours, style, or details. Tweaks left: 3"
> "Tweaks left: 3"
> "You've reached the maximum of 3 tweaks for this design."

**Issues:**
- "Tweaks left" feels like a software counter, not a premium atelier experience.
- The messaging around limits could feel punishing — discourages engagement.

**Suggested replacements:**
- "Refine the colours, style, or composition — 3 refinements included."
- "Refinements remaining: 3"
- "You've used all 3 refinements on this design. Ready to see it on your gift, or start fresh?"

**Priority: High** — this is a key moment in the purchase journey.

---

### 11. TestimonialGrid — subheadline is a duplicate of a section label already above it
**Location:** `/components/TestimonialGrid.tsx`, lines 63–66

**Current copy:**
```
h2: "Loved by Gift-Givers"
sub: "Loved by customers across the UK and US"
```

**Issue:** Both lines use the word "Loved" — awkward repetition. The subheadline also adds almost nothing to the heading.

**Suggested replacement:**
```
h2: "Loved by Gift-Givers"
sub: "Real reviews from customers across the UK and US"
```
Or more on-brand:
```
h2: "What Gift-Givers Are Saying"
sub: "Verified reviews from customers across the UK and US"
```

**Priority: High** — the community page is a trust page; this is its headline.

---

## MEDIUM

### 12. LandingPage hero — email capture section demographic assumption
**Location:** `/app/LandingPage.tsx`, line 888; `/components/SiteFooter.tsx`, line 129

**Current copy:**
> "Join women who love thoughtful gifting · Unsubscribe anytime" (LandingPage footer)
> "Join women who love thoughtful gifting" (SiteFooter heading)

**Issue:** Explicitly gendering the entire customer base to "women" excludes male gift-givers and non-binary customers. The reviews on the homepage include several men (Sarah, Jennifer, etc. are all women — but the shop draws a broader audience). "Thoughtful gift-givers" or "people who love thoughtful gifting" is more inclusive and no less warm.

**Suggested replacement:**
> "Join thousands of thoughtful gift-givers" (SiteFooter heading)
> "Unsubscribe anytime" (footer note — keep as is)

**Priority: Medium** — inclusion matters, but this is not illegal or damaging.

---

### 13. Privacy Policy — email address inconsistency
**Location:** `/app/privacy/page.tsx` and `/app/refunds/page.tsx`

**Issue:** The Privacy Policy uses `privacy@keepsy.co`; the Refunds page uses `support@keepsy.co`; the track page and success page reference `hello@keepsy.store`. Three different email addresses and two different domains (`keepsy.co` vs `keepsy.store`).

**Current:**
- Privacy: `privacy@keepsy.co`
- Refunds: `support@keepsy.co`
- Track/Success: `hello@keepsy.store`
- SiteFooter: `support@keepsy.store`
- Emails (orderEmails.tsx): `hello@keepsy.store`

**Suggested fix:** Decide on one domain (`keepsy.store` appears to be the live domain) and standardise all contact addresses. Recommended:
- General/orders: `hello@keepsy.store`
- Support: `support@keepsy.store`
- Privacy: `privacy@keepsy.store`

**Priority: Medium** — inconsistency erodes trust; customers emailing the wrong address will get no reply.

---

### 14. LandingPage — "Three Simple Steps" section heading is generic
**Location:** `/app/LandingPage.tsx`, line 648

**Current copy:**
> h2: "Three Simple Steps"

**Issue:** "Three Simple Steps" is the most overused heading on the internet. It does nothing to reinforce Keepsy's artisan personality.

**Suggested replacement:**
> "How it Works" with eyebrow "The Process" (already there — just improve the H2)
> or: "From Idea to Doorstep"
> or: "Made Just for You, in Three Moves"

**Priority: Medium**

---

### 15. Shop CatalogClient — empty state is flat
**Location:** `/app/shop/CatalogClient.tsx`, lines 445–457

**Current copy:**
> h: "No products found"
> sub: "Try a different filter."
> button: "Clear filters"

**Issue:** Flat, utilitarian, zero brand personality. This appears when the user selects a category that has no results.

**Suggested replacement:**
> h: "Nothing here quite yet."
> sub: "Try another category — we're always adding new things to the collection."
> button: "Show everything"

**Priority: Medium**

---

### 16. Track page — delivery estimate inconsistency
**Location:** `/app/track/page.tsx` and `/components/OrderSuccess.tsx`

**Current:**
- Track page (Order Summary): "5–10 business days"
- OrderSuccess (hero strip): "Estimated delivery: 5–10 business days"
- InProductionEmail: "5–10 business days"
- Shipping page: UK "2–3 business days after dispatch", US "3–6 business days after dispatch"
- About page (Promises section): "US & UK shipping within 5–7 business days"

**Issue:** The site quotes "5–10 business days" in most places but "5–7" on the About page and "2–3" / "3–6" on the Shipping page. These are contradictory and will cause customer confusion.

**Suggested fix:** Align all estimates. The Shipping page (which breaks out production + dispatch time) is the most credible source. Recommend:
- Production: 2–4 business days
- Dispatch + delivery: UK 2–3 days, US 3–6 days
- Total stated estimate: "5–8 business days for most orders" (replace the inconsistent 5–10 / 5–7 figures)

**Priority: Medium** — customer expectation management.

---

### 17. GenerativeLoader — loading microcopy uses jargon
**Location:** `/components/GenerativeLoader.tsx`, SKETCH_MICRO_COPY_TEMPLATES

**Current messages:**
> "Analyzing the brushstroke density..."
> "Mixing digital pigments..."
> "Preparing the canvas for {region} standards..."
> "Finalizing the 1-of-1 artifact..."

**Issues:**
- "Analyzing the brushstroke density" — this is pseudo-technical theatre that doesn't hold up to scrutiny.
- "Preparing the canvas for {region} standards" — the `{region}` replacement produces "Preparing the canvas for UK standards" which sounds like it's setting up a compliance process, not making art.
- "Finalizing the 1-of-1 artifact" — "artifact" is a technical/archaeological term; "1-of-1" is a crypto/NFT trope. Neither fits the warm artisan voice.

**Suggested replacements:**
> "Warming up the brushes..."
> "Mixing just the right colours..."
> "Composing your design..."
> "Adding the finishing details..."

**Priority: Medium** — loading states are a brand moment, not just a spinner.

---

### 18. GenerationLoadingOverlay — "Calibrating pigments" repeats the jargon issue
**Location:** `/components/GenerationLoadingOverlay.tsx`, line 67

**Current copy:**
> "Calibrating pigments — this usually takes a moment."

**Issue:** "Calibrating pigments" is faux-technical. Sounds like printer firmware, not an atelier.

**Suggested replacement:**
> "Bringing your design to life — this usually takes about 20 seconds."

**Priority: Medium**

---

### 19. DesignConfirmation — "Back to prompt" link is internal-facing language
**Location:** `/components/generation/DesignConfirmation.tsx`, line 111

**Current copy:**
> "Back to prompt"

**Issue:** Customers don't think in terms of "prompt" — that's a developer/AI-tool term. They think "my idea" or "my description".

**Suggested replacement:**
> "Back to my description"
> or simply: "Change my idea"

**Priority: Medium**

---

### 20. GiftingStep — section header is internal-sounding
**Location:** `/components/GiftingStep.tsx`, line 45

**Current copy:**
> "Optional gifting details"
> "Personalised gifting is skipped."

**Issues:**
- "Optional gifting details" reads like a form field label, not an invitation.
- "Personalised gifting is skipped." is unnecessarily blunt and slightly cold.

**Suggested replacements:**
> "Make it extra special (optional)"
> "Add a personal touch" (with a skip option labelled "Keep it simple")
> When skipped: "Gifting details not added." or "Skipped for now." (warmer, less final-sounding)

**Priority: Medium**

---

### 21. FAQ component — only 3 questions, and one is barely a question
**Location:** `/components/FAQ.tsx`

**Current FAQs:**
1. "How fast can I make a gift?" — A: "Most customers finish in under 10 minutes from upload to checkout."
2. "When will my order arrive?" — A: "Typical dispatch is 2–4 business days. See full details on our shipping page."
3. "Can I request a refund?" — A: "Yes. If your item arrives damaged or incorrect, we'll make it right."

**Issues:**
- FAQ 1 answer is about speed of *creating*, not about speed of delivery — the question wording implies speed of the whole process, which may mislead.
- FAQ 2 says "dispatch is 2–4 business days" but the shipping page says "production is 2–4 business days" — these are different things.
- Only 3 FAQs is thin. Customers want to know: Can I customise text? What if my image quality is poor? Can I preview before paying? Do you ship internationally? What print method is used?
- "Can I request a refund?" is an oddly formal framing; real customers ask "What if I'm not happy with it?"

**Suggested additions:**
> "Can I preview my design before I pay?" — Yes. You'll see it on your chosen product before going to checkout.
> "What if my photo quality is poor?" — We'll let you know if your image might affect print quality before you order.
> "Can I change my order after I've placed it?" — Once in production, we can't make changes, so take your time reviewing the preview.

**Priority: Medium** — FAQs are a customer service and SEO asset.

---

### 22. RegionSelector modal — heading is clunky
**Location:** `/components/RegionSelector.tsx`, line 103

**Current copy:**
> h2: "View your local Keepsy experience"
> sub: "See local gift ideas and holiday inspiration."

**Issue:** "View your local Keepsy experience" is marketing speak — vague and a bit corporate. The sub adds almost nothing.

**Suggested replacement:**
> h2: "Where are you shopping from?"
> sub: "We'll show you local prices, shipping times, and seasonal occasions."

**Priority: Medium**

---

### 23. OrderSuccess hero — exclamation mark is informal British punctuation
**Location:** `/components/OrderSuccess.tsx`, line 118

**Current copy:**
> "It's On Its Way!"

**Issue:** Title Case + exclamation mark reads as excited-American rather than warm-British. The entire hero section is in sentence case elsewhere, making this inconsistent.

**Suggested replacement:**
> "It's on its way."
> or: "Your order is confirmed."

**Priority: Medium** — minor tonal inconsistency, but visible on a high-emotion page.

---

### 24. Community page — eyebrow says "Customer Reviews" but page metadata title says "Reviews | Keepsy"
**Location:** `/app/community/page.tsx`, lines 7 and 39

**Current:**
- metadata title: `"Reviews | Keepsy"`
- eyebrow: `"Customer Reviews"`
- H1: `"Real Gifts. Real Reactions."`

**Issue:** The page metadata title is just "Reviews" which is generic for SEO. A better title would be "Customer Stories & Reviews | Keepsy" — matching the stated brand name for this page.

**Suggested metadata title:**
> `"Real Stories, Real Reactions | Keepsy Reviews"`

**Priority: Medium** — SEO and brand consistency.

---

### 25. About page hero — heading is somewhat limiting
**Location:** `/app/about/AboutClient.tsx`, line 66–67

**Current copy:**
> h1: "Two Sons, One Mission: Make Her Smile"

**Issue:** "Make Her Smile" gendering (same issue as footer — excludes non-female recipients). Also slightly twee. The body copy beneath is excellent — honest, warm, specific. The headline should match that register.

**Suggested replacement:**
> "Two Sons, One Mission: Make Mum Smile"
(This is more specific and charming — it's *literally* their story — without excluding male shoppers)
> or: "Built by Two Lads Who Couldn't Find the Right Gift"

**Priority: Medium** — the current version is tolerable but the suggested version is stronger.

---

### 26. TrackPage / NotFound — error messages are functional but cold
**Location:** `/app/track/page.tsx`, `NotFound` function, line 55

**Current copy:**
> `No order found for reference "${ref}".`

**Issue:** The error message dumps the raw ref back into the UI — this is fine for transparency but the surrounding context needs warmth.

**Current full experience:**
> eyebrow: "Order Not Found"
> h1: "We couldn't find that order"
> p: `No order found for reference "KPS-1234".`

**Suggested improvement:**
> eyebrow: "We looked everywhere"
> h1: "We couldn't find that order"
> p: "We couldn't match that reference to an order. Double-check the link from your confirmation email, or get in touch — we'll track it down."

**Priority: Medium**

---

### 27. About page "By the Numbers" — stat "0 Waste" is technically inaccurate
**Location:** `/app/about/AboutClient.tsx`, line 273

**Current:**
> value: "0 Waste"
> label: "Print on Demand"

**Issue:** Print-on-demand does not equal "zero waste" — there is still packing material, misprints, carrier emissions, etc. This is a greenwashing-adjacent claim without substantiation.

**Suggested replacement:**
> value: "No Overstock"
> label: "Made to Order"
> or: "Zero Landfill" (if you can substantiate it)

**Priority: Medium** — greenwashing claims carry reputational and legal risk.

---

## LOW

### 28. LandingPage — email capture success message uses an emoji
**Location:** `/app/LandingPage.tsx`, line 858; `/components/SiteFooter.tsx`, line 143

**Current copy:**
> "🎉 You're in! Check your inbox for your code."
> "🎉 You're in! Check your inbox."

**Issue:** Emoji in a premium-craft context is slightly inconsistent with the rest of the design language (which is very refined and typographic). Not egregious, but worth reviewing against brand standards.

**Suggested replacement:**
> "Wonderful — your 10% code is on its way."
> "Your discount code is in the post." (metaphorically — warmer British voice)

**Priority: Low**

---

### 29. Shipping page — "Fast & Reliable" eyebrow is generic
**Location:** `/app/shipping/page.tsx`, line 22

**Current copy:**
> eyebrow: "Fast & Reliable"

**Issue:** Every shipping page in the world says "Fast & Reliable". No personality.

**Suggested replacement:**
> "Getting It There"
> or: "From Our Studio to Your Door"

**Priority: Low**

---

### 30. SiteHeader announcement bar uses ⚡ emoji
**Location:** `/components/SiteHeader.tsx`, line 68

**Current copy:**
> "⚡ Fast shipping on every order · Free shipping over £75 (UK) / $75 (US)"

**Issue:** The lightning bolt emoji reads as tech/startup, not artisan. Minor.

**Suggested replacement:**
> "✦ Free shipping over £75 (UK) · $75 (US) · Every order made with care"

**Priority: Low**

---

### 31. ExitGuardian — "the pigment might fade" is charming but semantically odd
**Location:** `/components/ExitGuardian.tsx`, lines 30–31

**Current copy:**
> h2: "Wait."
> p: "Your masterpiece is still cooling in the kiln. If you leave now, the pigment might fade."

**Issue:** This is theatrical and mostly good, but "the pigment might fade" is technically meaningless (pigment doesn't fade from a user leaving). The drama is slightly forced.

**Suggested refinement:**
> h2: "One moment."
> p: "Your design is still being prepared. If you go now, we'll lose your progress."

**Priority: Low** — the current version has personality; this is a taste call.

---

### 32. TrackPage — stepper sub-labels could be warmer
**Location:** `/app/track/page.tsx`, STEPS array, lines 20–24

**Current sub-labels:**
> "Payment received, design queued for print"
> "Being printed on premium materials"
> "With the courier, heading to you"
> "Enjoy your keepsake!"

**Issue:** The first three are functional; the fourth switches to an enthusiastic exclamation. Tone is inconsistent. The first is also very technical ("design queued for print").

**Suggested replacements:**
> "Payment received — your design is being queued"
> "On the press — being printed on premium materials"
> "In the hands of the courier — almost there"
> "Arrived — hope they love it"

**Priority: Low**

---

### 33. OrderConfirmationEmail — "our studio is preparing to bring it to life" is good, but the machine metaphor is too technical
**Location:** `/lib/emails/orderEmails.tsx`, line 111

**Current copy:**
> "Our machines are currently calibrating the pigment density — every detail will be carefully rendered on premium materials before it reaches you."

**Issue:** This sentence is in the confirmation email — one of the most-read pieces of copy in the entire customer journey. "Our machines are currently calibrating the pigment density" is overly technical and slightly cold.

**Suggested replacement:**
> "Your design is in the queue at our print studio — every detail will be faithfully reproduced on premium materials before it makes its way to you."

**Priority: Low** — the rest of the email is excellent.

---

### 34. PromptHelperCollapsible / GuidedPromptPanel — "Guided prompt builder" label is internal jargon
**Location:** `/components/GuidedPromptPanel.tsx`, line 52; `/components/create/PromptHelperCollapsible.tsx`, line 42

**Current copy:**
> "Guided prompt builder" (panel heading)
> "Need help writing it?" (collapsible trigger)

**Issue:** "Prompt builder" is tool jargon. Customers don't know they're "writing a prompt". "Need help writing it?" (in the collapsible) is much better — keep that one. But the panel heading "Guided prompt builder" should be replaced.

**Suggested panel heading:**
> "Build your idea step-by-step"
> or: "Let us help you describe it"

**Priority: Low**

---

### 35. CartDrawer — empty state CTA sends to shop, not create
**Location:** `/components/CartDrawer.tsx`, line 213

**Current:**
> p: "Start creating something beautiful for the people you love."
> button: "Start Shopping"

**Issue:** The body copy says "Start creating" but the button says "Start Shopping" — these go to different pages. The language is misaligned.

**Suggested fix:**
> Either: `body: "Your bag is empty. Let's fill it with something special."` + button: `"Browse the Collection"` → `/shop`
> Or: `body: "Start creating something beautiful for the people you love."` + button: `"Start Creating"` → `/create`
> Pick one direction.

**Priority: Low**

---

### 36. GiftingStep — placeholder "Add a short note..." is underselling the feature
**Location:** `/components/GiftingStep.tsx`, line 113

**Current placeholder:**
> "Add a short note..."

**Issue:** The gift message field is one of the most emotionally powerful parts of the product. "Add a short note..." is generic.

**Suggested placeholder:**
> "e.g. 'Couldn't have asked for a better mum. Love you always.'"

**Priority: Low**

---

### 37. British vs American English inconsistencies throughout
The brand uses British English in most places but slips into American English in several spots.

| Location | American | British |
|---|---|---|
| `/app/terms/page.tsx` line 50 | "calibrate the colors" | "calibrate the colours" |
| `/app/about/AboutClient.tsx` PROMISES | "Effortlessly Personal" (fine) | — |
| `/app/community/page.tsx` metadata | "personalised gifts" (British ✓) | — |
| `/components/GiftAssistantWidget.tsx` | "I am Keepsy's AI gift assistant" (American phrasing, stiff) | "I'm Keepsy's gift guide" |
| `/app/LandingPage.tsx` review quotes | "colors" (within US customer quotes — acceptable) | — |
| `/app/LandingPage.tsx` SOCIAL_PROOF | "Made & Shipped with Love" — "Shipped" is fine, but this is generic | — |

**Action:** Check all authored copy (not user-generated quotes) for American spellings. Key words to audit: color/colour, personalized/personalised, organized/organised, neighbor/neighbour, favorite/favourite.

**Priority: Low**

---

### 38. Missing: product page copy for /product/[type]
**Location:** `/app/product/[type]/page.tsx`

This route exists but was not audited (not provided in the read). If it contains product descriptions, those should follow the same audit criteria above — especially ensuring descriptions are not generic/placeholder.

**Suggested action:** Read `/app/product/[type]/page.tsx` and audit against these standards.

**Priority: Low** (pending review)

---

## Summary Table

| # | Location | Issue | Priority |
|---|---|---|---|
| 1 | `/app/terms/page.tsx` | Legally dubious claims, inaccurate material descriptions | **Critical** |
| 2 | `/app/error.tsx` | Duplicate "Something went wrong" — no brand voice | **Critical** |
| 3 | `/components/SiteFooter.tsx` | "Made with love in the USA" — factually wrong | **High** |
| 4 | `/app/LandingPage.tsx` | "🇺🇸 Made & Shipped with Love" — US-only framing | **High** |
| 5 | `/app/LandingPage.tsx` + footer | "Powered by AI" vs "Handmade with care" — contradictory | **High** |
| 6 | `/app/shop/CatalogClient.tsx` | Review counts hardcoded as "(100+)" | **High** |
| 7 | `/components/GiftAssistantWidget.tsx` | Stiff robot greeting, "AI gift assistant" label | **High** |
| 8 | `/components/CartDrawer.tsx` | TODO in checkout button, sends to /create | **High** |
| 9 | `/components/UpsellDrawer.tsx` | "Saved as Add-ons (coming next)" — dev note visible | **High** |
| 10 | `/components/generation/DesignConfirmation.tsx` | "Tweaks left" — utilitarian counter | **High** |
| 11 | `/components/TestimonialGrid.tsx` | Duplicate "Loved" in heading + subhead | **High** |
| 12 | `/app/LandingPage.tsx` + `/components/SiteFooter.tsx` | "Women only" gifting audience assumption | **Medium** |
| 13 | Privacy / Refunds / Track / Footer | Three email addresses across two domains | **Medium** |
| 14 | `/app/LandingPage.tsx` | "Three Simple Steps" — generic heading | **Medium** |
| 15 | `/app/shop/CatalogClient.tsx` | Empty state is flat | **Medium** |
| 16 | Multiple pages | Delivery estimate inconsistency (5–10 vs 5–7 vs 2–6) | **Medium** |
| 17 | `/components/GenerativeLoader.tsx` | Pseudo-technical loading microcopy | **Medium** |
| 18 | `/components/GenerationLoadingOverlay.tsx` | "Calibrating pigments" — firmware voice | **Medium** |
| 19 | `/components/generation/DesignConfirmation.tsx` | "Back to prompt" — jargon | **Medium** |
| 20 | `/components/GiftingStep.tsx` | "Optional gifting details" — cold/functional | **Medium** |
| 21 | `/components/FAQ.tsx` | Only 3 FAQs, one is inaccurate | **Medium** |
| 22 | `/components/RegionSelector.tsx` | "View your local Keepsy experience" — vague | **Medium** |
| 23 | `/components/OrderSuccess.tsx` | "It's On Its Way!" — inconsistent case/tone | **Medium** |
| 24 | `/app/community/page.tsx` | Metadata title is generic | **Medium** |
| 25 | `/app/about/AboutClient.tsx` | Hero headline gendering | **Medium** |
| 26 | `/app/track/page.tsx` | NotFound error is cold | **Medium** |
| 27 | `/app/about/AboutClient.tsx` | "0 Waste" — greenwashing-adjacent | **Medium** |
| 28 | `/app/LandingPage.tsx` + Footer | Emoji in email capture confirmation | **Low** |
| 29 | `/app/shipping/page.tsx` | "Fast & Reliable" — generic eyebrow | **Low** |
| 30 | `/components/SiteHeader.tsx` | ⚡ emoji in announcement bar | **Low** |
| 31 | `/components/ExitGuardian.tsx` | "the pigment might fade" — semantically odd | **Low** |
| 32 | `/app/track/page.tsx` | Stepper sub-labels inconsistent in tone | **Low** |
| 33 | `/lib/emails/orderEmails.tsx` | Confirmation email — "calibrating pigment density" | **Low** |
| 34 | `/components/GuidedPromptPanel.tsx` | "Guided prompt builder" — jargon | **Low** |
| 35 | `/components/CartDrawer.tsx` | Empty state CTA direction mismatch | **Low** |
| 36 | `/components/GiftingStep.tsx` | Gift message placeholder undersells the feature | **Low** |
| 37 | Multiple | British/American English inconsistencies | **Low** |
| 38 | `/app/product/[type]/page.tsx` | Not audited — requires review | **Low** |

---

## What Is Working Well

These copy elements are strong and should be preserved as brand benchmarks:

- **Hero headline** (`"Gifts They'll Never Forget."`) — simple, emotional, memorable.
- **About page origin story** — honest, specific, human. Dan and Rory are named; the problem is concrete. This is the brand at its best.
- **About page mission quote** (`"The best gift isn't the most expensive one. It's the one that says: I remembered."`) — excellent.
- **Email subject lines** — warm and specific (`"Your Keepsy order is being crafted"`, `"Your order has arrived — we'd love your thoughts"`).
- **Delivered email body** — the paragraph about hoping the gift "carries the meaning you intended" is genuinely moving.
- **404 page** — the "taking a tea break" line is charming and perfectly Keepsy.
- **OrderSuccess "What Happens Next" section** — clear, warm, properly structured.
- **Refunds page** — honest, no-nonsense, appropriately brief.
- **ExitGuardian** — "Your masterpiece is still cooling in the kiln" is theatrical but earns it.
- **DesignConfirmation primary CTA** — "Show me how this will look on my gift" is customer-centric and specific.
- **Community page H1** — "Real Gifts. Real Reactions." is excellent.
