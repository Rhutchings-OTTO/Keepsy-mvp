# Team 8: Page Speed & Core Web Vitals — Audit Report

**Date:** 2026-03-08
**Site:** https://keepsy.store
**Scope:** app/layout.tsx, next.config.ts, app/LandingPage.tsx

---

## 1. Findings

### 1.1 app/layout.tsx

**Missing: preconnect / dns-prefetch hints**
The layout `<head>` block contains only the Organisation JSON-LD script tag. There are no `<link rel="preconnect">` or `<link rel="dns-prefetch">` hints for the external origins the page depends on:

| Origin | Usage | Missing hint |
|---|---|---|
| `https://fonts.googleapis.com` | Google Fonts stylesheet (Fraunces, Manrope via next/font) | `preconnect` |
| `https://fonts.gstatic.com` | Google Fonts font files | `preconnect crossOrigin="anonymous"` |
| `https://js.stripe.com` | Stripe.js (payment checkout) | `dns-prefetch` |
| `https://res.cloudinary.com` | Product images (listed in remotePatterns) | `dns-prefetch` |

Without these hints the browser must perform a full TCP/TLS handshake for each origin at render time, adding 100–300 ms of latency to first contentful paint (FCP) and LCP.

**Missing: `viewport` named export**
The file exports only `metadata`. In Next.js 13+ App Router the recommended pattern is to export a separate `viewport` constant so Next.js generates the correct `<meta name="viewport">` tag. Without it, Next.js falls back to a default, but explicitly declaring it is required for Lighthouse "Viewport" audit compliance and prevents accidental overrides by page-level metadata.

---

### 1.2 next.config.ts

**`minimumCacheTTL` is 60 seconds**
The image optimiser is configured with `minimumCacheTTL: 60`. This means Next.js's built-in image optimisation cache only holds optimised images for one minute. CDN edge nodes and the browser will re-request and re-optimise the same product images extremely frequently, wasting bandwidth and adding latency. Changing this to `86400` (1 day) aligns with the `Cache-Control: public, max-age=31536000, immutable` header already applied to `/images/*` static assets.

**Image formats — OK**
`formats: ["image/avif", "image/webp"]` is already present. AVIF is listed first (preferred), falling back to WebP. No change needed.

---

### 1.3 app/LandingPage.tsx

**Hero images — `priority` prop usage is correct**
The `ProductCollectionCard` component accepts a `priority` prop and passes it through to the Next.js `<Image>` component. At the call sites:
- Mobile horizontal scroll: `priority={i < 2}` — first two tiles get `priority`
- Desktop 2-col grid: `priority={i < 2}` — first two tiles get `priority`

The first two product images (`mug-hero.jpg`, `cards-hero.jpg`) are above the fold on both mobile and desktop and are correctly marked with `priority`, which instructs Next.js to inject a `<link rel="preload">` in the document head and set `fetchPriority="high"` on the underlying `<img>` element.

**Below-fold images — no `priority` (correct)**
`FeaturedProductCard`, the story section image (`our-story-hero.png`), and other below-fold images do not have `priority`. This is correct — only LCP candidates should be preloaded.

**No action required on LandingPage.tsx.**

---

## 2. Fixes Applied

### Fix 1 — `app/layout.tsx`: Add preconnect/dns-prefetch link tags
Added four resource hint `<link>` tags inside the `<head>` block:
```tsx
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
<link rel="dns-prefetch" href="https://js.stripe.com" />
<link rel="dns-prefetch" href="https://res.cloudinary.com" />
```
These allow the browser to start DNS resolution and TCP/TLS negotiation for critical third-party origins before they are referenced in the page, reducing FCP and LCP.

### Fix 2 — `app/layout.tsx`: Add `viewport` named export
Added:
```ts
export const viewport = {
  width: "device-width",
  initialScale: 1,
};
```
This satisfies Next.js App Router's recommended viewport configuration and ensures the `<meta name="viewport">` tag is always generated correctly.

### Fix 3 — `next.config.ts`: Increase `minimumCacheTTL` to 86400
Changed `minimumCacheTTL: 60` → `minimumCacheTTL: 86400` (1 day). Optimised product images will now be cached for 24 hours by the Next.js image server and any CDN sitting in front of it, reducing repeated re-optimisation and improving Time to First Byte (TTFB) for image requests on subsequent visits.

---

## 3. Expected Impact

| Metric | Before | After (estimated) |
|---|---|---|
| FCP | Delayed by font/payment origin DNS | ~100–300 ms improvement from preconnects |
| LCP | Hero images already prioritised | Maintained; font resource hints further help |
| TTFB (image requests) | Re-optimised every 60 s | Served from cache for up to 24 h |
| Lighthouse Viewport audit | May warn on missing explicit export | Pass |

---

## 4. Not Changed

- `app/sitemap.ts` — out of scope (Team 1 territory)
- `app/robots.ts` — out of scope (Team 1 territory)
- `app/LandingPage.tsx` — hero `priority` props are already correct; no structural changes made
