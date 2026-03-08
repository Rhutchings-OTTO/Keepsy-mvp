# Team 2: Spacing & Layout Grid — Audit Report
**File:** `app/globals.css`
**Date:** 2026-03-08

---

## 1. Existing Spacing Patterns Observed

### What is already in globals.css

`globals.css` currently carries no reusable spacing utility classes. All spacing decisions are made inline via Tailwind utility classes in component files. The following spacing-adjacent rules exist but serve specific, single-purpose components — not reusable layout primitives:

| Rule | Location | Purpose |
|------|----------|---------|
| `position: absolute; inset: 0` | `.grain-overlay`, `.aurora-container`, `.ink-bleed-overlay` | Full-bleed decorative layers |
| `width: 520px; height: 520px` | `.aurora-blob` | Fixed-size animation blobs |
| `width: 600px; height: 380px` etc. | `.gateway-cloud-blob--*` | Fixed-size cloud blobs for PremiumGateway |
| `filter: blur(88px)` | `.aurora-container` | Visual blur — not spacing |
| `padding: 0` (implicit via `margin: 0`) | `body` | Base reset |

### Patterns notably absent

1. **No consistent section vertical rhythm.** Components define their own `py-*` values in JSX — resulting in sections ranging from `py-8` to `py-24` with no governing rule.
2. **No standard max-width container.** Some sections use `max-w-6xl`, others `max-w-5xl` or `max-w-7xl`. The codebase has no single `.page-container` to normalise this.
3. **No card internal padding standard.** Cards mix `p-4`, `p-5`, `p-6` with no responsive scaling rule.
4. **No flex/grid gap utility.** Grid gaps are set ad hoc in component JSX.
5. **No named section-gap primitive.** Vertical distance between major page sections is not governed by any shared value.

---

## 2. What the New Section Addresses

The `/* === SPACING & LAYOUT SYSTEM ===*/` block added at the end of `globals.css` introduces **five reusable spacing primitives**:

### `.section-padding`
Establishes a consistent vertical rhythm for every page section:
- Desktop: `6rem` (96 px) top and bottom — matches premium editorial standards (Aesop, Liberty London).
- Mobile: `3rem` (48 px) — halves cleanly without crowding.

Fixes the current scatter of `py-8` through `py-24` that makes the page feel tonally inconsistent.

### `.page-container`
A single max-width wrapper (1200 px) with responsive horizontal insets:
- Mobile: 20 px — keeps content off the screen edges.
- Tablet (≥640 px): 40 px — breathing room on mid-size screens.
- Desktop (≥1024 px): 80 px — generous gutters for the premium aesthetic.

Replaces the ad-hoc `max-w-5xl / max-w-6xl / max-w-7xl` spread across components.

### `.card-padding`
Standardised internal card spacing:
- Desktop: `1.5rem` (24 px) — comfortable for product card content.
- Mobile: `1rem` (16 px) — prevents cramping on small viewports.

### `.section-gap`
A flex-column wrapper that governs vertical distance between major page sections:
- Desktop: `5rem` (80 px) gap — creates clear visual hierarchy.
- Mobile: `3rem` (48 px) — scales proportionally.

### `.grid-gap`
A utility for product grids and icon-grid rows:
- Desktop: `1.5rem` (24 px) — standard card grid gutter.
- Mobile: `0.75rem` (12 px) — tighter on small screens to keep cards usable.

---

## 3. Design Rationale

The Keepsy brand targets a premium gifting audience. Premium editorial sites (Liberty, Aesop, NET-A-PORTER) use **generous, consistent whitespace** as a trust and quality signal. Inconsistent spacing — even when invisible to casual visitors — registers subconsciously as cheap or rushed. These five primitives give every future component a shared spacing vocabulary without touching Tailwind config or any existing component.

---

## 4. Files Modified

| File | Change |
|------|--------|
| `app/globals.css` | Appended `/* === SPACING & LAYOUT SYSTEM ===*/` block at the bottom |
| `scripts/visual/02-spacing-layout.md` | This report (created) |

No component files were modified.
