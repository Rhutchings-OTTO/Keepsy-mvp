# Keepsy WCAG 2.1 AA Accessibility Audit

**Date:** 2026-03-08
**Audited by:** Code-only static analysis (no live browser)
**Standard:** WCAG 2.1 Level AA
**Scope:** All page components and UI components in `/app` and `/components`

---

## Executive Summary

The codebase has a solid accessibility foundation in several areas: `<html lang="en">` is set, most interactive elements use semantic `<button>` or `<Link>`, form labels are largely properly associated, modal dialogs use `role="dialog" aria-modal="true"`, and the generation loading overlay has `role="status" aria-live="polite"`. However, there are 19 distinct issues ranging from Critical to Low that require remediation for WCAG 2.1 AA compliance.

---

## PERCEIVABLE

---

### A-01 — No skip-to-content link
**WCAG:** 2.4.1 Bypass Blocks
**Priority:** Critical (legal risk)
**File:** `/Users/roryhutchings/keepsy-mvp/app/layout.tsx` + `/Users/roryhutchings/keepsy-mvp/components/SiteChrome.tsx`

**What's wrong:** There is no skip navigation link anywhere in the shell. Keyboard-only users must Tab through the entire SiteHeader (logo, 4 nav links, cart button, CTA button) on every page before reaching main content. On the create page, the header is absent, but no skip link is provided either.

**How to fix:** Add a visually hidden skip link as the very first focusable element in `SiteChrome.tsx` (or `layout.tsx`), positioned before `<SiteHeader />`:

```tsx
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[9999] focus:rounded-lg focus:bg-charcoal focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
>
  Skip to main content
</a>
```

Add `id="main-content"` to the `<main>` element in `SiteChrome.tsx`.

---

### A-02 — Meaningful alt text missing on checkout preview thumbnail
**WCAG:** 1.1.1 Non-text Content
**Priority:** High
**File:** `/Users/roryhutchings/keepsy-mvp/app/MerchGeneratorPlatform.tsx` line 1283

**What's wrong:** The order summary thumbnail uses `alt="thumb"` — this is not meaningful alt text.

```tsx
<Image src={checkoutPreviewImage} alt="thumb" fill />
```

**How to fix:** Replace with descriptive alt text: `alt={`Preview of your ${checkoutItemDescription}`}` or `alt="Your custom design preview"`.

---

### A-03 — Meaningful alt text missing on community showcase images
**WCAG:** 1.1.1 Non-text Content
**Priority:** Medium
**File:** `/Users/roryhutchings/keepsy-mvp/app/MerchGeneratorPlatform.tsx` line 1392

**What's wrong:** Community gallery images use `alt="Community design"` — all images share the same generic alt text with no distinguishing information.

**How to fix:** If the images have no distinct metadata, mark them as decorative: `alt=""` (with `aria-hidden="true"` on the parent `MagneticCard`). If they represent actual designs, provide creator-specific alt text, e.g. `alt={`Design by creator_${idx + 1}`}`.

---

### A-04 — Low contrast: muted text colours (#ink-muted, #ink-faint)
**WCAG:** 1.4.3 Contrast (Minimum)
**Priority:** Critical (legal risk)
**Files:** `/Users/roryhutchings/keepsy-mvp/app/globals.css`, multiple components

**What's wrong:** The design system defines two semantic text colours that fall below the 4.5:1 ratio required for normal text on the cream background (`#FDF6EE`):

| Token | Value | Background | Approx. Contrast | Required |
|---|---|---|---|---|
| `--ink-muted` | `rgba(45,41,38,0.62)` | `#FDF6EE` (cream) | ~3.8:1 | 4.5:1 |
| `--ink-faint` | `rgba(45,41,38,0.40)` | `#FDF6EE` (cream) | ~2.2:1 | 4.5:1 |

`--ink-faint` is used extensively in footer column headings, payment badge labels, copyright text, and "We accept" heading. `--ink-muted` is used for body text and link text throughout `SiteFooter.tsx`, `LandingPage.tsx`, and `CreatePageLayoutLean.tsx`.

**How to fix:**
- Raise `--ink-muted` to at least `rgba(45,41,38,0.75)` (~4.6:1 on cream) for text used at normal body size.
- `--ink-faint` must never be used for text that conveys information; limit it to purely decorative text or raise it significantly. For the footer category headings and copyright text, either raise opacity to ~0.60 or use a different colour entirely.
- For small text (under 14px bold / 18px regular) the contrast requirement is still 4.5:1.

---

### A-05 — Low contrast: `text-charcoal/55` and similar Tailwind opacity utilities on white backgrounds
**WCAG:** 1.4.3 Contrast (Minimum)
**Priority:** High
**Files:** Multiple — `SiteHeader.tsx`, `CartDrawer.tsx`, `CreatePageLayoutLean.tsx`, `DesignConfirmation.tsx`, `GiftingStep.tsx`, many others

**What's wrong:** Tailwind classes like `text-charcoal/55`, `text-charcoal/45`, `text-charcoal/35`, `text-charcoal/30` are used for secondary text on white (`bg-white`) card backgrounds. Charcoal is `#2D2926`. On white:

| Class | Approx. hex | Contrast on white | Required |
|---|---|---|---|
| `/55` | ~`#8A8582` | ~3.6:1 | 4.5:1 |
| `/45` | ~`#9E9B99` | ~2.9:1 | 4.5:1 |
| `/35` | ~`#B4B2B1` | ~2.2:1 | 4.5:1 |
| `/30` | ~`#BCBAB9` | ~2.1:1 | 4.5:1 |

These are used for secondary descriptions, price hints, product sub-labels, placeholder descriptions in the cart, and timestamp-style text.

**How to fix:** Audit every use of these opacity suffixes for text. Raise secondary body text to at minimum `/70` on white backgrounds. Consider defining semantic tokens (e.g. `--text-secondary`, `--text-tertiary`) with pre-calculated accessible values rather than relying on opacity modifiers.

---

### A-06 — Low contrast: white/85 and white/75 text on terracotta marquee background
**WCAG:** 1.4.3 Contrast (Minimum)
**Priority:** High
**File:** `/Users/roryhutchings/keepsy-mvp/app/LandingPage.tsx` line 506

**What's wrong:** The social proof marquee uses `text-white/85` on the terracotta background (`#C4714A`). White at 85% opacity gives approximately ~3.9:1 contrast against `#C4714A` — below 4.5:1. The separator uses `text-white/30` — approximately 1.3:1 (decorative, less concern).

**How to fix:** Use full `text-white` (5.4:1 against `#C4714A`). The separator dot can remain decorative with lower contrast.

---

### A-07 — Marquee animation has no `prefers-reduced-motion` override
**WCAG:** 2.3.3 Animation from Interactions (AAA), but also 1.4.12 and user expectation for 2.1 AA compliance
**Priority:** Medium
**File:** `/Users/roryhutchings/keepsy-mvp/app/LandingPage.tsx` lines 491–500

**What's wrong:** The social proof marquee uses a perpetual CSS animation (`marquee-run 22s linear infinite`). There is no `@media (prefers-reduced-motion: reduce)` rule to pause or disable it. Users with vestibular disorders may find continuous lateral motion disorienting or nausea-inducing. The `.marquee-run:hover` pause helps mouse users only.

**How to fix:** Add a media query in the inline `<style>` block:
```css
@media (prefers-reduced-motion: reduce) {
  .marquee-run { animation: none; }
}
```

---

### A-08 — Information conveyed by colour alone (product colour swatches)
**WCAG:** 1.4.1 Use of Color
**Priority:** High
**File:** `/Users/roryhutchings/keepsy-mvp/app/MerchGeneratorPlatform.tsx` lines 1111–1122

**What's wrong:** The selected state of a colour swatch is indicated by `border-terracotta ring-4 ring-terracotta/20` (a coloured ring) with no additional non-colour cue. The `aria-pressed={selectedColor === c.hex}` attribute is present (good), but the visual ring alone may be insufficient for users who have difficulty perceiving colour differences (e.g. colourblind users distinguishing a terracotta ring from a charcoal ring on a coloured swatch).

**How to fix:** Add a visible checkmark or tick mark icon overlaid on the selected swatch, or a clear border change that doesn't rely solely on hue. Example:
```tsx
{selectedColor === c.hex && (
  <Check size={14} className="absolute inset-0 m-auto text-white drop-shadow" aria-hidden />
)}
```

---

## OPERABLE

---

### B-01 — Mobile overlay (`MobileOverlay`) lacks focus trap
**WCAG:** 2.1.2 No Keyboard Trap (inverse — focus must be *contained* in modal)
**Priority:** Critical (legal risk)
**File:** `/Users/roryhutchings/keepsy-mvp/components/SiteHeader.tsx` lines 81–175

**What's wrong:** When the mobile menu opens, there is no focus trap. Focus is not moved to the overlay on open, and Tab can escape the overlay into the now-hidden background content. The overlay also lacks `role="dialog"` and `aria-modal="true"`.

**How to fix:**
1. Add `role="dialog" aria-modal="true" aria-label="Navigation menu"` to the `motion.div`.
2. On open, move focus to the first nav link or the close button.
3. Implement a focus trap (using `focus-trap-react` or a custom hook) so Tab cycles only within the overlay while it is open.
4. On close, return focus to the hamburger button that opened it.

---

### B-02 — Internal cart panel in `MerchGeneratorPlatform` lacks ARIA dialog semantics and focus management
**WCAG:** 2.1.2, 4.1.3
**Priority:** High
**File:** `/Users/roryhutchings/keepsy-mvp/app/MerchGeneratorPlatform.tsx` lines 1442–1514

**What's wrong:** The `motion.aside` cart panel rendered inside `MerchGeneratorPlatform` has no `role="dialog"`, no `aria-modal`, no `aria-label`, no focus management on open, and the close button lacks `aria-label`:

```tsx
<button onClick={() => setIsCartOpen(false)} className="text-charcoal/50 hover:text-charcoal">
  <X size={20} />  {/* no aria-label */}
</button>
```

The quantity adjustment buttons also lack `aria-label`:
```tsx
<button onClick={() => handleAdjustQuantity(item.id, -1)} className="...">-</button>
<button onClick={() => handleAdjustQuantity(item.id, 1)} className="...">+</button>
```

Note: The separate `CartDrawer.tsx` component is correctly implemented with `role="dialog" aria-modal="true" aria-label="Shopping cart"`. This duplicate cart inside `MerchGeneratorPlatform` is the problem.

**How to fix:** Either remove the duplicate cart in `MerchGeneratorPlatform` and rely solely on `CartDrawer.tsx`, or bring it to the same standard: add `role="dialog"`, `aria-modal="true"`, `aria-label`, focus management, and meaningful `aria-label` on all icon-only buttons.

---

### B-03 — Checkout "Securing" overlay lacks screen reader announcement
**WCAG:** 4.1.3 Status Messages
**Priority:** High
**File:** `/Users/roryhutchings/keepsy-mvp/app/MerchGeneratorPlatform.tsx` lines 1319–1350

**What's wrong:** The optimistic "Securing your Masterpiece" overlay that appears when checkout is initiated has no `role="status"` or `aria-live` attribute. Screen reader users get no feedback that a checkout is in progress.

**How to fix:** Add `role="status" aria-live="polite" aria-label="Securing your order, redirecting to checkout"` to the outer `motion.div`.

---

### B-04 — `GiftAssistantWidget` chat interface missing ARIA roles and labels
**WCAG:** 4.1.2 Name, Role, Value
**Priority:** High
**File:** `/Users/roryhutchings/keepsy-mvp/components/GiftAssistantWidget.tsx`

**What's wrong:**
- The open panel `div` has no `role="dialog"`, `aria-modal`, or `aria-label`.
- The chat message list has no `role="log"` or `aria-live="polite"` — new assistant responses are not announced to screen readers.
- The close button reads only "Close" as text — adequate, but the text is tiny (`text-xs`) and has no minimum touch target.
- The input field has no `<label>` — only a placeholder (`placeholder="e.g. mum + cat + cozy"`).
- The open trigger button text "AI gift assistant" is adequate but the icon `MessageCircleHeart` needs `aria-hidden="true"` (it already has it — good).

**How to fix:**
1. Add `role="dialog" aria-modal="true" aria-label="AI Gift Assistant"` to the panel `div`.
2. Add `role="log" aria-live="polite" aria-label="Conversation"` to the messages container.
3. Add an associated `<label htmlFor="gift-assistant-input">` or `aria-label` on the `<input>`.
4. Ensure the close button meets 44×44px touch target minimum.

---

### B-05 — `SizeGuideDrawer` tab buttons lack `tabpanel` association
**WCAG:** 4.1.2 Name, Role, Value
**Priority:** Medium
**File:** `/Users/roryhutchings/keepsy-mvp/components/products/SizeGuideDrawer.tsx` lines 73–94

**What's wrong:** The Imperial/Metric toggle uses `role="tablist"` and `role="tab"` on buttons with `aria-selected`, but the associated content panel (the table) lacks `role="tabpanel"`, `id`, and the buttons lack `aria-controls` pointing to it.

**How to fix:**
```tsx
<div role="tablist" ...>
  <button role="tab" aria-selected={unit === "imperial"} aria-controls="size-panel" id="tab-imperial" ...>
  <button role="tab" aria-selected={unit === "metric"} aria-controls="size-panel" id="tab-metric" ...>
</div>
<div role="tabpanel" id="size-panel" aria-labelledby={unit === "imperial" ? "tab-imperial" : "tab-metric"}>
  <table>...</table>
</div>
```

---

### B-06 — Desktop nav link active state has insufficient focus indicator contrast
**WCAG:** 2.4.11 Focus Appearance (AA in 2.2, but 2.4.7 in 2.1)
**Priority:** Medium
**File:** `/Users/roryhutchings/keepsy-mvp/components/SiteHeader.tsx` line 226

**What's wrong:** Nav links use `focus-visible:ring-2 focus-visible:ring-black/20` — a 20% opacity black ring. On the white pill nav background, this provides approximately 1.6:1 contrast for the focus ring — well below the 3:1 minimum for focus indicators required by WCAG 2.4.7 / 2.4.11.

**How to fix:** Use a higher-contrast focus ring. `focus-visible:ring-charcoal` or `focus-visible:ring-terracotta` with full opacity (minimum 3:1 against adjacent colours). For example:
```
focus-visible:ring-2 focus-visible:ring-charcoal/60
```

---

### B-07 — `PromptHelperCollapsible` toggle button missing `aria-controls`
**WCAG:** 4.1.2 Name, Role, Value
**Priority:** Low
**File:** `/Users/roryhutchings/keepsy-mvp/components/create/PromptHelperCollapsible.tsx` line 40

**What's wrong:** The collapsible button has `aria-expanded={expanded}` (good) but no `aria-controls` attribute pointing to the expandable content panel. This makes it harder for AT users to jump directly to the revealed content.

**How to fix:**
```tsx
<button aria-expanded={expanded} aria-controls="prompt-helper-panel" ...>
<div id="prompt-helper-panel" ...>
```

---

### B-08 — `Carousel` component: dot buttons do not indicate currently active slide
**WCAG:** 4.1.2 Name, Role, Value
**Priority:** Medium
**File:** `/Users/roryhutchings/keepsy-mvp/components/ui/Carousel.tsx` lines 109–117

**What's wrong:** The dot navigation buttons use `aria-label={`Go to slide ${i + 1}`}` — good. However, the currently active dot is indicated only by visual size/colour change (`w-6 bg-charcoal/70` vs `w-2 bg-charcoal/25`), with no `aria-current="true"` or `aria-pressed="true"` attribute. Screen readers cannot identify which slide is currently visible.

**How to fix:** Add `aria-current={i === index ? "true" : undefined}` to each dot button.

---

## UNDERSTANDABLE

---

### C-01 — Email input in landing page footer email capture has no label
**WCAG:** 1.3.1 Info and Relationships, 3.3.2 Labels or Instructions
**Priority:** High
**File:** `/Users/roryhutchings/keepsy-mvp/app/LandingPage.tsx` line 869

**What's wrong:** The email capture form inside the forest-green section uses `placeholder="Your email address"` but has no associated `<label>` and no `aria-label` or `aria-labelledby`. Placeholders disappear on input and are not a substitute for labels.

```tsx
<input
  type="email"
  required
  value={emailValue}
  onChange={(e) => setEmailValue(e.target.value)}
  placeholder="Your email address"
  className="..."
  // no aria-label or associated label
/>
```

**How to fix:** Add `aria-label="Email address"` or wrap in a `<label>`:
```tsx
<label htmlFor="landing-email-input" className="sr-only">Email address</label>
<input id="landing-email-input" type="email" ... />
```

---

### C-02 — Sort dropdown in shop catalog has no label
**WCAG:** 1.3.1, 3.3.2
**Priority:** High
**File:** `/Users/roryhutchings/keepsy-mvp/app/shop/CatalogClient.tsx` line 410

**What's wrong:** The sort `<select>` has no `<label>`, no `aria-label`, and no `aria-labelledby`. The adjacent icon (`SlidersHorizontal`) is decorative and provides no semantic association.

**How to fix:**
```tsx
<label htmlFor="sort-select" className="sr-only">Sort products</label>
<select id="sort-select" ...>
```

---

### C-03 — Inline error for checkout is not associated with the triggering field
**WCAG:** 3.3.1 Error Identification
**Priority:** High
**File:** `/Users/roryhutchings/keepsy-mvp/app/MerchGeneratorPlatform.tsx` line 1259–1263

**What's wrong:** The checkout error message (`checkoutError`) is rendered as a plain `<p>` tag below the checkout button with no `role="alert"`, `aria-live`, or association back to the button. Screen readers will not automatically announce this error.

```tsx
{checkoutError && (
  <p className="mt-3 rounded-xl px-4 py-3 text-sm font-semibold" style={...}>
    {checkoutError}
  </p>
)}
```

Similarly, the inline refinement error in `DesignConfirmation.tsx` (line 255) uses a plain `<p>` without `role="alert"`.

**How to fix:** Use `role="alert"` (for assertive) or `aria-live="polite"` on error containers. For field-level errors, add `aria-describedby` on the form control pointing to the error `id`.

---

### C-04 — Refinement textarea in `DesignConfirmation` has no accessible label
**WCAG:** 1.3.1, 3.3.2
**Priority:** Medium
**File:** `/Users/roryhutchings/keepsy-mvp/components/generation/DesignConfirmation.tsx` line 246

**What's wrong:** The refinement `<textarea>` has only a placeholder (`placeholder={PLACEHOLDERS[placeholderIndex]}`). There is a `<h3>` heading "Tell us what you'd like to change" above it, but it is not associated with the textarea via `aria-labelledby`.

**How to fix:**
```tsx
<h3 id="refinement-label" ...>Tell us what you'd like to change</h3>
...
<textarea aria-labelledby="refinement-label" ...>
```

---

### C-05 — Prompt textarea in `CreatePageLayoutLean` uses `<label>` wrapping but `<span>` as visual label
**WCAG:** 1.3.1
**Priority:** Low
**File:** `/Users/roryhutchings/keepsy-mvp/components/create/CreatePageLayoutLean.tsx` lines 204–221

**What's wrong:** The textarea is wrapped with a `<label>` element containing a `<span>` as the visible label, which is a valid implicit association pattern. However, this only works if the `<textarea>` is the only form control inside the `<label>` element — which it is here. This pattern is acceptable, but the `<span>` content changes depending on `createMode` and the `<label>` has no `for` / `htmlFor`, meaning some ATs may struggle. Additionally, the label text is rendered at `text-sm font-medium text-charcoal/60` — the `/60` opacity on cream gives approximately 3.4:1, below 4.5:1.

**How to fix:** Make the association explicit:
```tsx
<label htmlFor="prompt-textarea">
  <span className="...">Describe the gift...</span>
</label>
<textarea id="prompt-textarea" ...>
```
And raise label text to minimum `text-charcoal/75` for adequate contrast.

---

## ROBUST

---

### D-01 — `EntryGateway` (PremiumGateway) keyboard accessibility: hover-only expand effect
**WCAG:** 2.1.1 Keyboard
**Priority:** Medium
**File:** `/Users/roryhutchings/keepsy-mvp/components/EntryGateway.tsx`

**What's wrong:** The UK/US split buttons expand on `onMouseEnter`/`onMouseLeave`. Keyboard users focusing the button via Tab will not see the expansion effect, and there is no `onFocus`/`onBlur` handler. This is purely cosmetic but the visual feedback that indicates which option is "active" is absent for keyboard users.

**How to fix:** Add `onFocus={() => setHovered(region)}` and `onBlur={() => setHovered(null)}` to each `motion.button`.

---

### D-02 — `MerchGeneratorPlatform` product selector buttons have no `aria-pressed` or selection announcement
**WCAG:** 4.1.2 Name, Role, Value
**Priority:** Medium
**File:** `/Users/roryhutchings/keepsy-mvp/app/MerchGeneratorPlatform.tsx` lines 1082–1101

**What's wrong:** The product selection buttons in the step-3 panel (the grid of product tiles: Mug, Tee, Hoodie, Card) have no `aria-pressed` attribute. Their selected state (indicated by `border-terracotta` border colour) is conveyed only visually.

```tsx
<motion.button
  onClick={() => { setSelectedProduct(prod); ... }}
  className={`rounded-xl border-2 p-4 ... ${selectedProduct.id === prod.id ? "bg-white ..." : "..."}`}
  // no aria-pressed
>
```

The equivalent buttons in `CreatePageLayoutLean.tsx` (step 1 product grid) also lack `aria-pressed`.

**How to fix:** Add `aria-pressed={selectedProduct.id === prod.id}` to all product toggle buttons.

---

### D-03 — Loading state during image refinement is not announced to screen readers
**WCAG:** 4.1.3 Status Messages
**Priority:** Medium
**File:** `/Users/roryhutchings/keepsy-mvp/components/generation/DesignConfirmation.tsx` lines 125–130

**What's wrong:** The refinement spinner ("Updating your design…") is shown inside the image container as a visual spinner and text, but the container has no `aria-live` or `role="status"`. Screen readers will not announce that a refinement is in progress.

```tsx
{isRefining ? (
  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-xl bg-[#F5EDE0]">
    <div className="w-8 h-8 border-2 ... animate-spin" />  {/* no aria-label */}
    <span className="text-sm font-semibold text-charcoal/60">Updating your design…</span>
  </div>
)}
```

**How to fix:**
```tsx
<div
  className="..."
  role="status"
  aria-live="polite"
  aria-label="Updating your design, please wait"
>
```

Also add `aria-hidden="true"` to the spinner `div` (it is purely decorative next to the text).

---

## Summary Table

| ID | WCAG Criterion | Location | Priority |
|---|---|---|---|
| A-01 | 2.4.1 Bypass Blocks | `app/layout.tsx`, `components/SiteChrome.tsx` | **Critical** |
| A-02 | 1.1.1 Non-text Content | `app/MerchGeneratorPlatform.tsx:1283` | High |
| A-03 | 1.1.1 Non-text Content | `app/MerchGeneratorPlatform.tsx:1392` | Medium |
| A-04 | 1.4.3 Contrast | `app/globals.css` — `--ink-muted`, `--ink-faint` tokens | **Critical** |
| A-05 | 1.4.3 Contrast | Multiple — `text-charcoal/55` and lower | High |
| A-06 | 1.4.3 Contrast | `app/LandingPage.tsx:506` — marquee text | High |
| A-07 | 2.3.3 Animation | `app/LandingPage.tsx:491` — marquee | Medium |
| A-08 | 1.4.1 Use of Color | `app/MerchGeneratorPlatform.tsx:1111` — colour swatches | High |
| B-01 | 2.1.2 No Keyboard Trap | `components/SiteHeader.tsx` — mobile overlay | **Critical** |
| B-02 | 2.1.2, 4.1.3 | `app/MerchGeneratorPlatform.tsx:1442` — internal cart | High |
| B-03 | 4.1.3 Status Messages | `app/MerchGeneratorPlatform.tsx:1319` — securing overlay | High |
| B-04 | 4.1.2 Name, Role, Value | `components/GiftAssistantWidget.tsx` | High |
| B-05 | 4.1.2 Name, Role, Value | `components/products/SizeGuideDrawer.tsx` | Medium |
| B-06 | 2.4.7 Focus Visible | `components/SiteHeader.tsx:226` — nav focus ring | Medium |
| B-07 | 4.1.2 Name, Role, Value | `components/create/PromptHelperCollapsible.tsx:40` | Low |
| B-08 | 4.1.2 Name, Role, Value | `components/ui/Carousel.tsx:109` | Medium |
| C-01 | 1.3.1, 3.3.2 | `app/LandingPage.tsx:869` — email input | High |
| C-02 | 1.3.1, 3.3.2 | `app/shop/CatalogClient.tsx:410` — sort select | High |
| C-03 | 3.3.1 Error Identification | `app/MerchGeneratorPlatform.tsx:1259`, `components/generation/DesignConfirmation.tsx:255` | High |
| C-04 | 1.3.1, 3.3.2 | `components/generation/DesignConfirmation.tsx:246` | Medium |
| C-05 | 1.3.1 | `components/create/CreatePageLayoutLean.tsx:204` | Low |
| D-01 | 2.1.1 Keyboard | `components/EntryGateway.tsx` | Medium |
| D-02 | 4.1.2 Name, Role, Value | `app/MerchGeneratorPlatform.tsx:1082` | Medium |
| D-03 | 4.1.3 Status Messages | `components/generation/DesignConfirmation.tsx:125` | Medium |

---

## What Is Already Good

The following patterns are correctly implemented and should be preserved:

- `<html lang="en">` is set in `app/layout.tsx`. ✓
- The generation loading overlay uses `role="status" aria-live="polite"` (`components/GenerationLoadingOverlay.tsx`). ✓
- `CartDrawer.tsx` correctly uses `role="dialog" aria-modal="true" aria-label="Shopping cart"` with cart icon buttons having `aria-label`. ✓
- `RegionSelector.tsx` uses `role="dialog" aria-modal="true" aria-label="Choose your region"` and moves focus to the first button on open. ✓
- `SizeGuideDrawer.tsx` uses `role="dialog" aria-modal="true"` and handles Escape key. ✓
- `UpsellDrawer.tsx` uses `role="dialog" aria-modal="true"`. ✓
- `BottomSheetNav.tsx` uses `aria-current="page"` for the active tab link. ✓
- All decorative SVG icons use `aria-hidden`. ✓
- The `Carousel` component has keyboard arrow-key navigation. ✓
- `SiteHeader.tsx` cart button has a descriptive `aria-label` that includes item count. ✓
- `MerchGeneratorPlatform.tsx` colour and size selection uses `aria-pressed`. ✓
- The `BeforeAfterSlider` range input has `aria-label="Before and after comparison slider"`. ✓
- `prefers-reduced-motion` is respected for Framer Motion animations via `useReducedMotionPref()`. ✓
- Form fields in `GiftingStep.tsx` use the implicit label-wrapping pattern consistently. ✓
- Social icons in `SiteFooter.tsx` use `aria-label` on anchor tags. ✓
- `PromptHelperCollapsible.tsx` toggle button uses `aria-expanded`. ✓

---

## Recommended Fix Priority Order

1. **A-01** — Skip link (1 hour, low risk)
2. **B-01** — Mobile menu focus trap (2–3 hours, medium complexity)
3. **A-04** — Ink-muted / ink-faint colour tokens (1 hour, review for visual regression)
4. **A-05** — Charcoal opacity text audit (2 hours, widespread)
5. **C-01, C-02** — Missing form labels (30 mins each)
6. **C-03** — Error message announcements (1 hour)
7. **B-02** — MerchGeneratorPlatform internal cart (1–2 hours)
8. **B-03, D-03** — Missing loading state announcements (30 mins each)
9. **A-06** — Marquee contrast (15 mins)
10. **A-07** — Marquee reduced-motion (15 mins)
11. Remaining Medium/Low issues (ongoing)
