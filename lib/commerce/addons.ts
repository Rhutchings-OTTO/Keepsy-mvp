/**
 * Optional extras offered at checkout. Every add-on maps to a real catalogue
 * SKU with a server-authoritative price and a Printify blueprint, so choosing
 * one adds a genuine, fulfilable line to the basket.
 *
 * Deliberately NOT offered (no fulfilment path exists): "priority print
 * handling", gift wrap, percentage bundles.
 */
import { getUnitPrice, type Currency } from "@/lib/commerce/pricing";
import { getSupportedSizes, isApparel } from "@/lib/commerce/variants";
import { PRODUCT_CATALOG } from "@/lib/commerce/catalog";
import type { CartLine } from "@/lib/cart/store";
import type { Region } from "@/lib/region";

export type AddonId = "matching-card" | "second-print";

export type AddonOffer = {
  id: AddonId;
  label: string;
  description: string;
  productId: string;
  unitPrice: number;
  currency: Currency;
  /** Apparel duplicates need a size; other products do not. */
  needsSize: boolean;
  sizeOptions: string[];
  defaultSize?: string;
};

function primaryDesignLine(lines: CartLine[]): CartLine | null {
  // The first non add-on line is "the design" the extras relate to.
  return lines.find((l) => !l.addonId) ?? lines[0] ?? null;
}

/** Build the add-on offers for the current basket. Empty when the basket has no design. */
export function getAddonOffers(lines: CartLine[], region: Region): AddonOffer[] {
  const primary = primaryDesignLine(lines);
  if (!primary) return [];
  const currency: Currency = region === "US" ? "usd" : "gbp";
  const offers: AddonOffer[] = [];

  // 1. Matching card — postcard in the UK (Prodigi), single greeting card in the US (Taylor).
  const cardProductId = region === "US" ? "uscard_1" : "postcard";
  const cardPrice = getUnitPrice(cardProductId, currency);
  const primaryIsThatCard = primary.productId === cardProductId;
  if (cardPrice != null && !primaryIsThatCard) {
    offers.push({
      id: "matching-card",
      label: region === "US" ? "Add a matching greeting card" : "Add a matching postcard",
      description: `Your design printed on a ${region === "US" ? "5×7 in greeting card" : "fine art postcard"} — ideal to send with the gift.`,
      productId: cardProductId,
      unitPrice: cardPrice,
      currency,
      needsSize: false,
      sizeOptions: [],
    });
  }

  // 2. Second print of the same design on the same product (own size for apparel).
  const secondPrice = getUnitPrice(primary.productId, currency);
  if (secondPrice != null) {
    const needsSize = isApparel(primary.productId);
    const sizeOptions = needsSize ? getSupportedSizes(primary.productId, primary.color ?? "") : [];
    offers.push({
      id: "second-print",
      label: `Add a second ${PRODUCT_CATALOG[primary.productId]?.name.toLowerCase() ?? "print"}`,
      description: needsSize
        ? "Same design, same colour — pick a size for the second one."
        : "Same design again — perfect as a spare or for someone else.",
      productId: primary.productId,
      unitPrice: secondPrice,
      currency,
      needsSize,
      sizeOptions,
      defaultSize: needsSize ? primary.size : undefined,
    });
  }

  return offers;
}

/** The cart line an add-on would create (or has created). */
export function buildAddonLine(offer: AddonOffer, lines: CartLine[], size?: string): Omit<CartLine, "id"> | null {
  const primary = primaryDesignLine(lines);
  if (!primary) return null;
  const chosenSize = offer.needsSize ? (size ?? offer.defaultSize) : undefined;
  if (offer.needsSize && !chosenSize) return null;
  const name =
    offer.id === "matching-card"
      ? PRODUCT_CATALOG[offer.productId].name
      : primary.name;
  return {
    productId: offer.productId,
    name,
    color: offer.id === "second-print" ? primary.color : undefined,
    size: chosenSize,
    imageUrl: primary.imageUrl,
    designUrl: primary.designUrl,
    // Cards/second prints of a canvas reuse the crop only when the product is the same canvas size.
    croppedImageUrl: offer.id === "second-print" ? primary.croppedImageUrl : undefined,
    sourceKind: primary.sourceKind,
    sourceWidth: primary.sourceWidth,
    sourceHeight: primary.sourceHeight,
    designId: primary.designId,
    addonId: offer.id,
    unitPrice: offer.unitPrice,
    currency: offer.currency,
    quantity: 1,
  };
}

/** Lines currently in the basket that came from an add-on offer. */
export function findAddonLines(lines: CartLine[], addonId: AddonId): CartLine[] {
  return lines.filter((l) => l.addonId === addonId);
}
