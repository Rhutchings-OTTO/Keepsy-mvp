# Team 7 — Internal Linking & Site Architecture

## Current Link Structure

### Homepage (`/`)
- Links to `/create` (hero CTA, multiple sections)
- Links to `/shop` (via product grid cards and navigation)
- Links to `/product/[type]` (via ProductGrid component)
- Links to `/gift-ideas` (navigation)
- Links to `/community` (navigation)

### Shop page (`/shop`)
- `CatalogClient` renders product cards; each card links to `/create?product=[type]&color=[color]`
- No links to individual `/product/[type]` detail pages (cards go directly to `/create`)
- No breadcrumb previously

### Product pages (`/product/[type]`)
- Links back to `/create`, `/shop`, `/gift-ideas` at the bottom (added by prior team)
- Has JSON-LD Product schema

### Gift Ideas page (`/gift-ideas`)
- Links to `/create` via CTA button at the bottom
- `OccasionTiles` component links to occasion-filtered create flows
- No breadcrumb previously

### Community/Reviews page (`/community`)
- Links to `/create` ("Start Creating →" CTA)
- Links to `/shop` ("Browse Shop" CTA)
- Both links are already present in the server-rendered page component

### Footer (`SiteFooter`)
- Shop column: `/shop`, `/gift-ideas`, `/community`, `/create`, `/product/mug`, `/product/tee`, `/product/hoodie`, `/product/card`
- Company column: `/about`, `/terms`, `/privacy`, `/cookies`, `/refunds`, `/shipping`
- Help column: `mailto:support@keepsy.store`, `/faq`

---

## Orphan Pages Identified

The following pages are linked from the footer but have no inbound links from content pages:
- `/canvas` product — missing from footer Shop column (only mug, tee, hoodie, card listed)
- `/about`, `/terms`, `/privacy`, `/cookies`, `/refunds`, `/shipping`, `/faq` — policy/utility pages, footer-only; acceptable

Pages that could benefit from stronger cross-linking:
- `/community` — only reachable via footer and nav; no content pages link to it contextually
- `/gift-ideas` — reachable from footer and nav; product pages now link to it (prior team)

---

## What Was Added in This Audit

### 1. Breadcrumb nav — `/shop`
Added a server-rendered `<nav aria-label="Breadcrumb">` at the top of `ShopPage`, wrapping the existing `<CatalogClient />` in a fragment. Provides visible Home → Shop trail and supports the BreadcrumbList schema.

### 2. Breadcrumb nav — `/gift-ideas`
Added a server-rendered `<nav aria-label="Breadcrumb">` at the top of `GiftIdeasPage`, above the `<PromoBanner />`. Provides visible Home → Gift Ideas trail.

### 3. BreadcrumbList JSON-LD — `/shop`
Added a `BreadcrumbList` schema alongside the existing `ItemList` schema in `app/shop/page.tsx` using the shared `JsonLd` component. Signals the breadcrumb path to Google.

### 4. CatalogClient cross-links — observation
`CatalogClient` product cards currently link to `/create?product=...` rather than to `/product/[type]` detail pages. This is intentional (direct-to-customiser flow). No change made; noted for future consideration if product detail page traffic becomes a priority.

### 5. Community page CTAs — observation
`/community` already has server-rendered CTAs linking to both `/create` and `/shop`. No changes needed.
