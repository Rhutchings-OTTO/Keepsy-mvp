import "@/tests/browserStorage";
import { describe, it, expect, beforeEach } from "vitest";
import {
  CART_STORAGE_KEY,
  __resetCartStoreForTests,
  addLine,
  addLines,
  computeTotals,
  getCart,
  mergeLine,
  normaliseLine,
  parseCart,
  reloadCart,
  removeFromCart,
  updateQuantity,
  type CartLine,
} from "./store";

const design = "https://res.cloudinary.com/demo/image/upload/v1/keepsy-designs/abc.png";

function tee(overrides: Partial<Omit<CartLine, "id">> = {}): Omit<CartLine, "id"> {
  return {
    productId: "tee",
    name: "Premium tee",
    color: "White",
    size: "M",
    imageUrl: design,
    designUrl: design,
    sourceKind: "ai",
    unitPrice: 29.99,
    quantity: 1,
    ...overrides,
  };
}

beforeEach(() => {
  __resetCartStoreForTests();
  window.localStorage.clear();
});

describe("mergeLine", () => {
  it("merges identical variant + design into one line with summed quantity", () => {
    let lines = mergeLine([], tee());
    lines = mergeLine(lines, tee({ quantity: 2 }));
    expect(lines).toHaveLength(1);
    expect(lines[0].quantity).toBe(3);
  });

  it("keeps different sizes of the same design as separate lines (multi-size orders)", () => {
    let lines = mergeLine([], tee({ size: "M", quantity: 2 }));
    lines = mergeLine(lines, tee({ size: "L", quantity: 1 }));
    lines = mergeLine(lines, tee({ size: "XL", quantity: 3 }));
    expect(lines.map((l) => `${l.size}×${l.quantity}`)).toEqual(["M×2", "L×1", "XL×3"]);
    expect(new Set(lines.map((l) => l.id)).size).toBe(3);
  });

  it("keeps the same size with a different design separate", () => {
    let lines = mergeLine([], tee());
    lines = mergeLine(lines, tee({ designUrl: design.replace("abc", "def"), imageUrl: design.replace("abc", "def") }));
    expect(lines).toHaveLength(2);
  });

  it("treats add-on lines as distinct from the primary line even with the same variant", () => {
    let lines = mergeLine([], tee());
    lines = mergeLine(lines, tee({ addonId: "second-print" }));
    expect(lines).toHaveLength(2);
  });
});

describe("persistence", () => {
  it("survives reload including card sub-types (postcard) and canvas ids", () => {
    addLines([
      tee(),
      { productId: "postcard", name: "Fine Art Postcard", imageUrl: design, designUrl: design, unitPrice: 6.99, quantity: 1 },
      { productId: "canvas_20x16", name: "Canvas", size: "20x16", imageUrl: design, designUrl: design, croppedImageUrl: design, unitPrice: 54.99, quantity: 1 },
    ]);
    const raw = window.localStorage.getItem(CART_STORAGE_KEY)!;
    expect(raw).toBeTruthy();
    __resetCartStoreForTests();
    const restored = reloadCart();
    expect(restored.map((l) => l.productId)).toEqual(["tee", "postcard", "canvas_20x16"]);
    expect(restored[2].croppedImageUrl).toBe(design);
  });

  it("tolerates the legacy line shape written by the old create flow", () => {
    const legacy = [{
      id: "item-tee-#FFFFFF-M-123",
      productId: "tee",
      name: "Premium Tee",
      color: "White",
      size: "M",
      imageUrl: "data:image/png;base64,AAAA",
      designUrl: design,
      unitPrice: 29.99,
      quantity: 2,
    }];
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(legacy));
    const lines = getCart();
    expect(lines).toHaveLength(1);
    expect(lines[0].id).toBe("item-tee-#FFFFFF-M-123");
    expect(lines[0].designUrl).toBe(design);
  });

  it("drops unsellable or corrupt entries instead of throwing", () => {
    expect(parseCart("not json")).toEqual([]);
    expect(parseCart(JSON.stringify([{ productId: "hat", imageUrl: design, unitPrice: 1, quantity: 1 }]))).toEqual([]);
    expect(parseCart(JSON.stringify([{ productId: "tee", imageUrl: design, unitPrice: 1, quantity: 99 }]))).toEqual([]);
    expect(normaliseLine({ productId: "tee", imageUrl: "", designUrl: design, unitPrice: 29.99, quantity: 1 })?.imageUrl).toBe(design);
  });
});

describe("quantities and removal", () => {
  it("updates, removes at zero and removes explicitly", () => {
    const [line] = addLine(tee());
    updateQuantity(line.id, 4);
    expect(getCart()[0].quantity).toBe(4);
    updateQuantity(line.id, 0);
    expect(getCart()).toHaveLength(0);
    addLine(tee());
    removeFromCart(getCart()[0].id);
    expect(getCart()).toHaveLength(0);
  });
});

describe("computeTotals", () => {
  it("prices from the catalogue per currency and applies free shipping over the threshold", () => {
    const lines = mergeLine([], tee({ quantity: 2 })); // 2 × 29.99 = 59.98 GBP
    const gbp = computeTotals(lines, "gbp");
    expect(gbp.subtotal).toBe(59.98);
    expect(gbp.shipping).toBe(3.99);
    expect(gbp.total).toBe(63.97);
    expect(gbp.amountToFreeShipping).toBe(15.02);

    const usd = computeTotals(lines, "usd"); // tee is $39.99 in USD → 79.98 ≥ 75 → free shipping
    expect(usd.subtotal).toBe(79.98);
    expect(usd.shipping).toBe(0);
    expect(usd.itemCount).toBe(2);
  });

  it("has zero shipping for an empty basket", () => {
    expect(computeTotals([], "gbp")).toEqual({ subtotal: 0, shipping: 0, total: 0, itemCount: 0, amountToFreeShipping: 75 });
  });
});
