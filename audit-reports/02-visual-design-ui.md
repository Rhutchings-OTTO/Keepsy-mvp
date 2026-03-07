# Visual Design & UI Audit — Keepsy
**Date:** 2026-03-06 | **Branch:** main (81c4151)

---

## Executive Summary

Keepsy has a **premium, cohesive visual design system** with excellent attention to detail in spacing, typography, and micro-interactions. The design successfully conveys "calm, premium, and easy to trust" through consistent frosted glass elements, warm neutral palette, and responsive animation. However, there are **critical accessibility/contrast issues**, type scale inconsistencies, and opportunities to reduce modal complexity in the creation flow.

**Overall Grade: B+** (strong foundations, needs accessibility polish)

---

## 1. Visual Hierarchy
**Rating: HIGH — Strength**

- Hero headline is prominent and emotional at 4xl–6xl responsive scale
- Supporting copy at reduced opacity (`text-black/65`) creates clear information tiers
- CTA buttons are prominent (`bg-black text-white`) and positioned above the fold
- Product grid provides instant context of what Keepsy makes

`/app/LandingPage.tsx` — eye flows naturally: headline → supporting copy → CTA → product examples ✓

---

## 2. Whitespace Usage
**Rating: LOW — Minor issue**

Spacing is intentional and premium throughout:
- Container padding: `px-4 sm:px-6` consistent
- Section spacing: `py-12`, `py-14`
- Gap patterns: `gap-3`, `gap-4`, `gap-8` scale responsively

Desktop breakpoints could use slightly larger section gaps for more breathing room.

---

## 3. Typography System
**Rating: MEDIUM — Needs work**

**Font pairing (good):**
- Serif: Fraunces (400–700) for headlines — elegant and premium
- Sans: Manrope (400–700) for body — modern, highly legible
- Both use `font-display: swap` ✓

**Issues:**
- **No explicit type scale defined** in `tailwind.config.ts` — sizes vary across components without a consistent multiplier (3xl, 2xl, lg, base, sm, xs used ad hoc)
- **Line height inconsistency** — some headings use `leading-[1.1]`, others use default; body copy alternates between `leading-relaxed` and `leading-6`
- **Letter spacing variance** — `/components/BottomSheetNav.tsx:77` uses hardcoded `tracking-[0.18em]` instead of a design token

**Recommendation:** Define explicit type scale (1.125 or 1.25 ratio) and standardise line-height defaults (1.5 body, 1.2 headings).

---

## 4. Colour Palette
**Rating: HIGH — Strength**

Custom palette in `tailwind.config.ts`:
- `ivory: #F9F8F6` — primary background
- `obsidian: #1A1A1A` — primary text/dark
- `periwinkle: #E2E8FF` — accent/selection
- `gold` range: #D4AF37 / #E5C158 / #B8962E — premium accents

CSS variables in `app/globals.css`:
- `--bg: #f6f1eb`, `--ink: #1f1b18`, `--ink-muted: rgba(31,27,24,0.68)`

**Minor issue:** `--bg` (#f6f1eb) and `ivory` (#F9F8F6) are different values. Many components use hardcoded `bg-ivory` or `bg-white/85` instead of CSS variables, causing drift risk.

---

## 5. Colour Contrast (WCAG AA)
**Rating: CRITICAL — Must fix**

| Location | Combination | Ratio | Result |
|---|---|---|---|
| `SiteFooter.tsx:22` | `text-black/58` on white | ~4.1:1 | ⚠️ Fails AA (needs 4.5:1) |
| `SiteHeader.tsx:40` | `text-black/65` on `bg-white/70` blur | ~5.2:1 | ✓ AA pass, ✗ AAA fail |
| `BottomSheetNav.tsx:32` | Icon on `bg-[#1f2937]` | unclear | Needs audit |
| `TrustBar.tsx:19` | `text-[#7C644E]` on `#FCF8F3` | ~4.9:1 | ⚠️ Marginal |

**Action:** Raise footer link opacity from `/58` to `/70` minimum. Audit all custom hex colours against their backgrounds with a contrast checker.

---

## 6. Button Design Consistency
**Rating: HIGH — Strength**

Consistent button system:
- Primary: `rounded-full bg-black text-white shadow-[0_16px_32px...]`
- Secondary: `border border-black/10 bg-white`
- Tertiary: `hover:text-black hover:underline`
- Touch targets: `min-h-11` / `min-h-12` ✓
- Micro-interactions via `MagneticButton.tsx`: `whileHover={{ y: -1, scale: 1.01 }}` ✓

**Minor issue:** `BottomSheetNav.tsx:32` uses `bg-[#1f2937]` which conflicts with brand palette.

---

## 7. Card/Component Patterns
**Rating: HIGH — Strength**

Well-defined card system:
- **Frosted glass** (`globals.css:59`): `rgba(255,255,255,0.78)` + `backdrop-filter: blur(14px)` ✓
- **Occasion card** (`OccasionShowcaseCard.tsx`): gradient + `hover:-translate-y-1` ✓
- **Testimonial card**: `rounded-2xl border border-black/10 bg-white p-4 shadow-sm` ✓
- **Premium panel** (`globals.css:235`): inset glow + directional light ✓

All card patterns are consistently applied. No major issues.

---

## 8. Grid & Alignment
**Rating: HIGH — Strength**

- Container: `max-w-6xl` / `max-w-7xl` with `mx-auto` centering
- Responsive grids: `grid-cols-2 lg:grid-cols-4` used consistently
- `OccasionTiles.tsx:26`, `Hero.tsx:27`, `TestimonialGrid.tsx:23` all properly structured

No misalignment issues detected.

---

## 9. Brand Coherence
**Rating: HIGH — Strength**

- `SiteChrome.tsx` applies `MeshGradientBackground` to all pages ✓
- `DynamicLogo.tsx` present on all pages with `role="img" aria-label="Keepsy"` ✓
- Footer consistent across non-landing pages ✓
- Same colour/typography system everywhere ✓

---

## 10. Above-the-Fold Impact
**Rating: MEDIUM — Needs attention**

Strengths: large headline, product mockups, prominent CTA, emotional copy.

Issues:
- Badge text is `text-xs` — too small to read comfortably (`text-sm` recommended)
- `StorybookJourney` frame uses `aspect-[4/7]` portrait and takes significant vertical space on mobile, pushing "How it works" below fold
- Product mockup grid aspect ratio inconsistency (card vs mug vs apparel proportions differ)

---

## 11. Micro-interactions & Animation
**Rating: HIGH — Strength**

- Framer Motion used throughout with reduced-motion support via `useReducedMotionPref()` ✓
- `KineticHeading.tsx:71` properly skips animation when reduce-motion is set ✓
- `MeshGradientBackground.tsx` provides subtle ambient animation ✓
- Spring physics in `BottomSheetNav.tsx` ✓

Premium feel without compromising accessibility.

---

## 12. Icon Consistency
**Rating: MEDIUM — Minor issue**

Lucide React used throughout. Usage is sparse — icons exist in `BottomSheetNav`, `TrustBar`, but most UI areas lack affordance icons (form inputs, dropdowns, status indicators).

**Recommendation:** Define icon sizing scale (`h-4 w-4` small, `h-6 w-6` medium, `h-8 w-8` large) and expand usage in forms and interactive states.

---

## 13. Visual Clutter
**Rating: MEDIUM — Creation flow concern**

Landing page: very clean ✓
Product page: clean ✓
Creation flow: multiple overlays possible simultaneously (generation loading + upsell drawer + exit guardian + error display). If multiple modals are triggered together, cognitive overload is likely.

**Recommendation:** Audit creation flow for modal stacking — enforce single-modal-at-a-time rule.

---

## Summary of Recommendations

| Priority | Issue | Action |
|---|---|---|
| **CRITICAL** | Footer text contrast `text-black/58` fails WCAG AA | Raise to `/70` minimum |
| **CRITICAL** | Audit all custom hex colours for WCAG AA compliance | Run contrast checker on `#5A4634`, `#7C644E`, `#7C644E` |
| **HIGH** | No explicit type scale defined | Add 1.125/1.25 ratio scale to `tailwind.config.ts` |
| **HIGH** | Line-height inconsistency | Standardise: 1.5 body, 1.2 headings |
| **HIGH** | CSS variable vs hardcoded hex drift | Replace `bg-ivory` / hardcoded colours with CSS vars |
| **MEDIUM** | Badge text too small (`text-xs`) | Increase to `text-sm` |
| **MEDIUM** | Mobile above-fold: StorybookJourney pushes content down | Lazy-load or reduce height on mobile |
| **MEDIUM** | Creation flow modal stacking | Enforce single-modal-at-a-time |
| **LOW** | `bg-[#1f2937]` in BottomSheetNav conflicts with palette | Replace with `bg-obsidian` |
| **LOW** | Expand icon usage for form affordances | Add icons to inputs, dropdowns, states |
