import placementData from "./placements.json";

export type MockupProductType = "tshirt" | "hoodie" | "mug" | "card";
export type MockupColor = "white" | "blue" | "black";

export type PlacementRect = {
  xPct: number;
  yPct: number;
  wPct: number;
  hPct: number;
  rotateDeg: number;
  borderRadiusPct?: number;
};

export type PlacementQuadPoint = {
  xPct: number;
  yPct: number;
};

export type PlacementQuad = {
  tl: PlacementQuadPoint;
  tr: PlacementQuadPoint;
  br: PlacementQuadPoint;
  bl: PlacementQuadPoint;
};

export type Placement =
  | { kind: "rect"; rect: PlacementRect }
  | { kind: "quad"; quad: PlacementQuad };

export type PlacementEntry = {
  baseMockupSrc: string;
  aspectRatio: number;
  placement: Placement;
  opacity?: number;
  dropShadow?: string;
};

export type PlacementMap = Record<
  MockupProductType,
  Partial<Record<MockupColor, PlacementEntry>>
>;

export const placements: PlacementMap = placementData as PlacementMap;

export function getPlacement(productType: MockupProductType, color: MockupColor = "white"): PlacementEntry {
  const byProduct = placements[productType];
  if (!byProduct) {
    throw new Error(`Unknown product type: ${productType}`);
  }
  const colorEntry = byProduct[color] || byProduct.white;
  if (!colorEntry) {
    throw new Error(`Missing placement for ${productType}/${color}`);
  }

  // Keep apparel print placement uniform across all colors.
  // We still use each color's own base mockup image.
  if (productType === "tshirt" || productType === "hoodie") {
    const uniformEntry = byProduct.white || colorEntry;
    return {
      ...colorEntry,
      placement: uniformEntry.placement,
      opacity: uniformEntry.opacity,
      dropShadow: uniformEntry.dropShadow,
    };
  }

  return colorEntry;
}

export function getPlacementPath() {
  return "lib/mockups/placements.json";
}
