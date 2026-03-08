# Team 7: Forms, Inputs & Interactive Elements — Audit Report

**Date:** 2026-03-08
**Scope:** globals.css (forms section), MagneticButton.tsx

---

## 1. MagneticButton.tsx — Audit

**File:** `/Users/roryhutchings/keepsy-mvp/components/ui/MagneticButton.tsx`

### Status: HEALTHY — no changes made.

### Findings:

**className forwarding:** Correct. The component destructures `className = ""` and passes it directly to `<motion.button className={className}>`. Any consumer can layer Tailwind classes freely.

**Props spread:** Uses `...props` spread onto `<motion.button>`, which means all native button attributes (including `disabled`, `onClick`, `type`, `aria-*`, etc.) are forwarded without any wrapping or stripping. This is the correct pattern.

**Disabled handling:** Not explicitly handled in the component body, but because `disabled` flows through `...props` to `<motion.button>`, the button will receive the disabled attribute and CSS `:disabled` pseudo-class will fire. The new globals.css `button:disabled` rule (opacity 0.5, cursor not-allowed) will apply correctly to MagneticButton instances that receive `disabled` as a prop. No change needed.

**Reduced motion:** The component imports and uses `useReducedMotionPref()`. When the user prefers reduced motion, `whileHover` and `whileTap` are set to `undefined`, disabling all Framer Motion micro-animations. This is the correct accessibility pattern.

**`-webkit-font-smoothing`:** Not applied inline on the component. This is not a problem — font smoothing is already set globally on `body` in globals.css (`-webkit-font-smoothing: antialiased`), so all child elements including MagneticButton inherit it. Adding a redundant inline style would be unnecessary. No change made.

**Type signature:** Uses `React.ComponentProps<typeof motion.button>`, which gives full type safety for all motion.button props. This is idiomatic and correct.

**Summary:** MagneticButton.tsx is well-written, minimal, and correctly implemented. No changes were required or made.

---

## 2. globals.css — Forms & Interactive System

**File:** `/Users/roryhutchings/keepsy-mvp/app/globals.css`

### Existing state before this task:

The file already contained four bottom sections added by previous teams:
- `=== TYPOGRAPHY POLISH ===` (lines 377–421)
- `=== SURFACE & SHADOW SYSTEM ===` (lines 423–487)
- `=== SPACING & LAYOUT SYSTEM ===` (lines 489–561)

The file had **no dedicated form input styling**. All existing button-related CSS was for specific named classes (`.btn-primary-sheen`, `.btn-trust-sheen`) tied to animation effects, not base interactive element resets.

### Gap analysis — what was missing:

| Area | Problem |
|---|---|
| Text inputs / textareas | No base styles — iOS Safari would zoom on focus (font-size < 16px) |
| Input focus states | No consistent terracotta focus ring to match brand |
| Placeholder colour | No muted colour — browsers default to varying grey values |
| Disabled states | No visual feedback for disabled inputs, textareas, selects, or buttons |
| `.btn-primary` utility class | No raw CSS class for non-MagneticButton primary actions |
| `.btn-secondary` utility class | No outline/ghost button class |
| Modal overlay | No standardised backdrop class |
| Modal panel | No standardised panel class with responsive border-radius |

### Changes made:

Added `/* === FORMS & INTERACTIVE SYSTEM === */` section at the very end of globals.css (after all existing content). Contents:

1. **Input base styles** — Applied to `input[type="text/email/number/search"]`, `textarea`, `select`. Sets 16px font-size (iOS zoom prevention), brand font, charcoal text, translucent white background, subtle border, 10px radius, 44px min-height (touch target), and smooth transitions.

2. **Input focus styles** — Removes default outline, applies terracotta border colour (`#C4714A`) and a soft 3px terracotta ring (`rgba(196,113,74,0.15)`). Consistent with the existing `.focus-ring:focus-visible` pattern in the Surface & Shadow section.

3. **Placeholder colour** — Set to `rgba(45,41,38,0.38)` — faint but legible, consistent with `--ink-faint` token.

4. **Disabled states** — `opacity: 0.5; cursor: not-allowed` on all interactive elements when `:disabled`. Applies to MagneticButton via `button:disabled` passthrough.

5. **`.btn-primary`** — Standalone CSS utility for raw `<button>` elements that don't use MagneticButton. Terracotta background, white text, 44px min-height, 10px radius, 600 weight. Hover reduces opacity to 0.88. Active scales down to 0.985.

6. **`.btn-secondary`** — Outline/ghost variant. Transparent background, charcoal border, same sizing. Hover darkens border and adds faint fill.

7. **`.modal-overlay`** — Semi-transparent black backdrop (`rgba(0,0,0,0.38)`) with `backdrop-filter: blur(4px)`. Matches the frosted-glass aesthetic.

8. **`.modal-panel`** — White panel, top-rounded for mobile drawer pattern (`border-radius: 16px 16px 0 0`), fully rounded on `sm` breakpoint (`640px+`).

### Compatibility notes:

- `appearance: none` + `-webkit-appearance: none` on select ensures consistent rendering across browsers, including Safari.
- All `backdrop-filter` rules include `-webkit-backdrop-filter` for Safari.
- 16px font-size on inputs is the canonical fix for iOS Safari auto-zoom — this is the most impactful accessibility change in this section.
- The `.btn-primary` class does not conflict with `.btn-primary-sheen` — they are complementary (sheen can be added alongside).

### No existing content was removed or modified.
