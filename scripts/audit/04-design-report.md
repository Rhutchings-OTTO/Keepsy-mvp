# Keepsy Design Audit — 04
**Date:** 2026-03-08
**Auditor:** Claude Sonnet 4.6 (code-only, no live browsing)
**Files reviewed:** tailwind.config.ts, app/globals.css, app/layout.tsx, app/LandingPage.tsx, app/shop/CatalogClient.tsx, app/gift-ideas/page.tsx, app/about/AboutClient.tsx, app/success/page.tsx, app/product/[type]/page.tsx, components/SiteHeader.tsx, components/SiteFooter.tsx, components/SiteChrome.tsx, components/BottomSheetNav.tsx, components/CartDrawer.tsx, components/create/CreatePageLayoutLean.tsx, components/DynamicLogo.tsx, components/PremiumGateway.tsx, components/Hero.tsx

---

## Summary

The Keepsy design system has a strong foundation: a coherent warm-craft brand palette (cream, terracotta, forest, gold), a considered font pairing (Fraunces serif + Manrope sans), and consistent use of Tailwind spacing conventions throughout most pages. The main issues are architectural (two competing header/footer systems, a zombie Hero component, legacy colour tokens still in production code) and typographic inconsistency (font-black used heavily in MerchGeneratorPlatform, absent from all other public pages). There are no broken image paths for images that are actually referenced. Overall brand cohesion is good; the issues below are real and worth fixing before any conversion audit.

---

## 1. VISUAL HIERARCHY

### 1.1 Competing header systems — no shared SiteChrome on the landing page
**File:** `components/SiteChrome.tsx` lines 18–36
**What is wrong:** `SiteChrome` applies `SiteHeader` + `SiteFooter` on every route *except* `/`. The landing page (`LandingPage.tsx`) renders its own bespoke `<header>` and `<footer>` inside the page component itself. This means the landing page has a completely different navigation from every other page in the site: different logo size (width 140 vs 110 in SiteHeader), different nav items (only "Shop Now" vs the full pill nav), and no SiteHeader sticky behaviour. First-time visitors get a different navigation experience than return visitors navigating to any other page, which weakens brand consistency and hierarchy.
**Suggested fix:** Either wrap `/` inside SiteChrome (removing the inline header/footer from LandingPage) or accept the landing page as a standalone brand experience and document it as intentional. If intentional, the custom landing header and SiteHeader should at minimum share the same max-width constant (`max-w-6xl`) — the landing page currently uses `max-w-6xl px-5 sm:px-8` while SiteHeader uses `max-w-6xl px-4 sm:px-6`.
**Priority:** Medium

### 1.2 Zombie Hero component never used on any public route
**File:** `components/Hero.tsx`
**What is wrong:** `Hero.tsx` renders a plain black-on-white layout with `font-black` headings and `bg-black` CTAs — none of the brand colours. It references product tile images (`/product-tiles/plain-card.png` etc) that do exist in `/public`. The component is not imported or rendered anywhere in the current routing tree. It is dead code, but its existence in the `components/` folder creates confusion for developers about the intended hero pattern.
**Suggested fix:** Either delete the file or rename it to `_Hero.legacy.tsx` with a comment explaining it is unused. This prevents it being accidentally re-introduced.
**Priority:** Low

### 1.3 MerchGeneratorPlatform uses font-black for primary headings
**File:** `app/MerchGeneratorPlatform.tsx` (lines 1068, 1231, 1279, 1356, etc.)
**What is wrong:** The core create/preview/checkout flow uses `font-black` (Tailwind weight 900) for its primary headings ("Configure your gift", "Checkout", "Catalog", etc.). Every other public page — landing, shop, about, product, gift-ideas — uses `font-bold` (700) for headings with Fraunces serif. `font-black` at 900 weight with Fraunces looks very different to `font-bold`, and these are the most commercially important screens in the funnel. The typographic tone shifts from editorial-premium on the landing page to graphic-heavy inside the create flow.
**Suggested fix:** Replace `font-black` heading usages in MerchGeneratorPlatform with `font-bold font-serif` to match the system. Reserve `font-black` for purely decorative or numeric emphasis (e.g. large price display).
**Priority:** High

### 1.4 Wizard.tsx heading system also uses font-black with no font-serif
**File:** `components/Wizard.tsx` lines 142, 176, 212
**What is wrong:** `<h1>Create your gift</h1>` and section headings use `font-black` without `font-serif`, rendering in Manrope 900 weight. This diverges from the system-wide pattern of using Fraunces for headings.
**Suggested fix:** Apply `font-serif font-bold` to match the design system. Wizard.tsx appears to be an older or parallel component — confirm whether it is still rendered and clean up if not.
**Priority:** Medium

---

## 2. SPACING AND ALIGNMENT

### 2.1 Two different CONTAINER constants with different padding
**Files:** `app/LandingPage.tsx` line 31, `components/SiteHeader.tsx` line 10, `components/SiteFooter.tsx` line 6
**What is wrong:** Three different files each define their own `CONTAINER` constant:
- `SiteHeader.tsx` / `SiteFooter.tsx`: `mx-auto w-full max-w-6xl px-4 sm:px-6`
- `LandingPage.tsx`: `mx-auto w-full max-w-6xl px-5 sm:px-8`

The landing page has 1px more left-padding on mobile (`px-5` vs `px-4`) and 2px more on tablet (`sm:px-8` vs `sm:px-6`). This creates a subtle but real misalignment between the landing page content edges and the SiteHeader content edges if they were ever rendered together. The OccasionTiles component uses `max-w-7xl` (wider than the rest of the site) without justification.
**Suggested fix:** Centralise the CONTAINER constant into a shared layout utility file (e.g., `lib/layout.ts`) and use it everywhere. Standardise on `max-w-6xl px-4 sm:px-6`. Audit why OccasionTiles uses `max-w-7xl`.
**Priority:** Medium

### 2.2 BottomSheetNav overlaps page content on mobile — no bottom padding compensation
**File:** `components/BottomSheetNav.tsx`, all page components
**What is wrong:** `BottomSheetNav` is `fixed bottom-0` and 56px tall (plus `env(safe-area-inset-bottom)`). No page component applies a corresponding `pb-14` (or `pb-[calc(56px+env(safe-area-inset-bottom))]`) to ensure content isn't hidden behind the nav. The `SiteChrome` `<main>` has only `flex-1`, not bottom padding. The landing page adds `BottomSheetNav` inside `EasterEggProvider` but its footer sits at `py-14` which may partially overlap on shorter phones.
**Suggested fix:** Add `pb-16 md:pb-0` (or equivalent) to `<main>` in SiteChrome, ensuring the bottom nav never obscures content on mobile.
**Priority:** High

### 2.3 Cart drawer shadow value has a Unicode minus sign instead of a hyphen
**File:** `components/CartDrawer.tsx` line 311
**What is wrong:** The shadow class is `shadow-[−24px_0_60px_-20px_rgba(45,41,38,0.18)]`. The first offset uses `−` (U+2212 MINUS SIGN) instead of `-` (U+002D HYPHEN-MINUS). Tailwind JIT will not match this class, so the drawer has no left drop-shadow. This is a silent bug.
**Suggested fix:** Replace `−24px` with `-24px` in the className string.
**Priority:** Medium

### 2.4 About page two CTAs in CTASection look identical
**File:** `app/about/AboutClient.tsx` lines 422–433
**What is wrong:** The two CTA buttons ("Shop Our Collection" and "Start Creating for Free") are visually identical — both `bg-white text-terracotta rounded-full`. There is no primary/secondary distinction. The second button even has an erroneous `border-2 border-white bg-white` which collapses the border completely into the background.
**Suggested fix:** Make the primary CTA (`/create`) use `bg-white text-terracotta` and the secondary CTA (`/shop`) use `border-2 border-white/60 bg-transparent text-white` to create clear visual hierarchy.
**Priority:** Medium

---

## 3. TYPOGRAPHY

### 3.1 Font weights loaded are limited — no italic weights for Fraunces
**File:** `app/layout.tsx` lines 7–12
**What is wrong:** Fraunces is loaded at weights `["500", "600", "700"]` only. Several components use `font-serif italic` for decorative copy (footer tagline "Gifts they'll never forget.", blockquote in AboutClient, SiteFooter brand sub-line). The `italic` variant of Fraunces is a separate optical axis (`ital`) — if it is not loaded, the browser falls back to a synthetic italicisation of the upright weight, which looks noticeably worse in a premium brand context. Fraunces is specifically designed to have an expressive italic axis.
**Suggested fix:** Add the italic axis to the Fraunces load: either use the Google Fonts variable font or request `style: ["normal", "italic"]` in the Next.js font config. The italic weight at 500–700 is the minimal safe addition.
**Priority:** Medium

### 3.2 Clamp font sizes not paired with a consistent line-height
**Files:** `app/LandingPage.tsx` line 419, `app/gift-ideas/page.tsx` line 27, `components/create/CreatePageLayoutLean.tsx` line 154, `components/PremiumGateway.tsx` line 103
**What is wrong:** These hero headings use `style={{ fontSize: "clamp(X, Y, Z)" }}` inline, bypassing Tailwind's responsive typography. The associated Tailwind `leading-*` class is then either set to a fixed value that becomes incorrect at larger clamp sizes, or omitted entirely (landing page h1 uses `leading-[0.95]` which at 6.5rem creates very tight stacking, appropriate for the condensed editorial look — but `CreatePageLayoutLean` applies no explicit leading on its clamp heading).
**Suggested fix:** For each clamp heading, verify the `leading-*` is explicitly set. `CreatePageLayoutLean` line 154 has no explicit line-height on its h1 — add `leading-[1.05]` to match the tighter editorial style used elsewhere.
**Priority:** Low

### 3.3 Inconsistent section label / eyebrow text formatting
**Files:** Multiple pages
**What is wrong:** Section eyebrows/labels use three different class patterns across the codebase:
- `text-[11px] font-bold uppercase tracking-[0.22em]` — most pages (landing, product, gift-ideas)
- `text-xs font-semibold uppercase tracking-[0.14em]` — create page panels
- `text-[11px] font-bold uppercase tracking-widest` — MerchGeneratorPlatform, ProductPreviewClient

These are effectively the same semantic element but rendered at slightly different sizes and tracking values. While subtle, at scale this creates micro-inconsistency in the brand voice.
**Suggested fix:** Define a single shared class string for eyebrow labels (e.g., `text-[11px] font-bold uppercase tracking-[0.22em]`) and apply it consistently. A Tailwind `@layer components` entry or a shared constant would enforce this.
**Priority:** Low

---

## 4. COLOUR

### 4.1 Legacy colour tokens still referenced in production components
**Files:** `components/TextureLoupe.tsx` line 58, `components/RealisticHoodie.tsx` line 49
**What is wrong:** `tailwind.config.ts` marks `ivory`, `obsidian`, and `periwinkle` as "Legacy kept for compatibility". `bg-ivory` is actively used in two production components. `--color-periwinkle: #E2E8FF` sits in the Tailwind config but `periwinkle` is not in `globals.css` CSS variables, meaning it only works via the Tailwind class — it has no CSS var fallback for inline style usage.
**Suggested fix:** Replace `bg-ivory` with `bg-cream` in `TextureLoupe.tsx` and `RealisticHoodie.tsx`. Once no code references the legacy tokens, remove them from `tailwind.config.ts` to prevent future use.
**Priority:** Low

### 4.2 Gold colour class `text-gold` used without Tailwind utility definition
**Files:** `components/product/ProductPreviewClient.tsx` lines 277, 447; `app/shop/CatalogClient.tsx` line 203
**What is wrong:** `text-gold` and `text-gold-500` are used in multiple places. The Tailwind config defines `gold` as a nested object with `DEFAULT`, `light`, `500`, `400`, `600` keys. Tailwind generates `text-gold` (using `DEFAULT`) and `text-gold-500` — these should work. However, `className="text-gold"` in `app/shop/CatalogClient.tsx` line 203 uses `style={{ color: "var(--color-gold)" }}` next to it — the CSS var and the Tailwind class co-exist without conflict, but the mixing style is inconsistent with the system.
**Suggested fix:** Pick one approach for gold: either always use the Tailwind class `text-gold` or always use `style={{ color: "var(--color-gold)" }}`. The inline style approach used in SiteHeader, SiteFooter, and most other components should be the standard, since it respects the Atelier Mode override mechanism via CSS variable reassignment. Tailwind hardcoded classes bypass the CSS variable layer entirely, meaning Atelier Mode cannot override `text-gold`.
**Priority:** Medium

### 4.3 Atelier Mode overrides are fragile and incomplete
**File:** `app/globals.css` lines 265–267
**What is wrong:** The Atelier Mode (dark mode easter egg) is implemented with very specific class selectors: `[class*="bg-ivory"]` and `[class*="text-obsidian"]`. Any component that uses the newer `bg-cream` or `text-charcoal` classes (which is most of the site) will not be affected by the dark mode transition. The CSS variable layer (`--bg`, `--ink`, etc.) is defined in `:root.atelier-mode`, which is correct, but most components use hardcoded Tailwind classes (`bg-[#F5EDE0]`, `text-charcoal`, etc.) that ignore CSS variables entirely.
**Suggested fix (scoped):** This is primarily an easter egg, not a core feature, so full dark-mode support is not urgent. However, components that use the `--bg`/`--ink` semantic aliases in their `style={}` props will correctly respond to mode toggling. Document this intent — that Atelier Mode only affects components using CSS var-based styling.
**Priority:** Low

### 4.4 Hardcoded background colours bypass the CSS variable system
**Files:** `app/LandingPage.tsx` (multiple sections), `app/gift-ideas/page.tsx`, `app/about/AboutClient.tsx`
**What is wrong:** Sections use `style={{ backgroundColor: "#F5EDE0" }}` (raw hex) instead of `style={{ backgroundColor: "var(--color-cream-dark)" }}`. While visually identical, using raw hex values means any future brand refresh or theming requires hunting hex strings across files rather than changing a single CSS variable.
**Suggested fix:** Establish a rule: all background colours must use `var(--color-*)` references, not raw hex. The `--color-cream-dark` variable (`#F5EDE0`) is already defined in globals.css.
**Priority:** Low

### 4.5 Contrast concern: charcoal/40 and charcoal/35 text on cream background
**Files:** Multiple components use `text-charcoal/40` and `text-charcoal/35` for helper text
**What is wrong:** `charcoal` is `#2D2926`. At 40% opacity on cream (`#FDF6EE`): approximate hex result is around `#BDB9B7`, which has a contrast ratio of approximately 1.9:1 against `#FDF6EE`. WCAG AA requires 4.5:1 for normal text and 3:1 for large text. Labels like the tips accordion summary (`text-charcoal/45`), the "Need ideas?" label (`text-charcoal/45`), and section labels using `text-charcoal/40` all fall below AA contrast thresholds when rendered at small sizes (10–12px).
**Suggested fix:** Raise helper/muted text to at least `text-charcoal/65` (the existing `--ink-muted` alias) for any text below 18px. The design system already defines `--ink-muted: rgba(45, 41, 38, 0.62)` which at ~3.5:1 meets AA for large text but is marginal for small text. For critical labels (form helpers, empty-state descriptions), prefer `text-charcoal/70` or higher.
**Priority:** Medium

---

## 5. IMAGERY

### 5.1 Referenced product images are all present — no broken paths
All image paths referenced in production components map to files that exist in `/public`:
- `/images/hero/*.jpg` — 3 of 4 present (`mug-hero.jpg`, `cards-hero.jpg`, `tee-hero.jpg`)
- `/images/featured/*.jpg` — all 4 present
- `/images/products/*.jpg` — all present
- `/product-tiles/*.png` — all present

**Notable gap:** `/images/hero/hoodie-hero.jpg` is referenced in `PRODUCT_IMAGES` in `LandingPage.tsx` — but the actual array entry at line 61 points to `/images/featured/grandma-hoodie.jpg`. No missing file here, but the `alt` text says "Custom hoodie" without mentioning the label for consistency.

### 5.2 About page founder illustration is a PNG placeholder
**File:** `app/about/AboutClient.tsx` line 147, `public/images/about/founders-illustration.png`
**What is wrong:** The founders illustration exists as a file but its origin and quality are unknown from code. The `<img>` tag uses `aspect-square w-full object-contain` which means if the illustration has any padding or transparency baked in, it will appear smaller than expected on the 2rem-rounded container. Additionally this component uses a plain `<img>` tag (not Next.js `<Image>`), which means no automatic optimisation or lazy loading.
**Suggested fix:** Replace with `next/image` with `fill` or explicit dimensions. Ensure the illustration is at least 800×800px for retina displays.
**Priority:** Low

### 5.3 ProductPreviewClient uses raw `<img>` for related products
**File:** `components/product/ProductPreviewClient.tsx` lines 469–478
**What is wrong:** The "You May Also Like" grid uses `<img>` (with an eslint-disable comment suppressing the `@next/next/no-img-element` warning) loading Unsplash URLs at 300px width. These are external URLs; on slow connections they will be unoptimised, potentially blurry on retina displays (300px source displayed at 33vw), and have no width/height attributes, causing layout shift.
**Suggested fix:** Replace with `<Image>` from `next/image`, either by moving Unsplash to `remotePatterns` in `next.config` (if not already configured) or by switching to local product tile images from `/product-tiles/`.
**Priority:** Medium

### 5.4 About page hero uses a raw `<img>` without lazy loading strategy
**File:** `app/about/AboutClient.tsx` line 42
**What is wrong:** The hero image (`https://images.unsplash.com/photo-1536010305525-f7aa0834e2c7?w=1600&q=90`) is rendered with a plain `<img>` tag. At 1600px wide, this is a large network request. It has no explicit `width`/`height` causing Cumulative Layout Shift (CLS) on load. It is above the fold so `loading="lazy"` would be wrong, but `fetchpriority="high"` should be applied.
**Suggested fix:** Replace with `next/image` using `fill` on the positioned parent, `priority` prop, and ensure `unsplash.com` is in `next.config` `remotePatterns`.
**Priority:** Medium

---

## 6. RESPONSIVE DESIGN

### 6.1 Featured products grid is 2-column on mobile with no gap relief
**File:** `app/LandingPage.tsx` line 543
**What is wrong:** `grid grid-cols-2 gap-5 lg:grid-cols-4` — on mobile, 4 product cards render in a 2-column grid at `gap-5` (20px). Each card has a `4/5` aspect ratio image container. On a 375px phone viewport with `px-5` container padding, each card is approximately `(375 - 10 - 20 - 20) / 2 = 162px` wide. The card images are portrait 4:5, so each image is ~203px tall. This is workable, but the card titles (`font-serif text-base font-bold sm:text-lg`) will wrap uncomfortably in ~162px. The `sm:text-lg` breakpoint fires at 640px, not smaller, so on iPhones 12 and below the title `text-base` with serif weight will be tight.
**Suggested fix:** On the 2-column mobile layout, reduce text to `text-sm` within product cards. The `sm:text-lg` escalation is appropriate; ensure `text-sm` (not `text-base`) is the mobile default inside `FeaturedProductCard`.
**Priority:** Low

### 6.2 Shop page CatalogClient sticky filter bar z-index conflict
**File:** `app/shop/CatalogClient.tsx` line 379
**What is wrong:** The filter bar uses `sticky top-16 z-30`. `SiteHeader` is `sticky top-0 z-50`. At `top-16` (64px), this assumes the SiteHeader is exactly 64px tall. The SiteHeader `py-3` with a `h-8` logo is approximately 54–58px. The AnnouncementBar, when visible, adds ~32px. With the announcement bar showing, the sticky filter bar would overlap the SiteHeader at a scroll position before the SiteHeader has left the viewport, because `top-16` is not dynamically aware of the announcement bar height.
**Suggested fix:** Either use `top-[var(--header-height)]` with a CSS variable updated dynamically, or wrap `top-16` to account for the announcement bar conditionally. At minimum, test with the announcement bar visible.
**Priority:** Medium

### 6.3 BottomSheetNav and CartDrawer both use fixed positioning without coordination
**Files:** `components/BottomSheetNav.tsx` line 21, `components/CartDrawer.tsx` line 311
**What is wrong:** Both use `fixed` positioning. CartDrawer is `z-[301]`; BottomSheetNav is `z-40`. When the CartDrawer is open on mobile, the BottomSheetNav (z-40) sits behind the backdrop (z-300) but the bottom safe-area padding (`env(safe-area-inset-bottom)`) in BottomSheetNav may still be visible through the backdrop if the backdrop doesn't reach the bottom of the screen. This is a minor visual seam on devices with a home indicator.
**Suggested fix:** Apply `z-[302]` to BottomSheetNav so it correctly sits above the cart drawer, or hide it when the cart is open.
**Priority:** Low

### 6.4 LandingPage hero grid collapses to column order without explicit mobile ordering
**File:** `app/LandingPage.tsx` line 398
**What is wrong:** The hero uses `grid lg:grid-cols-[3fr_2fr]`. Below `lg` (1024px), this collapses to a single column. The text column (left on desktop) renders first in DOM order, which is correct. The product grid renders second (below the text). On a 768px tablet in portrait mode, the hero occupies `min-h-[90vh]` with `py-16`. The product images grid (`grid-cols-2`) will render below the full CTA block, pushing it well below the fold on tablet. The `min-h-[90vh]` constraint may cause the product images to be cut off on shorter viewports.
**Suggested fix:** Consider adding `md:grid-cols-2` as an intermediate breakpoint so the editorial split renders on tablets too, or remove `min-h-[90vh]` from the inner grid and let content dictate height naturally.
**Priority:** Low

### 6.5 Create page prompt textarea has no `font-size: 16px` — triggers iOS zoom
**File:** `components/create/CreatePageLayoutLean.tsx` line 208
**What is wrong:** The main `<textarea>` for the prompt has class `text-base` (16px in Tailwind default). This is correct and prevents iOS Safari zoom. However, the gift note textarea in `CartDrawer.tsx` line 393 applies `fontSize: "16px"` as an inline style — suggesting this was a deliberate fix done inconsistently. The `CreatePageLayoutLean` textarea relies on `text-base` being 16px (which it is by default in Tailwind), so this is fine as-is, but worth noting it's relying on implicit Tailwind defaults rather than explicit intent.
**No change needed** — current state is correct, but the inconsistency between the two approaches is worth standardising.
**Priority:** Informational

---

## 7. ADDITIONAL OBSERVATIONS

### 7.1 PremiumGateway uses the `periwinkle` colour (#E2E8FF) for cloud rendering
**File:** `components/PremiumGateway.tsx` line 339
**What is wrong:** The 3D cloud scene passes `color="#E2E8FF"` (periwinkle) as a cloud tint. This is the only usage of the periwinkle token outside the config. It is not semantically connected to the brand. This appears intentional as a subtle sky colour in the Three.js scene, but it is the only non-warm-palette element in the entire UI.
**Suggested fix:** Either accept this as intentional (document it) or shift the cloud colour to a very light cream tint `#FDF6EE` for a warmer sky feel. Not a blocker.
**Priority:** Low

### 7.2 `hover:underline` as the sole hover state on footer links has low discoverability
**File:** `components/SiteFooter.tsx` lines 290, 318
**What is wrong:** Footer navigation links use `hover:underline` as the only interactive state — no colour change. On the cream-dark background `#F5EDE0`, `ink-muted` (62% opacity charcoal) links only show an underline on hover. This is a low-discovery affordance and has no keyboard focus style (`focus-visible` not applied).
**Suggested fix:** Add `hover:text-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta/40` to footer links to provide both a colour and keyboard focus state.
**Priority:** Medium

### 7.3 Social icon hover state uses JavaScript `onMouseEnter/onMouseLeave` instead of CSS
**File:** `components/SiteFooter.tsx` lines 250–261
**What is wrong:** Social icon hover colour changes are implemented with `onMouseEnter`/`onMouseLeave` JS handlers mutating `element.style` directly. This approach has no keyboard focus equivalent, no touch equivalent, and will fail if JS is slow to execute. It also bypasses the Tailwind/CSS variable system.
**Suggested fix:** Replace with a Tailwind group approach: wrap each icon in a `group` `<a>`, and use `group-hover:bg-terracotta group-hover:text-white group-hover:border-transparent` on the inner elements. This is pure CSS and keyboard/touch friendly.
**Priority:** Medium

### 7.4 `inline-block` duplicate classname on about page CTAs
**File:** `app/about/AboutClient.tsx` line 249, 256
**What is wrong:** Both CTA links have `inline-flex ... inline-block` — `inline-flex` and `inline-block` are both applied. `inline-flex` takes precedence in CSS (flex wins over block). The `inline-block` is a dead class here.
**Suggested fix:** Remove `inline-block` from both links. This is a copy-paste artifact.
**Priority:** Low

---

## Priority Summary

| # | Issue | Priority |
|---|-------|----------|
| 1.3 | MerchGeneratorPlatform font-black headings break typographic system | **High** |
| 2.2 | BottomSheetNav overlaps content — no bottom padding on main | **High** |
| 1.1 | Competing header/footer systems on landing vs other pages | **Medium** |
| 1.4 | Wizard.tsx font-black headings | **Medium** |
| 2.1 | Two different CONTAINER constants with different padding | **Medium** |
| 2.3 | Cart drawer shadow uses Unicode minus (silent Tailwind bug) | **Medium** |
| 2.4 | About page two CTAs look identical — no hierarchy | **Medium** |
| 3.1 | Fraunces italic not loaded — synthetic italics used for decorative copy | **Medium** |
| 4.2 | text-gold Tailwind class bypasses CSS variable for Atelier Mode | **Medium** |
| 4.5 | charcoal/35–40 muted text fails WCAG AA contrast at small sizes | **Medium** |
| 5.3 | ProductPreviewClient uses raw `<img>` for related products | **Medium** |
| 5.4 | About hero raw `<img>` causes CLS and missing optimisation | **Medium** |
| 6.2 | Shop sticky filter bar z-index/top value assumes fixed header height | **Medium** |
| 7.2 | Footer links have no colour change or focus state on hover | **Medium** |
| 7.3 | Social icon hover uses JS DOM mutation instead of CSS | **Medium** |
| 1.2 | Zombie Hero.tsx component in production codebase | Low |
| 3.2 | Clamp headings missing explicit line-height in CreatePageLayoutLean | Low |
| 3.3 | Inconsistent eyebrow/label text classes across pages | Low |
| 4.1 | Legacy ivory/obsidian tokens still used in 2 components | Low |
| 4.3 | Atelier Mode overrides incomplete (most classes bypass CSS vars) | Low |
| 4.4 | Hardcoded hex colours instead of CSS variable references | Low |
| 5.2 | About founder illustration uses `<img>` not `<Image>` | Low |
| 6.1 | Featured products 2-column mobile card: text base size too large | Low |
| 6.3 | BottomSheetNav z-index lower than CartDrawer backdrop | Low |
| 6.4 | Hero grid has no intermediate md breakpoint | Low |
| 7.1 | Periwinkle cloud colour only non-warm element in UI | Low |
| 7.4 | inline-flex + inline-block duplicate classes on about CTAs | Low |
