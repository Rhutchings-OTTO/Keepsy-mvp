# Team 10 — Responsive Breakpoint Polish Report

**Files audited:**
- `app/shop/CatalogClient.tsx`
- `app/shop/page.tsx`
- `app/product/[type]/page.tsx`
- `components/SiteHeader.tsx`

---

## 1. app/shop/CatalogClient.tsx

### Filter pills bar (line 343–365)

**Issue A — Pills can compress on mobile.**
The category pills wrapper (`<div className="flex items-center gap-2 flex-shrink-0">`) wraps all pills in a non-scrollable flex container. The outer bar uses `overflow-x-auto` on the whole row including the sort dropdown, which means on narrow screens the layout either wraps or hides the sort control rather than giving pills their own horizontal scroll lane.

Fix:
- Give the pills `<div>` `overflow-x-auto`, `flex-nowrap` (i.e. keep it as a row with `flex-wrap: nowrap`), `-mx-4 px-4` on mobile, and `pb-2` for scrollbar clearance.
- Each `<button>` pill should add `flex-shrink-0` so text never compresses.
- Remove the `overflow-x-auto` from the parent row; only the pills container should scroll.

### Product grid (line 397)

**Issue B — Gap is too large on small screens.**
Current classes: `grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4`
- `gap-5` (20px) on a 375px screen with 2 columns leaves very little card width.
- No `sm:` breakpoint column rule means it jumps from 2 directly to 3 at `md`.

Fix: `grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4`

### Hero banner (lines 296–335)

**Issue C — Stats bar hidden on mobile is fine**, but the `h1` uses `text-4xl` at mobile, which is readable. No issue here. The `py-10 sm:py-20` is a good responsive rhythm. The stats block is already `hidden ... sm:flex` so no overflow risk on small screens. No changes needed.

### Sort dropdown (lines 368–383)

**Issue D — Touch target too small.**
The `<select>` has no `min-h` set. On mobile, the touch target should be at least 44px. It also lacks explicit border styling which is inconsistent with other inputs on the site.

Fix: Add `min-h-[44px] text-sm border border-charcoal/20 rounded-lg px-2 bg-transparent` to the `<select>`.

---

## 2. app/product/[type]/page.tsx

### Outer container (line 286)

**Status: Correct.** Already `mx-auto max-w-4xl px-4 pb-16 pt-8 sm:px-6`. No change needed.

### How It Works steps (lines 291–300)

**Issue E — Steps are fine for stacking** (vertical list with `space-y-4` and flex gap). No issue at mobile. No change needed.

### Perfect For tags (lines 312–317)

**Status: Correct.** Already uses `flex flex-wrap gap-2`. Tags will wrap naturally. No change needed.

### Delivery section (line 320)

**Issue F — Padding too tight on mobile.**
`rounded-2xl bg-[#F5EDE0] p-6` — on 375px screens `p-6` (24px all sides) is generous but fine. However, the instruction asks to make it `p-4` on mobile and `p-6` on sm+.

Fix: Change `p-6` to `p-4 sm:p-6`.

### FAQ heading (line 333)

**Issue G — Heading size is fixed.**
`text-2xl font-black` — the instruction asks for `text-xl sm:text-2xl` for better mobile fit.

Fix: Change to `text-xl sm:text-2xl`.

### Explore More buttons (lines 347–351)

**Issue H — Buttons don't stack on mobile.**
`flex flex-wrap gap-3` — pills wrap but don't become full-width. On 375px, three buttons of varying widths squeeze into a row before wrapping awkwardly.

Fix: Change to `flex flex-col gap-3 sm:flex-row sm:flex-wrap` and add `w-full sm:w-auto` to each `<a>` button.

---

## 3. components/SiteHeader.tsx

### Announcement bar (lines 63–79)

**Status: Correct — no changes needed.**
Team 6 already added two separate `<span>` elements:
- Mobile: `<span className="truncate sm:hidden">⚡ Free shipping over £75 / $75</span>` — short text with `truncate` applied.
- Desktop: `<span className="hidden truncate sm:inline">⚡ Fast shipping on every order · Free shipping over £75 (UK) / $75 (US)</span>`

The `truncate` class is present on both spans. On 320px the short mobile text ("⚡ Free shipping over £75 / $75") is ~34 characters and will fit. The `px-10` outer padding gives room for the dismiss button. No overflow risk.

---

## Summary of changes made

| File | Change | Lines affected |
|---|---|---|
| `app/shop/CatalogClient.tsx` | Filter pills: own scrollable container with `overflow-x-auto`, `flex-shrink-0` on pills, `-mx-4 px-4 pb-2` | ~343–365 |
| `app/shop/CatalogClient.tsx` | Product grid gap: `gap-3 sm:gap-4` | ~397 |
| `app/shop/CatalogClient.tsx` | Sort select touch target & border | ~374 |
| `app/product/[type]/page.tsx` | Delivery padding: `p-4 sm:p-6` | ~320 |
| `app/product/[type]/page.tsx` | FAQ heading: `text-xl sm:text-2xl` | ~333 |
| `app/product/[type]/page.tsx` | Explore More buttons: stack on mobile | ~347–351 |
