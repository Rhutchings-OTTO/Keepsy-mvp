# Team 3 Report: Colour & Surface Design
**Date:** 2026-03-08
**Scope:** globals.css (new section only) + tailwind.config.ts (boxShadow additions only)

---

## Audit: Current State

### globals.css — Existing shadow/border usage

| Class / Location | Shadow value | Issue |
|---|---|---|
| `.frosted-glass` | `0 20px 44px -34px rgba(45,41,38,0.22)` | One-off inline value, not reusable |
| `.frosted-white` | `0 18px 40px -30px rgba(45,41,38,0.20)` | One-off inline value, not reusable |
| `.premium-panel` | `inset 0 1px 0 rgba(255,255,255,0.95), 0 16px 40px -24px rgba(45,41,38,0.38)` | One-off inline value |
| `.hero-prompt-shell` | `inset 0 1px 0 rgba(255,255,255,0.9), 0 12px 26px -18px rgba(45,41,38,0.40)` | One-off inline value |
| `.logo-glass-tablet` | `inset 0 1px 0 0 rgba(255,255,255,0.25), 0 20px 60px -20px rgba(0,0,0,0.06)` | Uses `rgba(0,0,0,...)` instead of brand charcoal |

No standardised card shadow class exists anywhere in globals.css. No generic hover lift, focus ring, or image fade-in utility exists.

### tailwind.config.ts — Existing boxShadow entries

| Token | Value | Assessment |
|---|---|---|
| `warm-sm` | `0 8px 24px -12px rgba(45,41,38,0.28)` | Heavy for small components — no lightweight card option |
| `warm-md` | `0 16px 40px -20px rgba(45,41,38,0.32)` | Pronounced; suitable for panels but too heavy for product cards at rest |
| `warm-lg` | `0 24px 64px -28px rgba(45,41,38,0.38)` | Large heroic shadow |
| `warm-xl` | `0 40px 100px -40px rgba(45,41,38,0.42)` | Extra-large; no equivalent lightweight token |
| `terra-glow` | `0 8px 32px -8px rgba(196,113,74,0.45)` | Coloured accent glow |
| `forest-glow` | `0 8px 32px -8px rgba(44,74,62,0.45)` | Coloured accent glow |

**Gap:** No lightweight multi-layer card shadow. The smallest existing token (`warm-sm`) starts at 28% opacity with a strong spread, which is too heavy for a resting product card. There is no hover-state shadow token, no subtle depth token, and no elevated surface token.

### Inconsistencies identified

1. **No standard card shadow.** Product cards likely use ad-hoc Tailwind utilities (`shadow-sm`, `shadow-md`) or inline styles — there is no design-system token for this.
2. **No hover state tokens.** Transitions on cards require authors to write custom shadow values by hand each time.
3. **No focus ring standard.** Without `.focus-ring`, each interactive element either inherits the browser default (blue ring, clashes with brand) or has `outline: none` with no replacement — an accessibility risk.
4. **No border utility class.** `--border` and `--border-light` CSS variables exist but no utility class surfaces them; authors reach for `border border-black/10` one-offs.
5. **No image interaction standard.** Image hover lift and fade-in on load are implemented ad-hoc or not at all.
6. **Button transitions inconsistent.** Some buttons use Tailwind `transition-colors`, others have none. No single source of truth.
7. **Shadow colour drift.** `.logo-glass-tablet` uses `rgba(0,0,0,0.06)` instead of `rgba(45,41,38,...)` (charcoal), breaking the warm-tinted shadow system.

---

## Changes Made

### 1. globals.css — new `/* === SURFACE & SHADOW SYSTEM === */` section appended

Added after the existing `/* === TYPOGRAPHY POLISH === */` section (Team 1, untouched).

**Classes added and rationale:**

| Class | Purpose | Solves |
|---|---|---|
| `.card-shadow` | Multi-layer resting shadow for product cards | Issue 1 — no standard card shadow |
| `.card-shadow:hover` | Lifted shadow + 2px translateY on hover | Issue 2 — no hover state tokens |
| `.surface-elevated` | Heavier shadow for modals/drawers/dropdowns | Fills gap between `warm-md` and a dedicated overlay token |
| `.section-divider` | 1px separator using brand-consistent opacity | Consistent section rhythm |
| `.focus-ring` / `.focus-ring:focus-visible` | Brand-coloured terracotta outline, 2px offset | Issue 3 — accessibility + brand focus ring |
| `.border-subtle` | Single border using `--border-light` equivalent opacity | Issue 4 — surfaces the border variable as a utility |
| `.image-hover-lift` | `scale(1.03)` on hover with smooth transition | Issue 5 — standardises image interaction |
| `.btn-transition` | Combined opacity/transform/shadow transition | Issue 6 — consistent button hover motion |
| `.image-fade-in` | `imageFadeIn` keyframe, 0.4s ease | Issue 5 — image load feel |
| `a, button` base transition | Colour-property transitions only (not layout) | Issue 6 — baseline interactive smoothness |

**Shadow opacity scale used** (all use `rgba(45,41,38,...)` for warm tint):

- Resting card: 0.04 + 0.05 (very light, 2-layer)
- Hover card: 0.07 + 0.08 (lifted, still subtle)
- Elevated surface: 0.08 + 0.07 (modal-weight)

### 2. tailwind.config.ts — four new boxShadow tokens added

| Token | Value | Use case |
|---|---|---|
| `card` | `0 1px 3px rgba(45,41,38,0.04), 0 4px 12px rgba(45,41,38,0.05)` | Product card resting state (Tailwind: `shadow-card`) |
| `card-hover` | `0 2px 8px rgba(45,41,38,0.07), 0 12px 28px rgba(45,41,38,0.08)` | Product card hover state (Tailwind: `hover:shadow-card-hover`) |
| `elevated` | `0 4px 16px rgba(45,41,38,0.08), 0 16px 48px rgba(45,41,38,0.07)` | Modals, drawers, dropdowns |
| `subtle` | `0 1px 4px rgba(45,41,38,0.06)` | Inputs, small panels, subtle depth |

All existing tokens (`warm-sm` through `forest-glow`) are **unchanged**.

---

## Files Modified

- `/Users/roryhutchings/keepsy-mvp/app/globals.css` — appended `SURFACE & SHADOW SYSTEM` section only
- `/Users/roryhutchings/keepsy-mvp/tailwind.config.ts` — added 4 entries to `boxShadow` only

## Files NOT Modified

All component files left untouched. No existing CSS rules removed or altered.
