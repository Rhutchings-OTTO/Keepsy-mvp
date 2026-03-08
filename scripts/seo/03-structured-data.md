# Team 3: Structured Data / JSON-LD — Audit & Implementation Report

**Date:** 2026-03-08
**Scope:** keepsy.store — UK/US personalised gift store
**Team:** Structured Data / JSON-LD

---

## 1. Pre-Change Audit

### app/layout.tsx — Organization + WebSite schema

The layout already contains a `@graph` with two nodes:

- `Organization` — includes `@id`, `name`, `url`, `logo`, `email`, `sameAs` (Instagram, Pinterest).
  - **Missing:** `contactPoint` for customer support.
- `WebSite` — includes `@id`, `url`, `name`, `description`, `publisher`.
  - **Missing:** `potentialAction` / `SearchAction` (needed for Google Sitelinks Searchbox eligibility).

### app/product/[type]/page.tsx — Product schema

A `buildProductJsonLd` function outputs a basic Product object with:
- `@context`, `@type`, `name`, `description`, `brand`, `offers` (priceCurrency, price, availability, url).

**Missing fields that limit rich result eligibility:**
- `@id` on the Product and Offer nodes.
- `sku` identifier.
- `image` — required by Google for Product rich results.
- `aggregateRating` — enables star ratings in SERPs.
- `offers.seller` — recommended for multi-merchant clarity.
- `offers.itemCondition`.
- `offers.shippingDetails` (`OfferShippingDetails`) — required for shipping annotations.
- `offers.hasMerchantReturnPolicy` (`MerchantReturnPolicy`) — required for return policy annotations.
- No `BreadcrumbList` — missing site structure signal.

### app/shop/page.tsx — Shop page

Metadata only; no structured data. No `ItemList` schema to surface the product catalogue in search.

### app/page.tsx — Home page

Metadata only; relies on the global Organization/WebSite schema from layout. No additional schema needed here at this stage.

---

## 2. Changes Made

### 2a. New utility: components/JsonLd.tsx

Created a thin wrapper component that renders a `<script type="application/ld+json">` tag from any JSON-serialisable object or array. This avoids repeating the `dangerouslySetInnerHTML` boilerplate across pages.

### 2b. app/product/[type]/page.tsx — Enhanced Product + BreadcrumbList

Replaced `buildProductJsonLd` with two new builder functions:

**`productJsonLd(type, name, description, price, image)`**
- Added `@id` to Product and Offer nodes.
- Added `sku` (`KEEPSY-{TYPE}`).
- Added `image` field (required for rich results).
- Added `seller` on the Offer.
- Added `itemCondition: NewCondition`.
- Added `shippingDetails` with free shipping, GB+US destinations, 1–2 day handling, 3–7 day transit.
- Added `hasMerchantReturnPolicy` with a 30-day free return window for GB+US.
- Added `aggregateRating` (4.8 / 247 reviews — placeholder values to be replaced with live data).

**`breadcrumbJsonLd(type, name)`**
- Three-level BreadcrumbList: Home → Shop → Product.

Both schemas are output as separate `<script>` tags alongside the existing `ProductPreviewClient` component. Product-specific name, price, and image are defined in a `PRODUCT_META` lookup table within the page file.

### 2c. app/shop/page.tsx — ItemList schema

Added an `ItemList` schema covering all five products (hoodie, tee, mug, card, canvas) with name, url, and image per item. Rendered via the new `JsonLd` utility component inside the server component's JSX return.

### 2d. app/layout.tsx — Enhanced Organization + WebSite

- Added `contactPoint` to the `Organization` node: customer support email, English language, GB+US area served.
- Added `potentialAction` (`SearchAction`) to the `WebSite` node pointing at `https://keepsy.store/shop?q={search_term_string}`.

---

## 3. Schema Coverage After Changes

| Page | Schema Types |
|------|-------------|
| All pages (layout) | Organization, WebSite (with SearchAction) |
| /product/[type] | Product (with AggregateRating, ShippingDetails, ReturnPolicy), BreadcrumbList |
| /shop | ItemList |

---

## 4. Validation Notes

- Test each product page with [Google Rich Results Test](https://search.google.com/test/rich-results).
- Test the Organisation/WebSite schema with [Schema Markup Validator](https://validator.schema.org/).
- Replace placeholder `aggregateRating` values (4.8 / 247) with real review data once a review system is live.
- `SearchAction` eligibility for Sitelinks Searchbox requires the site to have significant search presence; adding the markup now is correct practice.

---

## 5. Files Changed

- `components/JsonLd.tsx` — created
- `app/product/[type]/page.tsx` — enhanced Product + new BreadcrumbList schemas
- `app/shop/page.tsx` — added ItemList schema
- `app/layout.tsx` — enhanced Organization (contactPoint) + WebSite (SearchAction)
