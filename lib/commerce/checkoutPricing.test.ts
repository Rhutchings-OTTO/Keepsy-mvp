import { describe, it, expect } from "vitest";
import { priceCart } from "./checkoutPricing";

const design = "https://res.cloudinary.com/demo/image/upload/v1/keepsy-designs/abc.png";

describe("priceCart (server-authoritative)", () => {
  it("prices every line from the catalogue in the requested currency and keeps per-line print sources", () => {
    const res = priceCart(
      [
        { productId: "tee", name: "x", color: "White", size: "M", designUrl: design, unitPrice: 39.99, quantity: 2 },
        { productId: "tee", name: "x", color: "White", size: "L", designUrl: design, unitPrice: 39.99, quantity: 1 },
        { productId: "uscard_1", name: "x", designUrl: design, unitPrice: 9.99, quantity: 1, addonId: "matching-card" },
      ],
      "usd",
      {}
    );
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.lines.map((l) => [l.id, l.size, l.quantity, l.unitPrice])).toEqual([
      ["tee", "M", 2, 39.99],
      ["tee", "L", 1, 39.99],
      ["uscard_1", undefined, 1, 9.99],
    ]);
    expect(res.lines.every((l) => l.designUrl === design)).toBe(true);
    expect(res.lines[2].addonId).toBe("matching-card");
  });

  it("rejects a client price that does not match the catalogue", () => {
    const res = priceCart([{ productId: "mug", name: "Mug", unitPrice: 1, quantity: 1 }], "gbp", {});
    expect(res).toMatchObject({ ok: false, status: 400, error: "PRICE_MISMATCH" });
  });

  it("rejects sizes we cannot fulfil (4XL) and unknown products", () => {
    expect(priceCart([{ productId: "hoodie", name: "h", color: "Black", size: "4XL", unitPrice: 44.99, quantity: 1 }], "gbp", {})).toMatchObject({ ok: false, error: "UNSUPPORTED_VARIANT" });
    expect(priceCart([{ productId: "card", name: "c", unitPrice: 6.99, quantity: 1 }], "gbp", {})).toMatchObject({ ok: false, error: "UNKNOWN_PRODUCT" });
  });

  it("falls back to the session design URL only when a line has none, and only canvas inherits the crop", () => {
    const crop = design.replace("abc", "crop");
    const res = priceCart(
      [
        { productId: "canvas_20x16", name: "c", size: "20x16", unitPrice: 54.99, quantity: 1 },
        { productId: "mug", name: "m", unitPrice: 14.99, quantity: 1 },
      ],
      "gbp",
      { designUrl: design, croppedImageUrl: crop }
    );
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.lines[0].croppedImageUrl).toBe(crop);
    expect(res.lines[1].croppedImageUrl).toBeUndefined();
    expect(res.lines[1].designUrl).toBe(design);
  });

  it("drops colour for non-apparel products", () => {
    const res = priceCart([{ productId: "mug", name: "m", color: "White", unitPrice: 14.99, quantity: 1 }], "gbp", {});
    expect(res.ok && res.lines[0].color).toBeUndefined();
  });
});
