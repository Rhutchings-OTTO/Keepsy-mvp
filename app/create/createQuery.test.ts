import { describe, expect, it } from "vitest";
import { resolveCreateMode, resolveProductSelection } from "./createQuery";

describe("create entry choices", () => {
  it("opens the requested photo mode and safely defaults invalid modes", () => {
    expect(resolveCreateMode("upload")).toBe("upload");
    expect(resolveCreateMode("DESCRIBE")).toBe("describe");
    expect(resolveCreateMode("unexpected")).toBe("describe");
  });

  it("preserves a valid product, colour and size", () => {
    const selection = resolveProductSelection({ product: "tee", color: "Navy", size: "xl" });
    expect(selection?.product.id).toBe("tshirt");
    expect(selection?.color).toBe("#1e3a8a");
    expect(selection?.size).toBe("XL");
  });

  it("supports existing blue shop links", () => {
    expect(resolveProductSelection({ product: "hoodie", color: "blue" })?.color).toBe("#1e3a8a");
  });

  it("rejects unsupported choices and products", () => {
    const selection = resolveProductSelection({ product: "hoodie", color: "pink", size: "5XL" });
    expect(selection?.color).toBe("#FFFFFF");
    expect(selection?.size).toBeNull();
    expect(resolveProductSelection({ product: "not-a-product" })).toBeNull();
    expect(resolveProductSelection({ product: "mug", color: "black", size: "M" })?.size).toBeNull();
  });

  it("keeps canvas as its own product", () => {
    expect(resolveProductSelection({ product: "canvas" })?.product.id).toBe("canvas");
  });
});
