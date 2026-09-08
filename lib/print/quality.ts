/**
 * Honest print-quality estimation.
 *
 * Given the pixel dimensions of the image that will be sent to print and the
 * product it will be printed on, estimate the effective DPI on the finished
 * item and rate it. The numbers here mirror the fulfilment pipeline:
 *
 *   tee     – 4500×5100 px print area at 300 DPI (15×17 in), contain-fit ×0.8
 *   hoodie  – 4500×3000 px at 300 DPI (15×10 in), contain-fit
 *   mug     – each face ≈ 840×1064 px at 300 DPI (2.8×3.5 in), contain-fit
 *   postcard– 6×4 in, image within 80% safe zone (4.8×3.2 in)
 *   cardpack– front panel ≈ 4×6 in, 80% safe zone (3.2×4.8 in)
 *   uscard  – 5×7 in front, 80% safe zone (4×5.6 in)
 *   canvas  – full W×H inches, cover-fit (user crops to the exact ratio)
 */

export type PrintQualityRating = "excellent" | "good" | "acceptable" | "poor";

export type PrintTarget = {
  widthIn: number;
  heightIn: number;
  fit: "contain" | "cover";
};

export type PrintQuality = {
  rating: PrintQualityRating;
  /** Effective dots per inch on the printed item. */
  dpi: number;
  /** Printed size of the image in inches (after fitting). */
  printedWidthIn: number;
  printedHeightIn: number;
  /** Pixels needed on the long edge for "good" (200 DPI) and "excellent" (300 DPI). */
  recommendedPx: { good: number; excellent: number };
  message: string;
};

const EXCELLENT_DPI = 300;
const GOOD_DPI = 200;
const ACCEPTABLE_DPI = 150;

/** Print target for a catalogue product id (tee, hoodie, mug, postcard, cardpack, uscard_10, canvas_20x16). */
export function getPrintTarget(productId: string, size?: string | null): PrintTarget | null {
  const p = productId.toLowerCase();
  if (p === "tee") return { widthIn: 15 * 0.8, heightIn: 17 * 0.8, fit: "contain" };
  if (p === "hoodie") return { widthIn: 15, heightIn: 10, fit: "contain" };
  if (p === "mug") return { widthIn: 2.8, heightIn: 3.5, fit: "contain" };
  if (p === "postcard") return { widthIn: 6 * 0.8, heightIn: 4 * 0.8, fit: "contain" };
  if (p === "cardpack") return { widthIn: 4 * 0.8, heightIn: 6 * 0.8, fit: "contain" };
  if (p.startsWith("uscard")) return { widthIn: 5 * 0.8, heightIn: 7 * 0.8, fit: "contain" };
  if (p.startsWith("canvas")) {
    const code = (size && /^\d+x\d+$/.test(size) ? size : p.replace(/^canvas_/, "")).toLowerCase();
    const m = code.match(/^(\d+)x(\d+)$/);
    if (!m) return null;
    return { widthIn: Number(m[1]), heightIn: Number(m[2]), fit: "cover" };
  }
  return null;
}

/**
 * Rate an image for a product. Returns null when the product is unknown.
 */
export function assessPrintQuality(args: {
  productId: string;
  size?: string | null;
  imageWidth: number;
  imageHeight: number;
}): PrintQuality | null {
  const target = getPrintTarget(args.productId, args.size);
  if (!target) return null;
  const { imageWidth: w, imageHeight: h } = args;
  if (!(w > 0) || !(h > 0)) return null;

  const imageRatio = w / h;
  const targetRatio = target.widthIn / target.heightIn;

  let printedWidthIn: number;
  let printedHeightIn: number;
  if (target.fit === "contain") {
    // Image is scaled to fit entirely inside the print area.
    if (imageRatio >= targetRatio) {
      printedWidthIn = target.widthIn;
      printedHeightIn = target.widthIn / imageRatio;
    } else {
      printedHeightIn = target.heightIn;
      printedWidthIn = target.heightIn * imageRatio;
    }
  } else {
    // Cover: the image fills the whole area (excess is cropped by the user).
    if (imageRatio >= targetRatio) {
      printedHeightIn = target.heightIn;
      printedWidthIn = target.heightIn * imageRatio;
    } else {
      printedWidthIn = target.widthIn;
      printedHeightIn = target.widthIn / imageRatio;
    }
  }

  const dpi = Math.floor(Math.min(w / printedWidthIn, h / printedHeightIn));
  const longEdgeIn = Math.max(printedWidthIn, printedHeightIn);
  const recommendedPx = {
    good: Math.ceil(longEdgeIn * GOOD_DPI),
    excellent: Math.ceil(longEdgeIn * EXCELLENT_DPI),
  };

  let rating: PrintQualityRating;
  let message: string;
  if (dpi >= EXCELLENT_DPI) {
    rating = "excellent";
    message = `Excellent — about ${dpi} DPI on the print. Sharp at any viewing distance.`;
  } else if (dpi >= GOOD_DPI) {
    rating = "good";
    message = `Good — about ${dpi} DPI on the print. Crisp for a gift.`;
  } else if (dpi >= ACCEPTABLE_DPI) {
    rating = "acceptable";
    message = `Acceptable — about ${dpi} DPI. Fine from arm's length; fine detail may soften.`;
  } else {
    rating = "poor";
    message = `Low resolution — about ${dpi} DPI. This will look soft or pixelated at this size. Use a larger photo (at least ${recommendedPx.good}px on the long edge) or choose a smaller product.`;
  }

  return {
    rating,
    dpi,
    printedWidthIn: Number(printedWidthIn.toFixed(2)),
    printedHeightIn: Number(printedHeightIn.toFixed(2)),
    recommendedPx,
    message,
  };
}
