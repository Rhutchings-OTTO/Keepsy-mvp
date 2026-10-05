import { describe, it, expect } from "vitest";
import { validPushEndpoint } from "./outbox";
import { isOwnerUser } from "@/lib/admin/ownerAllowlist";
describe("owner access and push safety", () => {
  it.each([
    "https://fcm.googleapis.com/send/a",
    "https://updates.push.services.mozilla.com/wpush/v2/a",
    "https://web.push.apple.com/Q/a",
  ])("accepts the supported push provider %s", (u) =>
    expect(validPushEndpoint(u)).toBe(true),
  );
  it.each([
    "http://fcm.googleapis.com/a",
    "https://localhost/a",
    "https://127.0.0.1/a",
    "https://web.push.apple.com.attacker.test/a",
    "https://u:p@fcm.googleapis.com/a",
    "https://fcm.googleapis.com:444/a",
  ])("rejects unsafe endpoints %s", (u) =>
    expect(validPushEndpoint(u)).toBe(false),
  );
  it("requires confirmed email, not phone confirmation, for owner access", () => {
    const env: NodeJS.ProcessEnv = {
      NODE_ENV: "test",
      OWNER_EMAILS: "owner@example.com",
    };
    expect(
      isOwnerUser({ email: "owner@example.com", confirmed_at: "today" }, env),
    ).toBe(false);
    expect(
      isOwnerUser(
        { email: "owner@example.com", email_confirmed_at: "today" },
        env,
      ),
    ).toBe(true);
    expect(
      isOwnerUser(
        { email: "other@example.com", email_confirmed_at: "today" },
        env,
      ),
    ).toBe(false);
    expect(
      isOwnerUser(
        { email: "owner@example.com", email_confirmed_at: "today" },
        { NODE_ENV: "test" },
      ),
    ).toBe(false);
  });
});
