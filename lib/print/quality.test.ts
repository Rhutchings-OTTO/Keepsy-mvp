import { describe, it, expect } from "vitest";
import { assessPrintQuality, getPrintTarget } from "./quality";

describe("assessPrintQuality", () => {
  it("rates a 12MP phone photo excellent on a mug and good on a 20×16 canvas", () => {
    const mug = assessPrintQuality({ productId: "mug", imageWidth: 4000, imageHeight: 3000 })!;
    expect(mug.rating).toBe("excellent");
    expect(mug.dpi).toBeGreaterThanOrEqual(300);

    const canvas = assessPrintQuality({ productId: "canvas_20x16", size: "20x16", imageWidth: 4000, imageHeight: 3000 })!;
    // Cover-fit: a 4:3 photo on a 5:4 canvas is cropped at the sides, so the 3000px
    // height spans 16in → 187 DPI → "acceptable" (not "good"). Honest, not optimistic.
    expect(canvas.printedHeightIn).toBe(16);
    expect(canvas.dpi).toBe(187);
    expect(canvas.rating).toBe("acceptable");
  });

  it("is honest about a 1024px AI image on a large canvas (poor) vs a postcard (excellent)", () => {
    const big = assessPrintQuality({ productId: "canvas_40x30", size: "40x30", imageWidth: 1024, imageHeight: 1024 })!;
    expect(big.rating).toBe("poor");
    expect(big.message).toMatch(/Low resolution/);
    expect(big.recommendedPx.good).toBeGreaterThan(1024);

    const postcard = assessPrintQuality({ productId: "postcard", imageWidth: 1024, imageHeight: 1024 })!;
    // contain-fit inside 4.8×3.2in → limited by height 3.2in → 320 DPI
    expect(postcard.rating).toBe("excellent");
  });

  it("uses contain-fit for apparel (a square image is limited by the shorter print edge)", () => {
    const tee = assessPrintQuality({ productId: "tee", imageWidth: 1024, imageHeight: 1024 })!;
    // tee target 12×13.6in, square → limited by width 12in → 85 DPI
    expect(tee.printedWidthIn).toBe(12);
    expect(tee.dpi).toBe(85);
    expect(tee.rating).toBe("poor");

    const hoodie = assessPrintQuality({ productId: "hoodie", imageWidth: 3000, imageHeight: 3000 })!;
    // hoodie target 15×10in, square → limited by height 10in → 300 DPI
    expect(hoodie.printedHeightIn).toBe(10);
    expect(hoodie.rating).toBe("excellent");
  });

  it("uses cover-fit for canvas (the customer crops to the exact ratio)", () => {
    // Portrait photo on a landscape canvas: width must cover 20in → 2000/20 = 100 DPI
    const q = assessPrintQuality({ productId: "canvas_20x16", size: "20x16", imageWidth: 2000, imageHeight: 3000 })!;
    expect(q.printedWidthIn).toBe(20);
    expect(q.dpi).toBe(100);
    expect(q.rating).toBe("poor");
  });

  it("returns null for unknown products or invalid dimensions", () => {
    expect(assessPrintQuality({ productId: "hat", imageWidth: 100, imageHeight: 100 })).toBeNull();
    expect(assessPrintQuality({ productId: "mug", imageWidth: 0, imageHeight: 100 })).toBeNull();
    expect(getPrintTarget("canvas_abc")).toBeNull();
  });

  it("boundaries: 300 → excellent, 200 → good, 150 → acceptable, 149 → poor", () => {
    // mug target 2.8×3.5in, square image limited by width 2.8in
    const at = (dpi: number) => assessPrintQuality({ productId: "mug", imageWidth: Math.ceil(2.8 * dpi), imageHeight: Math.ceil(2.8 * dpi) })!.rating;
    expect(at(300)).toBe("excellent");
    expect(at(200)).toBe("good");
    expect(at(150)).toBe("acceptable");
    expect(assessPrintQuality({ productId: "mug", imageWidth: 400, imageHeight: 400 })!.rating).toBe("poor");
  });
});
