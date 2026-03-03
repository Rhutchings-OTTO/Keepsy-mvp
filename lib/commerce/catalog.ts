/**
 * Canonical product catalog. Server-side only. Never trust client-provided price IDs.
 */
export type CatalogProduct = {
  id: string;
  name: string;
  priceGBP: number;
};

export const PRODUCT_CATALOG: Record<string, CatalogProduct> = {
  card: { id: "card", name: "Greeting card", priceGBP: 8 },
  mug: { id: "mug", name: "Mug", priceGBP: 14 },
  tee: { id: "tee", name: "Premium tee", priceGBP: 29 },
  hoodie: { id: "hoodie", name: "Hoodie", priceGBP: 40 },
};

export const ALLOWED_SKUS = Object.keys(PRODUCT_CATALOG);
export const MAX_QUANTITY = 20;
export const MIN_QUANTITY = 1;
