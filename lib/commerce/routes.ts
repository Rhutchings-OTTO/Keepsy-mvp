/**
 * Provider routing: which fulfilment region (blueprint/provider map) serves a
 * product for a given market. The blueprint maps in lib/printify-blueprints.ts
 * are keyed by the legacy Region ("UK" | "US"); this module is the single
 * place that turns a destination market into that key — or refuses.
 *
 * Only evidenced routes return a region. Anything else returns null and the
 * caller must fail closed (no quote, no checkout, no fulfilment).
 */
import { isProductAvailableInMarket } from "./shipping";
import type { Region } from "@/lib/region";
import { getCountry, type MarketCode } from "@/lib/commerce/markets";
import { getCatalogProduct } from "@/lib/commerce/pricing";

/**
 * Market → fulfilment region for every existing catalogue family.
 * GB and US are the live routes (see lib/printify-blueprints.ts header).
 * EU/CA/AU/NZ are deliberately absent until a reviewed route evidence record
 * carries enabled routes with cost evidence.
 */
const MARKET_TO_REGION: Partial<Record<MarketCode, Region>> = {
  GB: "UK",
  US: "US",
};

export function fulfilmentRegionForMarket(
  productId: string,
  market: MarketCode,
): Region | null {
  if (
    !getCatalogProduct(productId) ||
    !isProductAvailableInMarket(productId, market)
  )
    return null;
  return MARKET_TO_REGION[market] ?? null;
}

export function fulfilmentRegionForCountry(
  productId: string,
  country: unknown,
): Region | null {
  const c = getCountry(country);
  if (!c || !c.enabled) return null;
  return fulfilmentRegionForMarket(productId, c.market);
}

/** All lines must resolve to the SAME region (one Printify order per region is not supported yet). */
export function fulfilmentRegionForOrder(
  productIds: string[],
  country: unknown,
): Region | null {
  const regions = new Set<Region | null>(
    productIds.map((id) => fulfilmentRegionForCountry(id, country)),
  );
  if (regions.size !== 1) return null;
  const [only] = [...regions];
  return only;
}
