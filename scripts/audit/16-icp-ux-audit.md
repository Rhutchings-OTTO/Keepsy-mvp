# ICP UX Audit — "Karen, 47, from Surrey"
## Keepsy — Full Site Walkthrough Through the Eyes of the Primary Buyer

**Auditor role:** Behavioural psychologist specialising in consumer behaviour and digital usability for non-tech-native users.

**ICP:** Woman aged 35–55, buys gifts for family, uses phone more than laptop, comfortable with Amazon, distrusts jargon, will leave in 5 seconds if she doesn't understand what the site does, doesn't know what AI is or care. Biggest fears: "Will it look like the picture?" and "Will it arrive in time?"

---

## HOMEPAGE FIRST IMPRESSION (5-second test)

### Finding 1 — Footer: "Powered by AI" — SHOWSTOPPER
**Issue from Karen's perspective:** The footer contains the line "Powered by AI". Karen does not know what AI is. To her, this phrase signals either a robot, something experimental, or a tech company trying to be clever. It does not make her feel like she's buying a gift from a trusted brand. It makes her feel like she's accidentally landed on a startup project.

**What she thinks/feels:** "This is one of those AI things. My son was talking about those. I don't know what it means but I'm not sure I trust it. I just want a nice hoodie for Dave."

**Fix:** Remove "Powered by AI" from the footer entirely. Replace with: "Made with care, delivered with love." or simply remove it. The tech behind the product is irrelevant to her.

**Priority: Showstopper** — she will bounce if this is the first thing she reads while skimming the footer.

---

### Finding 2 — Hero headline "Gifts They'll Never Forget" — GOOD but subhead underperforms
**Issue:** The hero headline is strong. The subheading — "Turn your favourite photos and memories into beautiful, personalised keepsakes — mugs, cards, tees, hoodies" — is also clear and plain English. This part is working well.

**What she thinks:** "Oh, I could get Dave a personalised hoodie. That's nice."

**Assessment:** Pass. No fix needed.

---

### Finding 3 — Two CTAs on hero: "Shop the Collection" and "Create Your Own" — CONFUSING
**Issue:** Two equal-weight CTAs on the hero creates a decision paralysis moment. More critically, "Create Your Own" is ambiguous — it sounds like she has to do design work herself, using design tools. This is intimidating to Karen.

**What she thinks:** "Create my own? I don't know how to design things. Maybe I'll just look at the Shop one."

**Fix:** Make "Shop the Collection" the primary CTA (it is, visually, but the gap between them is small). Consider renaming "Create Your Own" to "Design a Personal Gift" or "Make It Personal" — language that says she's giving instructions, not doing graphic design.

**Priority: Confusing**

---

### Finding 4 — Navigation: "Create" label — CONFUSING
**Issue:** The site header navigation shows: Shop | Gift Ideas | Create | Reviews. "Create" to Karen sounds like she needs to do something difficult, like make something in Photoshop. She doesn't associate "Create" with buying a gift.

**What she thinks/feels:** "Create? Create what? I don't want to create anything, I want to buy something."

**Fix:** Rename nav item "Create" to "Personalise" or "Design a Gift". This tells her exactly what she's doing — personalising a gift — not that she has to create something from scratch.

**Priority: Confusing**

---

### Finding 5 — Mobile header CTA: "Start Creating" — CONFUSING
**Issue:** The primary mobile CTA button in the header says "Start Creating". This has the same problem as Finding 4 but worse — it's the most prominent button on mobile.

**What she thinks:** "Start creating? I'm not an artist."

**Fix:** Change "Start Creating" (in SiteHeader.tsx, both desktop and mobile) to "Make a Gift" or "Personalise a Gift".

**Priority: Confusing**

---

### Finding 6 — Mobile menu CTA: "Start Creating" — CONFUSING
**Issue:** The mobile overlay bottom CTA is also "Start Creating".

**Fix:** Same as Finding 5. Change to "Make a Gift".

**Priority: Confusing**

---

## NAVIGATION & WAYFINDING

### Finding 7 — Shop page CTA per product: "Personalise Now" — GOOD
**Assessment:** The shop page correctly uses "Personalise Now" as the CTA per product. This is the right language. Pass.

---

### Finding 8 — Shop product links go to /create not /product/[type] — CONFUSING
**Issue:** Every product card's "Personalise Now" button links directly to `/create?product=hoodie` (etc), bypassing any product detail page. Karen never sees size guides, material details, or photos of the product before starting the create flow.

**What she thinks/feels:** "Wait, where are the details? What size should I get? What does it look like on a real person?"

**Fix:** Product cards should link to `/product/[type]` first, then the product detail page should be the gateway to the create flow. This is where material info, size guides, and lifestyle photos live (or should).

**Priority: Confusing**

---

## THE "CREATE" EXPERIENCE

### Finding 9 — "Generate preview" button label — SHOWSTOPPER
**Issue:** The main action button in CreatePageLayoutLean.tsx reads "Generate preview". "Generate" is AI/tech jargon. Karen doesn't know what "generate" means in this context. She understands "Make", "Create", "Show me", "Preview".

**What she thinks:** "Generate? What does that mean? Is this going to do something weird?"

**Fix:** Change button text from "Generate preview" to "Create my design" or "Make my design".

**Priority: Showstopper** — this is the most important button on the entire page.

---

### Finding 10 — Loading state: "Creating your design..." — GOOD
**Assessment:** The loading state already says "Creating your design..." which is perfect. Consistent with the fix above.

---

### Finding 11 — GiftAssistantWidget: "AI Gift Assistant" — SHOWSTOPPER
**Issue:** The floating widget button says "AI gift assistant" (file: GiftAssistantWidget.tsx, line 167). The widget header also says "AI Gift Assistant" (line 97). This is a direct "AI" label in the UI.

**What Karen thinks:** "AI? What's that? Is this one of those chatbot things? I don't want to talk to a robot." She closes it immediately or ignores it, losing the most useful discovery tool on the page.

**Fix:** Rename to "Gift Ideas Helper" or "Need help choosing?" or "Get inspiration". Remove all references to "AI" from the label and widget header.

**Priority: Showstopper**

---

### Finding 12 — GiftAssistantWidget: Opening message references "AI gift assistant" — SHOWSTOPPER
**Issue:** The first message in the widget reads: "Hi, I am Keepsy's AI gift assistant. Tell me who this gift is for and your style." (GiftAssistantWidget.tsx, line 56/68).

**Fix:** Change to: "Hi! I'm here to help you find the perfect gift. Who are you buying for?"

**Priority: Showstopper** — this compounds Finding 11.

---

### Finding 13 — GiftAssistantWidget: Suggestion "Help me write a prompt" — SHOWSTOPPER
**Issue:** One of the suggestion chips in the widget reads "Help me write a prompt" (line 12 in GiftAssistantWidget.tsx). "Prompt" is AI developer jargon. Karen has never heard this word in a gift context. She will be confused and possibly put off.

**What she thinks:** "Write a what? What's a prompt? This is getting confusing."

**Fix:** Change to "Help me describe what I want" or "Help me get started". Also update the other suggestion "Make it funny but tasteful" to be more natural: "Something fun and cheeky" or keep it as-is (it's fine).

**Priority: Showstopper**

---

### Finding 14 — DesignConfirmation: "Back to prompt" button — CONFUSING
**Issue:** The back button on the design confirmation step reads "Back to prompt" (DesignConfirmation.tsx, line 111).

**What she thinks:** "Back to... prompt? What's a prompt?"

**Fix:** Change to "← Change my description" or "← Start again".

**Priority: Confusing**

---

### Finding 15 — DesignConfirmation: "Review your artwork" label — MINOR
**Issue:** The section label at the top reads "Review your artwork" (line 116). This is fine but slightly passive. Could be warmer.

**Fix:** Change to "Here's your design" or "Does this look right?"

**Priority: Minor**

---

### Finding 16 — PromptHelperCollapsible: "Use this prompt" button — CONFUSING
**Issue:** The builder widget's apply button says "Use this prompt" (PromptHelperCollapsible.tsx, line 100).

**Fix:** Change to "Use this description" or "Apply this".

**Priority: Confusing**

---

### Finding 17 — CreatePageLayoutLean: Textarea label says "prompt" indirectly through placeholder — MINOR
**Issue:** The textarea label reads "Describe the gift you want to make" (line 206) which is fine. The placeholder reads "Example: A warm floral mug design for Mum's birthday" — this is excellent. No "prompt" language here.

**Assessment:** Pass. This part is already good.

---

### Finding 18 — CreatePageLayoutLean: "Tips for best results" collapsible — MINOR
**Issue:** The "Tips for best results" collapsible (line 225) contains good guidance. However the phrasing leans slightly technical ("prompts work best"). The section is hidden by default, so the damage is limited.

**Fix:** Change "Simple, descriptive prompts work best" inside the tips list to "Simple descriptions work best — the more specific you are, the better."

**Priority: Minor**

---

### Finding 19 — "Back to prompt" in DesignConfirmation — already noted as Finding 14. Skip duplicate.

---

### Finding 20 — MerchGeneratorPlatform Step 3: "Configure your gift" label — MINOR
**Issue:** The product configuration panel uses the label "Configure your gift" (MerchGeneratorPlatform.tsx, line 1077). "Configure" is tech language.

**Fix:** Change to "Customise your gift" or "Choose your options".

**Priority: Minor**

---

### Finding 21 — Step 3 panel: No delivery estimate visible before add to cart — CONFUSING
**Issue:** Karen's biggest fear is "Will it arrive in time?" The product configuration step (Step 3) shows the price and colour/size options, but there is no delivery estimate visible before she hits "Add to Cart". The delivery estimate only appears inside the Cart Drawer after adding. Karen needs this reassurance much earlier.

**Fix:** Add a delivery estimate beneath the price on Step 3: "Estimated delivery: [date range]" using the same `getEstimatedDelivery()` function already used in CartDrawer.

**Priority: Confusing**

---

### Finding 22 — No material information or size context on Step 3 — CONFUSING
**Issue:** When Karen selects a hoodie, she sees the product name and price but no material details (cotton %, GSM weight, softness). She has no idea if this is cheap or premium. She also can't tell if a Medium will fit Dave.

**Fix:** Add a brief material callout under the product name: e.g., "Soft fleece hoodie, 320gsm — premium quality that lasts." The size guide button exists ("View size guide") but is very small and easy to miss on mobile. Make it more prominent.

**Priority: Confusing**

---

## PRODUCT UNDERSTANDING

### Finding 23 — No real product photos on the product page or create flow — SHOWSTOPPER
**Issue:** Karen's primary fear is "Will it actually look like the picture?" The mockup renderer in Step 3 shows a rendered mockup, not a photo of an actual printed product on a real person. There are no lifestyle photos of someone actually wearing a hoodie with a custom design printed on it. This is a significant trust gap.

**What she thinks:** "That looks like a computer picture. But will the real hoodie actually look like that? What will the print quality be like? What if it arrives and looks nothing like this?"

**Fix:** Add at minimum one "real product" photo below the mockup on Step 3 — a genuine photo of a printed hoodie/mug/card showing print quality. Even a small "quality assurance" photo strip would significantly reduce anxiety here.

**Priority: Showstopper** — this is her biggest stated fear.

---

### Finding 24 — Success page shows "Session:" with a technical session ID — CONFUSING
**Issue:** The success page (app/success/page.tsx, line 133) shows "Session: [long session ID string]" in a visible panel. This is developer information that makes the page look broken or technical to Karen.

**What she thinks:** "Session? What does that mean? Is something wrong with my order?"

**Fix:** Remove the "Session:" line from the visible success page panel entirely. It serves no user-facing purpose.

**Priority: Confusing**

---

### Finding 25 — Success page "Status: PROCESSING" in uppercase — CONFUSING
**Issue:** The success page (line 144) shows "Status: PROCESSING" in bold uppercase terracotta text. This looks like a warning or error state to Karen.

**What she thinks:** "Processing? Is there a problem? Did my payment go through?"

**Fix:** Either remove this status line from the visible UI, or replace it with friendlier language: "Your order is being prepared" in normal weight text.

**Priority: Confusing**

---

## TRUST & REASSURANCE

### Finding 26 — Emails: "The Keepsy Atelier" sign-off — CONFUSING
**Issue:** Every email (orderEmails.tsx) is signed "— The Keepsy Atelier". "Atelier" is a French word meaning workshop/studio, used commonly in luxury fashion. Karen, 47, from Surrey does not know what "Atelier" means. It sounds pretentious, possibly foreign, and creates a slight sense of distance rather than warmth.

**What she thinks:** "The Keepsy... Atelier? Is that French? Is this a proper company? Seems a bit fancy."

**Fix:** Change all "— The Keepsy Atelier" sign-offs to "— The Keepsy Team" or "— Keepsy" or "With love, the Keepsy team". Warm, human, simple.

**Priority: Confusing**

---

### Finding 27 — Order confirmation email: "Our machines are currently calibrating the pigment density" — SHOWSTOPPER
**Issue:** The order confirmation email (orderEmails.tsx, line 111) contains: "Our machines are currently calibrating the pigment density — every detail will be carefully rendered on premium materials before it reaches you."

"Calibrating the pigment density" is completely meaningless to Karen. It sounds industrial, technical, and possibly alarming. She has no idea whether this is normal or means something is wrong.

**What she thinks:** "Calibrating the pigment density? What does that mean? Is there something wrong with my order? Why is a machine calibrating things?"

**Fix:** Replace the entire paragraph body with: "We've received your order and our team is preparing it for print. You'll get another email when it's on its way."

**Priority: Showstopper** — this is the email she receives right after paying. It's the most important trust moment.

---

### Finding 28 — Order confirmation email: "Your vision is taking form" — MINOR
**Issue:** The email headline says "Your vision is taking form." This is theatrical/artistic copy. Karen thinks she's buying a hoodie, not commissioning a sculpture.

**Fix:** Change to "Your order is confirmed!" or "Thanks for your order, [Name]!" — warm, clear, reassuring.

**Priority: Minor** (but reinforces the atelier/theatrical tone issue).

---

### Finding 29 — In-production email: "5–10 business days" delivery estimate — CONFUSING
**Issue:** The in-production email states "Estimated delivery: 5–10 business days" (orderEmails.tsx, line 157). This is vague. Karen's key fear is "Will it arrive in time?" A date range of 5–10 days spanning potentially 2 calendar weeks tells her nothing useful.

**Fix:** Replace with a calculated estimated arrival date where possible: "Expected to arrive: [Mon 15 March] – [Fri 19 March]". If dynamic dates aren't available, use: "Usually arrives within 5–7 days of shipping."

**Priority: Confusing**

---

### Finding 30 — No phone number or live chat visible — CONFUSING
**Issue:** There is no phone number, WhatsApp, or live chat anywhere on the site. The only contact method visible is hello@keepsy.store in the footer and via email reply on the delivered email. Karen, who is anxious about online purchases, wants to know someone real is there if something goes wrong.

**Fix:** Add a clearly visible "Any questions? Email us at hello@keepsy.store" to the homepage and to the create flow. Even a mailto: link styled as a button would help enormously. Consider adding it to the footer more prominently.

**Priority: Confusing**

---

### Finding 31 — Returns policy not visible before checkout — CONFUSING
**Issue:** The 30-day returns policy is mentioned in the trust badges (TrustSection, AboutClient) but is not visible during the checkout/cart flow. When Karen opens the CartDrawer to check out, she sees "Secure Checkout · Handmade With Care · 30-Day Returns" in tiny 11px text at the bottom, but there is no link to the full refund policy.

**Fix:** In CartDrawer.tsx, make "30-Day Returns" a clickable link to /refunds. Also add a one-line "Not happy? Free returns within 30 days." above the checkout button in the cart, in larger text.

**Priority: Confusing**

---

### Finding 32 — Cart shows "Calculated at checkout" for shipping when below free threshold — CONFUSING
**Issue:** When Karen's cart is below the free shipping threshold, the CartDrawer shows shipping as "Calculated at checkout" (CartDrawer.tsx, line 461). This is a conversion killer. She has no idea what she's about to be charged for shipping and will hesitate or abandon.

**Fix:** Show an approximate shipping cost: "From £3.99" or the actual shipping rate if known. "Calculated at checkout" feels like a hidden cost and triggers the "what if it's expensive" anxiety.

**Priority: Confusing**

---

### Finding 33 — Region gateway blocks the entire homepage on first visit — CONFUSING
**Issue:** New visitors who haven't been to the site before see the PremiumGateway (region selector) full-screen before they can see any content. This is before Karen even knows what the site sells. She has to pick US or UK before she can browse.

**What she thinks:** "What is this? I haven't even seen the website yet and it's asking me questions."

**Fix:** This is a structural decision, but at minimum the gateway should show a headline above the region selector: "Where should we ship your gift?" with a brief one-line description visible ("Beautiful personalised gifts, shipped to your door"). Ideally, make the region selector non-blocking — detect region automatically or ask after she's shown interest.

**Priority: Confusing**

---

## CHECKOUT

### Finding 34 — Cart items always show £ symbol regardless of region — CONFUSING
**Issue:** In CartDrawer.tsx, all prices are hardcoded with the £ symbol (lines 79, 147, 178, 451, 466, etc.) regardless of whether the user has selected US as their region. A US customer who selected USD region will see £ prices in the cart, which is confusing and untrustworthy.

**Fix:** Use region-aware currency formatting in CartDrawer, consistent with the rest of the site.

**Priority: Confusing**

---

### Finding 35 — Checkout button says "Checkout" — MINOR
**Issue:** The CartDrawer checkout button says simply "Checkout" (line 491). This is functional but could be warmer and more action-oriented.

**Fix:** Change to "Go to Secure Checkout" or "Pay Securely". Both add a trust signal while being clear.

**Priority: Minor**

---

## LANGUAGE AUDIT — Full List of Flagged Terms

| Term Found | Location | Fix |
|---|---|---|
| "Powered by AI" | LandingPage.tsx footer (line 783) | Remove entirely |
| "AI gift assistant" | GiftAssistantWidget.tsx (lines 97, 167) | Change to "Gift Ideas Helper" |
| "AI gift assistant" | GiftAssistantWidget.tsx initial message (lines 56, 68) | Change to "Hi! I'm here to help you find the perfect gift..." |
| "Help me write a prompt" | GiftAssistantWidget.tsx SUGGESTIONS (line 12) | Change to "Help me describe what I want" |
| "Generate preview" | CreatePageLayoutLean.tsx button (line 307) | Change to "Create my design" |
| "Back to prompt" | DesignConfirmation.tsx (line 111) | Change to "← Change my description" |
| "Start Creating" | SiteHeader.tsx desktop CTA (line 325) | Change to "Make a Gift" |
| "Start Creating" | SiteHeader.tsx mobile menu CTA (line 217) | Change to "Make a Gift" |
| "Use this prompt" | PromptHelperCollapsible.tsx (line 100) | Change to "Use this description" |
| "The Keepsy Atelier" | orderEmails.tsx (lines 124, 159, 204, 239, 297) | Change to "The Keepsy Team" |
| "calibrating the pigment density" | orderEmails.tsx (line 111) | Rewrite paragraph entirely |
| "Configure your gift" | MerchGeneratorPlatform.tsx (line 1077) | Change to "Customise your gift" |
| "Simple, descriptive prompts work best" | CreatePageLayoutLean.tsx tips (line 244) | Change to "Simple descriptions work best" |
| "Design" (create flow metadata) | create/page.tsx description "Describe your memory, pick a product, and we'll bring it to life with AI." | Change to "...and we'll bring it to life." |
| "Session:" technical ID | success/page.tsx (line 133) | Remove from visible UI |
| "Status: PROCESSING" | success/page.tsx (line 144) | Replace with plain-language message |

---

## EMOTIONAL JOURNEY ANALYSIS

**When Karen feels excited:**
- Seeing the hero headline "Gifts They'll Never Forget" — strong emotional hook
- Seeing product images and prices ("From $23") — browsable, accessible
- The reviews section — very effective, especially Carol B's review about being "NOT a tech person"
- The "How It Works" three-step section — reassuring and clear
- Seeing the design appear on the mockup

**When Karen feels anxious or confused:**
- The gateway blocking the page before she's seen anything
- The word "Create" in navigation
- "Generate preview" button — sounds technical
- "AI gift assistant" widget — she ignores or distrusts it
- "Calibrating the pigment density" email — she panics
- "The Keepsy Atelier" sign-off — slight distance/pretension
- "Status: PROCESSING" on the success page — looks like an error
- Shipping "Calculated at checkout" — hidden cost fear

**When Karen might give up and go to Moonpig:**
1. After clicking "Create" in the nav — unclear what she's about to do
2. When the "Generate preview" button appears — too technical
3. After receiving the order confirmation email with "calibrating the pigment density"
4. On the success page if she sees "Session:" and "Status: PROCESSING"

**When Karen might feel stupid:**
- The "AI gift assistant" widget label implies she needs to know what AI means
- "Help me write a prompt" assumes she knows what a prompt is
- "Back to prompt" after reviewing her design

---

## OVERALL SCORE

### Would Karen buy a hoodie for her husband's birthday on this site?

**Score: 5.5 / 10**

**Explanation:**

The site has a strong foundation. The visual design is warm, premium, and trustworthy. The hero copy is clear. The reviews are excellent and relatable (Carol B. is particularly effective). The three-step "How It Works" section is well-written. The product pricing is visible. The cart experience includes reassuring elements like "No account required" and "Secure checkout".

However, there are five showstopper issues that directly threaten Karen's journey:
1. "Powered by AI" in the footer signals tech-experiment, not trusted gift brand
2. "Generate preview" button is the single most important button on the create page, and it uses jargon
3. "AI Gift Assistant" widget repels rather than helps the ICP
4. The order confirmation email contains "calibrating the pigment density" — sends her to Google or to abandon trust
5. No real product lifestyle photos — her biggest fear ("will it look like the picture?") is never addressed

With these five issues fixed, the score would rise to approximately **8/10**. The remaining gap would be closed by: a clearly visible contact method, shipping costs before checkout, and a smarter delivery date estimate.

Karen would most likely get to the "Generate preview" step, read the button, feel uncertain, pause, and then either press it anyway (50% chance) or close the tab and go to Notonthehighstreet.com or Moonpig (50% chance). If she presses it and sees a design she likes, she will likely buy — the mockup step and product preview are genuinely good. The biggest loss points are language/trust, not product quality.

---

*Audit completed: 2026-03-08*
*All file references verified against codebase at /Users/roryhutchings/keepsy-mvp*
