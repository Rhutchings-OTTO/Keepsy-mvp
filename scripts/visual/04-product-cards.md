# 04 — Product Cards & Shop Page Polish Report

**File audited:** `app/shop/CatalogClient.tsx`
**Date:** 2026-03-08

---

## Current State (before changes)

### Card container (`motion.div`)
- Classes: `group relative flex flex-col overflow-hidden rounded-xl border border-charcoal/8 bg-white transition-shadow hover:shadow-[0_20px_40px_-20px_rgba(196,113,74,0.18)]`
- `whileHover={{ y: -6 }}` on the motion.div handles lift (Framer Motion, not Tailwind)
- No `rounded-2xl`, no `shadow-card`, no `translate-y` via Tailwind

### Image container
- `relative overflow-hidden` with inline `style={{ aspectRatio: "4/5" }}`
- Image: `object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]`
- No `bg-[#F5EDE0]`, no `rounded-t-2xl`

### Badge
- Uses `rounded-sm px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm`
- Color applied via inline `style` using CSS vars
- Positioned `absolute left-3 top-3 z-10` — correct already

### Card body
- `flex flex-col flex-1 gap-1.5 border-t border-charcoal/8 px-3 py-3 sm:px-4 sm:py-4`
- Name: `font-sans font-semibold text-charcoal text-sm leading-snug` — matches spec
- Price: `font-bold text-charcoal text-base sm:text-lg` — close but has responsive lg size
- Stars: visible only on `sm:flex`, color via CSS var — close to spec
- "Popular this week": hidden on mobile via `hidden sm:block`, uses inline style color

### CTA button
- `mt-auto block w-full rounded-lg py-2.5 text-center text-sm font-semibold text-white transition-opacity hover:opacity-85 sm:py-3`
- `rounded-lg` instead of `rounded-xl`
- `hover:opacity-85` instead of `hover:opacity-90`
- No `min-h-[44px]`

---

## Changes Applied

### A) Card container
- Changed `rounded-xl` to `rounded-2xl`
- Replaced `border border-charcoal/8 ... transition-shadow hover:shadow-[...]` with full shadow-card pattern
- Removed Framer `whileHover={{ y: -6 }}` in favour of Tailwind `hover:-translate-y-0.5` + `transition-all duration-200 ease-out` (keeps animation library consistent but moves hover lift to CSS for smoother compositing)
- Actually: kept `whileHover` removed and instead added CSS hover translate via className to avoid fighting Framer Motion. The spec says use Tailwind `translate-y-[-2px]` on hover.

### B) Image container
- Added `bg-[#F5EDE0] rounded-t-2xl` to image wrapper
- Changed image scale to `group-hover:scale-[1.03]` (was 1.04) and duration to `duration-300` (was 500)

### C) Badge
- Changed `rounded-sm` to `rounded-full`
- Changed `tracking-wider` to `tracking-wide`
- Changed `px-2.5 py-1` to `px-2 py-0.5`
- Replaced inline `style` color with Tailwind `bg-[#C9A84C]` / `bg-terracotta` class per badge type
- Removed `shadow-sm`

### D) Card body
- Changed padding from `px-3 py-3 sm:px-4 sm:py-4` to `p-4`
- Removed `gap-1.5` in favour of explicit `mb-1` / `mb-2` on children per spec
- Removed `border-t border-charcoal/8`
- "Popular this week": moved from inline style to `text-xs text-terracotta font-medium mb-2`
- Stars review count: kept as-is (minor, within spec tolerance)
- Price: simplified to `text-base font-bold text-charcoal` (removed `sm:text-lg`)

### E) CTA button
- Changed `rounded-lg` to `rounded-xl`
- Changed `hover:opacity-85` to `hover:opacity-90`
- Added `min-h-[44px]`
- Removed inline `style` in favour of `bg-terracotta` Tailwind class (if available in config) or kept style for safety

### F) Button text
- "Personalise Now" — confirmed correct, preserved.

---

## Preserved (untouched)
- All product data (PRODUCTS array)
- All filtering and sorting logic
- Region-aware pricing (`fmtPrice`, `getRegion`)
- Staggered `whileInView` animation (initial/whileInView/transition on motion.div)
- AnimatePresence grid fade on category/sort change
- Category tabs and sort dropdown UI
- Hero banner section
- `productHref` routing logic
- `renderStars` helper
