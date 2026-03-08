# Team 2: On-Page SEO & Metadata — Audit Report

**Date:** 2026-03-08
**Scope:** All page-level metadata across keepsy.store

---

## Current State Findings

### app/layout.tsx (Global)
- Has a title template (`%s — Keepsy`) and fallback default title.
- Global description, keywords, metadataBase, alternates/hreflang, openGraph, and twitter cards are present.
- **Issue:** The global OG title and twitter title are just "Keepsy" — too generic.
- Global canonical is `https://keepsy.store` which is correct for the root but pages should override with their own canonical.

### app/page.tsx (Homepage)
- **No page-level metadata export.** Inherits everything from layout.
- Will render as "Keepsy — Personalised Gifts She'll Never Forget" in the title template (actually the default title, since there is no `%s` substitution).
- **Fix required:** Add full metadata export with keyword-rich title, description, and OG/twitter tags.

### app/shop/page.tsx
- Has metadata: title "Shop Personalised Gifts", description mentions UK & US, canonical set.
- OG and twitter titles are "Shop Personalised Gifts — Keepsy".
- **Issues:** Title missing price anchors and canvas. Description doesn't mention prices. OG description refers to "artisan quality" (vague). No twitter card images.
- **Fix required:** Update title, description, OG/twitter text with prices and canvas.

### app/create/page.tsx
- Has metadata: title "Create Your Custom Gift", description is short (59 chars), canonical set.
- **Issues:** Title is generic. Description lacks product specificity and benefit detail. No OG or twitter tags.
- **Fix required:** Expand to full metadata with OG/twitter.

### app/product/[type]/page.tsx
- Has `generateMetadata` producing per-product titles and descriptions.
- **Issues:** Titles are short (e.g. "Personalised Greeting Card") with no keyword depth. Descriptions are long narrative copy, not SEO-optimised. No prices. No "canvas" product type (canvas is not in PRODUCT_CARDS currently).
- **Fix required:** Replace PRODUCT_DESCRIPTIONS with SEO-optimised per-type data including prices, update generateMetadata titles to pattern "Personalised [Product] — Custom Printed [Product] | Keepsy".

### app/gift-ideas/page.tsx
- Has metadata: title "Gift Ideas for Every Occasion", canonical set, OG and twitter present.
- **Issues:** Title uses layout template producing "Gift Ideas for Every Occasion — Keepsy" which is acceptable but misses target keywords like "Personalised Gift Ideas". Description doesn't mention specific occasions (Mother's Day, hen do etc.).
- **Fix required:** Update title, description, and OG/twitter to target better keywords.

### app/community/page.tsx
- Has metadata: title "Customer Reviews & Stories", description mentions UK/US, canonical set.
- **Issues:** Title could be more concise and direct. Description is good but could mention the star rating.
- **Fix required:** Update title to "Customer Reviews — Keepsy Personalised Gifts" and description to reference 4.8/5 rating.

### Legal Pages

| Page | Has Metadata? | Issues |
|------|--------------|--------|
| app/terms/page.tsx | Yes (`export const metadata`) | Has title/description but no canonical, not typed as `Metadata` |
| app/privacy/page.tsx | Yes (`export const metadata`) | Has title/description but no canonical, not typed as `Metadata` |
| app/refunds/page.tsx | Yes (`export const metadata`) | Has title/description but no canonical, not typed as `Metadata` |
| app/cookies/page.tsx | Yes (`export const metadata`) | Has title/description but no canonical, not typed as `Metadata` |
| app/shipping/page.tsx | Yes (`export const metadata`) | Has title/description but no canonical, not typed as `Metadata` |
| app/sar/page.tsx | **NO** — no metadata export at all | Needs metadata added |

---

## Changes Implemented

### 1. app/page.tsx
- Added full `metadata` export with keyword-rich title, description, canonical, OG, and twitter tags.

### 2. app/shop/page.tsx
- Updated title to include all products and prices.
- Updated description to mention all product prices (hoodie £44.99, mug £18.99, tee £29.99, card £9.99, canvas £29.99).
- Updated OG and twitter titles and descriptions to match.

### 3. app/create/page.tsx
- Updated title to "Design Your Own Personalised Gift | Create Custom Prints — Keepsy".
- Expanded description with product list and preview benefit.
- Added openGraph and twitter metadata.

### 4. app/product/[type]/page.tsx
- Updated `PRODUCT_DESCRIPTIONS` to be SEO-optimised per-type descriptions including prices and benefits.
- Added `PRODUCT_TITLES` map with optimised title strings.
- Added canvas type entry to both maps (for future product expansion).
- Updated `generateMetadata` to use the new title and description maps.

### 5. app/gift-ideas/page.tsx
- Updated title to "Personalised Gift Ideas | Gift Guides by Occasion — Keepsy".
- Updated description to mention specific occasions (Mother's Day, Father's Day, birthdays, weddings, hen do).
- Updated OG and twitter text.

### 6. app/community/page.tsx
- Updated title to "Customer Reviews — Keepsy Personalised Gifts".
- Updated description to reference 4.8/5 rating and specific product types.
- Updated OG and twitter text.

### 7. Legal pages
- **terms, privacy, refunds, cookies, shipping** — already have metadata exports; no changes needed as per instructions (only add if MISSING entirely).
- **app/sar/page.tsx** — added minimal metadata export (title, description, canonical) since it had no metadata at all.

---

## Notes for Subsequent Teams
- Canvas is not yet in PRODUCT_CARDS in `components/ProductGrid.tsx`. The canvas metadata in the product page generateMetadata will work if/when a canvas product type is added there.
- All legal page metadata exports use plain objects (not typed as `Metadata`) — this is valid but worth unifying in a future pass.
- The layout global OG image (`/opengraph-image`) is inherited by all pages that don't override it. Product pages don't set OG images — a future improvement would be to add per-product preview images.
