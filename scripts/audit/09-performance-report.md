# Keepsy Performance Audit — 09
**Date:** 2026-03-08
**Auditor:** Senior Performance Engineer (Claude Sonnet 4.6)
**Scope:** Full codebase at `/Users/roryhutchings/keepsy-mvp`

---

## Executive Summary

Keepsy is a well-structured Next.js 16 application with some genuinely good performance decisions already in place (font `display: swap`, AVIF/WebP image formats, edge caching on community endpoint, reduced-motion support, `AdaptiveDpr` on 3D scenes). However, there are several high-impact issues — especially around bundle weight, an animated WebGL shader running on every page, a per-render API fetch inside a render-critical component, duplicate Stripe client instantiation, and the homepage being forced into full CSR when it could be mostly static. Each issue is documented below with impact, affected file, current state, and recommended fix.

---

## 1. BUNDLE

### 1.1 Three.js / React Three Fiber loaded on the landing page (P0 — HIGH)

**Impact:** `three`, `@react-three/fiber`, and `@react-three/drei` together contribute ~600–900 kB minified (~200–350 kB gzip). On the homepage, this is loaded inside `PremiumGateway` which is dynamically imported with `ssr: false` — but only deferred until client hydration. A first-time visitor who already has a region cookie set still has to wait for the main JS bundle before React can hydrate and render anything, during which time LCP is blocked.

**Affected file:** `app/LandingPage.tsx` (lines 26–29), `components/PremiumGateway.tsx`

**Current state:**
```ts
const PremiumGateway = dynamic(
  () => import("@/components/PremiumGateway").then((mod) => mod.PremiumGateway),
  { ssr: false }
);
```
`PremiumGateway` renders a Three.js cloud flythrough for ~2.5 seconds. This component is only shown to first-time visitors who have no `keepsy_region` cookie. Returning visitors never see it — yet the Three.js chunk is still part of the top-level client bundle graph because `LandingPage` imports it unconditionally.

**Recommended fix:**
1. The `dynamic()` import is correct. Ensure Three.js and R3F are NOT imported anywhere in the non-dynamic component tree (no static top-level `import * as THREE`).
2. Add `loading: () => null` to the dynamic import so nothing blocks while the chunk loads.
3. Consider replacing the cloud flythrough with a CSS/SVG transition for returning visitors entirely — this removes the Three.js dependency from the landing-page chunk completely for the majority of users.

**Estimated impact:** 200–350 kB gzip savings for returning visitors; improved TTI by 300–600 ms on mid-range mobile.

---

### 1.2 Framer Motion imported by nearly every component (P1 — MEDIUM)

**Impact:** Framer Motion v12 is ~70–100 kB gzip. Currently it is imported at the top level across ~30+ client components including `SiteHeader`, `CartDrawer`, `LandingPage`, `SiteFooter`, `CatalogClient`, `PremiumGateway`, and many more. Because these are all client components that are part of the shell (`SiteChrome`), Framer Motion is always in the initial JS payload for every page.

**Affected files:** All `"use client"` components that import `framer-motion` — at least 30 files.

**Current state:** Framer Motion is used for scroll-reveal animations (`Reveal`), drawer slide-ins (`CartDrawer`, `SizeGuideDrawer`), marquee pausing, and page transitions. Most of these are non-critical for first paint.

**Recommended fix:**
1. For the `Reveal` component (`components/motion/Reveal.tsx`): it already uses `IntersectionObserver` with an internal `useState`. Consider replacing the Framer Motion `motion.div` with a plain CSS transition + class swap triggered from the observer. This eliminates the Framer Motion dependency from scroll-reveal animations entirely.
2. For drawer/modal animations (CartDrawer, SizeGuideDrawer, MobileOverlay): use CSS `@keyframes` / `transition` on `transform: translateX` instead of `motion.aside`. These are interaction-time, not load-time, but reducing the top-level import still lowers the initial JS parse cost.
3. Keep Framer Motion for complex spring animations (`PremiumGateway` cloud, `MerchGeneratorPlatform` state transitions) — but import it only in those components via `dynamic()`.

**Estimated impact:** 70–100 kB gzip off the initial bundle; ~100–200 ms faster JS parse on low-end mobile.

---

### 1.3 `ogl` WebGL library bundled globally (P1 — MEDIUM)

**Impact:** `ogl` (used for the `Iridescence` WebGL shader in `IridescenceBackground`) is ~130 kB minified. It runs a continuous `requestAnimationFrame` loop.

**Affected file:** `components/Iridescence.tsx`, `components/IridescenceBackground.tsx`

**Current state:** `Iridescence` is a standard named import, not dynamically loaded. If `IridescenceBackground` is rendered on any page, the entire `ogl` library is included in that page's JS bundle.

**Recommended fix:** Wrap with `dynamic(() => import('@/components/Iridescence'), { ssr: false })` at the callsite in `IridescenceBackground`. This keeps the WebGL code out of the initial parse.

**Estimated impact:** 130 kB minified removed from initial parse path.

---

### 1.4 `gsap` is listed as a dependency but no usages found (P2 — LOW)

**Impact:** GSAP v3 is ~68 kB minified. If it is bundled but unused, it is pure waste.

**Affected file:** `package.json` (line 29)

**Current state:** `gsap: "^3.14.2"` is in `dependencies`. A codebase-wide search finds zero `import gsap` or `import { gsap }` statements in `.tsx` or `.ts` files.

**Recommended fix:** Run `npm uninstall gsap` and confirm no imports exist. If it was used in removed code, this is a safe removal.

**Estimated impact:** ~68 kB minified removed from node_modules and potentially from the bundle if tree-shaking missed it.

---

### 1.5 `canvas-confetti` loaded via dynamic import inside `GenerativeLoader` — good pattern, but loaded on _every_ generation regardless of easter egg trigger (P2 — LOW)

**Affected file:** `components/GenerativeLoader.tsx` (lines 137–146)

**Current state:**
```ts
import("canvas-confetti")
  .then(({ default: confetti }) => { confetti(...) })
  .catch(() => undefined);
```
This is already a dynamic import triggered only when the banana easter egg fires — correct. No change needed here.

---

## 2. IMAGES

### 2.1 `quality={100}` on mockup base layer — unnecessary (P1 — MEDIUM)

**Impact:** Setting `quality={100}` on Next.js Image disables compression and produces the largest possible output file. For a product mockup image that is viewed at 700px wide, this can be 3–5× larger than `quality={85}`.

**Affected file:** `components/mockups/BaseMockupLayer.tsx` (line 18)

**Current state:**
```tsx
<Image
  src={baseMockupSrc}
  alt={`${productType} mockup`}
  fill
  quality={100}
  sizes="(max-width: 1024px) 100vw, 700px"
/>
```

**Recommended fix:** Drop `quality={100}`. The Next.js default (`75`) or a modest increase to `85` is appropriate for product mockup PNGs. The AVIF/WebP pipeline in `next.config.ts` already handles modern formats — `quality={100}` nullifies those savings.

**Estimated impact:** 2–4× reduction in mockup image payload (~200–600 kB per image depending on source file size).

---

### 2.2 Unsplash image in `LandingPage` has no `sizes` attribute matching its actual rendered size (P2 — LOW)

**Affected file:** `app/LandingPage.tsx` (line 582–588)

**Current state:**
```tsx
<Image
  src="https://images.unsplash.com/photo-1536010305525-f7aa0834e2c7?w=800"
  alt="Woman smiling while receiving a gift"
  fill
  sizes="(max-width: 1024px) 100vw, 50vw"
/>
```
The image is hardcoded with `?w=800` in the URL but `sizes` tells Next.js it could be `100vw` on mobile — triggering a 1200px+ srcset candidate that the browser then fetches at 800px. The `sizes` prop is correct, but the Unsplash URL should not have a hardcoded `?w=800` parameter since that bypasses the Next.js image CDN sizing.

**Recommended fix:** Host the image through Cloudinary (already configured), remove the `?w=800` from the URL, and let the Next.js image optimizer handle responsive sizing via the `sizes` descriptor.

**Estimated impact:** Correct image is served at the right size; potential 30–50% reduction in image bytes for desktop viewport.

---

### 2.3 `ArtworkLayer` uses a plain `<img>` tag (not `next/image`) for the AI-generated design (P2 — LOW)

**Affected file:** `components/mockups/ArtworkLayer.tsx` (lines 136, 186)

**Current state:** Uses `<motion.img src={generatedImage} ...>` — a plain HTML img element wrapped in Framer Motion. For dynamically generated Cloudinary URLs this is acceptable (no pre-defined `sizes` to give), but it means no automatic format selection, no lazy loading, and no placeholder.

**Recommended fix:** Since `generatedImage` is always a Cloudinary URL at the point of display, add `loading="eager"` (it's always above-fold in context) and consider passing a `blurDataURL` placeholder to avoid layout shift while loading. The `width`/`height` attributes are already set for the quad variant — add them for the rect variant too to prevent CLS.

---

### 2.4 `RealisticHoodie` uses raw `<img>` tags for base, top layer, and design (P3 — LOW)

**Affected file:** `components/RealisticHoodie.tsx`

**Current state:** Three `<img src={...}>` tags, no dimensions, no `loading` attribute. The displacement map (`/mockups/hoodie-displacement-map.jpg`) is fetched on every render.

**Recommended fix:** Switch to `next/image` with explicit `width`/`height` for the base and top layers. For the displacement map specifically — since it feeds an SVG `<feImage>` filter — it can be preloaded with a `<link rel="preload" as="image">` in the component or via Next.js metadata.

---

### 2.5 No `priority` on the hero story image in `LandingPage` (P1 — MEDIUM)

**Affected file:** `app/LandingPage.tsx` (line 581–591)

**Current state:** The large editorial split-layout image (section 4, "Every Keepsake Tells a Story") is likely above-fold on desktop. It has no `priority` prop.

**Recommended fix:** Add `priority` to this image. On mobile it is below-fold so this may be layout-dependent; at minimum ensure the first two hero product collection cards have `priority` (they already do, at line 478).

---

## 3. API & DATA FETCHING

### 3.1 `MockupStage` fetches `/api/mockup-placements` on every mount with `cache: "no-store"` (P0 — HIGH)

**Impact:** The `MockupStage` component is mounted every time a user selects or changes a product type in the `/create` flow. Each mount fires an uncached GET to `/api/mockup-placements`. That endpoint reads a JSON file from disk on every request. At high traffic this creates unnecessary serverless function invocations and adds 50–200ms latency to the mockup display.

**Affected file:** `components/mockups/MockupStage.tsx` (lines 79–93)

**Current state:**
```ts
const res = await fetch("/api/mockup-placements", { cache: "no-store" });
```
The static fallback (`staticPlacements`) is imported at the top of the file and is always available. The runtime fetch only matters when placement data has been updated via the admin calibration portal.

**Recommended fix:**
1. Change `cache: "no-store"` to a time-based revalidation: `cache: "force-cache"` with `next: { revalidate: 3600 }`. This caches the placements in the Next.js data cache for an hour.
2. Alternatively, add `Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400` to the `/api/mockup-placements` response (currently it has no Cache-Control header), and remove `cache: "no-store"` from the fetch call. This allows the Vercel CDN to cache the response.
3. Because the static fallback is always available, consider removing the runtime fetch entirely and only doing it once on app load (e.g., in a context provider) rather than on every `MockupStage` mount.

**Estimated impact:** Removes 1 network round-trip per product-type selection; eliminates cold-start serverless invocations for this endpoint.

---

### 3.2 Supabase queries in `/success` page use two sequential round-trips (P1 — MEDIUM)

**Impact:** The success page makes two sequential Supabase queries: first fetching the order, then fetching order items using the `order_ref` from the first result. This is a classic N+1 pattern (N=1 here, but it's still an unnecessary serial dependency).

**Affected file:** `app/success/page.tsx` (lines 35–57)

**Current state:**
```ts
const { data: order } = await supabase
  .from("orders")
  .select("order_ref, status, total_gbp, generated_image_url")
  .eq("stripe_session_id", sessionId)
  .maybeSingle();

// Then separately:
const { data: orderItems } = await supabase
  .from("order_items")
  .select("product_name, quantity, line_total_gbp")
  .eq("order_ref", order.order_ref);
```

**Recommended fix:** Use a Supabase PostgREST join to fetch both in one query:
```ts
const { data: order } = await supabase
  .from("orders")
  .select("order_ref, status, total_gbp, generated_image_url, order_items(product_name, quantity, line_total_gbp)")
  .eq("stripe_session_id", sessionId)
  .maybeSingle();
```
This reduces the success page to a single DB round-trip. The same pattern applies in `/api/orders/status/route.ts` (lines 35–57).

**Estimated impact:** ~50–150 ms reduction in TTFB on the success page.

---

### 3.3 Stripe client is re-instantiated on every checkout request (P1 — MEDIUM)

**Impact:** Both `app/api/create-checkout-session/route.ts` and `app/api/checkout/route.ts` call `new Stripe(secretKey, ...)` inside the request handler on every invocation. This allocates a new Stripe client instance on each serverless cold start AND on each warm request. The Stripe SDK is designed to be instantiated once as a module-level singleton.

**Affected files:**
- `app/api/create-checkout-session/route.ts` (line 93)
- `app/api/checkout/route.ts` (line 82)
- `app/api/stripe/webhook/route.ts` (line 85) — same issue

**Current state:**
```ts
export async function POST(req: Request) {
  // ...
  const stripe = new Stripe(secretKey, { apiVersion: "2026-02-25.clover" });
```

**Recommended fix:** Move the Stripe instantiation to module scope (outside the request handler):
```ts
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2026-02-25.clover" })
  : null;

export async function POST(req: Request) {
  if (!stripe) return /* error response */;
  // use stripe directly
}
```
This is the standard pattern recommended in Stripe's own Next.js documentation.

**Estimated impact:** Reduces per-request overhead on warm instances; avoids unnecessary object allocation on every checkout.

---

### 3.4 `/api/mockup-placements` reads a file from disk on every request with no caching headers (P1 — MEDIUM)

**Affected file:** `app/api/mockup-placements/route.ts`

**Current state:**
```ts
const raw = await readFile(filePath, "utf8");
const json = JSON.parse(raw);
return NextResponse.json({ ok: true, placements: json });
```
No `Cache-Control` header is set on the response. Because the static `placements` fallback is always available in the module, the disk read only adds value when the admin has updated the file.

**Recommended fix:** Add `Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400` to the response. On Vercel, this causes the edge to serve subsequent requests without hitting the serverless function. Also cache the parsed JSON in a module-scope variable after the first read (a simple in-memory cache) so that even on non-cached requests, the file is only parsed once per cold start.

---

### 3.5 Shipping estimate cache is in-memory — resets on every cold start (P3 — LOW)

**Affected file:** `app/api/shipping-estimate/route.ts` (lines 33–73)

**Current state:** A `Map`-based LRU cache stores shipping rates in serverless function memory. This is fine for warm instances but is completely lost on every cold start or new container. Under high traffic / auto-scaling, the same zip code will repeatedly miss the in-memory cache across parallel instances.

**Recommended fix:** Replace the in-memory Map with `@upstash/redis` (already a dependency) as the cache store. Use a short TTL (10 minutes matches the current CACHE_TTL_MS). This gives a shared cache across all instances.

---

## 4. RENDERING

### 4.1 Homepage (`/`) is forced into full CSR — no server-rendered content above-fold (P0 — HIGH)

**Impact:** The root page server component (`app/page.tsx`) reads a cookie and passes `initialRegion` to `LandingPage`. However, `LandingPage` is `"use client"` and contains the full marketing page. Because Next.js RSC boundary stops at the `"use client"` directive, none of the hero HTML, product grid, or reviews are server-rendered. The browser receives an essentially empty HTML shell and must wait for JS to hydrate before any content is visible.

**Affected file:** `app/LandingPage.tsx`

**Current state:** The entire landing page — 987 lines of JSX — is a single `"use client"` component. The only server-side work done is reading a cookie.

**Why `"use client"` is here:** The page requires `useState` for the region state, gateway show/hide, email form, and `RegionSelector` open state. Some of these states only affect a small portion of the page.

**Recommended fix:** Split the landing page into server and client boundaries:
1. Keep `app/page.tsx` as a Server Component. Server-render all static sections (hero text, bullet points, how-it-works steps, review cards, footer) as plain JSX.
2. Extract only the interactive islands into Client Components: `<RegionGateway initialRegion={...} />` (the cookie-based gateway, already `{ ssr: false }`), `<HeroImageGallery />` (no interaction needed — could be static), `<EmailSignupForm />`, and `<RegionSelector />`.
3. The framer-motion `motion.div` animations in the hero can be moved to CSS `@keyframes` for above-fold content (removing the need for `"use client"` in the hero section entirely).

**Estimated impact:** 30–70% improvement in LCP; HTML content visible before JS parses; improved Core Web Vitals scores.

---

### 4.2 `SiteChrome` is a Client Component wrapping everything — forces full client hydration of the shell (P1 — MEDIUM)

**Affected file:** `components/SiteChrome.tsx`

**Current state:**
```tsx
"use client";
export function SiteChrome({ children }: SiteChromeProps) {
  const pathname = usePathname();
  // ...
}
```
`SiteChrome` is `"use client"` because it uses `usePathname()`. This means the entire site shell (header, footer, bottom nav, `MeshGradientBackground`, `CartDrawer`, `EasterEggProvider`) is on the client side, preventing the server from streaming any shell HTML.

**Recommended fix:** Use Next.js's ability to compose server and client components. `usePathname()` is only needed to conditionally render the `EasterEggProvider` branch vs the header/footer branch. Extract that conditional into a small client component (`<ChromeShell pathname={...} />`), and let `SiteHeader` and `SiteFooter` remain as Server Components. The `MeshGradientBackground` WebGL shader (which uses `useEffect` and `useState`) legitimately needs `"use client"`.

---

### 4.3 `/create` page uses `export const dynamic = "force-dynamic"` unnecessarily (P2 — LOW)

**Affected file:** `app/create/page.tsx` (line 7)

**Current state:**
```ts
export const dynamic = "force-dynamic";
```
The page reads `searchParams` and passes values to the client component. In Next.js 15+, accessing `searchParams` automatically opts the page into dynamic rendering — there is no need to set `force-dynamic` explicitly. Setting it explicitly just documents intent but adds no functional benefit. It does prevent any static caching of the shell.

**Recommended fix:** The `force-dynamic` is actually correct here since search params are read, but the comment above the export (`// force-dynamic is needed for searchParams`) would clarify this for future maintainers. No code change needed, but the explicit export on `/success` and `/track` is also redundant since both already do dynamic Supabase queries.

---

### 4.4 `product/[type]/page.tsx` does not implement `generateStaticParams` (P1 — MEDIUM)

**Affected file:** `app/product/[type]/page.tsx`

**Current state:** The product type pages (`/product/mug`, `/product/hoodie`, etc.) are dynamically rendered. The set of valid product types is fixed and defined in `PRODUCT_CARDS`.

**Recommended fix:** Add `generateStaticParams` to pre-render all product type pages at build time:
```ts
export function generateStaticParams() {
  return PRODUCT_CARDS.map((p) => ({ type: p.type }));
}
```
This turns these pages into static HTML served from CDN edge, eliminating serverless cold starts for product pages.

**Estimated impact:** Product pages load from CDN edge (~50 ms TTFB) instead of serverless function (~200–500 ms cold start).

---

### 4.5 `/shop/page.tsx` delegates to a client-only `CatalogClient` with all data in-memory (P2 — LOW)

**Affected file:** `app/shop/page.tsx`, `app/shop/CatalogClient.tsx`

**Current state:** `ShopPage` is a Server Component that renders `<CatalogClient />`. `CatalogClient` is `"use client"` and contains all product data as a hardcoded constant. The filtering/sorting logic runs in the browser.

**Recommended fix:** The product list data (`PRODUCTS` array in `CatalogClient`) is static. Render the initial product grid on the server and pass it as props. Filter/sort state remains client-side, but the initial HTML includes visible product cards, improving both SEO and perceived load time.

---

### 4.6 `MeshGradientBackground` runs an animated WebGL shader on every page (P1 — MEDIUM)

**Affected file:** `components/MeshGradientBackground.tsx`, `components/SiteChrome.tsx`

**Current state:**
```tsx
<div className="fixed inset-0 z-0" aria-hidden>
  <MeshGradientBackground />
</div>
```
`SiteChrome` mounts `MeshGradientBackground` globally on all pages — including `/track`, `/privacy`, `/terms`, `/shipping`, `/refunds`, `/about`. The `@paper-design/shaders-react` `MeshGradient` runs a continuous `requestAnimationFrame` animation loop consuming GPU resources continuously.

**Recommended fix:**
1. The shader is mostly covered by white/cream page content (the `bg-white/25` veil makes it barely visible). Consider replacing it with a static CSS gradient on content-heavy pages.
2. At minimum, pause the animation when the browser tab is not visible using the Page Visibility API.
3. Limit the `MeshGradientBackground` to the homepage only (where it provides the most visual benefit) by checking `pathname` in `SiteChrome` — this is already happening for `EasterEggProvider`, and the same pattern applies here.

**Estimated impact:** Reduces continuous GPU utilisation on all non-homepage pages; improves battery life on mobile.

---

## 5. THIRD PARTY

### 5.1 No analytics, no tracking scripts — excellent (P0 — POSITIVE)

**Finding:** A full codebase scan finds zero usage of Google Analytics, GTM, Hotjar, Intercom, Posthog, Mixpanel, or Segment. No third-party `<Script>` tags in `app/layout.tsx`. This is the single best thing Keepsy is doing for performance. Every external script would add 100–500 ms to TTI.

**Recommended action:** None. Maintain this discipline. If analytics are needed in future, use a privacy-first, single-pixel approach (Plausible, Fathom) rather than tag manager bundles.

---

### 5.2 Lenis smooth scroll library loaded on `/create` but nowhere else (P2 — LOW)

**Affected file:** `app/create/page.tsx`, `components/LenisProvider.tsx`

**Current state:** `LenisProvider` wraps the create page, importing `lenis/react` and `lenis/dist/lenis.css`. Lenis adds ~15 kB minified and intercepts all scroll events to apply smooth easing. It correctly respects `prefers-reduced-motion`.

**Finding:** Lenis is only used on `/create` (not site-wide). This is appropriate scoping. The `autoRaf: true` option means Lenis runs a `requestAnimationFrame` loop for the lifetime of the create page. On low-end devices this contributes to main thread load during the generation flow.

**Recommended fix:** No urgent change. If the `/create` page generates performance complaints on low-end devices, `smoothWheel: false` with a fallback to native scroll for those devices (detected via `navigator.hardwareConcurrency < 4` or device memory API) would help.

---

### 5.3 Google Fonts loaded via Next.js font optimization — correct (P0 — POSITIVE)

**Affected file:** `app/layout.tsx` (lines 7–19)

**Current state:** Both `Fraunces` and `Manrope` are loaded via `next/font/google` with `display: "swap"` and specific weight subsets. This ensures fonts are self-hosted, inlined into CSS, and do not block rendering.

**Recommended action:** None. This is the correct pattern.

---

## Priority Summary

| Priority | Issue | File | Est. Impact |
|----------|-------|------|-------------|
| P0 | Homepage full CSR — no SSR above-fold | `app/LandingPage.tsx` | LCP −30–70% |
| P0 | MockupStage fires uncached API fetch on every mount | `components/mockups/MockupStage.tsx` | −50–200ms per interaction |
| P1 | Three.js / R3F in landing bundle | `app/LandingPage.tsx`, `PremiumGateway.tsx` | −200–350 kB gzip |
| P1 | Framer Motion in every client component | 30+ files | −70–100 kB gzip |
| P1 | `quality={100}` on mockup images | `BaseMockupLayer.tsx` | 2–4× image size reduction |
| P1 | Sequential Supabase queries on success page | `app/success/page.tsx` | −50–150ms TTFB |
| P1 | Stripe client re-instantiated per request | 3 API route files | Reduced per-request overhead |
| P1 | No Cache-Control on `/api/mockup-placements` | `app/api/mockup-placements/route.ts` | Eliminates repeated serverless invocations |
| P1 | `SiteChrome` as client component — forces full shell hydration | `components/SiteChrome.tsx` | Improved streaming / shell TTFB |
| P1 | `product/[type]` not using `generateStaticParams` | `app/product/[type]/page.tsx` | CDN edge vs serverless |
| P1 | `MeshGradientBackground` WebGL shader on all pages | `components/SiteChrome.tsx` | Continuous GPU drain |
| P2 | `ogl` library not dynamically imported | `components/Iridescence.tsx` | −130 kB parse |
| P2 | `gsap` dependency unused | `package.json` | −68 kB |
| P2 | `hero` story image missing `priority` | `app/LandingPage.tsx` | LCP improvement |
| P2 | ArtworkLayer uses plain `<img>` | `components/mockups/ArtworkLayer.tsx` | CLS / lazy load |
| P2 | Shop page fully client-rendered | `app/shop/CatalogClient.tsx` | SEO + perceived load |
| P3 | Shipping cache resets on cold start | `app/api/shipping-estimate/route.ts` | Cache hit rate across instances |

---

## Quick Wins (implement in < 1 day)

1. Remove `quality={100}` from `BaseMockupLayer.tsx` — 1 line change.
2. Add `Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400` to `/api/mockup-placements` response.
3. Remove `cache: "no-store"` from `MockupStage` fetch or replace with `{ next: { revalidate: 3600 } }`.
4. Move Stripe instantiation to module scope in all three API route files.
5. Add `generateStaticParams` to `app/product/[type]/page.tsx`.
6. Remove unused `gsap` dependency.
7. Wrap `Iridescence` at its callsite with `dynamic(() => import(...), { ssr: false })`.
8. Fix the sequential Supabase queries in `/success` and `/api/orders/status` with a join.
