import { describe, it, expect } from "vitest";
import {
  computeMargin,
  minimumPriceForFloor,
  type MarginInput,
} from "./margin";
import { routeReady, type RouteEvidence } from "./data/candidates";
const base: MarginInput = {
  currency: "gbp",
  priceMinor: 4000,
  discountPct: 0.1,
  productionUsdCents: 1200,
  providerShippingUsdCents: 600,
  shippingRecoveredMinor: 400,
  usdPerUnit: 1.2,
  inclusiveTaxPct: 0.2,
  otherLandedCostsMinor: 100,
  processingPct: 0.03,
  processingFixedMinor: 30,
  fxAllowancePct: 0.03,
  contingencyPct: 0.04,
};
describe("landed economics", () => {
  it("subtracts tax and charges fees on the full collected amount", () => {
    const m = computeMargin(base);
    expect(m.grossCollectedMinor).toBe(4000);
    expect(m.taxMinor).toBe(667);
    expect(m.netRevenueMinor).toBe(3333);
    expect(m.costsMinor.production).toBe(1000);
    expect(m.costsMinor.providerShipping).toBe(500);
    expect(m.costsMinor.processing).toBe(150);
    expect(m.costsMinor.total).toBe(1929);
    expect(m.contributionMinor).toBe(1404);
  });
  it("rejects missing/invalid exchange rates and impossible discounts", () => {
    expect(() => computeMargin({ ...base, usdPerUnit: 0 })).toThrow();
    expect(() => computeMargin({ ...base, discountPct: 1 })).toThrow();
  });
  it("finds a floor after discounts and landed costs", () => {
    const price = minimumPriceForFloor(base);
    expect(computeMargin({ ...base, priceMinor: price }).meetsFloor).toBe(true);
    expect(computeMargin({ ...base, priceMinor: price - 1 }).meetsFloor).toBe(
      false,
    );
  });
  it("refuses an unaffordable international shipping route", () => {
    expect(
      computeMargin({ ...base, providerShippingUsdCents: 4500 }).meetsFloor,
    ).toBe(false);
  });
});
describe("route evidence", () => {
  const now = new Date("2026-10-04T12:00:00Z");
  const e: RouteEvidence = {
    country: "AU",
    blueprintId: 269,
    providerId: 1,
    variantIds: [1],
    capturedAt: now.toISOString(),
    productionCostVerified: true,
    shippingCostVerified: true,
    taxTreatmentVerified: true,
    fxVerified: true,
    artworkProofApproved: true,
    testOrderVerified: true,
    worstCaseContributionMargin: 0.3,
  };
  it("requires provider proofs, tax and worst-case economics", () => {
    expect(routeReady(e, now)).toBe(true);
    expect(routeReady({ ...e, taxTreatmentVerified: false }, now)).toBe(false);
    expect(routeReady({ ...e, artworkProofApproved: false }, now)).toBe(false);
    expect(routeReady({ ...e, worstCaseContributionMargin: 0.249 }, now)).toBe(
      false,
    );
    expect(routeReady({ ...e, capturedAt: "2026-08-01" }, now)).toBe(false);
  });
});
