import { describe, it, expect, vi, beforeEach } from "vitest";
import { createFakeSupabase } from "@/tests/helpers/fakeSupabase";

vi.mock("sharp", () => {
  const instance = {
    metadata: async () => ({ width: 3000, height: 2000, format: "png" }),
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
  TEE_PRINT_W: 4500,
  TEE_PRINT_H: 5100,
  HOODIE_PRINT_W: 4500,
  HOODIE_PRINT_H: 3000,
}));

const printify = vi.hoisted(() => ({
  uploadImageToPrintify: vi.fn(async (_img: unknown, name: string) => `img_${name}`),
  createPrintifyProduct: vi.fn(async (p: { variantId: number }) => `prod_${p.variantId}`),
  submitPrintifyOrderLines: vi.fn(async (_args: unknown) => "printify_order_1"),
}));
vi.mock("@/lib/printify", () => ({
  ...printify,
  splitName: (n: string) => ({ first_name: n, last_name: "" }),
}));

import { fulfilOrderLines, validateLines, SubmitUncertainError, type FulfilmentLine } from "./printifyFulfilment";
import type { SupabaseClient } from "@supabase/supabase-js";

const d = (n: string) => `https://res.cloudinary.com/demo/image/upload/v1/keepsy-designs/${n}.png`;
const address = { first_name: "A", last_name: "B", email: "a@b.c", country: "GB", address1: "1 St", city: "Leeds", zip: "LS1" };

beforeEach(() => {
  vi.clearAllMocks();
  printify.submitPrintifyOrderLines.mockResolvedValue("printify_order_1");
  vi.stubGlobal("fetch", vi.fn(async () => new Response(Buffer.from("img"), { status: 200 })));
});

describe("fulfilOrderLines", () => {
  it("creates one Printify product per line and ONE order carrying every line with its quantity", async () => {
    const supabase = createFakeSupabase({ orders: [{ order_ref: "order_1" }] });
    const lines: FulfilmentLine[] = [
      { productId: "tee", color: "White", size: "M", quantity: 2, designUrl: d("a") },
      { productId: "tee", color: "White", size: "L", quantity: 1, designUrl: d("a") },
      { productId: "postcard", quantity: 1, designUrl: d("a"), sourceKind: "original" },
      { productId: "canvas_20x16", size: "20x16", quantity: 1, designUrl: d("a"), croppedImageUrl: d("crop") },
    ];
    const result = await fulfilOrderLines({ orderRef: "order_1", region: "UK", lines, address, supabase: supabase as unknown as SupabaseClient, log: () => {} });

    expect(printify.createPrintifyProduct).toHaveBeenCalledTimes(4);
    // Tee M and tee L share one uploaded image (same design), postcard composites its own, canvas uses the crop URL.
    expect(printify.uploadImageToPrintify).toHaveBeenCalledTimes(3);
    expect(printify.uploadImageToPrintify.mock.calls[2][0]).toBe(d("crop"));

    expect(printify.submitPrintifyOrderLines).toHaveBeenCalledTimes(1);
    const submitted = printify.submitPrintifyOrderLines.mock.calls[0][0] as { lineItems: Array<{ variant_id: number; quantity: number }> };
    expect(submitted.lineItems.map((li) => li.quantity)).toEqual([2, 1, 1, 1]);
    // Variant ids: White/M=73203, White/L=73207, postcard 6x4=76317, canvas 20x16=91629
    expect(submitted.lineItems.map((li) => li.variant_id)).toEqual([73203, 73207, 76317, 91629]);

    expect(result.printifyOrderId).toBe("printify_order_1");
    expect(result.lines).toHaveLength(4);
    const order = supabase.tables.orders[0];
    expect(order.status).toBe("in_production");
    expect(order.printify_status).toBe("sent_to_printify");
    expect((order.fulfilment as { lines: unknown[] }).lines).toHaveLength(4);
  });

  it("refuses the whole order (no Printify calls) when any line cannot be fulfilled honestly", async () => {
    const lines: FulfilmentLine[] = [
      { productId: "tee", color: "White", size: "M", quantity: 1, designUrl: d("a") },
      { productId: "hoodie", color: "Black", size: "5XL", quantity: 1, designUrl: d("a") },
    ];
    expect(validateLines(lines, "UK")).toEqual([expect.stringMatching(/line 2: .*5XL/)]);
    await expect(fulfilOrderLines({ orderRef: "order_2", region: "UK", lines, address, log: () => {} })).rejects.toThrow(/Refusing to fulfil/);
    expect(printify.createPrintifyProduct).not.toHaveBeenCalled();
    expect(printify.submitPrintifyOrderLines).not.toHaveBeenCalled();
  });

  it("refuses unknown product ids instead of silently printing a postcard", async () => {
    const lines: FulfilmentLine[] = [{ productId: "premiumtee", quantity: 1, designUrl: d("a") }];
    expect(validateLines(lines, "US")[0]).toMatch(/unknown product id/);
    await expect(fulfilOrderLines({ orderRef: "order_3", region: "US", lines, address, log: () => {} })).rejects.toThrow();
  });

  it("refuses lines without an https print source", () => {
    expect(validateLines([{ productId: "mug", quantity: 1, designUrl: "" }], "UK")[0]).toMatch(/missing https design URL/);
    expect(validateLines([{ productId: "mug", quantity: 1, designUrl: "data:image/png;base64,AAAA" }], "UK")[0]).toMatch(/missing https/);
  });

  it("uses the US mug blueprint for US shipping addresses", async () => {
    await fulfilOrderLines({ orderRef: "order_4", region: "US", lines: [{ productId: "mug", quantity: 2, designUrl: d("m") }], address: { ...address, country: "US" }, log: () => {} });
    const created = printify.createPrintifyProduct.mock.calls[0][0] as { blueprintId: number; variantId: number };
    expect(created.blueprintId).toBe(68);
    expect(created.variantId).toBe(33719);
  });
});


describe("fulfilment retry protection", () => {
  const line: FulfilmentLine = { productId: "mug", quantity: 1, designUrl: d("retry") };
  function args(db: ReturnType<typeof createFakeSupabase>) {
    return { orderRef: "retry_order", region: "UK" as const, lines: [line], address, supabase: db as unknown as SupabaseClient, log: () => {} };
  }
  it("skips an order already accepted by Printify", async () => {
    const db = createFakeSupabase({ orders: [{ order_ref: "retry_order", printify_order_id: "existing" }] });
    expect(await fulfilOrderLines(args(db))).toMatchObject({ printifyOrderId: "existing", alreadyFulfilled: true });
    expect(printify.submitPrintifyOrderLines).not.toHaveBeenCalled();
  });
  it("allows only one of two concurrent fulfilment attempts to submit", async () => {
    const db = createFakeSupabase({ orders: [{ order_ref: "retry_order" }] });
    const results = await Promise.allSettled([fulfilOrderLines(args(db)), fulfilOrderLines(args(db))]);
    expect(results.filter(r => r.status === "fulfilled")).toHaveLength(1);
    expect(printify.submitPrintifyOrderLines).toHaveBeenCalledTimes(1);
  });
  it("freezes an ambiguous submit and refuses all subsequent retries", async () => {
    const db = createFakeSupabase({ orders: [{ order_ref: "retry_order" }] });
    printify.submitPrintifyOrderLines.mockRejectedValueOnce(new Error("fetch failed"));
    await expect(fulfilOrderLines(args(db))).rejects.toBeInstanceOf(SubmitUncertainError);
    expect(db.tables.orders[0].printify_status).toBe("submit_uncertain");
    await expect(fulfilOrderLines(args(db))).rejects.toBeInstanceOf(SubmitUncertainError);
    expect(printify.submitPrintifyOrderLines).toHaveBeenCalledTimes(1);
  });
});
