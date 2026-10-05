import { beforeEach, describe, it, expect, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  createFakeSupabase,
  type FakeSupabase,
} from "@/tests/helpers/fakeSupabase";
const m = vi.hoisted(() => ({ send: vi.fn() }));
vi.mock("resend", () => ({
  Resend: class {
    emails = { send: m.send };
  },
}));
vi.mock("./templates", () => ({
  renderTemplate: async () => ({
    subject: "A note",
    html: "<p>Hello</p>",
    text: "Hello",
  }),
}));
import { drainEmailQueue, enqueueEmail } from "./queue";
const client = (d: FakeSupabase) => d as unknown as SupabaseClient;
function seed(status = "opted_in") {
  const d = createFakeSupabase({
    contacts: [
      {
        id: "c",
        email: "test@example.com",
        email_canonical: "test@example.com",
        marketing_status: status,
        unsubscribe_token: "a".repeat(48),
      },
    ],
    email_queue: [
      {
        id: "q",
        contact_id: "c",
        to_email: "test@example.com",
        dedupe_key: "welcome:c",
        template_key: "welcome",
        payload: {},
        status: "sending",
        attempts: 1,
        first_attempt_at: new Date().toISOString(),
      },
    ],
  });
  d.rpc = vi.fn(async () => ({
    data: d.tables.email_queue.map((r) => ({ ...r })),
    error: null,
  }));
  return d;
}
beforeEach(() => {
  vi.stubEnv("EMAIL_QUEUE_ENABLED", "true");
  vi.stubEnv("RESEND_API_KEY", "test");
  m.send.mockReset();
  m.send.mockResolvedValue({ data: { id: "provider-id" }, error: null });
});
describe("email dispatch", () => {
  it.each(["unknown", "opted_out", "suppressed"])(
    "does not send to %s contacts",
    async (status) => {
      const d = seed(status);
      await drainEmailQueue(client(d));
      expect(m.send).not.toHaveBeenCalled();
      expect(d.tables.email_queue[0].status).toBe("skipped");
    },
  );
  it("checks suppression even when an old opt-in is still recorded", async () => {
    const d = seed();
    d.tables.suppressions = [{ email_canonical: "test@example.com" }];
    await drainEmailQueue(client(d));
    expect(m.send).not.toHaveBeenCalled();
  });
  it("sends with an immutable retry key and one-click unsubscribe headers", async () => {
    const d = seed();
    await drainEmailQueue(client(d));
    expect(m.send.mock.calls[0][1]).toEqual({
      idempotencyKey: "keepsy-email/q",
    });
    expect(m.send.mock.calls[0][0].headers["List-Unsubscribe-Post"]).toBe(
      "List-Unsubscribe=One-Click",
    );
    expect(d.tables.email_queue[0]).toMatchObject({
      status: "sent",
      provider_message_id: "provider-id",
    });
  });
  it("retries provider errors using the same idempotency key", async () => {
    const d = seed();
    m.send.mockResolvedValueOnce({ error: { message: "Temporary outage" } });
    await drainEmailQueue(client(d));
    expect(d.tables.email_queue[0].status).toBe("failed");
    await drainEmailQueue(client(d));
    expect(m.send.mock.calls[1][1]).toEqual(m.send.mock.calls[0][1]);
    expect(d.tables.email_queue[0].status).toBe("sent");
  });
  it("does not burn an attempt when a campaign is paused after claiming", async () => {
    const d = seed();
    d.tables.email_queue[0].campaign_id = "campaign";
    d.tables.campaigns = [{ id: "campaign", status: "paused" }];
    await drainEmailQueue(client(d));
    expect(m.send).not.toHaveBeenCalled();
    expect(d.tables.email_queue[0]).toMatchObject({
      status: "queued",
      attempts: 0,
      first_attempt_at: null,
    });
  });
  it("deduplicates retries without replacing the original email payload", async () => {
    const d = createFakeSupabase();
    const a = {
      contactId: "c",
      email: "test@example.com",
      key: "welcome:c",
      template: "welcome" as const,
      payload: { code: "first" },
    };
    await enqueueEmail(client(d), a);
    await enqueueEmail(client(d), { ...a, payload: { code: "changed" } });
    expect(d.tables.email_queue).toHaveLength(1);
    expect(d.tables.email_queue[0].payload).toEqual({ code: "first" });
  });
  it("makes no provider or database claims when sending is paused", async () => {
    vi.stubEnv("EMAIL_QUEUE_ENABLED", "false");
    const d = seed();
    expect(await drainEmailQueue(client(d))).toEqual({
      enabled: false,
      sent: 0,
    });
    expect(d.rpc).not.toHaveBeenCalled();
    expect(m.send).not.toHaveBeenCalled();
  });
});
