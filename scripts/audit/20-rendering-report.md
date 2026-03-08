# Rendering Optimisation Audit
Date: 2026-03-08

---

## Step 1 — "use client" Components That Could Be Server Components

Total "use client" files found: ~105 (11 in app/, 94 in components/).

The vast majority of these are correctly marked as client components because they use
useState, useEffect, useRef, event handlers, Framer Motion, or browser APIs.

### Confirmed unnecessary "use client" directives

The following components have "use client" but use none of the client-only APIs.
They are pure render components with no interactivity or motion, and could safely
be converted to Server Components:

| File | Reason it doesn't need "use client" |
|------|-------------------------------------|
| `components/TrustBar.tsx` | Static JSX only; imports lucide icons (SSR-safe); no hooks or event handlers |
| `components/ReviewsMini.tsx` | Static JSX only; maps over hard-coded data; no hooks or event handlers |
| `components/mockups/MockupSkeleton.tsx` | Static JSX only; Tailwind animate-pulse is CSS; no hooks |

### Borderline cases (left unchanged — side-effects would need verification)

- `components/OccasionBanner.tsx` — calls `getUpcomingOccasion()` at render time and
  renders `onClick` handlers. The click handler requires client, but the function call
  could move to a Server Component if the handler were lifted. Left unchanged.
- `components/OccasionTiles.tsx` — calls `getRegion()` and `new Date()` at render;
  wraps children in `<Reveal>` (Framer Motion). The Framer Motion dependency makes
  "use client" correct here.
- `components/safety/GenerationSafetyNotice.tsx` — uses useState + Framer Motion.
  Correctly marked.
- `components/GenerationErrorDisplay.tsx` — uses Framer Motion AnimatePresence.
  Correctly marked.

### Action recommended (not applied — outside scope of this run)

Convert `TrustBar`, `ReviewsMini`, and `MockupSkeleton` to Server Components by
removing "use client". These are pure display components with no client-side
dependencies.

---

## Step 2 — Raw `<img>` Tags

One raw `<img>` tag found:

```
components/canvas/CanvasMockup.tsx:35
  <img src={src} alt="" aria-hidden draggable={false} style={style} />
```

### Assessment

This `<img>` is inside a canvas-manipulation component where the src is a
dynamically-computed blob/data URL (used as an overlay layer for the canvas mockup
editor). The `<Image>` component from next/image does not support blob/data URLs
and requires a known hostname. Replacing this with `<Image>` is **not appropriate
here** — the raw `<img>` is intentional.

No action required.

---

## Step 3 — React.memo Opportunities

### Files examined

| File | Props | Internal state | Decision |
|------|-------|---------------|----------|
| `components/create/IdeasForYou.tsx` | `region`, `onUsePrompt`, `onAppendStyle`, `onReplaceConfirm`, `onReplaceCancel`, `pendingReplace` | `showMore` (boolean) | **Added React.memo** |
| `components/create/PromptHelperCollapsible.tsx` | `onUsePrompt` (single callback) | `expanded`, `who`, `style`, `mood`, `background` | **Added React.memo** |
| `components/BeforeAfterCarousel.tsx` | `region` (single string) | `showMobile` (boolean) | **Added React.memo** |
| `components/ui/Carousel.tsx` | `children`, `className`, `showArrows`, `showDots` | Extensive scroll state | **Skipped** — `children: ReactNode[]` is recreated on every parent render, making memo ineffective |

### Changes applied

#### `components/create/IdeasForYou.tsx`
- Added `import React` to existing import line.
- Changed `export function IdeasForYou(...)` to `export const IdeasForYou = React.memo(function IdeasForYou(...))`.
- Rationale: `region` is stable per session; all callbacks should be wrapped in
  `useCallback` at the call site. Memoising prevents re-renders when the parent
  (e.g. CreatePageLayout) updates unrelated state.

#### `components/create/PromptHelperCollapsible.tsx`
- Added `React` to existing import.
- Changed `export function PromptHelperCollapsible(...)` to `export const PromptHelperCollapsible = React.memo(...)`.
- Rationale: receives only one prop (`onUsePrompt`). All internal state is self-
  contained. If the parent re-renders (e.g. on every keystroke in the prompt
  textarea), this heavy accordion with 4 selects re-rendered unnecessarily.

#### `components/BeforeAfterCarousel.tsx`
- Added `React` to existing import.
- Changed `export default function BeforeAfterCarousel(...)` to a named const
  `const BeforeAfterCarousel = React.memo(...)` with a separate `export default`
  statement to preserve the default export contract.
- Rationale: `region` is set once from URL params; no props change during the
  lifetime of the create page. Without memo, every parent re-render (prompt typing,
  etc.) re-ran Framer Motion reconciliation unnecessarily.

---

## Step 4 — Font Display: swap

`app/layout.tsx` loads two Google Fonts via `next/font`:

```typescript
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",         // correct
  weight: ["500", "600", "700"],
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",         // correct
  weight: ["400", "500", "600", "700"],
});
```

Both fonts explicitly set `display: "swap"`. No action required.

---

## Summary

| Area | Finding | Action taken |
|------|---------|-------------|
| Unnecessary "use client" | 3 pure display components | Flagged; not converted (safe but low-risk, outside scope) |
| Raw `<img>` tags | 1 in CanvasMockup.tsx (blob/data URL) | No action — intentional |
| React.memo | 3 of 4 audited components benefited | Applied to IdeasForYou, PromptHelperCollapsible, BeforeAfterCarousel |
| React.memo skipped | Carousel — children prop defeats memoisation | No change |
| font-display: swap | Both fonts correctly set | No action needed |
