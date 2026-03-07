# SEO & Technical Health Audit — Keepsy
**Date:** 2026-03-06 | **Branch:** main (81c4151) | **Overall Score: 62/100**

---

## Executive Summary

Keepsy has solid Next.js foundations but **critical SEO gaps** that will prevent search engines from efficiently discovering and indexing pages. The three most urgent issues — no sitemap, no robots.txt, and 7 pages missing metadata — are all straightforward to fix.

**Strengths:** Good heading hierarchy, Open Graph implemented, clean URLs, mobile-responsive, HTTPS.
**Critical gaps:** No sitemap, no robots.txt, 7 pages with no unique metadata, 11 images with empty `alt=""`.

---

## Findings

### 1. Missing sitemap.xml
**Severity: CRITICAL**

No `app/sitemap.ts` or `public/sitemap.xml` exists. Search engines cannot efficiently discover all pages.

**Fix — create `app/sitemap.ts`:**
```ts
export default function sitemap() {
  return [
    { url: 'https://keepsy.store', lastModified: new Date() },
    { url: 'https://keepsy.store/create', lastModified: new Date() },
    { url: 'https://keepsy.store/gift-ideas', lastModified: new Date() },
    { url: 'https://keepsy.store/product/card', lastModified: new Date() },
    { url: 'https://keepsy.store/product/mug', lastModified: new Date() },
    { url: 'https://keepsy.store/product/tee', lastModified: new Date() },
    { url: 'https://keepsy.store/product/hoodie', lastModified: new Date() },
    { url: 'https://keepsy.store/terms', lastModified: new Date() },
    { url: 'https://keepsy.store/privacy', lastModified: new Date() },
    { url: 'https://keepsy.store/shipping', lastModified: new Date() },
    { url: 'https://keepsy.store/refunds', lastModified: new Date() },
  ];
}
```

---

### 2. Missing robots.txt
**Severity: CRITICAL**

No `public/robots.txt` exists. No crawler directives — debug/admin routes could be indexed.

**Fix — create `public/robots.txt`:**
```
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /debug/
Disallow: /perf/
Disallow: /mockup-previews/
Sitemap: https://keepsy.store/sitemap.xml
```

---

### 3. Seven Pages Missing Metadata
**Severity: CRITICAL**

All these pages inherit the root "Keepsy" title and generic description — causing duplicate content in SERPs:

| Page | File |
|---|---|
| `/create` | `app/create/page.tsx` |
| `/gift-ideas` | `app/gift-ideas/page.tsx` |
| `/product/[type]` | `app/product/[type]/page.tsx` |
| `/account` | `app/account/page.tsx` |
| `/privacy` | `app/privacy/page.tsx` |
| `/shipping` | `app/shipping/page.tsx` |
| `/refunds` | `app/refunds/page.tsx` |

**Fix example for `/create`:**
```ts
export const metadata: Metadata = {
  title: "Create Your Personalised Gift | Keepsy",
  description: "Turn a photo or memory into a premium keepsake. Cards, mugs, hoodies and tees — see the design before you buy.",
};
```

Product page needs `generateMetadata()` for dynamic titles per product type.

---

### 4. Eleven Images with Empty alt=""
**Severity: HIGH**
WCAG 2.1 violation + images not indexed by Google Images.

| File | Element |
|---|---|
| `components/PremiumGateway.tsx:251` | City watercolor image |
| `components/GalleryOfThePossible.tsx:50` | Gallery placeholder |
| `components/TextureLoupe.tsx:62` | Product base |
| `components/TextureLoupe.tsx:75` | Product overlay |
| `components/RealisticHoodie.tsx:76` | Hoodie highlight layer |
| `components/mockups/TopLayer.tsx:31` | Product top layer |
| `components/mockups/TopLayer.tsx:43` | Product layer |
| `components/DesignVaultSidebar.tsx:81` | Design vault image |
| `components/mockups/HoodieMockupLayered.tsx:51` | Hoodie base |
| `components/mockups/HoodieMockupLayered.tsx:80` | Hoodie highlights |
| `components/skin/magicpath/MagicpathBackground.tsx:69` | Background card |

Use `alt="Decorative"` for pure decoration, or descriptive text (e.g. `alt="Custom hoodie design preview"`).

---

### 5. Root Title Too Generic
**Severity: MEDIUM**
**File:** `app/layout.tsx`

Current: `"Keepsy"` (6 characters, no keywords)

**Fix:** `"Keepsy — AI Personalised Gifts | Cards, Mugs, Hoodies & Tees"`

---

### 6. No JSON-LD Structured Data
**Severity: MEDIUM**

No schema.org markup found anywhere. Missing:
- Organization schema (root)
- Product schema (product pages)
- FAQPage schema (FAQ section)
- BreadcrumbList schema

**Fix — add to root `layout.tsx`:**
```tsx
<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Keepsy",
  "url": "https://keepsy.store",
  "description": "AI-powered personalised gift creation — cards, mugs, hoodies and tees."
})}} />
```

---

### 7. No Page-Specific Open Graph Overrides
**Severity: MEDIUM**

All 7 pages above share the root OG title/description. Social shares for `/create`, `/gift-ideas`, and product pages will all show the generic homepage preview.

Add page-level `openGraph` in each page's metadata export.

---

### 8. Heading Hierarchy
**Severity: LOW — Mostly good**

- Landing page: correct H1 → H2 → H3 nesting ✓
- Terms, privacy, shipping, refunds: single H1, correct ✓
- `/create` page: **no visible H1** — the generator platform is a client component with no semantic heading. Search engines can't identify page topic.

**Fix:** Add an off-screen or visible H1 to the create page: `"Create your personalised gift"`.

---

### 9. URL Structure
**Severity: NONE — Good**

All routes are clean, descriptive, keyword-relevant: `/create`, `/gift-ideas`, `/product/card`, `/shipping`. No query params in main navigation. ✓

---

### 10. Internal Linking
**Severity: LOW — Good**

Homepage → `/create`, `/gift-ideas`. Product pages → `/create`. Footer links present. Anchor text is descriptive. ✓

Missing: breadcrumb navigation on product/create pages. Add BreadcrumbList schema + visible breadcrumbs.

---

## Priority Action Plan

| # | Action | Severity | Effort |
|---|---|---|---|
| 1 | Create `app/sitemap.ts` | CRITICAL | 15 min |
| 2 | Create `public/robots.txt` | CRITICAL | 5 min |
| 3 | Add metadata to 7 missing pages | CRITICAL | 1 hour |
| 4 | Fix 11 empty `alt=""` attributes | HIGH | 30 min |
| 5 | Improve root title with keywords | MEDIUM | 5 min |
| 6 | Add Organization JSON-LD to root layout | MEDIUM | 20 min |
| 7 | Add Product JSON-LD to product pages | MEDIUM | 30 min |
| 8 | Add H1 to create page | LOW | 10 min |
| 9 | Add FAQ JSON-LD | LOW | 20 min |
