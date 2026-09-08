/**
 * Integration test for the Stripe webhook with Stripe, Supabase, Printify,
 * sharp and email mocked. The regression under test: a paid basket with
 * several lines (two tee sizes + a postcard) must produce a Printify order
 * that carries EVERY line — previously only line[0] was printed.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createFakeSupabase, type FakeSupabase } from "@/tests/helpers/fakeSupabase";

const d = (n: string) => `https://res.cloudinary.com/demo/image/upload/v1/keepsy-designs/${n}.png`;

const stripeState = vi.hoisted(() => ({
  lineItems: [] as unknown[],
  fetchError: false,
  session: {} as Record<string, unknown>,
}));
vi.mock("stripe", () => ({
  default: class StripeMock {
    webhooks = {
      constructEventAsync: async (payload: string, signature: string) => {
        if (signature !== "valid") throw new Error("bad signature");
        return JSON.parse(payload);
      },
    };
    checkout = { sessions: { listLineItems: async () => { if (stripeState.fetchError) throw new Error("Stripe temporarily unavailable"); return { data: stripeState.lineItems }; } } };
  },
}));

const state = vi.hoisted(() => ({ supabase: null as unknown }));
vi.mock("@/lib/supabaseAdmin", () => ({ getSupabaseAdmin: () => state.supabase }));
vi.mock("@/lib/emails/orderEmails", () => ({ sendOrderConfirmationEmail: vi.fn(async () => ({ ok: true })) }));
const notify = vi.hoisted(() => ({ notifyFounders: vi.fn(async () => {}) }));
vi.mock("@/lib/notifications", () => notify);
vi.mock("sharp", () => {
  const instance = {
    metadata: async () => ({ width: 1024, height: 1024, format: "png" }),
    rotate() { return this; },
    png() { return this; },
    toBuffer: async () => Buffer.from("png"),
  };
  return { default: () => instance };
});
vi.mock("@/lib/image-composite", () => ({
  compositePostcardImage: vi.fn(async () => Buffer.from("postcard")),
  compositeCardpackImage: vi.fn(async () => Buffer.from("cardpack")),
  compositeUSCardImage: vi.fn(async () => Buffer.from("uscard")),
  compositeMugImage: vi.fn(async () => Buffer.from("mug")),
  computeContainScale: () => 0.9,
  TEE_PRINT_W: 4500, TEE_PRINT_H: 5100, HOODIE_PRINT_W: 4500, HOODIE_PRINT_H: 3000,
}));
const printify = vi.hoisted(() => ({
  uploadImageToPrintify: vi.fn(async (_img: unknown, name: string) => `img_${name}`),
  createPrintifyProduct: vi.fn(async (p: { variantId: number }) => `prod_${p.variantId}`),
  submitPrintifyOrderLines: vi.fn(async (_args: unknown) => "printify_order_9"),
}));
vi.mock("@/lib/printify", () => ({
  ...printify,
  splitName: (n: string) => ({ first_name: n.split(" ")[0], last_name: n.split(" ").slice(1).join(" ") }),
}));

process.env.STRIPE_SECRET_KEY = "sk_test_placeholder";
process.env.STRIPE_WEBHOOK_SECRET = "whsec_placeholder";
process.env.PRINTIFY_API_TOKEN = "printify_placeholder";

import { POST } from "./route";

function sessionFixture(orderRef: string) {
  return {
    id: "cs_test_multi",
    object: "checkout.session",
    amount_total: 6697,
    currency: "gbp",
    metadata: { order_ref: orderRef, design_url: d("session"), product_type: "tee" },
    client_reference_id: orderRef,
    customer_details: { email: "buyer@example.com", name: "Sam Buyer", phone: null, address: null },
    collected_information: {
      shipping_details: {
        name: "Sam Buyer",
        address: { line1: "1 High St", line2: null, city: "Leeds", state: null, postal_code: "LS1 1AA", country: "GB" },
      },
    },
  };
}

function eventBody(session: unknown, id = `evt_${Math.random().toString(36).slice(2)}`) {
  return JSON.stringify({ id, type: "checkout.session.completed", data: { object: session } });
}

function post(body: string, signature = "valid") {
  return POST(new Request("https://keepsy.store/api/stripe/webhook", { method: "POST", headers: { "stripe-signature": signature }, body }));
}

let db: FakeSupabase;
beforeEach(() => {
  stripeState.fetchError = false;
  vi.clearAllMocks();
  vi.stubGlobal("fetch", vi.fn(async () => new Response(Buffer.from("img"), { status: 200 })));
  db = createFakeSupabase();
  state.supabase = db;
  stripeState.lineItems = [];
});

describe("POST /api/stripe/webhook — checkout.session.completed", () => {
  it("fulfils EVERY paid line from the rich order_items rows written at checkout", async () => {
    const orderRef = "order_multi";
    db.tables.orders = [{ order_ref: orderRef, stripe_session_id: `pending_${orderRef}`, status: "pending", generated_image_url: d("session") }];
    db.tables.order_items = [
      { order_ref: orderRef, product_name: "Premium tee · M · White", quantity: 2, product_id: "tee", size: "M", color: "White", design_url: d("a"), source_kind: "ai" },
      { order_ref: orderRef, product_name: "Premium tee · L · White", quantity: 1, product_id: "tee", size: "L", color: "White", design_url: d("a"), source_kind: "ai" },
      { order_ref: orderRef, product_name: "Fine Art Postcard", quantity: 1, product_id: "postcard", design_url: d("a"), source_kind: "original", addon_id: "matching-card" },
    ];
    stripeState.lineItems = [
      { description: "Premium tee · M · White", quantity: 2, amount_total: 5998, price: { unit_amount: 2999, product: { metadata: { productId: "tee", size: "M", color: "White", designUrl: d("a") } } } },
      { description: "Premium tee · L · White", quantity: 1, amount_total: 2999, price: { unit_amount: 2999, product: { metadata: { productId: "tee", size: "L", color: "White", designUrl: d("a") } } } },
      { description: "Fine Art Postcard", quantity: 1, amount_total: 699, price: { unit_amount: 699, product: { metadata: { productId: "postcard", designUrl: d("a") } } } },
    ];

    const res = await post(eventBody(sessionFixture(orderRef)));
    expect(res.status).toBe(200);

    expect(printify.createPrintifyProduct).toHaveBeenCalledTimes(3);
    expect(printify.submitPrintifyOrderLines).toHaveBeenCalledTimes(1);
    const submitted = printify.submitPrintifyOrderLines.mock.calls[0][0] as {
      externalId: string;
      lineItems: Array<{ product_id: string; variant_id: number; quantity: number }>;
      shippingAddress: { country: string; city: string; first_name: string; last_name: string };
    };
    expect(submitted.externalId).toBe(orderRef);
    expect(submitted.lineItems.map((li) => li.quantity)).toEqual([2, 1, 1]);
    expect(submitted.lineItems.map((li) => li.variant_id)).toEqual([73203, 73207, 76317]);
    expect(submitted.shippingAddress).toMatchObject({ country: "GB", city: "Leeds", first_name: "Sam", last_name: "Buyer" });

    const order = db.tables.orders[0];
    expect(order).toMatchObject({ status: "in_production", stripe_session_id: "cs_test_multi", printify_order_id: "printify_order_9", customer_email: "buyer@example.com", region: "UK" });
    // Rich rows are preserved (not replaced by the Stripe line-item shape)
    expect(db.tables.order_items).toHaveLength(3);
    expect(db.tables.order_items[0].product_id).toBe("tee");
    expect(notify.notifyFounders).not.toHaveBeenCalled();
  });

  it("falls back to Stripe line-item metadata when the checkout pre-insert never happened", async () => {
    const orderRef = "order_fallback";
    stripeState.lineItems = [
      { description: "Mug", quantity: 3, amount_total: 4497, price: { unit_amount: 1499, product: { metadata: { productId: "mug", designUrl: d("mug") } } } },
      { description: "Standard Shipping", quantity: 1, amount_total: 399, price: { unit_amount: 399, product: "prod_shipping" } },
    ];
    const res = await post(eventBody(sessionFixture(orderRef)));
    expect(res.status).toBe(200);
    expect(printify.createPrintifyProduct).toHaveBeenCalledTimes(1);
    const submitted = printify.submitPrintifyOrderLines.mock.calls[0][0] as { lineItems: Array<{ quantity: number }> };
    expect(submitted.lineItems).toEqual([{ product_id: "prod_69010", variant_id: 69010, quantity: 3 }]);
    // order_items rebuilt from Stripe with product ids so retries can re-derive lines
    expect(db.tables.order_items.map((r) => r.product_id)).toEqual(["mug", null]);
  });

  it("marks the order for manual review (and never throws to Stripe) when a line cannot be fulfilled", async () => {
    const orderRef = "order_bad";
    db.tables.order_items = [
      { order_ref: orderRef, product_name: "Hoodie", quantity: 1, product_id: "hoodie", size: "5XL", color: "Black", design_url: d("h") },
    ];
    const res = await post(eventBody(sessionFixture(orderRef)));
    expect(res.status).toBe(200);
    expect(printify.submitPrintifyOrderLines).not.toHaveBeenCalled();
    expect(db.tables.orders.find((o) => o.order_ref === orderRef)).toMatchObject({ status: "paid", printify_status: "needs_manual_review" });
    expect(notify.notifyFounders).toHaveBeenCalledTimes(1);
  });

  it("flags orders with no print source instead of silently skipping fulfilment", async () => {
    const orderRef = "order_noimg";
    const session = sessionFixture(orderRef);
    session.metadata = { order_ref: orderRef, design_url: "", product_type: "mug" };
    stripeState.lineItems = [{ description: "Mug", quantity: 1, amount_total: 1499, price: { unit_amount: 1499, product: { metadata: { productId: "mug", designUrl: "" } } } }];
    await post(eventBody(session));
    expect(printify.createPrintifyProduct).not.toHaveBeenCalled();
    expect(db.tables.orders.find((o) => o.order_ref === orderRef)?.printify_status).toBe("needs_manual_review");
    expect(notify.notifyFounders).toHaveBeenCalled();
  });

  it("is idempotent per Stripe event id and rejects bad signatures", async () => {
    const orderRef = "order_dupe";
    stripeState.lineItems = [{ description: "Mug", quantity: 1, amount_total: 1499, price: { unit_amount: 1499, product: { metadata: { productId: "mug", designUrl: d("m") } } } }];
    const body = eventBody(sessionFixture(orderRef), "evt_same");
    await post(body);
    await post(body);
    expect(printify.submitPrintifyOrderLines).toHaveBeenCalledTimes(1);
    const bad = await post(body, "forged");
    expect(bad.status).toBe(400);
  });
});


it("asks Stripe to redeliver a transient failure without losing the event", async () => {
  const db = createFakeSupabase(); state.supabase = db;
  stripeState.fetchError = true;
  const response = await post(eventBody(sessionFixture("retry_fetch"), "evt_retry_fetch"));
  expect(response.status).toBe(500);
  expect(db.tables.stripe_events).toHaveLength(0);
  expect(printify.submitPrintifyOrderLines).not.toHaveBeenCalled();
});
it("does not acknowledge a paid event without a working order database", async () => {
  state.supabase = null;
  expect((await post(eventBody(sessionFixture("no_database")))).status).toBe(500);
});
