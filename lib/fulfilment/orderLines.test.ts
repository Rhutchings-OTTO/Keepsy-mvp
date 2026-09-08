import { describe, it, expect } from "vitest";
import type Stripe from "stripe";
import { linesFromOrderItems, linesFromStripeLineItems } from "./orderLines";

const d = (n: string) => `https://res.cloudinary.com/demo/image/upload/v1/keepsy-designs/${n}.png`;

describe("linesFromOrderItems", () => {
  it("rebuilds every paid line with its own print source and ignores legacy rows without product_id", () => {
    const lines = linesFromOrderItems(
      [
        { product_id: "tee", size: "M", color: "White", quantity: 2, design_url: d("a"), source_kind: "ai" },
        { product_id: "tee", size: "L", color: "White", quantity: 1, design_url: d("a") },
        { product_id: "postcard", quantity: 1, design_url: null, source_kind: "original" },
        { product_id: null, quantity: 1 }, // "Standard Shipping" row
      ],
      { designUrl: d("fallback") }
    );
    expect(lines).toHaveLength(3);
    expect(lines[0]).toMatchObject({ productId: "tee", size: "M", quantity: 2, designUrl: d("a"), sourceKind: "ai" });
    expect(lines[2]).toMatchObject({ productId: "postcard", designUrl: d("fallback"), sourceKind: "original" });
  });

  it("only canvas lines inherit the session-level crop", () => {
    const lines = linesFromOrderItems(
      [
        { product_id: "canvas_20x16", size: "20x16", quantity: 1, design_url: d("a") },
        { product_id: "mug", quantity: 1, design_url: d("a") },
      ],
      { croppedImageUrl: d("crop") }
    );
    expect(lines[0].croppedImageUrl).toBe(d("crop"));
    expect(lines[1].croppedImageUrl).toBeNull();
  });
});

describe("linesFromStripeLineItems", () => {
  const item = (meta: Record<string, string>, quantity = 1, description = "x"): Stripe.LineItem =>
    ({
      description,
      quantity,
      price: { product: { object: "product", metadata: meta } },
    }) as unknown as Stripe.LineItem;

  it("uses per-item metadata, skips the shipping line, and falls back to the session design URL", () => {
    const lines = linesFromStripeLineItems(
      [
        item({ productId: "hoodie", size: "XL", color: "Navy", designUrl: d("h") }, 1),
        item({ productId: "mug", designUrl: "" }, 3),
        { description: "Standard Shipping", quantity: 1, price: { product: "prod_x" } } as unknown as Stripe.LineItem,
      ],
      { designUrl: d("session") }
    );
    expect(lines).toHaveLength(2);
    expect(lines[0]).toMatchObject({ productId: "hoodie", size: "XL", color: "Navy", designUrl: d("h") });
    expect(lines[1]).toMatchObject({ productId: "mug", quantity: 3, designUrl: d("session") });
  });
});
