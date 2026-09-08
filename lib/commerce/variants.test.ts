import { describe, it, expect } from "vitest";
import { checkVariant, getSupportedColors, getSupportedSizes, isApparel, requiresSize } from "./variants";
import { PRODUCTS } from "@/lib/products";
import { CANVAS_SIZES } from "@/lib/canvas/sizes";
import { PRODUCT_CATALOG } from "@/lib/commerce/catalog";
import { PRINTIFY_BLUEPRINTS } from "@/lib/printify-blueprints";

describe("apparel variant support (derived from Printify blueprint maps)", () => {
  it("offers exactly the sizes that resolve in BOTH regions for every colour we sell", () => {
    for (const productId of ["tee", "hoodie"]) {
      const product = productId === "tee" ? PRODUCTS.tshirt : PRODUCTS.hoodie;
      for (const color of product.colors ?? []) {
        expect(getSupportedSizes(productId, color.name)).toEqual(["S", "M", "L", "XL", "2XL", "3XL"]);
        for (const size of product.sizes ?? []) {
          expect(checkVariant({ productId, color: color.name, size })).toEqual({ ok: true });
          expect(checkVariant({ productId, color: color.name, size, region: "UK" })).toEqual({ ok: true });
          expect(checkVariant({ productId, color: color.name, size, region: "US" })).toEqual({ ok: true });
        }
      }
    }
  });

  it("rejects 4XL/5XL — these used to silently fall back to Black / M at fulfilment", () => {
    for (const size of ["4XL", "5XL"]) {
      const res = checkVariant({ productId: "tee", color: "White", size });
      expect(res.ok).toBe(false);
      if (!res.ok) expect(res.reason).toMatch(/not available/);
    }
    expect(checkVariant({ productId: "hoodie", color: "Navy", size: "4XL" }).ok).toBe(false);
  });

  it("rejects apparel without a colour or size and unknown colours", () => {
    expect(checkVariant({ productId: "tee", size: "M" }).ok).toBe(false);
    expect(checkVariant({ productId: "tee", color: "White" }).ok).toBe(false);
    expect(checkVariant({ productId: "hoodie", color: "Chartreuse", size: "M" }).ok).toBe(false);
  });

  it("normalises casing (white / m → White / M)", () => {
    expect(checkVariant({ productId: "tee", color: "white", size: "m" })).toEqual({ ok: true });
    expect(checkVariant({ productId: "hoodie", color: "NAVY", size: "2xl" })).toEqual({ ok: true });
  });

  it("lists colours available in every region", () => {
    const tee = getSupportedColors("tee");
    expect(tee).toEqual(expect.arrayContaining(["White", "Navy", "Black"]));
    const hoodie = getSupportedColors("hoodie");
    expect(hoodie).toEqual(expect.arrayContaining(["White", "Navy", "Black"]));
    expect(hoodie).not.toContain("Maroon"); // US-only
  });

  it("classifies products", () => {
    expect(isApparel("tee")).toBe(true);
    expect(isApparel("mug")).toBe(false);
    expect(requiresSize("canvas_20x16")).toBe(true);
    expect(requiresSize("postcard")).toBe(false);
  });
});

describe("single-variant products", () => {
  it("accepts mug, postcard, cardpack and US cards without size/colour", () => {
    for (const productId of ["mug", "postcard", "cardpack", "uscard_1", "uscard_50"]) {
      expect(checkVariant({ productId })).toEqual({ ok: true });
    }
  });
  it("rejects unknown products", () => {
    expect(checkVariant({ productId: "premiumtee" }).ok).toBe(false);
  });
});

describe("canvas catalogue integrity", () => {
  it("every UI canvas size has a server price AND a Printify variant (no 20x60-style gaps)", () => {
    for (const size of CANVAS_SIZES) {
      expect(PRODUCT_CATALOG[size.catalogId], `catalog missing ${size.catalogId}`).toBeDefined();
      expect(PRINTIFY_BLUEPRINTS.canvas.variants[size.code], `variant missing ${size.code}`).toBeDefined();
      expect(checkVariant({ productId: size.catalogId, size: size.code })).toEqual({ ok: true });
      // price shown in the UI must equal the server price
      expect(PRODUCT_CATALOG[size.catalogId].priceGBP).toBe(size.priceGBP);
      expect(PRODUCT_CATALOG[size.catalogId].priceUSD).toBe(size.priceUSD);
    }
  });
  it("rejects a canvas size that cannot be printed", () => {
    expect(checkVariant({ productId: "canvas_20x60", size: "20x60" }).ok).toBe(false);
    expect(checkVariant({ productId: "canvas_20x16", size: "" }).ok).toBe(true); // size derived from id
  });
});
