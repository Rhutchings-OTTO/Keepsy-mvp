/**
 * Canonical route helpers for product preview pages.
 * Use for floater cards, catalog, and "Choose your item" navigation.
 */

type ProductSlug = "tee" | "hoodie" | "mug" | "card";

/** Map app product id (tshirt | hoodie | mug | card) to URL slug */
export function getProductPreviewHref(productType: string): string {
  const slug: ProductSlug = productType === "tshirt" ? "tee" : (productType as ProductSlug);
  return `/product/${slug}`;
}
