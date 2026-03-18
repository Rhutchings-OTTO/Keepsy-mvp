/**
 * Canonical product schema with variants (size, color).
 */

export type ApparelSize = "S" | "M" | "L" | "XL" | "2XL" | "3XL" | "4XL" | "5XL";

export type ProductType = "hoodie" | "tshirt" | "mug" | "card" | "canvas";

export interface Product {
  id: ProductType;
  name: string;
  description: string;
  basePrice: number;
  hasSize: boolean;
  /** True for the canvas product — uses CanvasSizeSelector instead of apparel sizes */
  hasCanvasSize?: boolean;
  sizes?: ApparelSize[];
  colors?: Array<{ hex: string; name: string }>;
}

const TSHIRT_SIZES: ApparelSize[] = ["S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"];
const HOODIE_SIZES: ApparelSize[] = ["S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"];

export const PRODUCTS: Record<ProductType, Product> = {
  tshirt: {
    id: "tshirt",
    name: "Premium Tee",
    description: "Soft, heavyweight premium tee.",
    basePrice: 29.99,
    hasSize: true,
    sizes: TSHIRT_SIZES,
    colors: [
      { hex: "#FFFFFF", name: "White" },
      { hex: "#1e3a8a", name: "Navy" },
      { hex: "#111827", name: "Black" },
    ],
  },
  hoodie: {
    id: "hoodie",
    name: "Hoodie",
    description: "Soft fleece hoodie, gift-ready print.",
    basePrice: 44.99,
    hasSize: true,
    sizes: HOODIE_SIZES,
    colors: [
      { hex: "#FFFFFF", name: "White" },
      { hex: "#1e3a8a", name: "Navy" },
      { hex: "#111827", name: "Black" },
    ],
  },
  mug: {
    id: "mug",
    name: "Mug",
    description: "11oz ceramic mug with glossy finish.",
    basePrice: 18.99,
    hasSize: false,
  },
  card: {
    id: "card",
    name: "Greeting Card",
    description: "Premium cardstock + envelope.",
    basePrice: 9.99,
    hasSize: false,
  },
  canvas: {
    id: "canvas",
    name: "Canvas Print",
    description: "Gallery-wrapped canvas, 1.25\" depth. From £29.99.",
    basePrice: 29.99, // starting price (small tier)
    hasSize: false,
    hasCanvasSize: true,
  },
};

/** Ordered list for UI iteration */
export const PRODUCT_LIST: Product[] = [
  PRODUCTS.tshirt,
  PRODUCTS.hoodie,
  PRODUCTS.mug,
  PRODUCTS.card,
  PRODUCTS.canvas,
];

/** Product id used in cart/checkout (legacy: tee, hoodie, mug, card) */
export const PRODUCT_CATALOG_IDS: Record<ProductType, string> = {
  tshirt: "tee",
  hoodie: "hoodie",
  mug: "mug",
  card: "card",
  // Canvas uses per-size IDs (canvas_10x8, canvas_20x16, etc.) — handled specially at cart build time
  canvas: "canvas",
};

export function getProductByCatalogId(catalogId: string): Product | null {
  // Canvas per-size IDs all start with "canvas_"
  if (catalogId.startsWith("canvas")) return PRODUCTS.canvas;
  const entry = Object.entries(PRODUCT_CATALOG_IDS).find(([, id]) => id === catalogId);
  return entry ? PRODUCTS[entry[0] as ProductType] : null;
}

export function getProduct(type: ProductType): Product {
  return PRODUCTS[type];
}

export function getColorName(product: Product, hex: string): string {
  const c = product.colors?.find((x) => x.hex.toLowerCase() === hex.toLowerCase());
  return c?.name ?? hex;
}
