/**
 * Printify blueprint, provider, and variant mapping.
 *
 * Providers:
 *   1   = SPOKE Custom Products      (US — mugs)
 *   6   = T Shirt and Sons           (UK — mugs, hoodies)
 *   36  = Print Pigeons              (UK+US — greeting card bundles, BP 524)
 *   69  = Prodigi                    (UK+US — fine art postcards, BP 842)
 *   99  = Printify Choice            (US — hoodies, t-shirts; UK — t-shirts)
 *   105 = Jondo                      (UK+US — canvas prints)
 *   228 = Taylor                     (US — greeting cards, BP 1094)
 *
 * Blueprints:
 *   68   = Generic Brand 11oz Mug (US)
 *   535  = Orca Coatings 11oz White Mug (UK)
 *   77   = Gildan 18000 Unisex Heavy Blend Hooded Sweatshirt
 *   706  = Comfort Colors Unisex Garment-Dyed T-Shirt
 *   842  = Fine Art Postcards (Prodigi) — 6"×4" and 7"×5", landscape, 1854×1264 px print area
 *   524  = Greeting Cards 7 pcs (Print Pigeons) — folded, 2409×1819 px print area
 */

export type ProductRegionKey =
  | "mug_us"
  | "mug_uk"
  | "hoodie_us"
  | "hoodie_uk"
  | "tee_us"
  | "tee_uk"
  | "postcard"
  | "cardpack"
  | "uscard"
  | "canvas";

export type BlueprintConfig = {
  blueprintId: number;
  printProviderId: number;
  /** Printify print_area position identifier */
  printPosition: string;
  /** Flat map of "Color / Size" → variant ID */
  variants: Record<string, number>;
  /** Used when exact color/size combo isn't in the map */
  fallbackVariantId: number;
};

/* ─── Mug US (BP 68, provider 1) ─────────────────────────────────────────── */
// Only one variant: 11oz (ID 33719)
const MUG_US: BlueprintConfig = {
  blueprintId: 68,
  printProviderId: 1,
  printPosition: "front",
  variants: {},
  fallbackVariantId: 33719,
};

/* ─── Mug UK (BP 535, provider 6) ────────────────────────────────────────── */
// Only one variant: 11oz (ID 69010)
const MUG_UK: BlueprintConfig = {
  blueprintId: 535,
  printProviderId: 6,
  printPosition: "front",
  variants: {},
  fallbackVariantId: 69010,
};

/* ─── Fine Art Postcard (BP 842, provider 69 — Prodigi) ──────────────────── */
// Print area: 1854 × 1264 px (landscape). Sizes: 6"×4" and 7"×5".
// Variant IDs verified via Printify catalog API 2026-03-26.
const POSTCARD: BlueprintConfig = {
  blueprintId: 842,
  printProviderId: 69,
  printPosition: "front",
  variants: {
    "6x4": 76317, // 6" x 4" / 1 pc / Glossy
    "7x5": 76318, // 7" x 5" (Horizontal) / 1 pc / Glossy
  },
  fallbackVariantId: 76317, // 6" x 4" / 1 pc / Glossy
};

/* ─── Greeting Cards 7 pcs (BP 524, provider 36 — Print Pigeons) ─────────── */
// Print area: 2409 × 1819 px (landscape flat; portrait when folded).
// All 7 cards carry the same design. Single variant.
// Variant ID verified via Printify catalog API 2026-03-26.
const CARDPACK: BlueprintConfig = {
  blueprintId: 524,
  printProviderId: 36,
  printPosition: "front",
  variants: {},
  fallbackVariantId: 68326, // One size
};

/* ─── US Greeting Cards (BP 1094, provider 228 — Taylor) ─────────────────── */
// Print area: 2175 × 1538 px (landscape flat; portrait when folded).
// Quantity options: 1, 10, 30, 50 cards — each is a separate variant.
// Using 5" × 7" Coated (both sides) — standard US greeting card size.
// Variant IDs verified via Printify catalog API 2026-03-26.
const USCARD: BlueprintConfig = {
  blueprintId: 1094,
  printProviderId: 228,
  printPosition: "front",
  variants: {
    "1":  81858, // 5" x 7" (Vertical) / Coated (both sides) / 1 pc
    "10": 81859, // 5" x 7" (Vertical) / Coated (both sides) / 10 pcs
    "30": 81860, // 5" x 7" (Vertical) / Coated (both sides) / 30 pcs
    "50": 81861, // 5" x 7" (Vertical) / Coated (both sides) / 50 pcs
  },
  fallbackVariantId: 81858, // 5" x 7" (Vertical) / Coated (both sides) / 1 pc
};

/* ─── Hoodie US (BP 77, provider 99 — Printify Choice) ───────────────────── */
const HOODIE_US: BlueprintConfig = {
  blueprintId: 77,
  printProviderId: 99,
  printPosition: "front",
  variants: {
    // Black
    "Black / S": 32918, "Black / M": 32919, "Black / L": 32920,
    "Black / XL": 32921, "Black / 2XL": 32922, "Black / 3XL": 32923,
    // White
    "White / S": 32910, "White / M": 32911, "White / L": 32912,
    "White / XL": 32913, "White / 2XL": 32914, "White / 3XL": 32915,
    // Navy
    "Navy / S": 32894, "Navy / M": 32895, "Navy / L": 32896,
    "Navy / XL": 32897, "Navy / 2XL": 32898, "Navy / 3XL": 32899,
    // Sport Grey
    "Sport Grey / S": 32902, "Sport Grey / M": 32903, "Sport Grey / L": 32904,
    "Sport Grey / XL": 32905, "Sport Grey / 2XL": 32906, "Sport Grey / 3XL": 32907,
    // Dark Heather
    "Dark Heather / S": 32878, "Dark Heather / M": 32879, "Dark Heather / L": 32880,
    "Dark Heather / XL": 32881, "Dark Heather / 2XL": 32882, "Dark Heather / 3XL": 32883,
    // Maroon
    "Maroon / S": 32886, "Maroon / M": 32887, "Maroon / L": 32888,
    "Maroon / XL": 32889, "Maroon / 2XL": 32890,
    // Light Pink
    "Light Pink / S": 42148, "Light Pink / M": 42149, "Light Pink / L": 42150,
    "Light Pink / XL": 42151,
    // Charcoal
    "Charcoal / S": 42211, "Charcoal / M": 42212, "Charcoal / L": 42213,
    "Charcoal / XL": 42214, "Charcoal / 2XL": 42215,
  },
  fallbackVariantId: 32919, // Black / M
};

/* ─── Hoodie UK (BP 77, provider 6 — T Shirt and Sons) ───────────────────── */
const HOODIE_UK: BlueprintConfig = {
  blueprintId: 77,
  printProviderId: 6,
  printPosition: "front",
  variants: {
    // Black
    "Black / S": 32918, "Black / M": 32919, "Black / L": 32920,
    "Black / XL": 32921, "Black / 2XL": 32922, "Black / 3XL": 32923,
    // White
    "White / S": 32910, "White / M": 32911, "White / L": 32912,
    "White / XL": 32913, "White / 2XL": 32914, "White / 3XL": 32915,
    // Navy
    "Navy / S": 32894, "Navy / M": 32895, "Navy / L": 32896,
    "Navy / XL": 32897, "Navy / 2XL": 32898, "Navy / 3XL": 32899,
    // Sport Grey
    "Sport Grey / S": 32902, "Sport Grey / M": 32903, "Sport Grey / L": 32904,
    "Sport Grey / XL": 32905, "Sport Grey / 2XL": 32906, "Sport Grey / 3XL": 32907,
    // Dark Heather
    "Dark Heather / S": 32878, "Dark Heather / M": 32879, "Dark Heather / L": 32880,
    "Dark Heather / XL": 32881, "Dark Heather / 2XL": 32882,
    // Red
    "Red / S": 33385, "Red / M": 33386, "Red / L": 33387,
    "Red / XL": 33388, "Red / 2XL": 33389, "Red / 3XL": 33390,
    // Light Pink
    "Light Pink / S": 42148, "Light Pink / M": 42149, "Light Pink / L": 42150,
    "Light Pink / XL": 42151, "Light Pink / 2XL": 42152,
    // Orange
    "Orange / S": 42156, "Orange / M": 42157, "Orange / L": 42158,
    "Orange / XL": 42159, "Orange / 2XL": 42160,
    // Light Blue
    "Light Blue / S": 42235, "Light Blue / M": 42236, "Light Blue / L": 42237,
    "Light Blue / XL": 42238, "Light Blue / 2XL": 42239,
  },
  fallbackVariantId: 32919, // Black / M
};

/* ─── T-Shirt US/UK (BP 706, provider 99 — Printify Choice) ──────────────── */
// Comfort Colors — same Printify Choice provider for both regions
const TEE: BlueprintConfig = {
  blueprintId: 706,
  printProviderId: 99,
  printPosition: "front",
  variants: {
    // Black
    "Black / S": 73196, "Black / M": 73200, "Black / L": 73204,
    "Black / XL": 73208, "Black / 2XL": 73212, "Black / 3XL": 79114,
    // Navy
    "Navy / S": 73197, "Navy / M": 73201, "Navy / L": 73205,
    "Navy / XL": 73209, "Navy / 2XL": 73213, "Navy / 3XL": 79152,
    // Red
    "Red / S": 73198, "Red / M": 73202, "Red / L": 73206,
    "Red / XL": 73210, "Red / 2XL": 73214, "Red / 3XL": 79157,
    // White
    "White / S": 73199, "White / M": 73203, "White / L": 73207,
    "White / XL": 73211, "White / 2XL": 73215, "White / 3XL": 79169,
    // Ivory
    "Ivory / S": 78991, "Ivory / M": 78992, "Ivory / L": 78993,
    "Ivory / XL": 78994, "Ivory / 2XL": 78995, "Ivory / 3XL": 79142,
    // Grey
    "Grey / S": 78971, "Grey / M": 78972, "Grey / L": 78973,
    "Grey / XL": 78974, "Grey / 2XL": 78975, "Grey / 3XL": 79137,
    // Sage
    "Sage / S": 79061, "Sage / M": 79062, "Sage / L": 79063,
    "Sage / XL": 79064, "Sage / 2XL": 79065, "Sage / 3XL": 79159,
    // Terracotta
    "Terracotta / S": 79071, "Terracotta / M": 79072, "Terracotta / L": 79073,
    "Terracotta / XL": 79074, "Terracotta / 2XL": 79075, "Terracotta / 3XL": 79162,
    // Blossom (light pink)
    "Blossom / S": 78886, "Blossom / M": 78887, "Blossom / L": 78888,
    "Blossom / XL": 78889, "Blossom / 2XL": 78890, "Blossom / 3XL": 79115,
    // Midnight (dark navy)
    "Midnight / S": 79016, "Midnight / M": 79017, "Midnight / L": 79018,
    "Midnight / XL": 79019, "Midnight / 2XL": 79020, "Midnight / 3XL": 79148,
  },
  fallbackVariantId: 73200, // Black / M
};

/* ─── Canvas (BP 1159, provider 105 — Jondo) ─────────────────────────────── */
// Single global provider; no color variants — key is "WxH" (width × height in inches).
// All sizes have 1.25" depth. Variant IDs fetched via scripts/fetch-canvas-variants.ts.
const CANVAS: BlueprintConfig = {
  blueprintId: 1159,
  printProviderId: 105,
  printPosition: "front",
  variants: {
    // ── Horizontal ────────────────────────────────────────────────────────
    "10x8":  101412,
    "12x9":   91624,
    "14x11":  91625,
    "16x12":  91626,
    "18x12":  91627,
    "20x10":  91628,
    "20x16":  91629,
    "24x16":  91630,
    "24x18":  91631,
    "24x20":  91632,
    "30x15": 112821,
    "30x20":  91633,
    "30x24": 101410,
    "32x24":  91634,
    "36x12":  91636,
    "36x24":  91635,
    "40x20": 112822,
    "40x30":  91637,
    "48x16": 101414,
    "48x24": 112135,
    "48x32":  91638,
    "48x36": 112823,
    "60x20":  91639,
    // ── Vertical ──────────────────────────────────────────────────────────
    "8x10":  101413,
    "9x12":   91640,
    "10x20":  91642,
    "11x14":  91641,
    "12x16":  91643,
    "12x18":  91644,
    "12x36":  91645,
    "15x30": 112824,
    "16x20":  91646,
    "16x24":  91647,
    "16x48": 101415,
    "18x24":  91648,
    "20x24":  91649,
    "20x30":  91650,
    "20x40": 112825,
    "24x30": 101411,
    "24x32":  91652,
    "24x36":  91653,
    "24x48": 112136,
    "30x40":  91654,
    "32x48":  91655,
    "36x48": 112826,
    // ── Square ────────────────────────────────────────────────────────────
    "6x6":   101418,
    "10x10":  91656,
    "12x12":  91657,
    "14x14":  91658,
    "16x16":  91659,
    "20x20":  91660,
    "24x24":  91661,
    "30x30":  91662,
    "32x32":  91663,
    "36x36": 101419,
  },
  fallbackVariantId: 91657, // 12x12 square
};

/* ─── Master product map ─────────────────────────────────────────────────── */

export const PRINTIFY_BLUEPRINTS: Record<ProductRegionKey, BlueprintConfig> = {
  mug_us: MUG_US,
  mug_uk: MUG_UK,
  hoodie_us: HOODIE_US,
  hoodie_uk: HOODIE_UK,
  tee_us: TEE,
  tee_uk: TEE, // same provider serves both regions for Comfort Colors
  postcard: POSTCARD,
  cardpack: CARDPACK,
  uscard: USCARD,
  canvas: CANVAS,
};

/* ─── Lookup helpers ─────────────────────────────────────────────────────── */

/**
 * Convert a Keepsy productId ("card" | "mug" | "tee" | "hoodie") and
 * a region ("US" | "UK") into the ProductRegionKey used in the blueprint map.
 */
export function getProductRegionKey(
  productId: string,
  region: "US" | "UK"
): ProductRegionKey {
  const p = productId.toLowerCase().replace(/\s+/g, "");
  // Postcard aliases — covers catalog id "postcard" and session.metadata fallback "fineartpostcard"
  if (p === "postcard" || p === "fineartpostcard" || p === "fine-art-postcard") return "postcard";
  // Card pack aliases
  if (p === "cardpack" || p === "greetingcards(7pack)" || p === "greetingcardpack") return "cardpack";
  // US greeting cards: uscard_1, uscard_10, uscard_30, uscard_50 → all use uscard blueprint
  if (p.startsWith("uscard")) return "uscard";
  if (p === "mug") return region === "UK" ? "mug_uk" : "mug_us";
  if (p === "hoodie") return region === "UK" ? "hoodie_uk" : "hoodie_us";
  if (p === "tee") return region === "UK" ? "tee_uk" : "tee_us";
  // canvas_small / canvas_medium / canvas_large / canvas_xlarge all map to one provider
  if (p.startsWith("canvas")) return "canvas";
  // fallback
  console.error(`[printify] Unknown productId '${productId}' — falling back to postcard. Add blueprint mapping.`);
  return "postcard";
}

/**
 * Normalise an incoming color string to Printify Title Case.
 * e.g. "dark heather" → "Dark Heather", "BLACK" → "Black"
 */
function normalizeColor(color?: string): string {
  if (!color) return "";
  return color
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Normalise an incoming size string.
 * e.g. "xl" → "XL", "2xl" → "2XL"
 */
function normalizeSize(size?: string): string {
  if (!size) return "";
  return size.trim().toUpperCase();
}

/**
 * Look up the Printify variant ID for a product + region + color + size.
 * Falls back gracefully through: exact → color-only → fallback.
 */
export function getPrintifyVariantId(
  productId: string,
  region: "US" | "UK",
  color?: string,
  size?: string
): { config: BlueprintConfig; variantId: number } {
  const key = getProductRegionKey(productId, region);
  const config = PRINTIFY_BLUEPRINTS[key];

  // US greeting cards: quantity is encoded in the productId suffix (uscard_1, uscard_10, etc.)
  if (key === "uscard") {
    const qty = productId.toLowerCase().replace("uscard_", "");
    const variantId = config.variants[qty] ?? config.fallbackVariantId;
    return { config, variantId };
  }

  const c = normalizeColor(color);
  const s = normalizeSize(size);

  // Exact match "Color / Size"
  if (c && s) {
    const exact = `${c} / ${s}`;
    if (config.variants[exact] !== undefined) {
      return { config, variantId: config.variants[exact] };
    }
  }

  // Color-only (for products with no sizes like mugs/cards)
  if (c && config.variants[c] !== undefined) {
    return { config, variantId: config.variants[c] };
  }

  // Size-only (for products with no colors like canvas)
  if (s && config.variants[s] !== undefined) {
    return { config, variantId: config.variants[s] };
  }

  // Fallback
  return { config, variantId: config.fallbackVariantId };
}
