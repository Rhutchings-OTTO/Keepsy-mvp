/**
 * Maps Keepsy product IDs + size/color to Printful catalog variant IDs.
 *
 * To find the correct variant IDs:
 *   GET https://api.printful.com/products           → list all catalog products
 *   GET https://api.printful.com/products/{id}      → get variants for a product
 *
 * Current mappings use common Printful defaults. Update these to match your
 * Printful store's synced products if you're using sync_variant_id instead.
 */

type VariantKey = string; // `${productId}:${size ?? ""}:${color ?? ""}`

// Printful catalog variant IDs
// See: https://www.printful.com/uk/catalog
const VARIANT_MAP: Record<VariantKey, number> = {
  // ── Greeting Card ──────────────────────────────────────────────
  // Printful product 505 – Greeting Cards (4.25" x 5.5")
  "card::": 10673,

  // ── Mug (11oz White Glossy) ────────────────────────────────────
  // Printful product 19 – Mug (11oz)
  "mug::": 1320,
  "mug::white": 1320,

  // ── Premium Tee (Bella+Canvas 3001) ───────────────────────────
  // Printful product 145 – Unisex Staple T-Shirt | Bella + Canvas 3001
  "tee:XS:white": 4012,
  "tee:S:white":  4013,
  "tee:M:white":  4014,
  "tee:L:white":  4015,
  "tee:XL:white": 4016,
  "tee:2XL:white": 4017,
  "tee:XS:black": 4018,
  "tee:S:black":  4019,
  "tee:M:black":  4020,
  "tee:L:black":  4021,
  "tee:XL:black": 4022,
  "tee:2XL:black": 4023,
  // fallback – S white
  "tee::":  4013,

  // ── Hoodie (Gildan 18500) ──────────────────────────────────────
  // Printful product 380 – Unisex Heavy Blend Hooded Sweatshirt
  "hoodie:XS:white": 9026,
  "hoodie:S:white":  9027,
  "hoodie:M:white":  9028,
  "hoodie:L:white":  9029,
  "hoodie:XL:white": 9030,
  "hoodie:2XL:white": 9031,
  "hoodie:XS:black": 9038,
  "hoodie:S:black":  9039,
  "hoodie:M:black":  9040,
  "hoodie:L:black":  9041,
  "hoodie:XL:black": 9042,
  "hoodie:2XL:black": 9043,
  // fallback – M black
  "hoodie::": 9040,
};

/**
 * Returns the Printful variant ID for a given Keepsy product + options.
 * Falls back to the no-option key if the exact variant isn't mapped.
 */
export function getPrintfulVariantId(
  productId: string,
  size?: string,
  color?: string
): number {
  const s = (size ?? "").toLowerCase().replace(/\s/g, "");
  const c = (color ?? "").toLowerCase().replace(/\s/g, "");

  const exact = `${productId}:${s}:${c}`;
  if (VARIANT_MAP[exact]) return VARIANT_MAP[exact];

  // try size only, then color only, then fallback
  const bySize = `${productId}:${s}:`;
  if (VARIANT_MAP[bySize]) return VARIANT_MAP[bySize];

  const byColor = `${productId}::${c}`;
  if (VARIANT_MAP[byColor]) return VARIANT_MAP[byColor];

  const fallback = `${productId}::`;
  if (VARIANT_MAP[fallback]) return VARIANT_MAP[fallback];

  throw new Error(
    `No Printful variant mapped for product="${productId}" size="${size}" color="${color}". ` +
    `Add an entry to lib/printful/variants.ts.`
  );
}
