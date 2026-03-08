# Typography Audit & Changes — Keepsy
*Team 1: Typography & Hierarchy | 2026-03-08*

---

## Current Font Import State (before changes)

### Fraunces (serif)
```typescript
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
  weight: ["500", "600", "700"],
});
```
- Weights loaded: 500, 600, 700 only
- Style: NOT specified (defaults to normal only)
- No italic axis loaded

### Manrope (sans-serif)
```typescript
const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});
```
- Weights loaded: 400, 500, 600, 700 — adequate range, no changes needed

---

## What Was Missing

### 1. Fraunces italic axis
Fraunces is a variable font with two axes: weight and italic (wght + ital). Without `style: ["normal", "italic"]` in the next/font/google config, the browser cannot load italic variants. This means:
- `font-style: italic` on any Fraunces element falls back to browser-synthesised oblique (a slanted version of the upright letterforms) — visually cheap and misaligned with Fraunces's expressive optical-size italic design
- Any `.serif-italic` class or `font-style: italic; font-family: var(--font-serif)` in components renders with fake italic rather than the true drawn italic

### 2. Narrow weight range
Fraunces supports weights 100–900. Loading only 500–700 means:
- Weight 400 (regular) unavailable — light body copy in Fraunces falls back to 500 (slightly heavier than intended)
- Weights 800 and 900 unavailable — display-scale hero headings at 800/900 will fall back to 700, losing impact at large sizes
- Less typographic range overall for headline hierarchy

### 3. No `.eyebrow` utility class
No global utility existed for the small-caps / all-caps label treatment commonly used above section headings ("Most Popular", "Step 1 of 3", etc.). Without a shared class, these are implemented inconsistently across components.

### 4. No `text-wrap: balance` on headings
Without `text-wrap: balance`, multi-line headings in narrow containers (mobile, card grids) frequently produce single-word orphan lines on the last row — visually jarring and unprofessional.

### 5. No `.display-heading` tight leading
Large display headings (hero h1, section h2s) rendered with default line-height (~1.2–1.3) leave excessive vertical space between lines at 48px+. A tighter `line-height: 1.05` with subtle negative tracking (`letter-spacing: -0.02em`) reads as intentional luxury typography rather than default browser rendering.

---

## Changes Made

### app/layout.tsx — Fraunces import update
**Added** `style: ["normal", "italic"]` to load the true italic axis.
**Extended** `weight` array from `["500", "600", "700"]` to `["400", "500", "600", "700", "800", "900"]`.

```typescript
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
});
```

Manrope import left unchanged — its weight range is appropriate.

### app/globals.css — New `/* === TYPOGRAPHY POLISH === */` section appended
Added the following utility rules (no existing rules removed or altered):

| Rule / Class | Purpose |
|---|---|
| `h1, h2, h3 { text-wrap: balance }` | Eliminates orphan words on heading wraps |
| `h1, h2 { word-break: keep-all }` | Prevents mid-word breaks at narrow viewports |
| `.eyebrow` | Standardises 11px/700/+0.15em uppercase label text at 50% ink opacity |
| `.display-heading` | Tight 1.05 leading + −0.02em tracking for large display headings |
| `.body-comfortable` | 1.65 leading at 15px for readable long-form body paragraphs |
| `.serif-italic` | Applies Fraunces in true italic at weight 500 for decorative/pull-quote text |
| `.text-balance-safe` | Combines `text-wrap: balance` with a 28ch soft max-width for narrow headlines |

---

## Expected Visual Improvements

1. **Hero headline**: With italic axis loaded and `.serif-italic` available, decorative italic text in the hero (e.g. *"she'll never forget"*) renders in Fraunces's drawn italic rather than synthesised oblique — richer, more intentional letterform contrast.

2. **Section eyebrows**: Consistent 11px uppercase labels with generous tracking (`0.15em`) and muted colour create clear hierarchy without competing with h2s.

3. **Heading wraps on mobile**: `text-wrap: balance` on h1–h3 automatically distributes text across lines evenly, eliminating single-word final lines on product cards and grid section titles.

4. **Display-scale headings**: `.display-heading` with `line-height: 1.05` brings the hero h1 into premium editorial range — comparable to high-end DTC brands (Aesop, Cuyana) where tight leading at large sizes signals craft.

5. **Weight 800/900 available**: Hero h1 text using `font-weight: 800` or `900` now loads the actual designed heavy cut rather than falling back to 700, increasing visual impact at large sizes.

6. **Body readability**: `.body-comfortable` at `line-height: 1.65` / `0.9375rem` (15px) improves scanning comfort on product description paragraphs — measurably better reading experience on mobile.
