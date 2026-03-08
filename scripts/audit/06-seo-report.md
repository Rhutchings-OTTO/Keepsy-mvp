# SEO Audit Report — Keepsy
**Date:** 2026-03-08 | **Auditor:** SEO Specialist review of main branch
**Overall SEO Health: 55/100**

---

## Executive Summary

Keepsy has some solid SEO foundations — a well-structured root metadata export, Next.js Image optimization, functional Open Graph images, clean URL structure, and good heading hierarchy on most pages. However there are several critical gaps that will significantly limit search engine discoverability and ranking potential.

**Three issues demand immediate attention:** no sitemap.xml (search engines cannot reliably discover all pages), no robots.txt (internal/admin routes are crawlable), and no metadata whatsoever on the two highest-value pages (`/create` and `/product/[type]`).

**Summary scorecard:**

| Category | Status |
|---|---|
| Root metadata | Mostly good — title template present, description strong |
| Page-level metadata | Partial — 9 of 19 pages have metadata; 10 do not |
| Sitemap | MISSING |
| robots.txt | MISSING |
| Canonical URLs | Root only — no page-level canonicals |
| H1 structure | Mostly good — /create missing H1 |
| Image alt text | 11 empty `alt=""` attributes in components |
| Structured data (JSON-LD) | MISSING entirely |
| Open Graph | Root only — no per-page OG overrides on key pages |
| Twitter Cards | Root only — same issue |

---

## Detailed Findings

---

### ISSUE 1 — No sitemap.xml
**File:** Not present (checked `app/sitemap.ts`, `app/sitemap.xml`, `public/sitemap.xml`)
**Priority: CRITICAL | SEO Impact: HIGH**

Google and other crawlers use the sitemap to discover pages efficiently. Without one, deep or less-linked pages may never be indexed. Keepsy has at least 13 public-facing routes that should be in a sitemap.

**Recommended fix — create `app/sitemap.ts`:**
```ts
import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://keepsy.store";
  const now = new Date();
  return [
    { url: base,                              lastModified: now, changeFrequency: "weekly",  priority: 1.0 },
    { url: `${base}/shop`,                    lastModified: now, changeFrequency: "weekly",  priority: 0.9 },
    { url: `${base}/create`,                  lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/gift-ideas`,              lastModified: now, changeFrequency: "weekly",  priority: 0.8 },
    { url: `${base}/product/mug`,             lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/product/card`,            lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/product/tee`,             lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/product/hoodie`,          lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/about`,                   lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/community`,               lastModified: now, changeFrequency: "weekly",  priority: 0.6 },
    { url: `${base}/shipping`,                lastModified: now, changeFrequency: "yearly",  priority: 0.4 },
    { url: `${base}/refunds`,                 lastModified: now, changeFrequency: "yearly",  priority: 0.4 },
    { url: `${base}/terms`,                   lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
    { url: `${base}/privacy`,                 lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
  ];
}
```

Note: exclude `/account`, `/success`, `/track`, `/debug`, `/perf`, and `/mockup-previews` — these are user-specific, utility, or dev-only routes.

---

### ISSUE 2 — No robots.txt
**File:** Not present (checked `app/robots.ts`, `public/robots.txt`)
**Priority: CRITICAL | SEO Impact: HIGH**

Without a robots.txt, Googlebot will crawl everything including `/debug`, `/perf`, `/admin`, and `/mockup-previews`. These pages consume crawl budget and could appear in search results.

**Recommended fix — create `app/robots.ts`:**
```ts
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin/",
        "/debug/",
        "/perf/",
        "/mockup-previews/",
        "/api/",
        "/track/",
        "/success/",
        "/account/",
      ],
    },
    sitemap: "https://keepsy.store/sitemap.xml",
  };
}
```

Alternatively create `public/robots.txt` as a static file. The `app/robots.ts` approach is preferred in Next.js 13+.

---

### ISSUE 3 — `/create` page has no metadata
**File:** `app/create/page.tsx`
**Priority: CRITICAL | SEO Impact: HIGH**

The `/create` route is arguably the most important conversion page on the site. It currently exports no metadata — meaning it inherits the generic root title (`"Keepsy — Personalised Gifts She'll Never Forget"`) with no unique description. Google will either use the generic fallback or generate its own snippet from page content.

**Recommended fix:**
```ts
export const metadata: Metadata = {
  title: "Create a Personalised Gift | Keepsy",
  description: "Turn a photo or memory into a premium keepsake in minutes. Design your custom mug, card, hoodie or tee — see it on the product before you buy.",
  alternates: {
    canonical: "https://keepsy.store/create",
  },
  openGraph: {
    title: "Create a Personalised Gift | Keepsy",
    description: "Turn a photo or memory into a premium keepsake in minutes.",
    url: "https://keepsy.store/create",
  },
};
```

---

### ISSUE 4 — `/product/[type]` has no metadata (static or dynamic)
**File:** `app/product/[type]/page.tsx`
**Priority: CRITICAL | SEO Impact: HIGH**

The product detail pages (`/product/mug`, `/product/card`, `/product/tee`, `/product/hoodie`) have zero metadata. These are high-intent landing pages for queries like "custom mug gift", "personalised greeting card" — exactly the terms Keepsy should rank for.

**Recommended fix — add `generateMetadata`:**
```ts
import type { Metadata } from "next";
import { PRODUCT_CARDS } from "@/components/ProductGrid";

const META: Record<string, { title: string; description: string }> = {
  mug: {
    title: "Custom Personalised Mug | Keepsy",
    description: "Design a one-of-a-kind personalised mug with your own photo or message. Premium ceramic, vivid print, shipped to US & UK. From $24.",
  },
  card: {
    title: "Personalised Greeting Cards | Keepsy",
    description: "Create a custom greeting card with your own photo and message. Beautiful, meaningful and printed to perfection. From $4.",
  },
  tee: {
    title: "Custom Printed T-Shirts | Keepsy",
    description: "Design your own personalised tee with a photo or memory. Premium organic cotton, vivid prints, fast US & UK shipping. From $32.",
  },
  hoodie: {
    title: "Custom Personalised Hoodies | Keepsy",
    description: "Create a custom hoodie with your own design or photo. Heavyweight fleece, premium print quality, shipped to US & UK. From $54.",
  },
};

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { type } = await params;
  const meta = META[type];
  if (!meta) return {};
  return {
    title: meta.title,
    description: meta.description,
    alternates: { canonical: `https://keepsy.store/product/${type}` },
    openGraph: {
      title: meta.title,
      description: meta.description,
      url: `https://keepsy.store/product/${type}`,
    },
  };
}
```

---

### ISSUE 5 — No JSON-LD structured data anywhere
**File:** None — not implemented
**Priority: HIGH | SEO Impact: HIGH**

No schema.org markup exists in the entire codebase. Structured data enables rich results in Google (star ratings, product prices, FAQ accordions, breadcrumbs) and is a significant ranking signal.

**Missing schema types:**

| Schema Type | Where to add | Impact |
|---|---|---|
| `Organization` | `app/layout.tsx` | Brand knowledge panel |
| `WebSite` with `SearchAction` | `app/layout.tsx` | Sitelinks search box |
| `Product` | `app/product/[type]/page.tsx` | Product rich results + Google Shopping |
| `BreadcrumbList` | `app/product/[type]/page.tsx` | Breadcrumb trail in SERPs |
| `FAQPage` | `app/page.tsx` or a dedicated FAQ section | FAQ accordion in SERPs |
| `Review` / `AggregateRating` | Product pages | Star ratings in SERPs |

**Recommended fix — Organization schema in `app/layout.tsx`:**
```tsx
const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Keepsy",
  "url": "https://keepsy.store",
  "logo": "https://keepsy.store/opengraph-image",
  "description": "AI-powered personalised gifts — custom mugs, greeting cards, tees and hoodies, shipped to US & UK.",
  "contactPoint": {
    "@type": "ContactPoint",
    "email": "hello@keepsy.store",
    "contactType": "customer service"
  },
  "sameAs": []
};

// In <head>:
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
/>
```

**Recommended fix — Product schema example for `/product/mug`:**
```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Custom Personalised Mug",
  "description": "Design a one-of-a-kind personalised mug with your own photo or message.",
  "brand": { "@type": "Brand", "name": "Keepsy" },
  "offers": {
    "@type": "Offer",
    "price": "24.99",
    "priceCurrency": "USD",
    "availability": "https://schema.org/InStock",
    "url": "https://keepsy.store/product/mug"
  }
}
```

---

### ISSUE 6 — Root canonical set to "/" only; no per-page canonical URLs
**File:** `app/layout.tsx` (line 29–31); all `page.tsx` files
**Priority: HIGH | SEO Impact: MEDIUM–HIGH**

`app/layout.tsx` sets `alternates: { canonical: "/" }` which means every page will inherit `https://keepsy.store/` as its canonical URL unless overridden. This tells Google that `/shop`, `/gift-ideas`, and `/product/mug` are all duplicates of the homepage — a significant crawl/indexation problem.

Every `page.tsx` that exports metadata needs its own canonical:
```ts
alternates: {
  canonical: "https://keepsy.store/shop",
},
```

Pages currently missing per-page canonicals:
- `app/shop/page.tsx`
- `app/about/page.tsx`
- `app/gift-ideas/page.tsx`
- `app/privacy/page.tsx`
- `app/terms/page.tsx`
- `app/shipping/page.tsx`
- `app/refunds/page.tsx`
- `app/account/page.tsx`
- `app/community/page.tsx`
- `app/create/page.tsx`
- `app/product/[type]/page.tsx`

---

### ISSUE 7 — 11 images with empty alt="" in components
**Files:** Multiple component files
**Priority: HIGH | SEO Impact: MEDIUM**

Google Images cannot index images with empty or missing `alt` text. These are also WCAG 2.1 accessibility violations (Level A). The full list:

| File | Line | Context |
|---|---|---|
| `components/DesignVaultSidebar.tsx` | 81 | Design vault thumbnail |
| `components/TextureLoupe.tsx` | 62 | Product base layer image |
| `components/TextureLoupe.tsx` | 75 | Product overlay layer |
| `components/skin/magicpath/MagicpathBackground.tsx` | 69 | Background card image |
| `components/GalleryOfThePossible.tsx` | 50 | Gallery image placeholder |
| `components/RealisticHoodie.tsx` | 76 | Hoodie product image |
| `components/mockups/HoodieMockupLayered.tsx` | 51 | Hoodie base mockup |
| `components/mockups/HoodieMockupLayered.tsx` | 80 | Hoodie highlight layer |
| `components/mockups/TopLayer.tsx` | 65 | Product top layer |
| `components/mockups/TopLayer.tsx` | 78 | Product layer |
| `components/mockups/TopLayer.tsx` | 110 | Product layer |

For purely decorative images (overlays, highlights), use `alt=""` with `role="presentation"` or pass `aria-hidden="true"` on a wrapper — but the current empty `alt=""` on functional product images (hoodie, loupe, vault) needs descriptive text.

**Examples:**
```tsx
// Decorative overlay — correct pattern:
<Image src={highlightsSrc} alt="" aria-hidden="true" ... />

// Functional product image — needs description:
<Image src={productBase} alt={`${productType} product mockup`} ... />

// Design vault:
<Image src={design.src} alt={design.name ?? "Saved design preview"} ... />
```

---

### ISSUE 8 — `/create` page has no H1
**File:** `app/create/page.tsx`, `components/MerchGeneratorPlatformLoader.tsx` (and the loaded component)
**Priority: HIGH | SEO Impact: MEDIUM**

The create flow renders a client-side generator with no semantic H1. Search engines cannot determine the page's primary topic. The page is also marked `export const dynamic = "force-dynamic"` which limits static optimizations.

**Recommended fix — add a visually hidden (or visible) H1:**
```tsx
// In CreatePage or MerchGeneratorPlatform:
<h1 className="sr-only">Create Your Personalised Gift</h1>
```

This is invisible to users but provides the semantic signal to crawlers. Alternatively make it visible as a styled page heading.

---

### ISSUE 9 — Open Graph metadata not set per-page on high-value pages
**Files:** `app/create/page.tsx`, `app/product/[type]/page.tsx`, `app/shop/page.tsx`, `app/gift-ideas/page.tsx`
**Priority: MEDIUM | SEO Impact: MEDIUM**

Root OG in `app/layout.tsx` sets a generic title ("Keepsy") and description ("Keep what matters — turn it into a gift."). Pages that don't override these will show this generic card when shared on social — a missed opportunity for conversion.

**Current state per page:**

| Page | Has OG override? |
|---|---|
| `/` (homepage) | Yes (root) |
| `/shop` | No — inherits generic root |
| `/create` | No — inherits generic root |
| `/gift-ideas` | No — inherits generic root |
| `/product/[type]` | No — no metadata at all |
| `/about` | No — inherits generic root |
| `/community` | No — inherits generic root |

**Recommended fix for `/shop`:**
```ts
export const metadata: Metadata = {
  title: "Shop Personalised Gifts | Keepsy",
  description: "Browse our collection of personalised mugs, tees, hoodies and greeting cards.",
  openGraph: {
    title: "Shop Personalised Gifts | Keepsy",
    description: "Custom mugs, tees, hoodies & cards — see your design before you buy.",
    url: "https://keepsy.store/shop",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Keepsy personalised gifts collection" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Shop Personalised Gifts | Keepsy",
    description: "Custom mugs, tees, hoodies & cards — see your design before you buy.",
  },
};
```

---

### ISSUE 10 — Root OG title too short; lacks keywords
**File:** `app/layout.tsx` (line 36)
**Priority: MEDIUM | SEO Impact: MEDIUM**

The root OpenGraph title is just `"Keepsy"` — 6 characters with no keywords. When the homepage is shared on social or appears as a search result, this is what users see in the card title. All sub-pages that don't override OG also inherit this.

**Current:** `"Keepsy"`
**Recommended:** `"Keepsy — Personalised Gifts | Custom Mugs, Cards, Hoodies & Tees"`

---

### ISSUE 11 — Title formatting inconsistency across pages
**File:** Multiple `page.tsx` files
**Priority: MEDIUM | SEO Impact: LOW–MEDIUM**

The root layout defines a template `"%s — Keepsy"`. Some pages bypass this by manually appending "| Keepsy" or "— Keepsy" in the title string, which causes the template separator to double-render. Others use the pipe character `|` while the root uses an em dash `—`.

**Inconsistent examples:**
- `app/gift-ideas/page.tsx`: `"Gift Ideas | Keepsy"` — uses `|`, bypasses template, renders as `"Gift Ideas | Keepsy — Keepsy"` ← bug
- `app/account/page.tsx`: `"My Account | Keepsy"` — same issue
- `app/community/page.tsx`: `"Reviews | Keepsy"` — same issue
- `app/privacy/page.tsx`: `"Privacy Policy | Keepsy"` — same issue
- `app/terms/page.tsx`: `"Terms of Service | Keepsy"` — same issue
- `app/shipping/page.tsx`: `"Shipping & Delivery | Keepsy"` — same issue
- `app/refunds/page.tsx`: `"Refund Policy | Keepsy"` — same issue

Pages correctly using the template:
- `app/shop/page.tsx`: `"Shop — Keepsy"` (matches template's `—` separator) ✓
- `app/about/page.tsx`: `"Our Story — Keepsy"` ✓

**Fix:** All title strings passed to the metadata template should be just the page portion (before the separator), not include `| Keepsy`:
```ts
// Wrong — will render as "Gift Ideas | Keepsy — Keepsy":
title: "Gift Ideas | Keepsy",

// Correct — template renders as "Gift Ideas — Keepsy":
title: "Gift Ideas",
```

---

### ISSUE 12 — Meta descriptions not fully keyword-optimised on key pages
**File:** Multiple `page.tsx` files
**Priority: MEDIUM | SEO Impact: MEDIUM**

Some descriptions are under-optimised or too short. A good meta description is 140–160 characters and includes target keywords + a call to action.

| Page | Current description | Char count | Issue |
|---|---|---|---|
| `/shop` | "Browse our collection of personalised mugs, tees, hoodies and greeting cards." | 78 chars | Too short, no CTA, no differentiator |
| `/about` | "Learn about Keepsy — the personalised gift brand built by a mom who wanted to preserve memories." | 96 chars | Inaccurate (founders are two men, not "a mom") |
| `/community` | "See what customers are saying about Keepsy personalised gifts. Loved by customers across the UK and US." | 103 chars | Acceptable but generic |
| `/gift-ideas` | "Browse gift ideas by occasion — birthdays, anniversaries, holidays and more. Find the perfect personalised gift." | 112 chars | Good but could include product types |

**Recommended replacements:**
```
/shop: "Shop custom mugs, greeting cards, personalised hoodies and tees. AI-powered design — see your gift on the product before you buy. US & UK delivery."
(150 chars)

/about: "Learn how Keepsy was built to make personalised gifting effortless — premium keepsakes for every occasion, shipped to US & UK."
(128 chars)
```

---

### ISSUE 13 — No `generateStaticParams` on product pages
**File:** `app/product/[type]/page.tsx`
**Priority: MEDIUM | SEO Impact: MEDIUM**

The dynamic route `/product/[type]` has no `generateStaticParams`. This means product pages are rendered server-side on demand rather than statically generated at build time. Static pages are faster, more reliably cached, and indexed more efficiently.

**Recommended fix:**
```ts
export function generateStaticParams() {
  return [
    { type: "mug" },
    { type: "card" },
    { type: "tee" },
    { type: "hoodie" },
  ];
}
```

---

### ISSUE 14 — `app/about/AboutClient.tsx` uses `<img>` instead of Next.js `<Image>`
**File:** `app/about/AboutClient.tsx` (lines 41, 148)
**Priority: LOW | SEO Impact: LOW**

Two images use the native `<img>` tag instead of Next.js `<Image>`, losing automatic format optimization (AVIF/WebP), lazy loading, and `sizes` attribute generation:

```tsx
// Line 41 — hero background:
<img src="https://images.unsplash.com/..." alt="Women laughing together, warm friendship" />

// Line 148 — founders illustration:
<img src="/images/about/founders-illustration.png" alt="Rory and Dan, co-founders of Keepsy" />
```

These images do have good `alt` text, but replacing them with `next/image` `<Image>` components would improve LCP scores and image SEO. The Unsplash domain is already in `remotePatterns` in `next.config.ts`.

---

### ISSUE 15 — Internal tool pages not blocked from indexing
**Files:** `app/debug/page.tsx`, `app/perf/page.tsx`, `app/mockup-previews/page.tsx`, `app/admin/`
**Priority: LOW | SEO Impact: LOW (until indexed)**

These pages have no `noindex` meta tag and no robots.txt to block them. They rely on a URL key for auth, but Google will eventually crawl and index them. Once a robots.txt is in place (Issue 2) this is resolved, but adding `noindex` as a defence-in-depth is recommended.

**Recommended fix — add to each internal tool page:**
```ts
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};
```

---

## Pages Without Any Metadata — Summary

| Route | File | Has Metadata? |
|---|---|---|
| `/` | `app/page.tsx` | Inherits root ✓ |
| `/shop` | `app/shop/page.tsx` | Yes (partial) ✓ |
| `/about` | `app/about/page.tsx` | Yes (partial) ✓ |
| `/gift-ideas` | `app/gift-ideas/page.tsx` | Yes (partial, broken title) |
| `/community` | `app/community/page.tsx` | Yes (partial, broken title) |
| `/privacy` | `app/privacy/page.tsx` | Yes (partial, broken title) |
| `/terms` | `app/terms/page.tsx` | Yes (partial, broken title) |
| `/shipping` | `app/shipping/page.tsx` | Yes (partial, broken title) |
| `/refunds` | `app/refunds/page.tsx` | Yes (partial, broken title) |
| `/account` | `app/account/page.tsx` | Yes (partial, broken title) |
| **`/create`** | `app/create/page.tsx` | **MISSING** |
| **`/product/[type]`** | `app/product/[type]/page.tsx` | **MISSING** |
| `/success` | `app/success/page.tsx` | No (acceptable — noindex instead) |
| `/track` | `app/track/page.tsx` | No (acceptable — noindex instead) |
| `/debug` | `app/debug/page.tsx` | No — needs noindex |
| `/perf` | `app/perf/page.tsx` | No — needs noindex |
| `/mockup-previews` | `app/mockup-previews/page.tsx` | No — not served in prod |

---

## What's Working Well

- **Root metadata is solid.** `app/layout.tsx` has a title template, keywords array, `metadataBase`, OG and Twitter card configured. Good foundation.
- **Open Graph images exist.** `app/opengraph-image.tsx` and `app/twitter-image.tsx` render dynamic 1200×630 images using `next/og` — this is the correct implementation.
- **Next.js Image is used extensively** in `LandingPage.tsx` with descriptive alt text, correct `sizes`, `priority` on LCP images, and `fill` with aspect-ratio containers.
- **URL structure is clean and descriptive.** Routes like `/gift-ideas`, `/product/mug`, `/create` are keyword-relevant and hyphenated.
- **Landing page heading hierarchy is correct.** One `h1` ("Gifts They'll Never Forget"), then `h2` sections ("Most Loved This Month", "Three Simple Steps", etc.), then `h3` items within sections.
- **`next.config.ts` has good image settings.** AVIF/WebP formats, device size breakpoints, `minimumCacheTTL`, and remote patterns are all configured.
- **`lang="en"` is set on `<html>`.** Important for accessibility and language detection.
- **`poweredByHeader: false`** removes the `X-Powered-By: Next.js` header — minor security improvement.
- **About page heading hierarchy is correct.** `h1` → `h2` (section headings) → `h3` (value cards, promise items).
- **Policy pages (privacy, terms, shipping, refunds) all have H1s** and correct document structure.

---

## Priority Action Plan

| # | Issue | Priority | Effort | Impact |
|---|---|---|---|---|
| 1 | Create `app/sitemap.ts` | CRITICAL | 20 min | HIGH — crawlability |
| 2 | Create `app/robots.ts` | CRITICAL | 10 min | HIGH — crawl budget, blocks internal tools |
| 3 | Add metadata + canonical to `/create` | CRITICAL | 15 min | HIGH — highest-value conversion page |
| 4 | Add `generateMetadata` to `/product/[type]` | CRITICAL | 30 min | HIGH — product pages core ranking targets |
| 5 | Fix broken title template on 7 pages | HIGH | 30 min | MEDIUM — duplicate title strings in SERPs |
| 6 | Add per-page canonical URLs to all metadata pages | HIGH | 30 min | HIGH — prevents canonical collapse to homepage |
| 7 | Fix 11 empty `alt=""` images in components | HIGH | 30 min | MEDIUM — accessibility + image SEO |
| 8 | Add Organization + WebSite JSON-LD to root layout | HIGH | 30 min | HIGH — knowledge panel, search features |
| 9 | Add Product JSON-LD to `/product/[type]` pages | HIGH | 45 min | HIGH — rich results, Google Shopping |
| 10 | Add `noindex` to `/debug`, `/perf`, `/success`, `/track` | MEDIUM | 15 min | LOW–MEDIUM — crawl budget |
| 11 | Add H1 to `/create` page | MEDIUM | 10 min | MEDIUM — topical relevance signal |
| 12 | Add `generateStaticParams` to product pages | MEDIUM | 10 min | MEDIUM — build-time static generation |
| 13 | Optimise meta descriptions on `/shop`, `/about` | MEDIUM | 20 min | MEDIUM — CTR improvement |
| 14 | Add OG overrides to `/shop`, `/gift-ideas`, `/about`, `/community` | MEDIUM | 30 min | MEDIUM — social sharing quality |
| 15 | Replace `<img>` with `<Image>` in `AboutClient.tsx` | LOW | 20 min | LOW — image optimisation |
| 16 | Add BreadcrumbList JSON-LD to product pages | LOW | 20 min | LOW — breadcrumb trail in SERPs |
| 17 | Add FAQPage JSON-LD (e.g. on `/shipping` or homepage) | LOW | 30 min | LOW — FAQ rich results |

---

## Keyword Targeting Assessment

The site's content, headings, and partial metadata do reference key target terms organically:

| Target Keyword | Currently Targeted? | Strongest Page |
|---|---|---|
| personalised gifts | Yes — root description, LandingPage | Homepage |
| custom mugs | Yes — root keywords, landing product cards | `/product/mug` (once metadata added) |
| personalised greeting cards | Partial — landing copy | `/product/card` (once metadata added) |
| custom hoodies | Partial — landing copy | `/product/hoodie` (once metadata added) |
| personalised t-shirts | Weak — copy says "tees" | `/product/tee` |
| birthday gift ideas | Partial — `/gift-ideas` has good heading | `/gift-ideas` |
| keepsake gifts | Yes — root description | Homepage |
| photo gifts | Yes — root keywords | Homepage |
| gifts for her | Not targeted | Missing — consider a landing page or `/gift-ideas` filter |
| mothers day gifts | Seasonal — mentioned in reviews/shipping | Could be a `/gift-ideas` category |

The biggest keyword opportunity is adding full `title` + `description` + Product JSON-LD to the four product pages (`/product/mug`, `/product/card`, `/product/tee`, `/product/hoodie`) — these are transactional search terms with purchase intent that have zero metadata coverage today.
