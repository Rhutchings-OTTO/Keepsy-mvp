# Navigation & Header/Footer Polish — Team 6 Audit

## Current State

### SiteHeader.tsx (343 lines)

**Announcement bar** (`AnnouncementBar`)
- Class: `px-10 py-2 text-xs font-medium` — `py-2` is 8px top+bottom, slightly tall
- Dismiss button: `absolute right-2 top-1/2` with `p-2.5` inner padding — fine
- Text: no `truncate` on narrow viewports; wraps freely

**Sticky header**
- `<header className="sticky top-0 z-50 border-b">` — already has `border-b` via className
- `borderColor: "var(--border)"` via inline style — border exists but uses the generic `--border` token; no issue to fix here beyond confirming it reads clearly

**Desktop nav pill**
- Container: `gap-1 rounded-full border border-charcoal/10 bg-white px-2 py-1.5 shadow-...` — gap-1 already present
- Active link: `backgroundColor: "var(--color-terracotta)"` — currently terracotta fill, not charcoal; spec asks for charcoal (`bg-charcoal text-white`)
- Inactive links: `color: "rgba(45,41,38,0.70)"` via inline style, no `hover:text-charcoal` or `transition-colors` class applied
- Link padding: `px-4 py-2` — spec says `px-3 py-1.5`

**"Make a Gift" CTA (desktop)**
- `rounded-full px-5 text-sm font-semibold text-white ... hover:opacity-90` — rounded-full not rounded-lg; no explicit `py-2` (uses min-h-10)
- Spec calls for `rounded-lg px-4 py-2`

**Mobile overlay**
- Background: `style={{ backgroundColor: "var(--color-cream)" }}` — already cream, good
- Close button: `rounded-full border p-2` — inner padding p-2 makes effective tap target ~36px; spec wants min `w-10 h-10`
- Nav links: `min-h-[64px] font-serif text-4xl font-bold` — text-4xl is 36px, spec says at minimum text-3xl; links are already large
- Nav link vertical padding: achieved via `min-h-[64px]` not explicit `py-3`; functionally fine
- CTA button in overlay: `rounded-full` with terracotta — already correct, but spec asks `rounded-full` explicitly; this already matches

**Cart badge**
- `h-5 w-5` (20px) — spec wants `min-w-[18px] h-[18px]` (slightly smaller, 18px)
- Terracotta background, white text, font-bold — all already correct
- `text-[10px]` — already present

---

### SiteFooter.tsx (408 lines)

**Trust badges**
- Component: `flex items-center gap-2` — horizontal layout (icon + label side by side), NOT stacked vertically
- Container: `flex gap-6 overflow-x-auto` on mobile, wraps on sm — NOT a `grid grid-cols-4`
- Spec: stacked vertically, `grid grid-cols-4` desktop / `grid-cols-2` mobile, `text-center`
- Icon size: already `text-lg` — correct
- Label: `text-xs font-semibold` with forest color — spec says `text-charcoal/60`; color mismatch

**Footer link columns**
- Headers: `text-xs font-bold uppercase tracking-[0.16em]` with `--ink-faint` color — close to spec but tracking should be `tracking-widest` and color `text-charcoal/40`
- Links: `text-sm hover:underline` — spec wants `hover:text-charcoal transition-colors duration-150` instead of underline
- Link gap: `gap-2.5` — already matches spec's `space-y-2.5`

**Social icons**
- `h-9 w-9 rounded-full border` — size and shape already correct
- Hover: JS `onMouseEnter/Leave` sets `backgroundColor: terracotta` and `color: #fff` — spec says NO fill hover, only `hover:border-terracotta hover:text-terracotta`
- The JS inline style handlers need to be removed and replaced with Tailwind hover classes

**Bottom bar**
- `border-t py-6` with `var(--border)` — `border-t` present, `py-6` present; spec wants `border-charcoal/8` and `pt-6` only (or `py-6` is fine)
- Text: `text-xs` with `var(--ink-faint)` — spec says `text-charcoal/35`; functionally similar but should use Tailwind class

**Email signup**
- Input: `rounded-full border px-4 py-2.5 text-sm` — spec says `rounded-lg px-4 py-3`; shape and padding differ
- Button: `rounded-full px-5 py-2.5` — spec says same height as input `py-3`; no `rounded-lg`
- Layout: already `flex` side-by-side, stacked on mobile — matches spec

---

## What Will Be Changed

### SiteHeader.tsx

1. **Announcement bar** — change `py-2` → `py-1.5`; add `truncate` to text spans
2. **Active nav link** — change inline `backgroundColor: terracotta` → Tailwind `bg-charcoal text-white`
3. **Inactive nav links** — add `hover:text-charcoal transition-colors duration-150` Tailwind classes; remove inline color for inactive state, use `text-charcoal/60`
4. **Nav link padding** — change `px-4 py-2` → `px-3 py-1.5`
5. **Desktop CTA button** — change `rounded-full px-5` → `rounded-lg px-4 py-2`; keep `hover:opacity-90 transition-opacity duration-150`
6. **Mobile close button** — change `p-2` → `w-10 h-10` explicit size
7. **Cart badge** — change `h-5 w-5` → `min-w-[18px] h-[18px]`

### SiteFooter.tsx

1. **Trust badges** — change `TrustBadge` component from horizontal `flex items-center gap-2` to vertical `flex flex-col items-center gap-1 text-center`; change container from scrollable flex row to `grid grid-cols-2 sm:grid-cols-4 gap-6`; fix label color to `text-charcoal/60`
2. **Column header color** — change `var(--ink-faint)` inline style → Tailwind `text-charcoal/40`; change `tracking-[0.16em]` → `tracking-widest`
3. **Footer link hover** — change `hover:underline` → `hover:text-charcoal transition-colors duration-150`; use Tailwind `text-charcoal/60` for color
4. **Social icons** — remove JS `onMouseEnter/Leave` handlers; replace `hover:border-transparent hover:text-white` with `hover:border-terracotta hover:text-terracotta transition-colors duration-150`
5. **Email input** — change `rounded-full py-2.5` → `rounded-lg py-3`
6. **Email button** — change `rounded-full py-2.5 px-5` → `rounded-lg py-3 px-5`
7. **Bottom bar text** — inline `var(--ink-faint)` already fine, optionally swap to Tailwind `text-charcoal/35`
