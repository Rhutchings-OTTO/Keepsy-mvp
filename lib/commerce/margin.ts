/**
 * Planning arithmetic only. Never enables a destination or changes retail
 * prices: a provider quote, tax treatment and verified artwork are also required.
 * All values must be in the sale currency except the explicit USD provider costs.
 */
import type { Currency } from "@/lib/commerce/pricing";
export const MIN_CONTRIBUTION_MARGIN = 0.25;
export type MarginInput = {
  currency: Currency;
  priceMinor: number;
  discountPct: number;
  productionUsdCents: number;
  providerShippingUsdCents: number;
  shippingRecoveredMinor: number;
  /** Verified rate: USD bought by one sale-currency unit. */
  usdPerUnit: number;
  /** VAT/sales tax included in customer-facing price; 0 only when evidenced. */
  inclusiveTaxPct: number;
  /** Unrecoverable supplier tax, duties and per-order charges in sale currency. */
  otherLandedCostsMinor: number;
  processingPct: number;
  processingFixedMinor: number;
  fxAllowancePct: number;
  contingencyPct: number;
};
export function computeMargin(input: MarginInput) {
  for (const [key, value] of Object.entries(input)) {
    if (key !== "currency" && (!Number.isFinite(value) || Number(value) < 0))
      throw new Error("Invalid margin input: " + key);
  }
  if (
    input.usdPerUnit <= 0 ||
    input.discountPct >= 1 ||
    [input.processingPct, input.fxAllowancePct, input.contingencyPct].some(
      (v) => v >= 1,
    )
  )
    throw new Error("Invalid margin assumptions");
  const grossCollectedMinor =
    Math.round(input.priceMinor * (1 - input.discountPct)) +
    input.shippingRecoveredMinor;
  const taxMinor = Math.round(
    grossCollectedMinor - grossCollectedMinor / (1 + input.inclusiveTaxPct),
  );
  const netRevenueMinor = grossCollectedMinor - taxMinor;
  const production = Math.ceil(input.productionUsdCents / input.usdPerUnit);
  const providerShipping = Math.ceil(
    input.providerShippingUsdCents / input.usdPerUnit,
  );
  // Processor fees apply to the whole amount collected, including tax/shipping.
  const processing = Math.ceil(
    grossCollectedMinor * input.processingPct + input.processingFixedMinor,
  );
  const fx = Math.ceil((production + providerShipping) * input.fxAllowancePct);
  const contingency = Math.ceil(netRevenueMinor * input.contingencyPct);
  const total =
    production +
    providerShipping +
    processing +
    fx +
    contingency +
    input.otherLandedCostsMinor;
  const contributionMinor = netRevenueMinor - total;
  const contributionMargin =
    netRevenueMinor > 0 ? contributionMinor / netRevenueMinor : -1;
  return {
    currency: input.currency,
    grossCollectedMinor,
    taxMinor,
    netRevenueMinor,
    costsMinor: {
      production,
      providerShipping,
      processing,
      fx,
      contingency,
      other: input.otherLandedCostsMinor,
      total,
    },
    contributionMinor,
    contributionMargin,
    meetsFloor: contributionMargin >= MIN_CONTRIBUTION_MARGIN,
    inTargetRange: contributionMargin >= 0.25 && contributionMargin <= 0.4,
  };
}
export function minimumPriceForFloor(
  input: Omit<MarginInput, "priceMinor">,
  floor = MIN_CONTRIBUTION_MARGIN,
) {
  if (floor < 0 || floor >= 1) throw new Error("Invalid margin floor");
  let lo = 1,
    hi = 10000000;
  if (computeMargin({ ...input, priceMinor: hi }).contributionMargin < floor)
    throw new Error("No price meets this floor under these assumptions");
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (
      computeMargin({ ...input, priceMinor: mid }).contributionMargin >= floor
    )
      hi = mid;
    else lo = mid + 1;
  }
  return hi;
}
