# Mobile Experience Audit — Keepsy
**Date:** 2026-03-06 | **Branch:** main (81c4151)

---

## Executive Summary

Keepsy has a thoughtful mobile-first foundation — BottomSheetNav, responsive Tailwind classes, proper bottom sheet patterns — but has **critical accessibility gaps** that constitute WCAG 2.1 violations before launch. The viewport meta, touch target sizes, and input types must be fixed immediately.

---

## Findings

### 1. Missing Viewport Meta Tag
**Severity: CRITICAL**
**File:** `app/layout.tsx`

No `viewport` export exists. Without it, notched devices (iPhone X+, Android flagships) may hide content behind the notch/home indicator.

**Fix — add to `app/layout.tsx`:**
```ts
import { type Viewport } from "next";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
};
```

---

### 2. Checkbox Touch Target — 4×4px
**Severity: CRITICAL**
**File:** `components/UpsellDrawer.tsx:72`

`h-4 w-4` checkbox = 16px. Minimum per WCAG is 44×44px. The surrounding `<label>` does expand the tap area, but the visual element is still too small and confusing.

**Fix:** Style as custom checkbox with `appearance-none` at `h-6 w-6` minimum, wrapped in full label.

---

### 3. Form Input Types Missing
**Severity: CRITICAL**
**File:** `components/create/CreatePageLayoutLean.tsx`

All text inputs lack `type`, `inputMode`, and `autoComplete` attributes — meaning mobile users get a generic keyboard with no autocomplete.

**Fix:** Add where applicable:
```tsx
<input type="email" inputMode="email" autoComplete="email" />
<textarea inputMode="text" autoCorrect="on" spellCheck />
```

---

### 4. Touch Targets Below 44px Minimum
**Severity: HIGH**

| Location | Element | Current | Required |
|---|---|---|---|
| `SiteHeader.tsx:37` | Nav link buttons (tablet) | 40px | 44px |
| `Carousel.tsx:115` | Dot indicators | 8px | 44px |
| `GiftAssistantWidget.tsx:118` | Action buttons | ~28px | 44px |

**Fix:** Increase `min-h-10` → `min-h-11` on nav buttons. Wrap carousel dots in a `p-4` invisible hit area container.

---

### 5. Fixed Elements Missing Safe Area Insets
**Severity: MEDIUM**
**Files:** `components/BottomSheetNav.tsx:28`, `components/GiftAssistantWidget.tsx:90`

`fixed bottom-5` and `fixed bottom-4 right-4` don't account for home indicator on iPhone or navigation bar on Android. Elements can be partially hidden.

**Fix:**
```css
/* globals.css */
.bottom-safe { bottom: max(1.25rem, env(safe-area-inset-bottom)); }
```
Apply to BottomSheetNav and GiftAssistantWidget.

---

### 6. CreatePage Container Padding — Too Tight
**Severity: MEDIUM**
**File:** `components/create/CreatePageLayoutLean.tsx:144`

`px-1` (4px) side padding on the create flow — extremely tight on mobile. Should be `px-4` minimum.

---

### 7. Carousel Dots Too Small
**Severity: MEDIUM**
**File:** `components/ui/Carousel.tsx:115`

Dots are `h-2` (8px) tall. Arrows are correctly hidden on mobile (`hidden sm:flex`). But dots need a larger invisible tap area.

**Fix:** Wrap each dot button in a `p-3` container so total tap area reaches ~32px+.

---

### 8. RegionSelector Modal — 320px Edge Case
**Severity: MEDIUM**
**File:** `components/RegionSelector.tsx:96`

Width is `w-[min(92vw,520px)]`. On 320px screens (older iPhones), 92vw = 294px with minimal internal breathing room.

**Fix:** Add `px-4` internal padding and ensure text wraps cleanly at 280px content width.

---

### 9. Bottom Sheet No Max-Height on Tablet
**Severity: LOW**
**File:** `components/UpsellDrawer.tsx:52`

`fixed inset-x-0 bottom-0` with no `max-h`. On large tablets this could fill 80%+ of the screen.

**Fix:** Add `max-h-[80vh] overflow-y-auto` to the drawer container.

---

### 10. Navigation — Good ✓

- `SiteHeader` hidden on mobile, desktop shows clean nav ✓
- `BottomSheetNav` fixed at bottom, spring-animated, thumb-reachable ✓
- `min-h-12` (48px) on primary CTA in BottomSheetNav ✓
- `aria-label` on all nav buttons ✓

---

### 11. Images — Good ✓

All images use `next/image` with `object-cover`/`object-contain` and responsive `sizes` attributes. No horizontal overflow from fixed-width images. ✓

---

### 12. Typography — Good ✓

Fluid typography with `clamp()` used throughout (`text-[clamp(2.2rem,4.6vw,4.4rem)]`). Scales gracefully from 375px to 1440px. ✓

---

### 13. Carousel Swipe — Good ✓

`overflow-x-auto scroll-smooth` with `scrollbar-hide` gives native swipe feel. 85% item width leaves appropriate peek for next item. ✓

---

## Priority Fix Order

| # | Issue | WCAG | Effort |
|---|---|---|---|
| 1 | Add viewport meta export | AA required | 5 min |
| 2 | Checkbox tap area (UpsellDrawer) | AA required | 15 min |
| 3 | Add input types/inputMode | AA required | 20 min |
| 4 | Nav button height 40→44px | AA required | 5 min |
| 5 | Carousel dot tap area | AA required | 15 min |
| 6 | Safe area insets for fixed elements | Best practice | 20 min |
| 7 | CreatePage px-1 → px-4 | UX | 5 min |
| 8 | UpsellDrawer max-height | UX | 5 min |
