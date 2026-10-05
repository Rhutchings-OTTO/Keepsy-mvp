import { describe, it, expect, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { countPriorPaidOrders } from "./discountServer";
describe("first order verification", () => {
  it("uses the canonical historic email query for both guests and accounts", async () => {
    const rpc = vi.fn(async () => ({ data: 1, error: null }));
    expect(
      await countPriorPaidOrders({ rpc } as unknown as SupabaseClient, {
        email: "b.uyer+tag@gmail.com",
        userId: "u",
      }),
    ).toBe(1);
    expect(rpc).toHaveBeenCalledWith("crm_count_paid_orders", {
      email_address: "b.uyer+tag@gmail.com",
      customer_id: "u",
    });
  });
  it("fails closed when eligibility cannot be checked", async () => {
    const rpc = async () => ({
      data: null,
      error: { message: "Database offline" },
    });
    await expect(
      countPriorPaidOrders({ rpc } as unknown as SupabaseClient, {
        email: "buyer@example.com",
      }),
    ).rejects.toThrow("Cannot verify");
  });
});
