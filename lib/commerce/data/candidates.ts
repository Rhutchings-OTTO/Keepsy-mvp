/**
 * Research candidates, NOT sellable catalogue entries.
 * Primary source pages checked 2026-10-04. Public "from" prices are deliberately
 * omitted: they do not establish account-level, destination-specific landed cost.
 */
export const PREMIUM_CANDIDATES = [
  {
    family: "tough_phone_case",
    blueprintId: 269,
    source:
      "https://printify.com/app/products/269/generic-brand/tough-phone-cases",
    placementChecks: [
      "Each phone model's camera cutout",
      "Safe area and bleed",
      "One provider-generated proof per device variant",
    ],
  },
  {
    family: "impact_resistant_case",
    blueprintId: 841,
    source:
      "https://printify.com/app/products/841/generic-brand/impact-resistant-cases",
    placementChecks: [
      "Each phone model's template",
      "Camera protection and safe area",
      "No artwork across lens openings",
    ],
  },
  {
    family: "cotton_tote",
    blueprintId: 553,
    source: "https://printify.com/app/products/553/as-colour/cotton-tote-bag/",
    placementChecks: [
      "AS Colour 1001 front print area",
      "Handle/seam clearance",
      "Actual provider mockup proof",
    ],
  },
] as const;
export type RouteEvidence = {
  country: string;
  blueprintId: number;
  providerId: number;
  variantIds: number[];
  capturedAt: string;
  productionCostVerified: boolean;
  shippingCostVerified: boolean;
  taxTreatmentVerified: boolean;
  fxVerified: boolean;
  artworkProofApproved: boolean;
  testOrderVerified: boolean;
  worstCaseContributionMargin: number;
};
export function routeReady(e: RouteEvidence, now = new Date()) {
  const age = now.getTime() - new Date(e.capturedAt).getTime();
  return (
    /^[A-Z]{2}$/.test(e.country) &&
    e.blueprintId > 0 &&
    e.providerId > 0 &&
    e.variantIds.length > 0 &&
    e.variantIds.every((v) => v > 0) &&
    Number.isFinite(age) &&
    age >= 0 &&
    age <= 30 * 86400000 &&
    e.productionCostVerified &&
    e.shippingCostVerified &&
    e.taxTreatmentVerified &&
    e.fxVerified &&
    e.artworkProofApproved &&
    e.testOrderVerified &&
    Number.isFinite(e.worstCaseContributionMargin) &&
    e.worstCaseContributionMargin >= 0.25
  );
}
