import { getSupportedSizes } from "@/lib/commerce/variants";
import { PRODUCT_CATALOG_IDS, PRODUCT_LIST, type ApparelSize, type Product, type ProductType } from "@/lib/products";

export type InitialCreateQuery = {
  product?: string;
  color?: string;
  size?: string;
  mode?: string;
  prompt?: string;
  style?: string;
  occasion?: string;
  success?: boolean;
  canceled?: boolean;
};

const PRODUCT_ALIASES: Record<string, ProductType> = {
  tee: "tshirt", tshirt: "tshirt", "t-shirt": "tshirt",
  mug: "mug", card: "card", postcard: "card", cardpack: "card",
  uscard_1: "card", uscard_10: "card", uscard_30: "card", uscard_50: "card",
  hoodie: "hoodie", canvas: "canvas",
};

/** Resolve only choices offered by the storefront and fulfilment catalogue. */
export function resolveProductSelection(query: InitialCreateQuery): {
  product: Product;
  color: string;
  size: ApparelSize | null;
} | null {
  const productType = PRODUCT_ALIASES[query.product?.trim().toLowerCase() ?? ""];
  const product = PRODUCT_LIST.find((item) => item.id === productType);
  if (!product) return null;

  // Older shop links use "blue", while the product catalogue calls it Navy.
  const requestedColor = query.color?.trim().toLowerCase();
  const colorName = requestedColor === "blue" ? "navy" : requestedColor;
  const color = product.colors?.find((item) => item.name.toLowerCase() === colorName)
    ?? product.colors?.[0];
  const requestedSize = query.size?.trim().toUpperCase();
  const availableSizes = color ? getSupportedSizes(PRODUCT_CATALOG_IDS[product.id], color.name) : [];
  const size = requestedSize && product.sizes?.includes(requestedSize as ApparelSize) && availableSizes.includes(requestedSize)
    ? requestedSize as ApparelSize
    : null;
  return { product, color: color?.hex ?? "#FFFFFF", size };
}

export function resolveCreateMode(mode?: string): "describe" | "upload" {
  return mode?.trim().toLowerCase() === "upload" ? "upload" : "describe";
}
