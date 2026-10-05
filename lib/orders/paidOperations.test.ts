import { beforeEach, describe, it, expect, vi } from "vitest";
import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createFakeSupabase } from "@/tests/helpers/fakeSupabase";
const m = vi.hoisted(() => ({ redeem: vi.fn() }));
vi.mock("@/lib/crm/contacts", () => ({
  recordConsentFromOrder: async () => ({ contact: null }),
}));
vi.mock("@/lib/commerce/discountServer", () => ({
  redeemWelcomeCode: m.redeem,
}));
import { paidOperations } from "./paidOperations";
const paid = {
  id: "cs",
  amount_total: 2000,
  amount_subtotal: 1800,
  currency: "gbp",
  total_details: { amount_shipping: 200, amount_discount: 0 },
  customer_details: { email: "buyer@example.com" },
  collected_information: { shipping_details: { address: { country: "GB" } } },
} as unknown as Stripe.Checkout.Session;
beforeEach(() => {
  m.redeem.mockReset();
  m.redeem.mockResolvedValue("redeemed");
});
describe("payment audit before production", () => {
  it("stops fulfilment when Stripe's paid destination differs", async () => {
    const d = createFakeSupabase({
      orders: [{ order_ref: "o", destination_country: "US" }],
    });
    expect(
      await paidOperations(d as unknown as SupabaseClient, paid, "o"),
    ).toBe(false);
    expect(d.tables.orders[0].printify_status).toBe("needs_manual_review");
  });
  it("stops reused or mismatched welcome codes before printing", async () => {
    const d = createFakeSupabase({
      orders: [
        {
          order_ref: "o",
          destination_country: "GB",
          checkout_email: "buyer@example.com",
          discount_kind: "welcome",
          discount_code: "code",
        },
      ],
    });
    m.redeem.mockResolvedValueOnce("already_other_order");
    expect(
      await paidOperations(d as unknown as SupabaseClient, paid, "o"),
    ).toBe(false);
    d.tables.orders[0].checkout_email = "someone@example.com";
    expect(
      await paidOperations(d as unknown as SupabaseClient, paid, "o"),
    ).toBe(false);
    expect(m.redeem).toHaveBeenCalledTimes(1);
  });
  it("deduplicates owner alerts and payment events while persisting actual money totals", async () => {
    const d = createFakeSupabase({
      orders: [{ order_ref: "o", destination_country: "GB" }],
    });
    await paidOperations(d as unknown as SupabaseClient, paid, "o");
    await paidOperations(d as unknown as SupabaseClient, paid, "o");
    expect(d.tables.order_events).toHaveLength(1);
    expect(d.tables.notification_outbox).toHaveLength(1);
    expect(d.tables.orders[0]).toMatchObject({
      amount_total_minor: 2000,
      amount_shipping_minor: 200,
    });
  });
});
