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
  /** True for the card product — shows a postcard vs. card-pack sub-selector */
  hasCardSubtype?: boolean;
  sizes?: ApparelSize[];
  colors?: Array<{ hex: string; name: string }>;
}

const TSHIRT_SIZES: ApparelSize[] = ["S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"];
const HOODIE_SIZES: ApparelSize[] = ["S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"];

export const PRODUCTS: Record<ProductType, Product> = {
  tshirt: {
    id: "tshirt",
    name: "Premium Tee",
    description: "Heavyweight 100% cotton tee with a relaxed, lived-in feel. Pre-shrunk so it stays true to size — a gift they'll actually wear.",
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
    description: "Soft, cosy hoodie with a classic fit. Double-lined hood, front pouch pocket, and a quality feel that makes it a go-to favourite.",
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
    description: "Classic white ceramic mug with your design printed on both sides. Dishwasher safe, microwave friendly, and looks great next to the kettle.",
    basePrice: 18.99,
    hasSize: false,
  },
  card: {
    id: "card",
    name: "Card",
    description: "Fine art postcard or greeting card pack, printed on premium paper and ready to send to someone special.",
    basePrice: 9.99, // smallest subtype price — used only as display fallback
    hasSize: false,
    hasCardSubtype: true,
  },
  canvas: {
    id: "canvas",
    name: "Canvas Print",
    description: "Gallery-quality stretched canvas on a solid pine wood frame. Ready to hang straight out of the box — no DIY required.",
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
