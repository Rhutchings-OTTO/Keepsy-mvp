import { describe, it, expect, beforeAll } from "vitest";
import {
  canonicalEmail,
  issueWelcomeCode,
  normaliseCode,
  validateWelcomeCode,
  verifyWelcomeCodeSignature,
  type DiscountCodeRow,
} from "./discounts";

const env = {
  WELCOME_CODE_SECRET: "test-secret-that-is-long-enough",
} as unknown as NodeJS.ProcessEnv;
const noEnv = {} as unknown as NodeJS.ProcessEnv;

function row(
  code: string,
  overrides: Partial<DiscountCodeRow> = {},
): DiscountCodeRow {
  return {
    code,
    offer_id: "welcome10",
    percent: 10,
    email_canonical: "sam@example.com",
    issued_at: "2026-09-01T00:00:00.000Z",
    expires_at: "2026-12-01T00:00:00.000Z",
    redeemed_at: null,
    redeemed_order_ref: null,
    locked_order_ref: null,
    locked_at: null,
    revoked_at: null,
    ...overrides,
  };
}

const lines = [
  { productId: "tee", unitPrice: 29.99, quantity: 2 },
  { productId: "postcard", unitPrice: 6.99, quantity: 1 },
];
const now = new Date("2026-09-09T12:00:00.000Z");

let code: string;
beforeAll(async () => {
  code = (await issueWelcomeCode(now, env)).code;
});

describe("welcome codes", () => {
  it("issues signed, unique, well-formed codes that verify", async () => {
    const a = await issueWelcomeCode(now, env);
    const b = await issueWelcomeCode(now, env);
    expect(a.code).toMatch(/^KEEPSY-[A-Z2-9]{6}-[A-Z2-9]{4}$/);
    expect(a.code).not.toBe(b.code);
    expect(a.expiresAt > a.issuedAt).toBe(true);
    expect(await verifyWelcomeCodeSignature(a.code, env)).toBe(true);
    expect(await verifyWelcomeCodeSignature(a.code.toLowerCase(), env)).toBe(
      true,
    );
  });

  it("rejects forged or tampered codes without touching the database", async () => {
    const tampered = code.slice(0, -1) + (code.endsWith("A") ? "B" : "A");
    expect(await verifyWelcomeCodeSignature(tampered, env)).toBe(false);
    expect(await verifyWelcomeCodeSignature("KEEPSY10", env)).toBe(false);
    expect(await verifyWelcomeCodeSignature(code, noEnv)).toBe(false);
  });

  it("refuses to issue without a configured secret", async () => {
    await expect(issueWelcomeCode(now, noEnv)).rejects.toThrow(
      /WELCOME_CODE_SECRET/,
    );
  });

  it("canonicalises emails so one person gets one code", () => {
    expect(canonicalEmail(" Sam.Buyer+promo@GMAIL.com ")).toBe(
      "sambuyer@gmail.com",
    );
    expect(canonicalEmail("sam+x@example.com")).toBe("sam@example.com");
    expect(canonicalEmail("s.a.m@googlemail.com")).toBe("sam@gmail.com");
  });

  it("applies 10% to the eligible subtotal only and never to shipping", () => {
    const res = validateWelcomeCode({
      code,
      row: row(code),
      signatureOk: true,
      email: "sam@example.com",
      priorPaidOrders: 0,
      market: "GB",
      currency: "gbp",
      lines,
      now,
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.eligibleSubtotal).toBe(66.97);
    expect(res.discountAmount).toBe(6.69);
    expect(res.conditions).toContain("first order only");
  });

  it("is first-order only and bound to the signup email", () => {
    const base = {
      code,
      row: row(code),
      signatureOk: true,
      market: "GB" as const,
      currency: "gbp" as const,
      lines,
      now,
    };
    expect(
      validateWelcomeCode({
        ...base,
        email: "sam@example.com",
        priorPaidOrders: 1,
      }),
    ).toMatchObject({ ok: false, reason: "not_first_order" });
    expect(
      validateWelcomeCode({
        ...base,
        email: "other@example.com",
        priorPaidOrders: 0,
      }),
    ).toMatchObject({ ok: false, reason: "email_mismatch" });
    expect(
      validateWelcomeCode({
        ...base,
        email: "Sam+gift@Example.com",
        priorPaidOrders: 0,
      }).ok,
    ).toBe(true);
  });

  it("rejects redeemed, expired, revoked, in-use and unsigned codes", () => {
    const base = {
      code,
      signatureOk: true,
      email: "sam@example.com",
      priorPaidOrders: 0,
      market: "GB" as const,
      currency: "gbp" as const,
      lines,
      now,
    };
    expect(
      validateWelcomeCode({
        ...base,
        row: row(code, { redeemed_at: "2026-09-02T00:00:00Z" }),
      }),
    ).toMatchObject({ ok: false, reason: "redeemed" });
    expect(
      validateWelcomeCode({
        ...base,
        row: row(code, { expires_at: "2026-09-01T00:00:00Z" }),
      }),
    ).toMatchObject({ ok: false, reason: "expired" });
    expect(
      validateWelcomeCode({
        ...base,
        row: row(code, { revoked_at: "2026-09-01T00:00:00Z" }),
      }),
    ).toMatchObject({ ok: false, reason: "invalid" });
    expect(
      validateWelcomeCode({
        ...base,
        row: row(code, {
          locked_order_ref: "order_other",
          locked_at: now.toISOString(),
        }),
      }),
    ).toMatchObject({ ok: false, reason: "in_use" });
    // A stale lock (older than the lock window) is released.
    expect(
      validateWelcomeCode({
        ...base,
        row: row(code, {
          locked_order_ref: "order_other",
          locked_at: "2026-09-09T09:00:00.000Z",
        }),
      }).ok,
    ).toBe(true);
    // The same checkout re-validating its own lock is fine.
    expect(
      validateWelcomeCode({
        ...base,
        orderRef: "order_me",
        row: row(code, {
          locked_order_ref: "order_me",
          locked_at: now.toISOString(),
        }),
      }).ok,
    ).toBe(true);
    expect(
      validateWelcomeCode({ ...base, row: row(code), signatureOk: false }),
    ).toMatchObject({ ok: false, reason: "invalid" });
    expect(validateWelcomeCode({ ...base, row: null })).toMatchObject({
      ok: false,
      reason: "invalid",
    });
  });

  it("refuses markets without the offer and empty eligible baskets", () => {
    const base = {
      code,
      row: row(code),
      signatureOk: true,
      email: "sam@example.com",
      priorPaidOrders: 0,
      currency: "gbp" as const,
      now,
    };
    expect(validateWelcomeCode({ ...base, market: "EU", lines })).toMatchObject(
      { ok: false, reason: "market" },
    );
    expect(
      validateWelcomeCode({ ...base, market: "GB", lines: [] }),
    ).toMatchObject({ ok: false, reason: "no_eligible_lines" });
  });

  it("normalises user-typed codes", () => {
    expect(normaliseCode(" keepsy-ab3k9q x7t2 ")).toBe("KEEPSY-AB3K9Q-X7T2");
    expect(normaliseCode("KEEPSYAB3K9QX7T2")).toBe("KEEPSY-AB3K9Q-X7T2");
  });
});
