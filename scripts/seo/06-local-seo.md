# Team 6: Local SEO Report — Keepsy

**Date:** 2026-03-08
**Scope:** Online-only UK/US personalised gift store — https://keepsy.store

---

## Summary

Keepsy is an online-only store with no physical locations. "Local SEO" therefore means:
1. Structured data that correctly signals the geographic markets served (UK + US).
2. A Google Business Profile that surfaces Keepsy in gift-related searches.
3. Footer links that give search engines crawlable paths to all key pages.

---

## Audit Findings

### 1. Structured Data (pre-edit)
- `app/layout.tsx` contained an `@graph` array with two nodes: `Organization` and `WebSite`.
- The `Organization` node already had `contactPoint.areaServed: ["GB", "US"]` and `sameAs` links to Instagram and Pinterest.
- Missing: an `OnlineStore` node to explicitly declare product catalogue, price range, accepted currencies/payment methods, and geographic service area.

### 2. Google Business Profile
- No GBP setup documented anywhere in the codebase.
- A GBP listing is the single highest-impact "local SEO" action for an online-only brand — it can surface in "personalised gifts UK" or "custom mugs near me" knowledge-panel results.
- Manual setup instructions have been added as a comment in `components/SiteFooter.tsx`.

### 3. Footer Links
- `/faq` page exists (`app/faq/page.tsx`) but was **absent** from the footer. Added to the Help column.
- `/community` page exists (`app/community/page.tsx`) but was **absent** from the footer. Added to the Shop column (alongside Gift Ideas, as it is audience/community facing).
- `/about`, `/gift-ideas` were already present.

---

## Changes Made

### `app/layout.tsx`
- Added a third node `{ "@type": ["Organization", "OnlineStore"] }` to the existing `@graph` array.
- Node declares `areaServed` (United Kingdom, United States), `hasOfferCatalog` (five product types), `priceRange`, `currenciesAccepted`, `paymentAccepted`, and `parentOrganization` reference to the existing `#organization` node.
- Existing `Organization` and `WebSite` nodes were not modified.

### `components/SiteFooter.tsx`
- Added a Google Business Profile setup comment block at the top of the file (after `"use client"`, before the first `import`).
- Added `<Link href="/faq">FAQ</Link>` to the Help accordion/column.
- Added `<Link href="/community">Community</Link>` to the Shop accordion/column.

---

## Recommended Next Steps (manual)

| Priority | Action |
|----------|--------|
| High | Complete GBP setup per the comment in SiteFooter.tsx |
| High | Upload 10+ product mockup photos to GBP |
| Medium | Add GBP products with names, prices, and photos |
| Medium | Enable Google Messaging on GBP |
| Medium | After first orders ship, request customer reviews via GBP |
| Low | Submit sitemap to Google Search Console for both en-GB and en-US |
| Low | Consider Bing Places for Business listing (same content as GBP) |

---

## Why These Changes Matter

- The `OnlineStore` schema node tells Google and other structured-data consumers exactly what Keepsy sells, where it ships, what currencies it accepts, and what payment methods it supports — information used to populate rich results and knowledge panels.
- A complete GBP listing can place Keepsy in the "Shopping" tab and Google Maps results for generic gift queries, even without a physical address (Google allows online-only businesses).
- Footer links pass PageRank to key destination pages (`/faq`, `/community`) and signal site structure to crawlers, improving indexation depth.
