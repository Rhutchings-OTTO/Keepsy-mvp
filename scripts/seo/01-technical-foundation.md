# Technical SEO Foundation Audit — Keepsy

Audited: 2026-03-08

---

## 1. Current State: sitemap.ts

### Pages included (before fix)
| URL | changeFrequency | priority |
|-----|----------------|----------|
| / | weekly | 1.0 |
| /shop | weekly | 0.9 |
| /create | monthly | 0.9 |
| /gift-ideas | weekly | 0.8 |
| /product/mug | monthly | 0.8 |
| /product/card | monthly | 0.8 |
| /product/tee | monthly | 0.8 |
| /product/hoodie | monthly | 0.8 |
| /about | monthly | 0.6 |
| /community | weekly | 0.6 |
| /shipping | yearly | 0.4 |
| /refunds | yearly | 0.4 |
| /terms | yearly | 0.3 |
| /privacy | yearly | 0.3 |

### Issues found
- `/` changeFrequency is "weekly" — should be "daily" (homepage content changes with promotions/new products)
- `/shop` changeFrequency is "weekly" — should be "daily" (product listings update frequently)
- `/shop` priority 0.9 — should be 0.95 (second most important page)
- Product pages priority 0.8 — should be 0.9 (core conversion pages)
- Product pages changeFrequency "monthly" — should be "weekly" (designs and copy can update)
- `/about` priority 0.6 — should be 0.7
- `/community` priority 0.6 — should be 0.7
- `/shipping` changeFrequency "yearly" — should be "monthly" (policy pages can change)
- `/refunds` changeFrequency "yearly" — should be "monthly"
- `/terms` changeFrequency "yearly" — should be "monthly"
- `/privacy` changeFrequency "yearly" — should be "monthly"
- Missing pages: `/faq`, `/cookies`, `/sar`

---

## 2. Current State: robots.ts

### What it does (before fix)
- Single wildcard rule (`*`) covering all user agents
- Allow: `/`
- Disallow: `/admin/`, `/debug/`, `/perf/`, `/mockup-previews/`, `/api/`, `/track/`, `/success/`, `/account/`
- Sitemap declared correctly

### Issues found
- No explicit rules for AI crawlers (GPTBot, ChatGPT-User, anthropic-ai, PerplexityBot, Google-Extended, Bingbot). Without explicit rules, the wildcard `allow: "/"` technically covers them, but many AI crawlers check for named rules as a signal of intentional opt-in. Explicit allow rules make crawl intent unambiguous and may improve AI-driven discovery/citations.
- `/track` and `/account` listed without trailing slash — should be `/track` and `/account` (or with trailing slash for consistency). Current code uses `/track/` and `/account/` with trailing slashes, which is fine, but worth confirming consistency.

---

## 3. Current State: layout.tsx (metadata)

### What exists
- `metadataBase: new URL("https://keepsy.store")` — correct
- `alternates: { canonical: "/" }` — present but incomplete. The canonical resolves to `https://keepsy.store/` via metadataBase, which is correct, but no `languages` field means no hreflang tags are emitted.

### Issues found
- No `languages` field in `alternates` — Google sees no hreflang signals. For a UK/US dual-market store using the same domain, hreflang `en-GB` and `en-US` both pointing to `https://keepsy.store` tells Google this content serves both locales, avoiding any ambiguity about which market the site targets.

---

## 4. Changes Made

### sitemap.ts
- Added missing pages: `/faq`, `/cookies`, `/sar`
- Updated `/` changeFrequency: weekly → daily
- Updated `/shop` changeFrequency: weekly → daily; priority: 0.9 → 0.95
- Updated all four product pages: priority 0.8 → 0.9; changeFrequency: monthly → weekly
- Updated `/about` priority: 0.6 → 0.7
- Updated `/community` priority: 0.6 → 0.7
- Updated `/shipping`, `/refunds`, `/terms`, `/privacy` changeFrequency: yearly → monthly
- Updated `/shipping` priority: 0.4 → 0.5
- Updated `/refunds` priority: 0.4 → 0.3 (to match terms/privacy tier)
- Added `/cookies` priority: 0.3, changeFrequency: monthly
- Added `/sar` priority: 0.2, changeFrequency: monthly
- Added submit-to-GSC comment at top of file

### robots.ts
- Kept existing wildcard rule with all disallow paths
- Added explicit named rules for: GPTBot, ChatGPT-User, anthropic-ai, PerplexityBot, Google-Extended, Bingbot — each with `Allow: /`

### layout.tsx
- Added `languages` field to existing `alternates` object:
  - `"en-GB": "https://keepsy.store"`
  - `"en-US": "https://keepsy.store"`
- Updated `canonical` from relative `"/"` to absolute `"https://keepsy.store"` for consistency with the languages values

---

## 5. Next Steps (manual)

1. Submit `https://keepsy.store/sitemap.xml` to Google Search Console: https://search.google.com/search-console
2. Verify hreflang tags are rendering by fetching page source and searching for `hreflang`
3. Once `/faq` page is built, confirm it returns 200 before the sitemap entry goes live
4. Consider per-page canonical + hreflang overrides on product pages once locale-specific copy is introduced
