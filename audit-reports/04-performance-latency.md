# Performance & Latency Audit — Keepsy
**Date:** 2026-03-06 | **Branch:** main (81c4151)

---

## Executive Summary

Keepsy has a well-structured codebase but carries **significant performance debt** from always-loaded 3D/animation libraries, a GPU-intensive background rendered on every page, and no streaming for the core image generation flow. These will materially impact Core Web Vitals and experience on mobile/slow connections.

**Estimated main bundle (pre-gzip):** ~1.5–2.0MB | **Gzipped:** ~400–500KB

---

## Findings

### 1. No Suspense Fallbacks on Dynamic Imports
**Severity: CRITICAL**
**Files:** `app/LandingPage.tsx:15-17`, `app/MerchGeneratorPlatform.tsx:16-18`, `components/GenerativeLoader.tsx:8-16`

All dynamic imports use `{ ssr: false }` with no `loading` fallback. Users see blank flashes while chunks download.

```tsx
// Current (bad)
const PremiumGateway = dynamic(() => import("@/components/PremiumGateway"), { ssr: false });

// Fix
const PremiumGateway = dynamic(() => import("@/components/PremiumGateway"), {
  ssr: false,
  loading: () => <div className="h-screen animate-pulse bg-ivory" />
});
```

---

### 2. 3D/Animation Libraries Always Bundled
**Severity: HIGH**
**Files:** `package.json:16-38`, multiple components

Heavy libraries loaded on every page:
- `three` (0.183.2): ~600KB — used only in easter egg + premium gateway
- `@react-three/fiber` + `@react-three/drei`: ~150KB
- `ogl` (1.0.11): ~200KB — used only in `Iridescence.tsx`
- `gsap` (3.14.2): ~150KB — overlaps with Framer Motion
- `canvas-confetti`: easter egg only

`Iridescence.tsx` imports `ogl` at module level — should be dynamically imported. `SecretBanana.tsx` loads full Three.js for a hidden easter egg.

**Fix:** Dynamic import `Iridescence` and ensure Three.js is never on the critical path.

---

### 3. MeshGradient Background — GPU Drain on Every Page
**Severity: HIGH**
**Files:** `components/SiteChrome.tsx:22-24`, `components/MeshGradientBackground.tsx`

The canvas-based animated gradient runs at 60fps on **every page** via fixed position in `SiteChrome`. It has:
- A continuous RAF loop (line 61-65)
- A ResizeObserver firing on every resize without debouncing
- No `prefers-reduced-motion` check

Drains battery on mobile and prevents CPU sleep on laptops.

**Fix:**
```tsx
const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
if (prefersReduced) return <div className="fixed inset-0 bg-ivory" />;
```
Also debounce the ResizeObserver with `requestAnimationFrame`.

---

### 4. No Streaming for Image Generation
**Severity: HIGH**
**Files:** `app/api/generate-image/route.ts`, `app/api/generate/route.ts`

Both generation routes return a full JSON response with no streaming. DALL-E 3 / gpt-image-1 can take 30-90 seconds. Users get zero progress feedback — just a spinner. The route returns `Cache-Control: no-store` even on cache hits.

**Fix:**
- Implement Server-Sent Events or a ReadableStream for generation progress
- Return `Cache-Control: public, max-age=3600` for cached/deduped hits (lines 146, 177)

---

### 5. Force-Dynamic Prevents All Caching
**Severity: HIGH**
**Files:** `app/create/page.tsx:7`, `app/success/page.tsx:6`, multiple API routes

`export const dynamic = "force-dynamic"` on the create and success pages disables Next.js static generation, ISR, and response caching. These pages are served fresh on every request even when content is identical.

**Fix:** Landing page and product pages should use ISR:
```tsx
export const revalidate = 3600; // app/page.tsx
```
Create/success pages are legitimately dynamic but ensure HTTP caching headers are set manually.

---

### 6. Lenis Smooth Scroll — Always Loaded
**Severity: MEDIUM**
**Files:** `components/LenisProvider.tsx`, `app/create/page.tsx:24`

Lenis (with continuous RAF scroll lerping) wraps the create page. It also imports a CSS file. Not needed on all pages.

**Fix:** Only load Lenis on landing and create pages (already scoped to create page — good). Verify it's not included in the root layout.

---

### 7. No ISR on Static Pages
**Severity: MEDIUM**
**Files:** `app/page.tsx`, all product pages

No pages use `revalidate`. Landing page and product pages could be statically generated with periodic revalidation, dramatically reducing TTFB.

**Fix:** Add `export const revalidate = 3600` to landing, product, gift-ideas pages.

---

### 8. ConversionFlowContext — Synchronous localStorage
**Severity: MEDIUM**
**Files:** `context/ConversionFlowContext.tsx:40-56`

- `useState` initialiser reads localStorage synchronously (blocks mount)
- `useEffect` writes to localStorage on every state change (no debounce)

**Fix:** Debounce writes with a 300ms timeout; initialiser is acceptable for small payloads.

---

### 9. Missing Cache Headers on Generation Cache Hits
**Severity: MEDIUM**
**Files:** `app/api/generate-image/route.ts:97, 146, 177`

All responses (including cache hits and deduped hits) return `Cache-Control: no-store`. Cache hits and deduped hits should be cacheable.

**Fix:** Return `Cache-Control: public, max-age=3600` for non-generation responses.

---

### 10. Image Component Inconsistencies
**Severity: MEDIUM**
**Files:** `app/LandingPage.tsx:75-82`, `components/Hero.tsx:29-32`

Most `<Image>` usage is correct (priority, sizes, alt). Verify all images below the fold use `loading="lazy"` explicitly and all have proper `sizes` for responsive loading to prevent oversized image downloads on mobile.

---

### 11. No AVIF/WebP Format Configuration
**Severity: LOW**
**Files:** `next.config.ts`

`next.config.ts` doesn't explicitly configure image formats.

**Fix:**
```ts
images: {
  formats: ["image/avif", "image/webp"],
  remotePatterns: [...existing...]
}
```

---

## Priority Fix Order

| Priority | Finding | Effort |
|---|---|---|
| P0 — Immediate | Add Suspense fallbacks to all dynamic imports | Low |
| P0 — Immediate | Reduce-motion check for MeshGradient | Low |
| P1 — This week | Cache headers for generation cache hits | Low |
| P1 — This week | ISR on landing + product pages | Low |
| P1 — This week | Dynamic import Iridescence.tsx | Low |
| P2 — Next sprint | API streaming for generation progress | High |
| P2 — Next sprint | Remove Three.js from critical path | Medium |
| P3 — Future | Consider replacing GSAP with Framer Motion exclusively | Medium |
