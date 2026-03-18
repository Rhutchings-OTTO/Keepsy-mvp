/**
 * Canvas size catalogue — all sizes available from Printify blueprint 1159 (Jondo provider 105).
 * Sizes are width × height in inches. Depth is always 1.25".
 * USD prices = floor(GBP × 1.27) + 0.99
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
  priceUSD: number;
  /** Key into PRODUCT_CATALOG, e.g. "canvas_20x16" */
  catalogId: string;
};

/** Per-size prices from Printify Jondo provider */
const PRICES: Record<string, { priceGBP: number; priceUSD: number }> = {
  // ── Horizontal ──────────────────────────────────────────────────────────
  "10x8":  { priceGBP: 29.99,  priceUSD: 38.99  },
  "12x9":  { priceGBP: 34.99,  priceUSD: 44.99  },
  "14x11": { priceGBP: 39.99,  priceUSD: 50.99  },
  "16x12": { priceGBP: 44.99,  priceUSD: 57.99  },
  "18x12": { priceGBP: 49.99,  priceUSD: 63.99  },
  "20x10": { priceGBP: 49.99,  priceUSD: 63.99  },
  "20x16": { priceGBP: 54.99,  priceUSD: 69.99  },
  "24x16": { priceGBP: 59.99,  priceUSD: 76.99  },
  "24x18": { priceGBP: 64.99,  priceUSD: 82.99  },
  "24x20": { priceGBP: 69.99,  priceUSD: 88.99  },
  "30x15": { priceGBP: 74.99,  priceUSD: 95.99  },
  "30x20": { priceGBP: 74.99,  priceUSD: 95.99  },
  "30x24": { priceGBP: 84.99,  priceUSD: 107.99 },
  "32x24": { priceGBP: 84.99,  priceUSD: 107.99 },
  "36x12": { priceGBP: 79.99,  priceUSD: 101.99 },
  "36x24": { priceGBP: 89.99,  priceUSD: 114.99 },
  "40x20": { priceGBP: 99.99,  priceUSD: 126.99 },
  "40x30": { priceGBP: 119.99, priceUSD: 152.99 },
  "48x16": { priceGBP: 99.99,  priceUSD: 126.99 },
  "48x24": { priceGBP: 119.99, priceUSD: 152.99 },
  "48x32": { priceGBP: 159.99, priceUSD: 203.99 },
  "48x36": { priceGBP: 179.99, priceUSD: 228.99 },
  "60x20": { priceGBP: 149.99, priceUSD: 190.99 },
  "60x30": { priceGBP: 179.99, priceUSD: 228.99 },
  "60x40": { priceGBP: 219.99, priceUSD: 279.99 },
  // ── Vertical ────────────────────────────────────────────────────────────
  "8x10":  { priceGBP: 29.99,  priceUSD: 38.99  },
  "9x12":  { priceGBP: 34.99,  priceUSD: 44.99  },
  "10x20": { priceGBP: 49.99,  priceUSD: 63.99  },
  "11x14": { priceGBP: 39.99,  priceUSD: 50.99  },
  "12x16": { priceGBP: 44.99,  priceUSD: 57.99  },
  "12x18": { priceGBP: 49.99,  priceUSD: 63.99  },
  "12x36": { priceGBP: 79.99,  priceUSD: 101.99 },
  "15x30": { priceGBP: 74.99,  priceUSD: 95.99  },
  "16x20": { priceGBP: 54.99,  priceUSD: 69.99  },
  "16x24": { priceGBP: 59.99,  priceUSD: 76.99  },
  "16x48": { priceGBP: 99.99,  priceUSD: 126.99 },
  "18x24": { priceGBP: 64.99,  priceUSD: 82.99  },
  "20x24": { priceGBP: 69.99,  priceUSD: 88.99  },
  "20x30": { priceGBP: 74.99,  priceUSD: 95.99  },
  "20x40": { priceGBP: 99.99,  priceUSD: 126.99 },
  "20x60": { priceGBP: 149.99, priceUSD: 190.99 },
  "24x30": { priceGBP: 84.99,  priceUSD: 107.99 },
  "24x32": { priceGBP: 84.99,  priceUSD: 107.99 },
  "24x36": { priceGBP: 89.99,  priceUSD: 114.99 },
  "24x48": { priceGBP: 119.99, priceUSD: 152.99 },
  "30x40": { priceGBP: 119.99, priceUSD: 152.99 },
  "30x60": { priceGBP: 179.99, priceUSD: 228.99 },
  "32x48": { priceGBP: 159.99, priceUSD: 203.99 },
  "36x48": { priceGBP: 179.99, priceUSD: 228.99 },
  "40x60": { priceGBP: 219.99, priceUSD: 279.99 },
  // ── Square ──────────────────────────────────────────────────────────────
  "6x6":   { priceGBP: 29.99,  priceUSD: 38.99  },
  "10x10": { priceGBP: 34.99,  priceUSD: 44.99  },
  "12x12": { priceGBP: 39.99,  priceUSD: 50.99  },
  "14x14": { priceGBP: 44.99,  priceUSD: 57.99  },
  "16x16": { priceGBP: 49.99,  priceUSD: 63.99  },
  "20x20": { priceGBP: 69.99,  priceUSD: 88.99  },
  "24x24": { priceGBP: 89.99,  priceUSD: 114.99 },
  "30x30": { priceGBP: 109.99, priceUSD: 139.99 },
  "32x32": { priceGBP: 119.99, priceUSD: 152.99 },
  "36x36": { priceGBP: 159.99, priceUSD: 203.99 },
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
  const code = `${w}x${h}`;
  const { priceGBP, priceUSD } = PRICES[code] ?? { priceGBP: 29.99, priceUSD: 38.99 };
  return {
    code,
    width: w,
    height: h,
    orientation: getOrientation(w, h),
    tier: getTier(w, h),
    priceGBP,
    priceUSD,
    catalogId: `canvas_${code}`,
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
