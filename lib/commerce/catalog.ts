/**
 * Canonical product catalog. Server-side only. Never trust client-provided price IDs.
 */
export type CatalogProduct = {
  id: string;
  name: string;
  priceGBP: number;
};

export const PRODUCT_CATALOG: Record<string, CatalogProduct> = {
  card: { id: "card", name: "Greeting card", priceGBP: 9.99 },
  mug: { id: "mug", name: "Mug", priceGBP: 18.99 },
  tee: { id: "tee", name: "Premium tee", priceGBP: 29.99 },
  hoodie: { id: "hoodie", name: "Hoodie", priceGBP: 44.99 },
  // Canvas — priced by size tier; productId encodes tier, size passed separately
  // Small: max(W,H) ≤ 12 in   e.g. 6x6, 8x10, 10x8, 9x12, 12x9, 10x10, 12x12
  canvas_small:  { id: "canvas_small",  name: "Canvas print (small)",      priceGBP: 29.99 },
  // Medium: 12 < max(W,H) ≤ 24 in   e.g. 14x11, 16x16, 20x24, 24x24
  canvas_medium: { id: "canvas_medium", name: "Canvas print (medium)",     priceGBP: 49.99 },
  // Large: 24 < max(W,H) ≤ 36 in   e.g. 30x20, 32x24, 36x36
  canvas_large:  { id: "canvas_large",  name: "Canvas print (large)",      priceGBP: 79.99 },
  // XL: max(W,H) > 36 in   e.g. 40x30, 48x24, 60x40
  canvas_xlarge: { id: "canvas_xlarge", name: "Canvas print (extra large)", priceGBP: 109.99 },
};

export const ALLOWED_SKUS = Object.keys(PRODUCT_CATALOG);
export const MAX_QUANTITY = 20;
export const MIN_QUANTITY = 1;
