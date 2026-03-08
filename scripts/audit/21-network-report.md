# Network Optimisation Audit — Report 21

**Date:** 2026-03-08
**Scope:** next.config.ts, app/layout.tsx, app/api/**

---

## Summary

One change was made. All other areas audited were already correctly configured.

---

## Step 2: Image Optimisation (next.config.ts)

**Status: Already configured — no changes needed.**

- `images.formats: ['image/avif', 'image/webp']` — present
- `images.remotePatterns` — configured for unsplash, cloudinary, picsum
- `images.minimumCacheTTL: 60` — present
- `images.deviceSizes` — custom responsive breakpoints configured

---

## Step 3: Font Loading (app/layout.tsx)

**Status: Already configured — no changes needed.**

Both fonts use `next/font/google` with `display: 'swap'`:

- `Fraunces` — subsets: latin, display: swap, weights: 500/600/700, variable: --font-serif
- `Manrope` — subsets: latin, display: swap, weights: 400/500/600/700, variable: --font-sans

Next.js automatically preloads fonts declared via `next/font`.

---

## Step 4: API Route Caching

**Status: Already configured — no changes needed.**

All routes audited had appropriate caching or correctly omitted it:

| Route | Method | Cache-Control | Notes |
|---|---|---|---|
| `/api/mockup-placements` | GET | `public, s-maxage=60, stale-while-revalidate=300` | Already present |
| `/api/community-designs` | GET | `public, s-maxage=3600, stale-while-revalidate=86400` | Already present, edge runtime with `revalidate=3600` |
| `/api/health` | GET | `public, max-age=30, s-maxage=30` | Already present |
| `/api/status` | GET | `public, max-age=2, s-maxage=2` | Already present (real-time capacity metric — short TTL correct) |
| `/api/shipping-estimate` | POST | In-memory LRU cache (10 min, 50 entries) | POST — no HTTP caching, in-process cache is correct |
| `/api/order-status` | GET | None | User-specific DB query — correctly uncached |
| `/api/admin/mockup-placements` | POST | None | Admin mutation — correctly uncached |
| `/api/generate-image` | — | None | Dynamic, user-specific — excluded per policy |
| `/api/create-checkout-session` | — | None | Per-transaction — excluded per policy |
| `/api/subscribe` | — | None | Mutation — excluded per policy |
| `/api/webhooks/*` | — | None | Webhook handlers — excluded per policy |

---

## Step 5: Static Asset Cache Headers (next.config.ts)

**Status: CHANGED — headers() function added.**

No `headers()` function existed in `next.config.ts`. Added a rule to apply long-lived immutable caching to all files served from the `/images/` path:

```typescript
async headers() {
  return [
    {
      source: '/images/(.*)',
      headers: [
        { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
      ],
    },
  ];
},
```

This sets a 1-year max-age with `immutable` for static image assets in the public `/images/` directory. This is safe because Next.js content-hashes asset filenames on build, so cache busting is handled automatically.

---

## Files Modified

- `/Users/roryhutchings/keepsy-mvp/next.config.ts` — added `headers()` function for `/images/(.*)` static asset caching

## Files Reviewed, No Changes

- `/Users/roryhutchings/keepsy-mvp/app/layout.tsx`
- `/Users/roryhutchings/keepsy-mvp/app/api/mockup-placements/route.ts`
- `/Users/roryhutchings/keepsy-mvp/app/api/community-designs/route.ts`
- `/Users/roryhutchings/keepsy-mvp/app/api/shipping-estimate/route.ts`
- `/Users/roryhutchings/keepsy-mvp/app/api/health/route.ts`
- `/Users/roryhutchings/keepsy-mvp/app/api/status/route.ts`
- `/Users/roryhutchings/keepsy-mvp/app/api/order-status/route.ts`
- `/Users/roryhutchings/keepsy-mvp/app/api/admin/mockup-placements/route.ts`
