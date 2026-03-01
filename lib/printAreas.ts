import { getPlacement } from "@/lib/mockups/placements";

export type ProductType = "card" | "hoodie" | "tshirt" | "mug";

export type PrintArea = {
  x: number;
  y: number;
  w: number;
  h: number;
  r?: number;
};

function getRectArea(productType: ProductType): PrintArea {
  const entry = getPlacement(productType, "white");
  if (entry.placement.kind !== "rect") {
    throw new Error(`Print area overlay expects rect placement for ${productType}`);
  }

  const rect = entry.placement.rect;
  return {
    x: rect.xPct,
    y: rect.yPct,
    w: rect.wPct,
    h: rect.hPct,
    r: rect.rotateDeg,
  };
}

export const PRINT_AREAS: Record<ProductType, PrintArea> = {
  card: getRectArea("card"),
  hoodie: getRectArea("hoodie"),
  tshirt: getRectArea("tshirt"),
  mug: getRectArea("mug"),
};

