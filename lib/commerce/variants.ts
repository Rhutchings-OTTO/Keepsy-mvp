/**
 * Variant support derived from the Printify blueprint maps.
 *
 * Single source of truth for "can we genuinely fulfil this size/colour?".
 * The UI, the checkout validator and the webhook all use these helpers so the
 * catalogue can never offer a variant that would silently fall back to the
 * default Printify variant (historically Black / M).
 */
import { PRINTIFY_BLUEPRINTS, normalizeSize, type ProductRegionKey } from "@/lib/printify-blueprints";
import type { Region } from "@/lib/region";

const APPAREL_SIZE_ORDER = ["XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL", "5XL"] as const;

function regionKeysFor(productId: string): ProductRegionKey[] {
  const p = productId.toLowerCase();
  if (p === "tee") return ["tee_uk", "tee_us"];
  if (p === "hoodie") return ["hoodie_uk", "hoodie_us"];
  if (p === "mug") return ["mug_uk", "mug_us"];
  if (p === "postcard") return ["postcard"];
  if (p === "cardpack") return ["cardpack"];
  if (p.startsWith("uscard")) return ["uscard"];
  if (p.startsWith("canvas")) return ["canvas"];
  return [];
}

function titleCase(color: string): string {
  return color
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

/** True when the product has colour × size variants (tee, hoodie). */
export function isApparel(productId: string): boolean {
  const p = productId.toLowerCase();
  return p === "tee" || p === "hoodie";
}

/** True when the product needs a size (apparel or canvas). */
export function requiresSize(productId: string): boolean {
  return isApparel(productId) || productId.toLowerCase().startsWith("canvas");
}

/**
 * Sizes that resolve to a real Printify variant for the colour in EVERY region
 * (region is only known at checkout from the shipping address, so the UI must
 * only offer the intersection).
 */
export function getSupportedSizes(productId: string, color: string): string[] {
  if (!isApparel(productId)) return [];
  const keys = regionKeysFor(productId);
  const c = titleCase(color);
  const perRegion = keys.map((key) => {
    const variants = PRINTIFY_BLUEPRINTS[key].variants;
    return new Set(
      Object.keys(variants)
        .filter((k) => k.startsWith(`${c} / `))
        .map((k) => k.split(" / ")[1])
    );
  });
  if (perRegion.length === 0) return [];
  const intersection = [...perRegion[0]].filter((s) => perRegion.every((set) => set.has(s)));
  return APPAREL_SIZE_ORDER.filter((s) => intersection.includes(s));
}

/** Colours (Printify names) supported in every region for an apparel product. */
export function getSupportedColors(productId: string): string[] {
  if (!isApparel(productId)) return [];
  const keys = regionKeysFor(productId);
  const perRegion = keys.map(
    (key) => new Set(Object.keys(PRINTIFY_BLUEPRINTS[key].variants).map((k) => k.split(" / ")[0]))
  );
  if (perRegion.length === 0) return [];
  return [...perRegion[0]].filter((c) => perRegion.every((set) => set.has(c))).sort();
}

export type VariantCheck = { ok: true } | { ok: false; reason: string };

/**
 * Validate a cart line against what fulfilment can actually produce.
 * `region` may be omitted (pre-checkout) in which case every region must support it.
 */
export function checkVariant(args: {
  productId: string;
  color?: string | null;
  size?: string | null;
  region?: Region | null;
}): VariantCheck {
  const productId = args.productId.toLowerCase();
  const keys = regionKeysFor(productId);
  if (keys.length === 0) return { ok: false, reason: `Unknown product "${args.productId}".` };

  if (isApparel(productId)) {
    const color = args.color ? titleCase(args.color) : "";
    const size = normalizeSize(args.size ?? undefined);
    if (!color) return { ok: false, reason: `${args.productId} needs a colour.` };
    if (!size) return { ok: false, reason: `${args.productId} needs a size.` };
    const regionsToCheck = args.region
      ? keys.filter((k) => k.endsWith(args.region === "UK" ? "_uk" : "_us"))
      : keys;
    for (const key of regionsToCheck) {
      if (PRINTIFY_BLUEPRINTS[key].variants[`${color} / ${size}`] === undefined) {
        return {
          ok: false,
          reason: `${color} / ${size} is not available for the ${args.productId}. Sizes we can print: ${getSupportedSizes(productId, color).join(", ") || "none"}.`,
        };
      }
    }
    return { ok: true };
  }

  if (productId.startsWith("canvas")) {
    const size = normalizeSize(args.size ?? undefined) || productId.replace(/^canvas_/, "");
    if (!size || PRINTIFY_BLUEPRINTS.canvas.variants[size] === undefined) {
      return { ok: false, reason: `Canvas size "${args.size ?? ""}" cannot be printed.` };
    }
    return { ok: true };
  }

  // Mug, postcard, cardpack, uscard_* — single variant products.
  return { ok: true };
}
