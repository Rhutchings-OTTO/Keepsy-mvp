# Team 9: Animation & Micro-interactions Audit
_Keepsy MVP — globals.css animation infrastructure_

---

## Existing Animation Infrastructure

### Keyframe animations already defined

| Name | Purpose | Location in file |
|---|---|---|
| `mesh-oscillate` | Slow 24s background gradient drift | `.mesh-gradient-bg` |
| `cta-sheen` | 8s shimmer loop on CTA buttons | `.btn-primary-sheen`, `.btn-trust-sheen` |
| `aurora` | 24s blob drift for hero background | `.aurora-blob` |
| `aurora-panic-flicker` | Easter egg flickering mode | `.aurora-container.panic-mode` |
| `gateway-cloud-drift-1..5` | One-shot cloud exit on PremiumGateway | `.gateway-cloud-blob--1..5` |
| `ink-bleed-in` / `ink-bleed-out` | Atelier mode clip-path transition | `.ink-bleed-overlay` |
| `toast-slide-in` / `toast-slide-out` | Toast notification entrance/exit | Referenced by toast component |
| `imageFadeIn` | Image opacity fade on load | `.image-fade-in` |

### Existing transition/hover utility classes

| Class | What it does |
|---|---|
| `.fade-up` / `.fade-up.visible` | JS-triggered scroll reveal (opacity + translateY 28px) — already in use |
| `.image-hover-lift` | `scale(1.03)` on hover with 0.25s ease |
| `.card-shadow:hover` | Lift shadow + `translateY(-2px)` |
| `.btn-transition` | 0.15s ease on opacity, transform, box-shadow |
| `.thermal-hover` | Drop-shadow glow on hover |
| `a, button` | Global 0.15s colour/bg transition |
| `.grain-spotlight` | Mouse-tracking grain mask (CSS custom props) |
| `.mouse-glow` | Mouse-tracking radial glow |

### Reduced-motion compliance
- `.gateway-cloud-blob` has `@media (prefers-reduced-motion: reduce) { animation: none !important; opacity: 0.5; }`
- `html { scroll-behavior: smooth; }` — needs a corresponding `prefers-reduced-motion` override (not currently present, low severity)
- Framer Motion components use `useReducedMotion()` internally across the codebase

---

## Conflict Analysis

Before adding new classes, each new identifier was checked against all existing `.css`, `.tsx`, `.ts`, `.jsx`, and `.js` files:

| Proposed class/keyframe | Conflict found? | Action |
|---|---|---|
| `.reveal-on-scroll` | None | Used as-is |
| `.is-visible` | None | Used as-is |
| `shimmer` (keyframe) | None in CSS; one comment mention in `lib/sonicTransition.ts` (unrelated audio code) | Used as-is |
| `.skeleton-shimmer` | None | Used as-is |
| `pageFadeIn` (keyframe) | None | Used as-is |
| `.page-enter` | None | Used as-is |
| `subtlePulse` (keyframe) | None | Used as-is |
| `.pulse-once` | None | Used as-is |
| `.count-up` | None | Used as-is |
| `.hover-underline` | None | Used as-is |
| `badgePop` (keyframe) | None | Used as-is |
| `.badge-pop` | None | Used as-is |

No renames required. No `v2-` prefixes needed.

**Note on `.fade-up` vs `.reveal-on-scroll`**: Both are scroll-reveal utilities, but they are intentionally distinct:
- `.fade-up` uses `translateY(28px)` and is triggered by adding `.visible`
- `.reveal-on-scroll` uses `translateY(18px)` and is triggered by adding `.is-visible`
- They coexist cleanly. New code should prefer `.reveal-on-scroll` as it includes built-in stagger support and a slightly subtler offset.

---

## New Additions (added at bottom of globals.css)

### `/* === SCROLL REVEAL ANIMATIONS === */`

**`.reveal-on-scroll` + `.is-visible`**
A pure CSS scroll reveal pattern. Elements start at `opacity: 0` with `translateY(18px)`, and transition to full visibility when `.is-visible` is added (via `IntersectionObserver` or any JS toggle). Uses a snappy `cubic-bezier(0.16, 1, 0.3, 1)` spring easing over 0.6s.

**Stagger selectors (`:nth-child(2..6)`)**
When multiple `.reveal-on-scroll` siblings share the same parent, each child automatically receives a progressively longer `transition-delay` (0.08s steps up to 0.40s), producing a cascade reveal without any JS orchestration.

**`shimmer` keyframe + `.skeleton-shimmer`**
A horizontal sweep shimmer for skeleton/loading placeholder elements. Uses brand-toned rgba values from `--color-charcoal` at low opacity. Background size is 200% to allow the sweep travel.

**`pageFadeIn` keyframe + `.page-enter`**
A 0.45s page-level entrance animation (opacity + 8px translateY). Intended for wrapping route content or major section containers when they mount.

**`subtlePulse` keyframe + `.pulse-once`**
A single 0.4s 5% scale pulse for drawing attention to newly added items (e.g., cart badge after adding an item).

**`.count-up`**
A pass-through `transition: all 0.3s ease` class for numeric counter elements — pairs with JS that increments the displayed number.

**`.hover-underline`**
An animated underline for inline text links. Uses `::after` pseudo-element that grows from `width: 0` to `width: 100%` on hover (0.2s ease). Does not require any JS.

**`badgePop` keyframe + `.badge-pop`**
A 0.25s scale pop animation (1 → 1.3 → 1) for cart/notification badge counters when their value changes.

### Reduced-motion coverage
A second `@media (prefers-reduced-motion: reduce)` block at the end disables:
- `.skeleton-shimmer` shimmer (replaced with a flat background)
- `.page-enter` animation
- `.pulse-once` animation

The `.reveal-on-scroll` reduced-motion rule is in its own block higher up (kept co-located with the reveal declarations for clarity).
