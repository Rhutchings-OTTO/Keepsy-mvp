# Team 8: Image Treatment & Media — Audit Report

**Date:** 2026-03-08
**Files audited:** `app/product/[type]/page.tsx`, `components/ProductGrid.tsx`

---

## app/product/[type]/page.tsx

### Finding: No images in server-rendered content sections

The server-rendered portion of this page outputs only JSON-LD structured data and text-based content blocks (How It Works, About, Perfect For, Delivery, FAQ, Explore More links). There are zero `<img>` or `<Image>` tags in the server-rendered JSX.

All visual product rendering is delegated entirely to `<ProductPreviewClient>`, which is a client component and outside this team's scope.

**Conclusion:** No image changes required in this file. The content sections are text-only.

---

## components/ProductGrid.tsx

### Finding: Image component present — audit results

The file renders one `<Image>` per product card (4 total) using:

```tsx
<Image src={product.image} alt={product.name} width={360} height={220} className="h-28 w-full object-contain" />
```

| Property | Status | Notes |
|---|---|---|
| `width` / `height` | Present | 360×220 — explicit, not `fill` |
| `alt` text | Present but generic | Uses `product.name` e.g. `"Greeting Card"`, `"Premium Hoodie"` — not descriptive enough for SEO/accessibility |
| `object-contain` | Present | Correct choice for product selector so full product is visible |
| Parent `position: relative` | Not needed | `fill` is not used; explicit dimensions are set |
| `sizes` prop | Missing | Grid is 2-column on ≥640px; missing `sizes` means browser downloads full-size image unnecessarily on mobile |
| `priority` | Not needed | ProductGrid appears below the fold (used in the create flow/shop, not the page hero) |
| Mockup consistency comments | Missing | No inline notes to flag which images need reviewing |

### Changes made

1. **Alt text improved** — Changed from generic product names to descriptive personalised-product strings:
   - `"Greeting Card"` → `"Personalised greeting card mockup"`
   - `"Premium Hoodie"` → `"Personalised hoodie mockup"`
   - `"Ceramic Mug"` → `"Personalised ceramic mug mockup"`
   - `"Premium Tee"` → `"Personalised t-shirt mockup"`

2. **`sizes` prop added** — `sizes="(max-width: 640px) 50vw, 25vw"` tells the browser the image takes ~50% of viewport on mobile (2-column grid) and ~25% on larger screens, enabling correct responsive image selection.

3. **Mockup verification comments added** — One inline comment per image noting it should be reviewed for visual consistency.

---

## Unchanged / out of scope

- `ProductPreviewClient` — client component, outside team scope
- `LandingPage.tsx` — polished by Team 5, not in scope
- `CatalogClient` — polished by Team 4, not in scope
- `next.config.ts` — already has AVIF/WebP formats and `minimumCacheTTL: 86400`
- `globals.css` — already has `.image-fade-in` and `.image-hover-lift`

---

## Summary

The product page server section requires no image changes (pure text content). ProductGrid.tsx received three targeted improvements: descriptive alt text, a `sizes` prop for responsive image delivery, and inline mockup-review comments for the team.
