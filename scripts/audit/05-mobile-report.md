# Keepsy Mobile UX Audit
**Audited:** 2026-03-08
**Method:** Static code analysis — no live browsing
**Auditor:** Claude (mobile UX specialist mode)

---

## Executive Summary

Keepsy has a solid mobile foundation. The BottomSheetNav, a full-screen hamburger overlay, cart drawer that goes full-width on mobile, and safe-area inset support are all well-implemented. The biggest risks are on the Create page (Step 3 specifically), where a fixed-width sidebar + two-column sticky layout will break at 375 px, and a missing `fontSize: 16px` on the main prompt textarea (the most-used input on the site), which will trigger iOS auto-zoom. There are also several small touch-target violations and one confirmed horizontal overflow source in the shop filters bar.

Priority summary: 3 HIGH · 5 MEDIUM · 5 LOW

---

## 1. LAYOUT

### [HIGH] Create Page Step 3 — sidebar + sticky panel breaks at 375 px

**Device/viewport:** 375 px (iPhone SE / iPhone 14 Pro in portrait)
**File:** `/Users/roryhutchings/keepsy-mvp/app/MerchGeneratorPlatform.tsx` lines 1014–1063

```tsx
<div className="sticky top-24 flex gap-0">
  <DesignVaultSidebar  // fixed pixel width: 140px when expanded
    ...
    className="self-start shrink-0"
  />
  <div className="flex-1 min-w-0">
    ...MockupRenderer...
  </div>
</div>
```

The `DesignVaultSidebar` renders at a hard-coded `width: collapsed ? 48 : 140` (inline style in `DesignVaultSidebar.tsx` line 37). The parent is `flex gap-0` with no column-stack breakpoint. On a 375 px screen, 140 px sidebar + MockupRenderer squeezed into the remaining 235 px (minus 16 px padding each side = 203 px effective) will render the mockup extremely narrow. There is no `md:` or `sm:` breakpoint to collapse this into a single column. The sidebar simply does not appear on mobile since entries are only shown when the vault has entries, but as soon as a user generates two+ designs in a session, the vault appears and the layout breaks.

**Suggested fix:** Wrap the sidebar + mockup div in `flex-col lg:flex-row`. On mobile, render the vault as a horizontal scrollable strip above the mockup rather than a sidebar. Alternatively, hide the vault sidebar below `lg` breakpoint entirely and use the existing vault entries in a different UI slot.

**Priority:** HIGH

---

### [HIGH] Create Page Step 3 — two-column product/checkout grid with `grid-cols-1 items-start gap-8 lg:grid-cols-[1.1fr_0.9fr]` but the sticky panel has `top-24`

**Device/viewport:** Any mobile
**File:** `/Users/roryhutchings/keepsy-mvp/app/MerchGeneratorPlatform.tsx` line 1014

`sticky top-24` means the mockup panel sticks 96 px from the top. On mobile there is no desktop header, only the bottom nav (56 px) + bottom padding. The `top-24` offset will cause the sticky panel to be partially hidden behind the SiteHeader (which is `sticky top-0`). The header is approximately 56–64 px tall on mobile. `top-24` (96 px) is fine for desktop but wastes significant vertical space on mobile.

**Suggested fix:** Use `sticky top-[calc(3.5rem+1px)] lg:top-24` or derive the offset from a CSS variable so it tracks the actual header height.

**Priority:** MEDIUM (degraded UX, not broken)

---

### [HIGH] Horizontal overflow — shop filter bar

**Device/viewport:** 375 px
**File:** `/Users/roryhutchings/keepsy-mvp/app/shop/CatalogClient.tsx` lines 383–425

The filter bar uses `flex items-center justify-between gap-4 py-4 overflow-x-auto scrollbar-hide`. The category pills are in `flex items-center gap-2 flex-shrink-0` and the sort dropdown is also `flex-shrink-0`. Both sides are `flex-shrink-0`, meaning neither can compress. On a 375 px screen with the full "All / Mugs / Tees / Hoodies / Cards" pill set plus the sort control, the total width will exceed 375 px. The `overflow-x-auto` will let the whole bar scroll, which is workable but the sort control will be cut off on initial render.

**Suggested fix:** Move the sort control to its own row below the pills on mobile, or make the pill row independently scrollable with a fixed sort button on the right that does not participate in the horizontal scroll.

**Priority:** HIGH

---

### [MEDIUM] Landing page hero — two-column grid starts at mobile width with no explicit single-column fallback

**Device/viewport:** 375–640 px
**File:** `/Users/roryhutchings/keepsy-mvp/app/LandingPage.tsx` line 398

```tsx
<div className="grid min-h-[90vh] items-center gap-10 py-16 lg:grid-cols-[3fr_2fr] lg:gap-16 lg:py-24">
```

This correctly single-columns below `lg`. However `min-h-[90vh]` applied to a single-column layout at 375 px means the hero requires nearly the full viewport height just for the first section. The 4-image product gallery grid (`grid-cols-2 gap-3`) then appears stacked below the headline within that same section. On a short phone (667 px height, iPhone SE), the hero text will not be visible without scrolling, and the CTAs sit below the fold.

**Suggested fix:** Replace `min-h-[90vh]` with `min-h-[auto] lg:min-h-[90vh]` and reduce mobile vertical padding from `py-16` to `py-10 lg:py-16`.

**Priority:** MEDIUM

---

### [MEDIUM] SizeGuideDrawer — table with `min-w-[320px]` can overflow on very small screens

**Device/viewport:** 320–360 px
**File:** `/Users/roryhutchings/keepsy-mvp/components/products/SizeGuideDrawer.tsx` line 97

The table has `min-w-[320px]` inside `overflow-x-auto`, which is correct. However the outer drawer modal itself uses `w-full` with `p-5` padding — that is 10 px padding each side = 320 px available content width at 340 px viewport. The table at exactly 320 px will be flush to the edge. At 320 px (Galaxy S5) the table content will be visually cramped without being technically broken because of the overflow wrapper.

**Suggested fix:** Reduce the drawer's horizontal padding to `p-4 sm:p-5` on mobile, or lower `min-w` to `280px`.

**Priority:** LOW

---

### [LOW] SiteChrome — no viewport meta tag visible in layout

**Device/viewport:** All
**File:** `/Users/roryhutchings/keepsy-mvp/app/layout.tsx`

There is no explicit `<meta name="viewport" content="width=device-width, initial-scale=1">` in the root layout. Next.js 13+ App Router injects this automatically, so it is not strictly a bug. However it would be worth confirming Next.js is not overriding it (e.g., with `initial-scale=1, maximum-scale=1` which would block pinch-zoom for accessibility). As long as Next.js defaults are used, this is fine, but the layout does not export a `viewport` export from `layout.tsx` which is the explicit Next.js 13 way to control this.

**Suggested fix:** Add `export const viewport: Viewport = { width: "device-width", initialScale: 1 }` to `layout.tsx` to make the intent explicit and prevent framework changes from silently altering behavior.

**Priority:** LOW

---

## 2. TOUCH TARGETS

### [HIGH] Announcement bar dismiss button — below 44 px minimum

**Device/viewport:** All mobile
**File:** `/Users/roryhutchings/keepsy-mvp/components/SiteHeader.tsx` lines 69–77

```tsx
<button
  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 hover:bg-white/20 transition"
>
  <X size={12} />
</button>
```

`p-1` = 4 px padding on each side. With a 12 px icon, the effective tap target is 20 px × 20 px. WCAG 2.5.5 requires 44 × 44 px. This is less than half the minimum. Users on mobile will consistently miss this button and likely cannot dismiss the banner.

**Suggested fix:** Change to `p-2.5` (10 px padding → 32 px target) or add an explicit `min-h-[44px] min-w-[44px]` with `flex items-center justify-center`.

**Priority:** HIGH

---

### [MEDIUM] Cart item quantity buttons — 28 px tap targets

**Device/viewport:** All mobile
**File:** `/Users/roryhutchings/keepsy-mvp/components/CartDrawer.tsx` lines 153–170

```tsx
<button className="flex h-7 w-7 items-center justify-center ...">−</button>
<button className="flex h-7 w-7 items-center justify-center ...">+</button>
<button className="flex h-7 w-7 items-center justify-center ..."><Trash2 /></button>
```

`h-7 w-7` = 28 px × 28 px. These three buttons (decrease, increase, remove) are all 28 px targets and they are grouped close together within the cart item row. Three 28 px buttons within approximately 90 px horizontal space means they are nearly adjacent — a missed tap will hit the wrong control.

**Suggested fix:** Increase to `h-10 w-10` (40 px), which is close enough to 44 px to pass practical mobile use while keeping the cart item row compact.

**Priority:** MEDIUM

---

### [MEDIUM] Inline cart in Create Page (MerchGeneratorPlatform) quantity buttons — 28–32 px targets

**Device/viewport:** All mobile
**File:** `/Users/roryhutchings/keepsy-mvp/app/MerchGeneratorPlatform.tsx` lines 1487–1492

```tsx
<button onClick={...} className="px-2 py-1 border border-charcoal/10 rounded-md">-</button>
<button onClick={...} className="px-2 py-1 border border-charcoal/10 rounded-md">+</button>
```

`px-2 py-1` = 8 px / 4 px padding with a single-character label gives approximately 24–28 px tall targets. Same issue as CartDrawer.

**Suggested fix:** Use `min-h-[44px] min-w-[44px]` or `px-3 py-2.5`.

**Priority:** MEDIUM

---

### [MEDIUM] GiftAssistantWidget — "Send" and "Use suggestion" buttons — 28–30 px targets

**Device/viewport:** All mobile
**File:** `/Users/roryhutchings/keepsy-mvp/components/GiftAssistantWidget.tsx` lines 137–154

Both action buttons use `py-1.5` (6 px padding) with `text-xs`, resulting in approximately 28–30 px tall targets. The widget sits at `fixed bottom-4 right-4` and the buttons share a `flex gap-2` row, making them easy to mis-tap.

**Suggested fix:** Increase to `py-2.5` (10 px) or `min-h-[44px]`.

**Priority:** MEDIUM

---

### [LOW] Refinement helper chips — approximately 32–34 px tall

**Device/viewport:** All mobile
**File:** `/Users/roryhutchings/keepsy-mvp/components/generation/DesignConfirmation.tsx` line 235

```tsx
<button className="px-3 py-1.5 rounded-lg text-sm font-semibold ...">{chip}</button>
```

`py-1.5` = 6 px padding, `text-sm` line-height ≈ 20 px = 32 px total. Below the 44 px ideal but these are quick-access helper chips so the lower bar of 36–40 px is acceptable. Still worth nudging to `py-2`.

**Priority:** LOW

---

### [LOW] UpsellDrawer bundle choice buttons — 28–30 px

**Device/viewport:** All mobile
**File:** `/Users/roryhutchings/keepsy-mvp/components/UpsellDrawer.tsx` line 88

```tsx
<button className="rounded-full px-3 py-1 text-xs font-semibold ...">
```

`py-1` = 4 px padding with `text-xs` = approximately 24 px tall. These appear in a bottom sheet, which is the correct pattern, but the buttons themselves are tiny.

**Suggested fix:** Use `py-2` and `text-sm` minimum for interactive buttons in drawers.

**Priority:** LOW

---

## 3. INPUT

### [HIGH] Prompt textarea missing `fontSize: 16px` — will trigger iOS zoom on focus

**Device/viewport:** iPhone (all models) with Safari
**File:** `/Users/roryhutchings/keepsy-mvp/components/create/CreatePageLayoutLean.tsx` line 220

```tsx
<textarea
  ...
  className="min-h-[144px] w-full resize-none rounded-xl border border-charcoal/10 bg-white
             px-4 py-4 text-base leading-7 text-charcoal outline-none ..."
/>
```

`text-base` in Tailwind computes to `1rem` (16 px) — but this depends on the root `font-size` being the browser default of 16 px. iOS Safari zooms in on any input with an effective computed font-size below 16 px. If the root `font-size` is overridden anywhere (or if a parent sets `font-size: 0.875rem`), `text-base` would compute below 16 px and trigger zoom. The safe, explicit approach is to set `style={{ fontSize: "16px" }}` directly on the textarea, which is what the `CartDrawer` gift note textarea already does correctly (line 393 in `CartDrawer.tsx`).

The refinement textarea in `DesignConfirmation.tsx` (line 251) has no explicit font size either — it gets the inherited font size, which could be below 16 px depending on context.

**Suggested fix:** Add `style={{ fontSize: "16px" }}` to all textareas on the site, or add a global CSS rule:
```css
input, textarea, select { font-size: 16px; }
```

This affects:
- `CreatePageLayoutLean.tsx` — main prompt textarea (critical)
- `DesignConfirmation.tsx` — refinement textarea
- `GiftingStep.tsx` — all form inputs
- `GiftAssistantWidget.tsx` — chat input
- `SiteFooter.tsx` — email input
- `LandingPage.tsx` — email input

**Priority:** HIGH

---

### [MEDIUM] GiftingStep form inputs — font size not explicit; keyboard layout concern

**Device/viewport:** iPhone
**File:** `/Users/roryhutchings/keepsy-mvp/components/GiftingStep.tsx` line 17

The `inputCls` string uses `text-sm`, which at 14 px will cause iOS Safari to zoom when these inputs are focused. These inputs appear inside Step 3 of the Create flow, which is already a two-column grid. When the virtual keyboard appears and iOS zooms due to the small font size, the layout will shift significantly and the user will see a confusing viewport change mid-checkout-funnel.

Additionally, the `select` elements for Relationship and Occasion will use iOS native pickers, which is good, but the `date` input for Delivery Date uses a native date picker that may appear in a style incompatible with the rest of the form.

**Suggested fix:** Add `fontSize: "16px"` to all inputs via `inputCls` constant, change `text-sm` to `text-base` for legibility on mobile.

**Priority:** MEDIUM

---

### [MEDIUM] Create page — no bottom padding accounts for BottomSheetNav (56 px) obscuring content

**Device/viewport:** All mobile
**File:** `/Users/roryhutchings/keepsy-mvp/app/MerchGeneratorPlatform.tsx` line 903

```tsx
<div className={`pb-16 px-4 sm:px-6 max-w-7xl mx-auto w-full pt-6`}>
```

`pb-16` = 64 px. The `BottomSheetNav` is 56 px tall + `env(safe-area-inset-bottom)`. On an iPhone 14 (safe area ≈ 34 px), the total nav bar height is ≈ 90 px. The 64 px bottom padding is insufficient — the last interactive element (the "Delete My Data" button and `GenerationLoadingOverlay` dismiss area) will be partially obscured by the bottom nav. The non-Create pages that use `SiteChrome`'s `main` wrapper do not have this explicit `pb-16` and will also be affected if their last content touches the bottom.

**Suggested fix:** Increase to `pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-16` to guarantee clearance on all phones.

**Priority:** MEDIUM

---

### [LOW] Keyboard does not scroll to focused input on Create page

**Device/viewport:** iPhone
**File:** `/Users/roryhutchings/keepsy-mvp/components/create/CreatePageLayoutLean.tsx`

The main prompt textarea sits inside a white card in a `lg:grid-cols-[1.06fr_0.94fr]` layout. On mobile (single column), the card is below the headline section. When the user taps the textarea, iOS will scroll to it and show the keyboard, which should be acceptable. However with `LenisProvider` wrapping the page (in `CreatePage`), smooth-scroll JS may conflict with iOS native scroll-to-input behavior. Lenis overrides `window.scroll` and can prevent the browser from automatically scrolling to bring a focused element into view above the keyboard.

**Suggested fix:** Confirm Lenis is destroyed or paused on the create page for mobile. The `LenisProvider` component should check `window.matchMedia('(pointer: coarse)')` and disable itself on touch devices, or use Lenis's built-in `autoResize` + `wheelEventsTarget` to avoid interfering with native form focus scrolling.

**Priority:** LOW

---

## 4. PERFORMANCE ON MOBILE

### [HIGH] PremiumGateway — Three.js 3D cloud scene on entry screen

**Device/viewport:** All mobile, especially mid-range Android
**File:** `/Users/roryhutchings/keepsy-mvp/components/PremiumGateway.tsx` lines 220–233

Every new visitor to the landing page sees the `PremiumGateway` (when no region cookie is set). After selecting a region, the gateway triggers a 2.5-second Three.js `@react-three/fiber` canvas scene with 60 cloud segments, animated at 60 fps. This runs for 2.5 seconds before the landing page is visible. On a mid-range Android (Snapdragon 665, Adreno 610), a Three.js canvas at full DPR can peg the GPU and cause the 2.5-second wait to stutter heavily.

Mitigating factors: `PerformanceMonitor` + `AdaptiveDpr` + `AdaptiveEvents` are used, and `dpr={[1, 2]}` caps the pixel ratio. However 60 cloud segments at `range={cloudRange}` and `bounds={[10, 2, 2]}` is still heavy.

**Suggested fix:**
1. On mobile (detected by `window.matchMedia('(pointer: coarse)')`), skip the Three.js scene entirely and use a simple CSS fade/slide transition.
2. If keeping the scene, reduce `CLOUD_SEGMENT_COUNT` to 20 on mobile and cap `dpr` to `[1, 1.5]`.
3. The `AdaptiveDpr` already handles graceful degradation but the initial render before the monitor kicks in is still expensive.

**Priority:** HIGH

---

### [MEDIUM] Global mesh gradient background animation — continuous infinite loop

**Device/viewport:** All mobile
**File:** `/Users/roryhutchings/keepsy-mvp/app/globals.css` lines 83–97, `/Users/roryhutchings/keepsy-mvp/components/MeshGradientBackground.tsx`

```css
.mesh-gradient-bg {
  background-size: 200% 200%;
  animation: mesh-oscillate 24s ease-in-out infinite;
}
```

The `MeshGradientBackground` is mounted in `SiteChrome` and applies to the fixed `inset-0` div that persists across all pages. The 24-second `background-position` animation runs continuously even when the user is idle. On older iPhones (iPhone X, A11 chip) or mid-range Android, a continuous GPU-painted background animation adds measurable battery drain and can contribute to animation jank in the foreground.

**Suggested fix:** Add `@media (prefers-reduced-motion: reduce)` to stop the animation. Additionally, consider pausing the animation when the tab is not visible using the Page Visibility API.

**Priority:** MEDIUM

---

### [MEDIUM] Aurora blob animations — 520 px absolute elements with continuous animation

**Device/viewport:** All mobile
**File:** `/Users/roryhutchings/keepsy-mvp/app/globals.css` lines 133–163

The `.aurora-blob` elements are 520 × 520 px with `mix-blend-mode: normal` and a 24-second position animation. These are rendered inside `.aurora-container` which has `filter: blur(88px)`. A `filter: blur(88px)` on a 520 px element triggers a GPU filter pass on every animation frame. On composited layers this can be expensive on older hardware.

**Suggested fix:** Apply `will-change: transform` to the blobs (already helps if compositing) and add `@media (prefers-reduced-motion: reduce) { .aurora-blob { animation: none; } }`. Consider reducing blur to `blur(48px)` on mobile.

**Priority:** LOW

---

### [LOW] Framer Motion animations — many components do not check `useReducedMotion`

**Device/viewport:** All mobile
**Files:** `LandingPage.tsx`, `CatalogClient.tsx`, `DesignConfirmation.tsx`, etc.

The codebase has 46 files using Framer Motion or CSS animations. The `MagneticButton`, `Carousel`, `Reveal`, `KineticHeading`, `ParallaxManifesto`, `MagneticCard`, and `MagneticLink` components correctly check `useReducedMotionPref()`. However the large page-level components — `LandingPage.tsx` (18+ `motion.div` elements), `CatalogClient.tsx`, `MerchGeneratorPlatform.tsx`, `CreatePageLayoutLean.tsx` — do not respect `prefers-reduced-motion` at the page level. They pass `initial`/`animate`/`whileInView` props on dozens of elements unconditionally.

**Suggested fix:** Wrap the `motion` variant objects in a conditional: if `useReducedMotion()` returns true, use `initial={false}` or pass no transition. This also reduces JS work on low-power devices where reduced motion preference is commonly set.

**Priority:** LOW

---

### [LOW] Image optimization — Unsplash image loaded without mobile-appropriate sizing

**Device/viewport:** All mobile
**File:** `/Users/roryhutchings/keepsy-mvp/app/LandingPage.tsx` line 582

```tsx
<Image
  src="https://images.unsplash.com/photo-1536010305525-f7aa0834e2c7?w=800"
  ...
  sizes="(max-width: 1024px) 100vw, 50vw"
/>
```

The `sizes` attribute is correct and Next.js will serve the appropriate size from `deviceSizes`. However the Unsplash URL has a hardcoded `?w=800` query param. Unsplash CDN will serve 800 px regardless of the Next.js Image optimization pipeline. On a 375 px mobile at 2× DPR, Next.js would normally serve a 750 px-optimized WebP, but Unsplash's 800 px JPEG will be served directly from Unsplash's CDN and then transformed. The format override (`?w=800`) bypasses the optimal crop. Not critical but suboptimal.

**Suggested fix:** Remove the `?w=800` suffix and let Next.js handle sizing via its `remotePatterns` configuration, or change to a local image.

**Priority:** LOW

---

## 5. MOBILE-SPECIFIC UX

### Navigation: GOOD with caveats

The mobile navigation architecture is well-considered:
- `SiteHeader` shows a hamburger (Menu icon, 22 px with `p-2` = 44 px effective target — passes)
- `MobileOverlay` is a full-screen modal with large nav links (`min-h-[64px]` — passes) and a `min-h-[52px]` CTA button — passes
- `BottomSheetNav` has `minHeight: 56px` per tab and uses `env(safe-area-inset-bottom)` — good
- Body scroll lock is implemented in both the header overlay and the cart drawer — good

**Caveat 1:** The landing page (`/`) does not use `SiteHeader`. It has its own inline header (in `LandingPage.tsx`). On mobile, this header has no hamburger menu. It shows only the logo and a "Shop Now" CTA. The BottomSheetNav is present but nav items are only Home / Shop / Create / Account — there are no Gift Ideas or Reviews links in the bottom nav. Users who land on the homepage cannot reach `/gift-ideas` or `/community` without going through the Shop page or scrolling to the footer.

**Suggested fix:** Add "Gift Ideas" to the `BottomSheetNav`'s TABS array, or add a fifth tab, or ensure the landing page header includes a mobile nav trigger equivalent to the site header.

**Priority:** MEDIUM

---

### [MEDIUM] PurchaseToast conflicts with BottomSheetNav on shop page

**Device/viewport:** All mobile
**File:** `/Users/roryhutchings/keepsy-mvp/app/shop/CatalogClient.tsx` line 273

```tsx
className="fixed bottom-6 left-4 z-50 max-w-[280px] ..."
```

The purchase activity toast appears at `bottom-6` (24 px from bottom). The `BottomSheetNav` is 56 px + safe area inset. On iPhone 14, the nav is approximately 90 px tall. The toast at `bottom-6` will be entirely behind the bottom nav and invisible to users.

**Suggested fix:** Change to `bottom-[calc(3.5rem+env(safe-area-inset-bottom)+0.75rem)]` or approximately `bottom-24` to clear the nav.

**Priority:** MEDIUM

---

### [MEDIUM] GiftAssistantWidget — conflicts with BottomSheetNav at `bottom-4 right-4`

**Device/viewport:** All mobile
**File:** `/Users/roryhutchings/keepsy-mvp/components/GiftAssistantWidget.tsx` line 90

```tsx
<div className="fixed bottom-4 right-4 z-40">
```

`bottom-4` = 16 px. The BottomSheetNav at 56 px + safe area will cover this widget completely on mobile. The widget is behind the nav (`z-40` vs nav's implied z-index from `z-40` class). Users cannot see or interact with the AI Gift Assistant on mobile.

**Suggested fix:** Change to `bottom-[calc(3.5rem+env(safe-area-inset-bottom)+0.5rem)]` and ensure `z-index` is above the nav (`z-50`).

**Priority:** MEDIUM

---

### [MEDIUM] DesignVaultSidebar — not hidden on mobile at Step 3

**Device/viewport:** 375–767 px
**File:** `/Users/roryhutchings/keepsy-mvp/components/DesignVaultSidebar.tsx` lines 34–37

As noted under Layout, the sidebar renders at a fixed pixel width with no responsive hiding. On mobile it will appear as a 140 px left panel that compresses the mockup beside it, or if the user previously collapsed it, a 48 px strip that still takes up space. Neither state is designed for mobile.

**Suggested fix:** Render `null` when `window.innerWidth < 1024` or use a `hidden lg:flex` wrapper. Vault entries can be exposed as a horizontal strip below the mockup on mobile.

**Priority:** MEDIUM

---

### [LOW] Create page mobile view switcher — "How it works / Catalog / Community" tabs at top

**Device/viewport:** Mobile
**File:** `/Users/roryhutchings/keepsy-mvp/app/MerchGeneratorPlatform.tsx` lines 910–931

There is a `md:hidden` tab strip at the top of the create page for switching between views. The buttons use `px-3 py-1.5 text-xs` which gives approximately 28–30 px height. These should be at least `py-2.5 text-sm` for comfortable mobile tapping. Not critical since these are secondary navigation, but worth noting.

**Priority:** LOW

---

### Complete Journey Assessment

| Step | Mobile Viability | Issues |
|------|-----------------|--------|
| Landing page | Mostly good | Hero below fold on small phones, no mobile nav for all links, gateway 3D animation |
| Shop /shop | Mostly good | Filter bar overflow, purchase toast hidden behind nav |
| Product page /product/[type] | Good | `sticky top-24` on mockup wastes mobile space |
| Create /create Step 1 | Good | iOS zoom on textarea focus (font size), Lenis scroll conflict |
| Create /create Step 2 (Design Confirmation) | Good | Refinement textarea font size, chip button sizes |
| Create /create Step 3 (Mockup) | Broken at 375px | DesignVaultSidebar layout, sticky offset |
| Create /create Step 4 (Checkout) | Good | Two-column grid stacks correctly via `md:grid-cols-2` |
| Cart Drawer | Good | Quantity buttons small, full-width on mobile is correct |
| Account /account | Not audited (simple page) | — |

**Overall:** The full browse → create → checkout journey is completable on mobile but Step 3 (mockup placement) is broken once the Design Vault has entries. Steps 1, 2, and 4 are functional but have input-zoom and touch-target issues that create friction.

---

## Issue Index by Priority

### HIGH (fix before launch)
| # | Issue | File |
|---|-------|------|
| H1 | Step 3 DesignVaultSidebar breaks layout at 375 px | `MerchGeneratorPlatform.tsx` |
| H2 | Shop filter bar horizontal overflow | `CatalogClient.tsx` |
| H3 | Announcement bar dismiss button — 20 px touch target | `SiteHeader.tsx` |
| H4 | Main prompt textarea missing `fontSize: 16px` (iOS zoom) | `CreatePageLayoutLean.tsx` |
| H5 | PremiumGateway Three.js cloud scene blocks entry on mobile | `PremiumGateway.tsx` |

### MEDIUM (fix before scale)
| # | Issue | File |
|---|-------|------|
| M1 | `sticky top-24` wastes vertical space on mobile | `MerchGeneratorPlatform.tsx` |
| M2 | Hero `min-h-[90vh]` pushes CTAs below fold on small phones | `LandingPage.tsx` |
| M3 | Cart drawer quantity buttons — 28 px targets | `CartDrawer.tsx` |
| M4 | Inline cart in Create Page quantity buttons — 28 px targets | `MerchGeneratorPlatform.tsx` |
| M5 | GiftAssistantWidget Send/Use buttons — 28–30 px targets | `GiftAssistantWidget.tsx` |
| M6 | GiftingStep form inputs font size triggers iOS zoom | `GiftingStep.tsx` |
| M7 | Bottom padding (pb-16) insufficient for BottomSheetNav + safe area | `MerchGeneratorPlatform.tsx` |
| M8 | Landing page has no hamburger / mobile nav for all links | `LandingPage.tsx` |
| M9 | PurchaseToast hidden behind BottomSheetNav | `CatalogClient.tsx` |
| M10 | GiftAssistantWidget hidden behind BottomSheetNav | `GiftAssistantWidget.tsx` |
| M11 | DesignVaultSidebar not hidden on mobile | `DesignVaultSidebar.tsx` |
| M12 | Mesh gradient background animates infinitely, no reduced-motion | `globals.css` |

### LOW (nice to have)
| # | Issue | File |
|---|-------|------|
| L1 | SizeGuideDrawer table cramped at 320 px | `SizeGuideDrawer.tsx` |
| L2 | No explicit viewport export in layout | `layout.tsx` |
| L3 | Refinement chips — 32 px targets | `DesignConfirmation.tsx` |
| L4 | UpsellDrawer bundle buttons — 24 px targets | `UpsellDrawer.tsx` |
| L5 | Lenis scroll may conflict with iOS input focus scrolling | `CreatePage` |
| L6 | Aurora blob animations, no reduced-motion support | `globals.css` |
| L7 | Many page-level motion.div elements don't check reduced-motion | Multiple pages |
| L8 | Unsplash image URL hardcodes `?w=800` | `LandingPage.tsx` |
| L9 | Create page mobile view switcher buttons — 28–30 px | `MerchGeneratorPlatform.tsx` |
