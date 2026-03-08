# Team 4: Content SEO & Keyword Strategy
**Date:** 2026-03-08
**Scope:** Product page rich content, gift-ideas page assessment, keyword strategy

---

## Audit findings

### app/product/[type]/page.tsx — pre-change state

The file is a clean async server component using `params: Promise<{ type: string }>`. It already has:
- Per-product `<title>` and `<meta description>` via `generateMetadata`
- Canonical URLs for all five product types
- Product JSON-LD (schema.org/Product with offers, shipping, return policy, aggregate rating)
- BreadcrumbList JSON-LD
- `generateStaticParams` for static export of all product slugs

The JSX returned was minimal — just `<JsonLd>` tags and `<ProductPreviewClient>`. There was **no server-rendered body copy** below the interactive client component, which is the primary SEO gap: crawlers get no textual content, no FAQs, no "How it works" narrative, and no internal links from these pages.

### app/gift-ideas/page.tsx — assessment

The page has good bones:
- Strong metadata (title, description, OG, Twitter, canonical)
- A hero section with an H1
- `<OccasionTiles>` component (renders occasion-based navigation tiles)
- A "How it works" strip (3-step process)
- A CTA banner linking to /create

**What it lacks for deeper content SEO:**
- No occasion-specific editorial copy (e.g., a short paragraph on "why personalised gifts work for Mother's Day")
- No FAQ section targeting gift-related long-tail queries
- No internal links to individual product pages within copy
- No structured data (FAQ schema, ItemList schema for occasions)
- The OccasionTiles component is a client-side component — if it renders entirely client-side, the occasion names may not be in the initial HTML

**Verdict:** The gift-ideas page is not sparse — it has a hero, tiles, how-it-works, and CTA. It is **not a candidate for a full rewrite**. The improvements needed are additive (editorial paragraphs, FAQ section, schema) and should be tackled as a separate pass once occasion-specific landing pages exist. No changes made to this file in this pass.

---

## Keyword strategy

### Primary target keywords by product

| Product | Primary KW | Supporting KWs |
|---------|-----------|----------------|
| Hoodie | personalised hoodie | custom printed hoodie, personalised hoodie gift UK, personalised hoodie gift US, hen party hoodie |
| Mug | personalised mug | custom photo mug, personalised mug gift, personalised birthday mug, photo mug UK |
| T-Shirt | personalised t-shirt | custom printed tee, personalised tshirt gift, hen party t-shirts, custom t shirt UK |
| Card | personalised greeting card | personalised birthday card, custom photo card, bespoke greeting card UK |
| Canvas | personalised canvas print | custom photo canvas, personalised wall art, canvas print gift UK |

### Occasion keywords mapped to products
- Mother's Day → all five products (mug and card highest intent)
- Father's Day → hoodie, mug, tee, card
- Birthday → all five products
- Hen party / hen do → hoodie, tee
- Wedding → canvas, card
- Anniversary → canvas, mug, card
- Christmas → all five products
- Baby shower → card, mug, canvas

---

## Changes made

### app/product/[type]/page.tsx

Added a `PRODUCT_CONTENT` constant (before the component) containing per-product:
- `aboutTitle` + `about` paragraph (keyword-rich prose for each product type)
- `howItWorks` (3-step ordered list)
- `perfectFor` (occasion tags as pill list)
- `faqs` (5 Q&A pairs per product targeting long-tail search queries)

Added a server-rendered `<div>` section below `<ProductPreviewClient>` that renders all of the above as semantic HTML. The section is conditionally rendered only when `PRODUCT_CONTENT[type]` exists, so unknown product types are unaffected.

Sections rendered (all in initial HTML, fully crawlable):
1. **How It Works** — `<h2>` + `<ol>` with numbered steps
2. **About** — `<h2>` + `<p>` with keyword-rich product description
3. **Perfect For** — `<h2>` + `<ul>` of occasion pills
4. **Delivery Information** — `<h2>` + `<ul>` in a warm-toned box
5. **Common Questions** — `<h2>` + per-FAQ `<h3>`/`<p>` pairs (FAQ schema can be layered on top)
6. **Explore More** — `<h2>` + three internal links to /create, /shop, /gift-ideas

No existing code (generateStaticParams, generateMetadata, JSON-LD builders, imports, ProductPreviewClient) was removed or modified.

---

## Recommendations for future passes

1. **FAQ JSON-LD on product pages** — the FAQ content added in this pass is ideal source material for `schema.org/FAQPage` structured data. A Team 3 follow-up pass should add this alongside the existing Product schema.
2. **Occasion landing pages** — high-value targets like `/gifts/mothers-day`, `/gifts/birthday`, `/gifts/hen-party`. These would capture mid-funnel traffic that gift-ideas/page.tsx currently misses.
3. **Gift-ideas editorial expansion** — add 150–200 word editorial paragraphs per occasion below the tiles, plus a FAQ section. Suitable for a standalone content pass.
4. **Internal linking from blog/editorial** — once blog infrastructure exists, link from gift guides directly to product pages using anchor text matching primary keywords.
5. **OccasionTiles SSR check** — verify that OccasionTiles renders occasion names in server HTML. If it is a pure client component, the occasion names are invisible to crawlers on first load.
