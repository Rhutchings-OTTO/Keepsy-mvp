/**
 * Canvas size catalogue — all sizes available from Printify blueprint 1159 (Jondo provider 105).
 * Sizes are width × height in inches. Depth is always 1.25".
 */

export type CanvasOrientation = "Horizontal" | "Vertical" | "Square";
export type CanvasTier = "small" | "medium" | "large" | "xlarge";

export type CanvasSize = {
  /** "WxH" e.g. "20x16" */
  code: string;
  width: number;
  height: number;
  orientation: CanvasOrientation;
  tier: CanvasTier;
  priceGBP: number;
  /** Key into PRODUCT_CATALOG, e.g. "canvas_medium" */
  catalogId: string;
};

const TIER_PRICES: Record<CanvasTier, { priceGBP: number; catalogId: string }> = {
  small:  { priceGBP: 29.99,  catalogId: "canvas_small" },
  medium: { priceGBP: 49.99,  catalogId: "canvas_medium" },
  large:  { priceGBP: 79.99,  catalogId: "canvas_large" },
  xlarge: { priceGBP: 109.99, catalogId: "canvas_xlarge" },
};

function getTier(w: number, h: number): CanvasTier {
  const max = Math.max(w, h);
  if (max <= 12) return "small";
  if (max <= 24) return "medium";
  if (max <= 36) return "large";
  return "xlarge";
}

function getOrientation(w: number, h: number): CanvasOrientation {
  if (w > h) return "Horizontal";
  if (h > w) return "Vertical";
  return "Square";
}

function makeSize(w: number, h: number): CanvasSize {
  const tier = getTier(w, h);
  const { priceGBP, catalogId } = TIER_PRICES[tier];
  return {
    code: `${w}x${h}`,
    width: w,
    height: h,
    orientation: getOrientation(w, h),
    tier,
    priceGBP,
    catalogId,
  };
}

export const CANVAS_SIZES: CanvasSize[] = [
  // ── Horizontal ──────────────────────────────────────────────────────────
  makeSize(10, 8),  makeSize(12, 9),  makeSize(14, 11), makeSize(16, 12),
  makeSize(18, 12), makeSize(20, 10), makeSize(20, 16), makeSize(24, 16),
  makeSize(24, 18), makeSize(24, 20), makeSize(30, 15), makeSize(30, 20),
  makeSize(30, 24), makeSize(32, 24), makeSize(36, 12), makeSize(36, 24),
  makeSize(40, 20), makeSize(40, 30), makeSize(48, 16), makeSize(48, 24),
  makeSize(48, 32), makeSize(48, 36), makeSize(60, 20), makeSize(60, 30),
  makeSize(60, 40),
  // ── Vertical ────────────────────────────────────────────────────────────
  makeSize(8, 10),  makeSize(9, 12),  makeSize(10, 20), makeSize(11, 14),
  makeSize(12, 16), makeSize(12, 18), makeSize(12, 36), makeSize(15, 30),
  makeSize(16, 20), makeSize(16, 24), makeSize(16, 48), makeSize(18, 24),
  makeSize(20, 24), makeSize(20, 30), makeSize(20, 40), makeSize(20, 60),
  makeSize(24, 30), makeSize(24, 32), makeSize(24, 36), makeSize(24, 48),
  makeSize(30, 40), makeSize(30, 60), makeSize(32, 48), makeSize(36, 48),
  makeSize(40, 60),
  // ── Square ──────────────────────────────────────────────────────────────
  makeSize(6, 6),   makeSize(10, 10), makeSize(12, 12), makeSize(14, 14),
  makeSize(16, 16), makeSize(20, 20), makeSize(24, 24), makeSize(30, 30),
  makeSize(32, 32), makeSize(36, 36),
];

/** Grouped by orientation for the size selector tabs */
export const CANVAS_BY_ORIENTATION: Record<CanvasOrientation, CanvasSize[]> = {
  Horizontal: CANVAS_SIZES.filter((s) => s.orientation === "Horizontal"),
  Vertical:   CANVAS_SIZES.filter((s) => s.orientation === "Vertical"),
  Square:     CANVAS_SIZES.filter((s) => s.orientation === "Square"),
};

export const TIER_LABEL: Record<CanvasTier, string> = {
  small:  "Small",
  medium: "Medium",
  large:  "Large",
  xlarge: "Extra Large",
};

export const DEFAULT_CANVAS_SIZE: CanvasSize = CANVAS_SIZES.find((s) => s.code === "20x16")!;

export function getCanvasSizeByCode(code: string): CanvasSize | undefined {
  return CANVAS_SIZES.find((s) => s.code === code);
}
