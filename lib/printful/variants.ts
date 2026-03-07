/**
 * PRINTFUL INTEGRATION — DISABLED
 *
 * Replaced by lib/printify-blueprints.ts.
 * Kept for rollback safety. Do not import from this file.
 */

/*
type VariantKey = string; // `${productId}:${size ?? ""}:${color ?? ""}`

const VARIANT_MAP: Record<VariantKey, number> = {
  "card::": 10673,
  "mug::": 1320,
  "mug::white": 1320,
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
  "tee::":  4013,
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
  "hoodie::": 9040,
};

export function getPrintfulVariantId(
  productId: string,
  size?: string,
  color?: string
): number {
  const s = (size ?? "").toLowerCase().replace(/\s/g, "");
  const c = (color ?? "").toLowerCase().replace(/\s/g, "");

  const exact = `${productId}:${s}:${c}`;
  if (VARIANT_MAP[exact]) return VARIANT_MAP[exact];

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
*/

export {};
