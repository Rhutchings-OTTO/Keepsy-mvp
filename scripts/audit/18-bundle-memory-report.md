# Bundle & Memory Optimization Audit — Report 18

**Date:** 2026-03-08
**Scope:** `/app/`, `/components/`, `next.config.ts`, `package.json`

---

## 1. Dependencies — Heavy Libraries Found

| Library | Size category | Use |
|---|---|---|
| `three` + `@react-three/fiber` + `@react-three/drei` | Very heavy (>500 KB gzipped) | 3-D banana easter-egg only |
| `framer-motion` | Heavy (~50 KB gzipped) | Pervasive — animations everywhere |
| `@paper-design/shaders-react` | Moderate (GPU shaders) | `MeshGradientBackground` — site-wide background |
| `ogl` | Moderate | `Iridescence.tsx` WebGL effect |
| `lenis` | Light | Smooth scroll |
| `canvas-confetti` | Light | Order success + banana easter-egg |
| `swr` | Light | Data fetching |

---

## 2. Three.js / WebGL Usage

### Already lazy-loaded (good)
- **`GenerativeLoader.tsx`** — both `Canvas` (from `@react-three/fiber`) and `SecretBanana` are `next/dynamic` with `ssr: false`. Three.js only loads when the banana easter-egg triggers.
- **`PremiumGateway.tsx`** — the Three.js cloud scene was removed in a previous pass (comment in file confirms this). Now pure CSS.

### `SecretBanana.tsx`
- Imports `three` and `@react-three/fiber` directly at the top of the file.
- This is fine because `SecretBanana` is itself only ever loaded through the dynamic import in `GenerativeLoader`, so the static imports are inside the lazy chunk.

### No other Three.js usage found in `app/` or `components/`.

---

## 3. Memory Leak Analysis

### 3.1 setInterval / setTimeout

**`GenerativeLoader.tsx`** — CLEAN
- Two `setInterval` calls both have `return () => clearInterval(t)` cleanup.
- Two `setTimeout` calls both have `return () => clearTimeout(...)` cleanup.

**`HeroFloatingCards.tsx`** (DebugOverlay) — CLEAN
- `setTimeout(update, 0)` has `return () => clearTimeout(t)`.

**`SiteHeader.tsx`** (MobileOverlay) — CLEAN
- `setTimeout(() => closeButtonRef.current?.focus(), 50)` has `return () => clearTimeout(id)`.

**`RegionSelector.tsx`** — MINOR CONCERN
- `resetTimeoutRef.current = setTimeout(...)` is called inside event handlers (not `useEffect`), not inside a `useEffect` with cleanup. If the component unmounts while the timeout is pending the ref-stored timer will still fire, calling `setClickCount(0)` and `setLastClickedRegion(null)` on an unmounted component.
- Risk is **low** — React 18 no longer warns on setState after unmount, and the timeout is only 2 seconds. Not a memory leak per se (the timer will fire and silently be ignored), but worth noting.

**`EntryGateway.tsx`** — MINOR CONCERN (same pattern)
- `setTimeout(() => { onSelect(region); }, 900)` inside a click handler with no cleanup. The callback is a prop function and the timer is only 900 ms. Same low-risk profile as `RegionSelector`.

**`SuccessPoller.tsx`** — CLEAN
- `timerRef.current = setTimeout(poll, POLL_INTERVAL_MS)` is cleaned up by `cancelled = true` flag and `if (timerRef.current) clearTimeout(timerRef.current)` in the cleanup return.

**`PremiumGateway.tsx`** — MINOR CONCERN
- Two `setTimeout` calls (500 ms and 2500 ms) inside `startTransition` event handler. No cleanup. Same low-risk profile — the component is full-screen and unmounts naturally after 2.5 s.

**`products/SizeAndMeasurements.tsx`**, **`motion/RevealSplitText.tsx`**, **`motion/KineticHeading.tsx`**, **`motion/Reveal.tsx`** — CLEAN
- All `setTimeout` calls have proper `return () => clearTimeout(t)` cleanup.

### 3.2 addEventListener / removeEventListener

**`HeroFloatingCards.tsx`** — CLEAN
- `window.addEventListener("resize", setWidth)` with matching `window.removeEventListener("resize", setWidth)` in cleanup.

**`SiteHeader.tsx`** — CLEAN
- `window.addEventListener("storage", readCart)` has matching `removeEventListener`.
- Body scroll lock effect returns `() => { document.body.style.overflow = ""; }`.

**`Iridescence.tsx`** — CLEAN
- `window.addEventListener("resize", resize)` cleaned up.
- `ctn.addEventListener("mousemove", handleMouseMove)` cleaned up.
- WebGL context is explicitly released with `gl.getExtension("WEBGL_lose_context")?.loseContext()`.
- Canvas DOM node is removed from the container with `ctn.removeChild(gl.canvas)`.

**`CartDrawer.tsx`** — CLEAN
- Three `useEffect` hooks: `open-cart-drawer`, `cart-updated`+`storage`, and body scroll lock — all have matching `removeEventListener` / cleanup returns.

**`ExitGuardian.tsx`** — CLEAN
- `document.addEventListener("mouseleave", handleMouseOut)` has matching `removeEventListener`.

**`SizeGuideDrawer.tsx`** — CLEAN
- `window.addEventListener("keydown", handler)` has `return () => window.removeEventListener("keydown", handler)`.

**`hero/HeroFloatersSimple.tsx`** — CLEAN
- Two `useEffect` hooks: ResizeObserver + resize listener, and pointermove/pointerleave. Both have full cleanup including `ro.disconnect()`, `cancelAnimationFrame(rafRef.current)`, and `removeEventListener`.

**`mockups/MockupWithLoupe.tsx`** — CLEAN
- `media.addEventListener("change", sync)` has `return () => media.removeEventListener("change", sync)`.
- `ResizeObserver` with `return () => obs.disconnect()`.

**`components/ui/Carousel.tsx`** — CLEAN
- `el.addEventListener("scroll", updateScrollState)` and `ResizeObserver` both cleaned up.

**`MouseGlow.tsx`** — CLEAN
- `parent.addEventListener("mousemove", handleMove)` with `return () => parent.removeEventListener("mousemove", handleMove)`.

**`MeshGradientBackground.tsx`** — CLEAN
- `window.addEventListener("resize", update)` with `return () => window.removeEventListener("resize", update)`.

### 3.3 requestAnimationFrame

**`Iridescence.tsx`** — CLEAN
- `let animateId: number; ... animateId = requestAnimationFrame(update);`
- Cleanup: `cancelAnimationFrame(animateId)`.

**`hero/HeroFloatersSimple.tsx`** — CLEAN
- `rafRef.current = requestAnimationFrame(...)` with `if (rafRef.current) cancelAnimationFrame(rafRef.current)` in cleanup.

**`hero/useFloaterCapacity.ts`** — CLEAN
- Same pattern: `rafRef.current = requestAnimationFrame(...)` with `cancelAnimationFrame` in cleanup.

**`canvas/CanvasCropTool.tsx`** — no `requestAnimationFrame` found (only pointer events).

**`mockups/MockupStage.tsx`** — no `requestAnimationFrame` found.

**`OrderSuccess.tsx`** — LOW-RISK CONCERN
- `requestAnimationFrame(frame)` is called recursively until `Date.now() >= end` (3 seconds). There is **no cleanup return** from the `useEffect`, so if the component unmounts before 3 seconds elapse the rAF loop continues running.
- The impact is minimal: `canvas-confetti` is lightweight, the rAF fires for at most 3 s total, and calls to a detached canvas object are silently ignored. Not a leak in the memory-growth sense, but wastes CPU for up to 3 s after unmount.
- **Recommended fix (low priority):** Store the rAF id in a ref, add cleanup `return () => cancelAnimationFrame(rafIdRef.current)`.

### 3.4 IntersectionObserver / ResizeObserver / MutationObserver

**`motion/Reveal.tsx`**, **`motion/KineticHeading.tsx`**, **`motion/RevealSplitText.tsx`** — CLEAN
- `IntersectionObserver` each has `return () => observer.disconnect()`.

**`canvas/CanvasCropTool.tsx`** — no Observer found.

**`mockups/MockupStage.tsx`** — uses a cancellation flag `let active = true` pattern for async operations.

**`mockups/MockupWithLoupe.tsx`** — CLEAN (see above).

**`hero/useFloaterCapacity.ts`** — CLEAN (see above).

**`hero/HeroFloatersSimple.tsx`** — CLEAN (see above).

---

## 4. console.log in Production Code

The `next.config.ts` already strips `console.log` at build time via:
```ts
compiler: {
  removeConsole: {
    exclude: ["error", "warn"],
  },
},
```

The following files contain `console.log` statements that will be stripped from production builds. They are **not removed** per audit instructions.

| File | Line | Content |
|---|---|---|
| `app/MerchGeneratorPlatform.tsx` | 403 | `[checkout] payload size: ${size} bytes (${(size / 1024).toFixed(1)} KB)` |
| `app/api/webhooks/printify/route.ts` | (API route — out of scope) | — |
| `app/api/webhooks/tracking/route.ts` | (API route — out of scope) | — |
| `app/api/stripe/webhook/route.ts` | (API route — out of scope) | — |

No `console.log` statements were found in `/components/`. API routes are excluded from this audit scope.

---

## 5. Raw `<img>` Tags (Non-Next.js Image)

One raw `<img>` tag found:

**`components/canvas/CanvasMockup.tsx` line 35:**
```tsx
// eslint-disable-next-line @next/next/no-img-element
const Img = ({ src, style }: { src: string; style: React.CSSProperties }) => (
  <img src={src} alt="" aria-hidden draggable={false} style={style} />
);
```

This is **intentional and correct**. The ESLint disable comment confirms the author is aware. The `src` is a local data URL (canvas art from the user's session), not a remote image — Next.js `<Image>` does not support data URLs and would fail here. No change required.

---

## 6. next.config.ts Image Optimization

`/Users/roryhutchings/keepsy-mvp/next.config.ts` is well configured:

```ts
images: {
  formats: ["image/avif", "image/webp"],   // Both modern formats
  deviceSizes: [375, 640, 750, 828, 1080, 1200, 1920],  // Good breakpoint coverage
  minimumCacheTTL: 60,                     // 60-second minimum CDN TTL
  remotePatterns: [...]                    // Restricted to known hosts
},
compiler: {
  removeConsole: { exclude: ["error", "warn"] }  // console.log stripped in prod
}
```

**Items to consider:**
- `minimumCacheTTL: 60` (60 seconds) is on the low side. For static product images on Cloudinary/Unsplash that don't change, a value of `86400` (1 day) or `2592000` (30 days) would improve CDN cache performance. Current value still prevents stale content but means more origin hits.
- No `imageSizes` configuration. The default Next.js `imageSizes` of `[16, 32, 48, 64, 96, 128, 256, 384]` is reasonable; no change needed unless very small thumbnails are in use.

---

## 7. Dynamic Import / Lazy-Loading Analysis

### Already lazy-loaded (no action needed)

| Component | Where | How |
|---|---|---|
| `Canvas` (`@react-three/fiber`) | `GenerativeLoader.tsx` | `next/dynamic`, ssr: false |
| `SecretBanana` | `GenerativeLoader.tsx` | `next/dynamic`, ssr: false |
| `CheckoutSummaryEnhancer` | `MerchGeneratorPlatform.tsx` | `next/dynamic`, ssr: false |
| `PremiumGateway` | `LandingPage.tsx` | `next/dynamic`, ssr: false |
| `RegionSelector` | `LandingPage.tsx` | `next/dynamic`, ssr: false |
| `ReviewsSection` | `LandingPage.tsx` | `next/dynamic`, ssr: false |
| `TrustSection` | `LandingPage.tsx` | `next/dynamic`, ssr: false |

### Potential improvement: `MeshGradientBackground` in `SiteChrome`

`SiteChrome` is a **Server Component**, so `next/dynamic` cannot be used directly inside it. However, `MeshGradientBackground` wraps `@paper-design/shaders-react` behind a `useState(false)` (`mounted`) guard — it does not render the shader canvas on the server. The JS is still included in the client bundle.

**Option:** Extract the `SiteChrome` background `<div>` into a separate `"use client"` wrapper component and apply `next/dynamic` there. This would defer the `@paper-design/shaders-react` chunk until after hydration, saving it from the critical render path. This is a moderate-effort change that should be considered if LCP or TTI is an issue.

### No action needed for these

The following components were audited and found to be either lightweight, above the fold, or already loaded conditionally:

- `MeshGradientBackground` — already guards SSR with `mounted` state
- `Iridescence` — only used in specific product/landing sub-sections
- `GalleryOfThePossible` — on `/account` page only (not a high-traffic critical path)
- All `motion/*` components — framer-motion is already in the main bundle

---

## 8. Summary of Findings

### Issues requiring no action
- Image optimization config is correct and complete.
- `removeConsole` in production is already configured.
- All `useEffect` event listener hooks have proper cleanup.
- All `ResizeObserver` / `IntersectionObserver` hooks disconnect in cleanup.
- All `setInterval` / `setTimeout` in `useEffect` have `clearInterval` / `clearTimeout` cleanup.
- Three.js is already fully lazy-loaded behind `next/dynamic`.
- The one raw `<img>` tag is intentional (data URL, ESLint suppression in place).

### Low-priority issues (no changes made)
1. **`OrderSuccess.tsx`** — rAF loop has no cleanup. If the component unmounts before 3 s, rAF continues briefly. Fix: store rAF id, add `cancelAnimationFrame` in `useEffect` cleanup.
2. **`RegionSelector.tsx`** and **`EntryGateway.tsx`** and **`PremiumGateway.tsx`** — `setTimeout` called in event handlers (not `useEffect`) with no cancel mechanism. Risk is very low (short durations, ephemeral components).
3. **`MeshGradientBackground` / `@paper-design/shaders-react`** — shipped in the main bundle for every page. Consider a dynamic import wrapper to defer it until after hydration.

### Config improvement (optional)
- Increase `minimumCacheTTL` in `next.config.ts` from `60` to `86400` for product images that don't change frequently.

---

## 9. No Files Were Modified

This audit is reporting-only. No source files were changed.
