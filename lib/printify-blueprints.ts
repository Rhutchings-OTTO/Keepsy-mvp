/**
 * Printify blueprint, provider, and variant mapping.
 *
 * Providers:
 *   1   = SPOKE Custom Products      (US — mugs)
 *   6   = T Shirt and Sons           (UK — mugs, hoodies)
 *   66  = Prima Printing             (US+UK — greeting cards)
 *   99  = Printify Choice            (US — hoodies, t-shirts; UK — t-shirts)
 *
 * Blueprints:
 *   68   = Generic Brand 11oz Mug (US)
 *   535  = Orca Coatings 11oz White Mug (UK)
 *   77   = Gildan 18000 Unisex Heavy Blend Hooded Sweatshirt
 *   706  = Comfort Colors Unisex Garment-Dyed T-Shirt
 *   962  = Generic Brand Greeting Cards
 */

export type ProductRegionKey =
  | "mug_us"
  | "mug_uk"
  | "hoodie_us"
  | "hoodie_uk"
  | "tee_us"
  | "tee_uk"
  | "card";

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

/* ─── Greeting Cards (BP 962, provider 66) ───────────────────────────────── */
// Variants: 78429 = Glossy, 78430 = Matte. Default: Glossy.
const CARD: BlueprintConfig = {
  blueprintId: 962,
  printProviderId: 66,
  printPosition: "front",
  variants: {
    Glossy: 78429,
    Matte: 78430,
  },
  fallbackVariantId: 78429,
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

/* ─── Master product map ─────────────────────────────────────────────────── */

export const PRINTIFY_BLUEPRINTS: Record<ProductRegionKey, BlueprintConfig> = {
  mug_us: MUG_US,
  mug_uk: MUG_UK,
  hoodie_us: HOODIE_US,
  hoodie_uk: HOODIE_UK,
  tee_us: TEE,
  tee_uk: TEE, // same provider serves both regions for Comfort Colors
  card: CARD,
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
  const p = productId.toLowerCase();
  if (p === "card") return "card";
  if (p === "mug") return region === "UK" ? "mug_uk" : "mug_us";
  if (p === "hoodie") return region === "UK" ? "hoodie_uk" : "hoodie_us";
  if (p === "tee") return region === "UK" ? "tee_uk" : "tee_us";
  // fallback
  console.error(`[printify] Unknown productId '${productId}' — falling back to card. Add blueprint mapping.`);
  return "card";
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

  // Fallback
  return { config, variantId: config.fallbackVariantId };
}
