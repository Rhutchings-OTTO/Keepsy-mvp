/**
 * Server-authoritative cart pricing + variant validation used by
 * /api/create-checkout-session. Pure and unit-testable.
 */
import { PRODUCT_CATALOG } from "@/lib/commerce/catalog";
import { checkVariant, isApparel } from "@/lib/commerce/variants";
import { isAllowedImageSourceUrl } from "@/lib/storage/allowedImageHosts";
import type { Currency } from "@/lib/commerce/pricing";

export type CheckoutCartLine = {
  productId: string;
  name: string;
  color?: string;
  size?: string;
  imageUrl?: string;
  designUrl?: string;
  croppedImageUrl?: string;
  sourceKind?: "ai" | "original";
  addonId?: string;
  unitPrice: number;
  quantity: number;
};

export type PricedLine = {
  id: string;
  name: string;
  priceGBP: number;
  priceUSD?: number;
  unitPrice: number;
  quantity: number;
  color?: string;
  size?: string;
  designUrl?: string;
  croppedImageUrl?: string;
  sourceKind?: "ai" | "original";
  addonId?: string;
};

export type PriceCartResult =
  | { ok: true; lines: PricedLine[] }
  | { ok: false; status: number; error: string; message: string };

/**
 * Price and validate the cart. Client prices are only accepted when they
 * match the catalogue for the currency; sizes/colours must map to a real
 * Printify variant in every region.
 */
export function priceCart(
  cart: CheckoutCartLine[],
  currency: Currency,
  sessionFallback: { designUrl?: string; croppedImageUrl?: string }
): PriceCartResult {
  const lines: PricedLine[] = [];
  // Print sources must be images WE host (closes the SSRF surface in the webhook fetch).
  for (const url of [sessionFallback.designUrl, sessionFallback.croppedImageUrl]) {
    if (url && !isAllowedImageSourceUrl(url)) {
      return { ok: false, status: 400, error: "INVALID_IMAGE_SOURCE", message: "Design images must be hosted by Keepsy. Please re-create the design." };
    }
  }
  let canvasIndex = 0;
  for (const item of cart) {
    for (const url of [item.designUrl, item.croppedImageUrl]) {
      if (url && !isAllowedImageSourceUrl(url)) {
        return { ok: false, status: 400, error: "INVALID_IMAGE_SOURCE", message: `The image for ${item.name} isn't hosted by Keepsy. Please add it to your basket again.` };
      }
    }
    const catalogItem = PRODUCT_CATALOG[item.productId];
    if (!catalogItem) {
      return { ok: false, status: 400, error: "UNKNOWN_PRODUCT", message: `Checkout includes an unknown product (${item.productId}).` };
    }
    const expectedPrice = currency === "usd" ? (catalogItem.priceUSD ?? catalogItem.priceGBP) : catalogItem.priceGBP;
    if (Math.abs(expectedPrice - item.unitPrice) > 0.01) {
      return { ok: false, status: 400, error: "PRICE_MISMATCH", message: `The price of ${catalogItem.name} has changed. Please refresh your basket.` };
    }
    const variant = checkVariant({ productId: item.productId, color: item.color, size: item.size });
    if (!variant.ok) {
      return { ok: false, status: 400, error: "UNSUPPORTED_VARIANT", message: variant.reason };
    }
    const designUrl = item.designUrl ?? sessionFallback.designUrl;
    const isCanvas = item.productId.startsWith("canvas");
    if (isCanvas && !item.size?.trim()) {
      return { ok: false, status: 400, error: "MISSING_CANVAS_SIZE", message: `Please choose a size for ${catalogItem.name}.` };
    }
    // Only the FIRST canvas line may inherit the session-level crop (legacy single-item clients);
    // every other canvas line must carry its own crop or it would print another design's crop.
    const croppedImageUrl = item.croppedImageUrl ?? (isCanvas && canvasIndex === 0 ? sessionFallback.croppedImageUrl : undefined);
    if (isCanvas) {
      canvasIndex += 1;
      if (!croppedImageUrl) {
        return { ok: false, status: 400, error: "MISSING_CANVAS_CROP", message: `Please position (crop) your image for ${catalogItem.name} before checking out.` };
      }
    }
    lines.push({
      id: catalogItem.id,
      name: catalogItem.name,
      priceGBP: catalogItem.priceGBP,
      priceUSD: catalogItem.priceUSD,
      unitPrice: expectedPrice,
      quantity: item.quantity,
      color: isApparel(item.productId) ? item.color : undefined,
      size: item.size,
      designUrl,
      croppedImageUrl,
      sourceKind: item.sourceKind,
      addonId: item.addonId,
    });
  }
  return { ok: true, lines };
}
