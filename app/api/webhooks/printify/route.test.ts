import { describe, it, expect, vi, beforeEach } from "vitest";
import { createHmac } from "node:crypto";
import { createFakeSupabase } from "@/tests/helpers/fakeSupabase";
const state = vi.hoisted(() => ({ db: null as unknown, provider: vi.fn() }));
vi.mock("@/lib/printify", () => ({ getPrintifyOrder: state.provider }));
vi.mock("@/lib/supabaseAdmin", () => ({ getSupabaseAdmin: () => state.db }));
vi.mock("next/server", () => ({ after: vi.fn() }));
vi.mock("@/lib/emails/orderEmails", () => ({
  sendInProductionEmail: vi.fn(),
  sendShippedEmail: vi.fn(),
  sendDeliveredEmail: vi.fn(),
}));
vi.mock("@/lib/notifications", () => ({
  notifyFounders: vi.fn(async () => {}),
}));
import { POST } from "./route";
beforeEach(() => {
  vi.stubEnv("PRINTIFY_WEBHOOK_SECRET", "webhook-test-secret");
  state.provider.mockReset();
  state.provider.mockResolvedValue({
    status: "fulfilled",
    external_id: "order_o",
    shipments: [{ number: "track", url: "https://track.example" }],
  });
});
function request(type: string, id = "e") {
  const body = JSON.stringify({
    id,
    type,
    resource: {
      id: "p1",
      data: {
        carrier: {
          code: "USPS",
          tracking_number: "track",
          tracking_url: "https://track.example",
        },
        skus: ["6202"],
      },
    },
  });
  return new Request("https://keepsy.store/api/webhooks/printify", {
    method: "POST",
    body,
    headers: {
      "x-pfy-signature": createHmac("sha256", "webhook-test-secret")
        .update(body)
        .digest("hex"),
    },
  });
}
describe("Printify callbacks", () => {
  it("never regresses delivery when older production or shipment updates arrive", async () => {
    const d = createFakeSupabase({
      orders: [
        {
          order_ref: "o",
          printify_order_id: "p1",
          status: "delivered",
          printify_status: "delivered",
        },
      ],
    });
    state.db = d;
    expect((await POST(request("order:sent-to-production"))).status).toBe(200);
    expect((await POST(request("order:shipment:created", "e2"))).status).toBe(
      200,
    );
    expect(d.tables.orders[0].status).toBe("delivered");
  });
  it("records one timeline event and owner alert when a provider callback repeats", async () => {
    const d = createFakeSupabase({
      orders: [{ order_ref: "o", printify_order_id: "p1", status: "paid" }],
    });
    state.db = d;
    await POST(request("order:shipment:created"));
    await POST(request("order:shipment:created"));
    expect(d.tables.order_events).toHaveLength(1);
    expect(d.tables.notification_outbox).toHaveLength(1);
    expect(d.tables.orders[0]).toMatchObject({
      status: "shipped",
      tracking_number: "track",
    });
  });
  it("requests redelivery when the provider callback beats the saved order", async () => {
    state.db = createFakeSupabase();
    expect((await POST(request("order:created"))).status).toBe(503);
  });
  it("rejects forged signatures and oversized bodies without trusting event data", async () => {
    state.db = createFakeSupabase();
    expect(
      (
        await POST(
          new Request("https://keepsy.store/api/webhooks/printify", {
            method: "POST",
            body: "{}",
          }),
        )
      ).status,
    ).toBe(401);
    expect(
      (
        await POST(
          new Request("https://keepsy.store/api/webhooks/printify", {
            method: "POST",
            body: "x".repeat(65537),
          }),
        )
      ).status,
    ).toBe(413);
  });
  it("keeps partial deliveries open until all shipments are delivered", async () => {
    const d = createFakeSupabase({
      orders: [
        {
          order_ref: "o",
          printify_order_id: "p1",
          status: "shipped",
          printify_status: "shipped",
        },
      ],
    });
    state.db = d;
    state.provider.mockResolvedValueOnce({
      status: "fulfilled",
      shipments: [{ number: "a", delivered_at: "today" }, { number: "b" }],
    });
    await POST(request("order:shipment:delivered", "partial"));
    expect(d.tables.orders[0]).toMatchObject({
      status: "shipped",
      printify_status: "partially_delivered",
    });
    expect(d.tables.order_events[0].type).toBe("shipment_delivered");
    state.provider.mockResolvedValueOnce({
      status: "fulfilled",
      shipments: [
        { number: "a", delivered_at: "today" },
        { number: "b", delivered_at: "today" },
      ],
    });
    await POST(request("order:shipment:delivered", "all"));
    expect(d.tables.orders[0].status).toBe("delivered");
  });
  it("requests retry when the complete provider order cannot be verified", async () => {
    state.db = createFakeSupabase({
      orders: [{ order_ref: "o", printify_order_id: "p1", status: "paid" }],
    });
    state.provider.mockRejectedValueOnce(new Error("Temporary outage"));
    expect((await POST(request("order:shipment:created"))).status).toBe(503);
  });
  it("acknowledges unrelated shop orders without changing Keepsy", async () => {
    const d = createFakeSupabase();
    state.db = d;
    state.provider.mockResolvedValueOnce({
      external_id: "another-integration-123",
    });
    expect((await POST(request("order:created"))).status).toBe(200);
    expect(d.tables.notification_outbox).toBeUndefined();
  });
});
