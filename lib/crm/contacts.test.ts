import { describe, it, expect } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createFakeSupabase } from "@/tests/helpers/fakeSupabase";
import {
  recordConsentFromOrder,
  recordConsent,
  setUnsubscribedByToken,
} from "./contacts";
const email = "buyer@example.com";
const c = {
  id: "c",
  email,
  email_canonical: email,
  marketing_status: "opted_out",
  marketing_status_changed_at: "2026-10-04T10:00:00.000Z",
  unsubscribe_token: "a".repeat(48),
  orders_count: 1,
};
describe("customer permission", () => {
  it("captures a purchase without inferring marketing consent", async () => {
    const d = createFakeSupabase({
      orders: [{ order_ref: "o", status: "paid" }],
    });
    const r = await recordConsentFromOrder(d as unknown as SupabaseClient, {
      order_ref: "o",
      customer_email: email,
    });
    expect(r.contact?.marketing_status).toBe("unknown");
    expect(r.consentRecorded).toBe(false);
    expect(d.tables.orders[0].contact_id).toBeTruthy();
  });
  it("does not undo an unsubscribe when a delayed paid webhook arrives", async () => {
    const d = createFakeSupabase({
      contacts: [c],
      orders: [{ order_ref: "o", status: "paid" }],
    });
    const r = await recordConsentFromOrder(d as unknown as SupabaseClient, {
      order_ref: "o",
      customer_email: email,
      marketing_consent: true,
      consent_text_version: "checkout-v1",
      consent_recorded_at: "2026-10-04T09:00:00.000Z",
    });
    expect(r.consentRecorded).toBe(false);
    expect(d.tables.contacts[0].marketing_status).toBe("opted_out");
  });
  it("preserves a suppression after another signup", async () => {
    const d = createFakeSupabase({
      contacts: [{ ...c, marketing_status: "suppressed" }],
      suppressions: [{ email_canonical: email }],
    });
    const r = await recordConsent(d as unknown as SupabaseClient, {
      email,
      source: "homepage",
      decision: "opt_in",
      textVersion: "newsletter-v1",
    });
    expect(r.contact.marketing_status).toBe("suppressed");
  });
  it("a random or malformed unsubscribe token cannot change a contact", async () => {
    const d = createFakeSupabase({
      contacts: [{ ...c, marketing_status: "opted_in" }],
    });
    expect(
      await setUnsubscribedByToken(d as unknown as SupabaseClient, "bad"),
    ).toEqual({ ok: false });
    expect(
      await setUnsubscribedByToken(
        d as unknown as SupabaseClient,
        "b".repeat(48),
      ),
    ).toEqual({ ok: false });
    expect(d.tables.contacts[0].marketing_status).toBe("opted_in");
  });
});
