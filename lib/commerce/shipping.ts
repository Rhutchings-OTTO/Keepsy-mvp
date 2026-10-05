/**
 * Server-authoritative shipping quotes by destination country.
 *
 * Pure and client-safe: the cart shows the same number the checkout charges.
 * A quote is only produced when the destination is enabled AND every line has
 * a route for that market. Otherwise it FAILS CLOSED (no quote → no checkout).
 *
 * Rates: `SHIPPING_TABLE` below is the CUSTOMER-facing charge per market. The
 * provider costs that justify these numbers live in lib/commerce/data/* and
 * ../phase2/catalog-research.md. GB/US keep the pre-existing policy (flat fee,
 * free over the threshold) until the research recommends otherwise.
 */
import type { Currency } from "@/lib/commerce/pricing";
import {
  FREE_SHIPPING_THRESHOLD,
  SHIPPING_FEE,
  roundMoney,
} from "@/lib/commerce/pricing";
import {
  getCountry,
  type CountryCode,
  type MarketCode,
} from "@/lib/commerce/markets";
import { getCatalogProduct } from "@/lib/commerce/pricing";

export type ShippingQuoteLine = {
  productId: string;
  quantity: number;
  unitPrice: number;
};

export type ShippingQuote =
  | {
      ok: true;
      destinationCountry: CountryCode;
      market: MarketCode;
      currency: Currency;
      amount: number;
      label: string;
      etaBusinessDays: { min: number; max: number };
      freeShippingApplied: boolean;
      amountToFreeShipping: number;
    }
  | {
      ok: false;
      reason: "destination_unavailable" | "product_unavailable" | "empty";
      message: string;
      /** Product ids that cannot ship to the destination (when reason = product_unavailable). */
      unavailableProductIds?: string[];
    };

type MarketRate = {
  /** Flat fee per order in the market currency. */
  fee: number;
  /** Subtotal at/above which shipping is free; null = never free. */
  freeThreshold: number | null;
  label: string;
  eta: { min: number; max: number };
};

/**
 * Customer shipping policy per market. Only markets with a row here can be
 * quoted. (EU/CA/AU/NZ intentionally absent until routes are evidenced.)
 */
export const SHIPPING_TABLE: Partial<Record<MarketCode, MarketRate>> = {
  GB: {
    fee: SHIPPING_FEE.gbp,
    freeThreshold: FREE_SHIPPING_THRESHOLD,
    label: "Standard delivery",
    eta: { min: 3, max: 7 },
  },
  US: {
    fee: SHIPPING_FEE.usd,
    freeThreshold: FREE_SHIPPING_THRESHOLD,
    label: "Standard shipping",
    eta: { min: 5, max: 10 },
  },
};

/**
 * Product availability per market. Today every catalogue product routes to
 * GB and US providers (see lib/printify-blueprints.ts). New families must be
 * added here explicitly when their routes are enabled.
 */
export function isProductAvailableInMarket(
  productId: string,
  market: MarketCode,
): boolean {
  if (!getCatalogProduct(productId)) return false;
  if (productId.startsWith("uscard_")) return market === "US";
  if (productId === "cardpack") return market === "GB";
  if (market === "GB" || market === "US") return true;
  return false;
}

export function quoteShipping(args: {
  lines: ShippingQuoteLine[];
  destinationCountry: unknown;
}): ShippingQuote {
  const country = getCountry(args.destinationCountry);
  if (!country || !country.enabled) {
    return {
      ok: false,
      reason: "destination_unavailable",
      message: "We don't deliver to that country yet.",
    };
  }
  const rate = SHIPPING_TABLE[country.market];
  if (!rate) {
    return {
      ok: false,
      reason: "destination_unavailable",
      message: `Shipping to ${country.name} isn't available yet.`,
    };
  }
  if (args.lines.length === 0)
    return { ok: false, reason: "empty", message: "Your basket is empty." };
  const unavailable = args.lines
    .filter((l) => !isProductAvailableInMarket(l.productId, country.market))
    .map((l) => l.productId);
  if (unavailable.length > 0) {
    return {
      ok: false,
      reason: "product_unavailable",
      message: `Some items can't be delivered to ${country.name} yet.`,
      unavailableProductIds: [...new Set(unavailable)],
    };
  }
  const subtotal = roundMoney(
    args.lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0),
  );
  const free = rate.freeThreshold != null && subtotal >= rate.freeThreshold;
  return {
    ok: true,
    destinationCountry: country.code,
    market: country.market,
    currency: country.currency,
    amount: free ? 0 : rate.fee,
    label: rate.label,
    etaBusinessDays: rate.eta,
    freeShippingApplied: free,
    amountToFreeShipping:
      rate.freeThreshold == null
        ? 0
        : Math.max(0, roundMoney(rate.freeThreshold - subtotal)),
  };
}
