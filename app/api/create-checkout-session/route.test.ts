/**
 * Integration test for POST /api/create-checkout-session with Stripe and
 * Supabase mocked (no network). Asserts the behaviour customers depend on:
 * server pricing, per-line print sources, variant validation, ownership.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createFakeSupabase, type FakeSupabase } from "@/tests/helpers/fakeSupabase";

const stripeMock = vi.hoisted(() => ({
  create: vi.fn(async (params: unknown) => ({ id: "cs_test_123", url: "https://checkout.stripe.com/c/pay/cs_test_123", params })),
}));
vi.mock("stripe", () => ({
  default: class StripeMock {
    checkout = { sessions: { create: stripeMock.create } };
  },
}));

const state = vi.hoisted(() => ({ supabase: null as unknown, user: null as { id: string; email: string } | null }));
vi.mock("@/lib/supabaseAdmin", () => ({ getSupabaseAdmin: () => state.supabase }));
vi.mock("@/lib/supabase/server", () => ({ getSessionUser: async () => state.user }));

process.env.STRIPE_SECRET_KEY = "sk_test_placeholder";
process.env.NEXT_PUBLIC_SITE_URL = "https://keepsy.store";

import { POST } from "./route";

const design = "https://res.cloudinary.com/demo/image/upload/v1/keepsy-designs/abc.png";
const crop = "https://res.cloudinary.com/demo/image/upload/v1/keepsy-designs/crop.png";

function post(body: unknown) {
  return POST(
    new Request("https://keepsy.store/api/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: "https://keepsy.store", "x-visitor-id": `v-${Math.random()}` },
      body: JSON.stringify(body),
    })
  );
}

let db: FakeSupabase;
beforeEach(() => {
  vi.clearAllMocks();
  db = createFakeSupabase();
  state.supabase = db;
  state.user = null;
});

describe("POST /api/create-checkout-session", () => {
  it("creates one Stripe line per basket line with its own print source, and persists rich order_items", async () => {
    const res = await post({
      currency: "gbp",
      cart: [
        { productId: "tee", name: "Premium tee", color: "White", size: "M", designUrl: design, sourceKind: "ai", unitPrice: 29.99, quantity: 2 },
        { productId: "tee", name: "Premium tee", color: "White", size: "L", designUrl: design, sourceKind: "ai", unitPrice: 29.99, quantity: 1 },
        { productId: "postcard", name: "Fine Art Postcard", designUrl: design, sourceKind: "original", addonId: "matching-card", unitPrice: 6.99, quantity: 1 },
        { productId: "canvas_20x16", name: "Canvas", size: "20x16", designUrl: design, croppedImageUrl: crop, unitPrice: 54.99, quantity: 1 },
      ],
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.url).toMatch(/^https:\/\/checkout\.stripe\.com/);

    const params = stripeMock.create.mock.calls[0][0] as {
      line_items: Array<{ price_data: { unit_amount: number; product_data: { name: string; metadata: Record<string, string> } }; quantity: number }>;
      metadata: Record<string, string>;
    };
    // 4 product lines, no shipping line (subtotal 151.95 ≥ 75)
    expect(params.line_items).toHaveLength(4);
    expect(params.line_items.map((li) => [li.price_data.product_data.metadata.size, li.quantity, li.price_data.unit_amount])).toEqual([
      ["M", 2, 2999],
      ["L", 1, 2999],
      ["", 1, 699],
      ["20x16", 1, 5499],
    ]);
    expect(params.line_items.every((li) => li.price_data.product_data.metadata.designUrl === design)).toBe(true);
    expect(params.line_items[3].price_data.product_data.metadata.croppedImageUrl).toBe(crop);
    expect(params.line_items[2].price_data.product_data.metadata.sourceKind).toBe("original");
    expect(params.metadata.line_count).toBe("4");
    expect(params.metadata.product_type).toBe("tee");

    const items = db.tables.order_items;
    expect(items).toHaveLength(4);
    expect(items.map((r) => [r.product_id, r.size, r.quantity, r.design_url])).toEqual([
      ["tee", "M", 2, design],
      ["tee", "L", 1, design],
      ["postcard", null, 1, design],
      ["canvas_20x16", "20x16", 1, design],
    ]);
    expect(items[3].cropped_image_url).toBe(crop);
    expect(items[2].addon_id).toBe("matching-card");
    expect(db.tables.orders[0]).toMatchObject({ order_ref: json.orderRef, status: "pending", currency: "gbp", total_gbp: 151.95 });
    expect(db.tables.orders[0].user_id).toBeUndefined(); // guest
  });

  it("adds the shipping line under the free-shipping threshold and prices in USD for US baskets", async () => {
    const res = await post({
      currency: "usd",
      cart: [{ productId: "mug", name: "Mug", designUrl: design, unitPrice: 19.99, quantity: 1 }],
    });
    expect(res.status).toBe(200);
    const params = stripeMock.create.mock.calls[0][0] as { line_items: Array<{ price_data: { currency: string; unit_amount: number; product_data: { name: string } } }> };
    expect(params.line_items).toHaveLength(2);
    expect(params.line_items[0].price_data).toMatchObject({ currency: "usd", unit_amount: 1999 });
    expect(params.line_items[1].price_data.product_data.name).toBe("Standard Shipping");
    expect(params.line_items[1].price_data.unit_amount).toBe(499);
  });

  it("rejects a tampered price without touching Stripe", async () => {
    const res = await post({ cart: [{ productId: "hoodie", name: "Hoodie", color: "Black", size: "M", designUrl: design, unitPrice: 4.99, quantity: 1 }] });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toBe("PRICE_MISMATCH");
    expect(stripeMock.create).not.toHaveBeenCalled();
  });

  it("rejects sizes fulfilment cannot print (5XL) with the supported list", async () => {
    const res = await post({ cart: [{ productId: "hoodie", name: "Hoodie", color: "Black", size: "5XL", designUrl: design, unitPrice: 44.99, quantity: 1 }] });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("UNSUPPORTED_VARIANT");
    expect(body.message).toMatch(/S, M, L, XL, 2XL, 3XL/);
    expect(stripeMock.create).not.toHaveBeenCalled();
  });

  it("rejects data-URL design sources (must be permanent https) and a canvas without a size", async () => {
    const bad = await post({ cart: [{ productId: "mug", name: "Mug", designUrl: "data:image/png;base64,AAAA", unitPrice: 14.99, quantity: 1 }] });
    expect(bad.status).toBe(400);
    const noSize = await post({ cart: [{ productId: "canvas_20x16", name: "Canvas", designUrl: design, unitPrice: 54.99, quantity: 1 }] });
    expect(noSize.status).toBe(400);
    expect((await noSize.json()).error).toBe("MISSING_CANVAS_SIZE");
  });

  it("attaches the signed-in customer to the order (guests unaffected)", async () => {
    state.user = { id: "11111111-1111-1111-1111-111111111111", email: "rory@example.com" };
    const res = await post({ cart: [{ productId: "mug", name: "Mug", designUrl: design, unitPrice: 14.99, quantity: 1 }] });
    expect(res.status).toBe(200);
    expect(db.tables.orders[0].user_id).toBe(state.user.id);
    const params = stripeMock.create.mock.calls[0][0] as { customer_email?: string; metadata: Record<string, string> };
    expect(params.customer_email).toBe("rory@example.com");
    expect(params.metadata.user_id).toBe(state.user.id);
  });

  it("refuses requests from other origins", async () => {
    const res = await POST(
      new Request("https://keepsy.store/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json", Origin: "https://evil.example" },
        body: JSON.stringify({ cart: [] }),
      })
    );
    expect(res.status).toBe(403);
  });
});
