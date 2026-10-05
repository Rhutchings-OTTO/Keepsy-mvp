/**
 * First-order welcome discount: signed, unique, single-use codes.
 *
 * Issuance (newsletter signup / owner):
 *   code = KEEPSY-<6 random chars>-<4 HMAC chars>, bound to one canonical
 *   email, stored in `discount_codes` (see migration 202609090001). The HMAC
 *   tail lets us reject forged codes without a database round trip and lets
 *   an operator verify authenticity offline with WELCOME_CODE_SECRET.
 *
 * Redemption (checkout):
 *   1. code parses + HMAC ok            → else "invalid"
 *   2. row exists, not revoked/expired  → else "expired"/"invalid"
 *   3. not redeemed / not locked by a different live checkout
 *   4. email supplied matches the bound canonical email
 *   5. customer has no prior paid order (email or user id) → first order only
 *   6. market allowed, basket ≥ minimum, at least one eligible line
 *   7. discount = 10% of the ELIGIBLE subtotal (never shipping)
 *   → checkout locks the code to the order, applies a one-off Stripe coupon
 *     for exactly that amount, and the webhook marks it redeemed on payment.
 *
 * Pure + edge-safe (Web Crypto). Database access stays in the routes.
 */
import type { Currency } from "@/lib/commerce/pricing";
import { roundMoney } from "@/lib/commerce/pricing";
import type { MarketCode } from "@/lib/commerce/markets";
import {
  WELCOME_ALLOWED_MARKETS,
  WELCOME_MIN_SUBTOTAL,
  WELCOME_PERCENT,
  isWelcomeEligibleProduct,
} from "@/lib/commerce/discountPolicy";

export const WELCOME_OFFER = {
  id: "welcome10",
  percent: WELCOME_PERCENT,
  /** Bump when the promise wording changes; recorded with every consent/issuance. */
  textVersion: "welcome10-v1",
  validityDays: 90,
  prefix: "KEEPSY",
  /** How long a checkout may hold a code before the lock is considered stale. */
  lockMinutes: 60,
} as const;

// Unambiguous alphabet: no 0/O/1/I.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_RE = /^KEEPSY-([A-Z2-9]{6})-([A-Z2-9]{4})$/;

export function normaliseCode(input: string): string {
  return input
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace(/^KEEPSY-?/, "KEEPSY-")
    .replace(/^(KEEPSY-[A-Z2-9]{6})-?([A-Z2-9]{4})$/, "$1-$2");
}

/** Lower-case, trimmed; strips +tags; Gmail dots removed (one code per person). */
export function canonicalEmail(email: string): string {
  const e = email.trim().toLowerCase();
  const at = e.lastIndexOf("@");
  if (at <= 0) return e;
  let local = e.slice(0, at);
  let domain = e.slice(at + 1);
  if (domain === "googlemail.com") domain = "gmail.com";
  const plus = local.indexOf("+");
  if (plus > 0) local = local.slice(0, plus);
  if (domain === "gmail.com") local = local.replace(/\./g, "");
  return `${local}@${domain}`;
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

function getSecret(env: NodeJS.ProcessEnv = process.env): string | null {
  const s = env.WELCOME_CODE_SECRET;
  return s && s.length >= 16 ? s : null;
}

export function isWelcomeIssuanceConfigured(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return getSecret(env) !== null;
}

async function hmacTail(body: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body)),
  );
  let out = "";
  for (let i = 0; i < 4; i += 1) out += ALPHABET[sig[i] % ALPHABET.length];
  return out;
}

function randomBody(): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  let out = "";
  for (const b of bytes) out += ALPHABET[b % ALPHABET.length];
  return out;
}

export type IssuedCode = {
  code: string;
  offerId: typeof WELCOME_OFFER.id;
  percent: number;
  textVersion: string;
  issuedAt: string;
  expiresAt: string;
};

/** Create a new signed code. Throws when WELCOME_CODE_SECRET is not configured. */
export async function issueWelcomeCode(
  now: Date = new Date(),
  env: NodeJS.ProcessEnv = process.env,
): Promise<IssuedCode> {
  const secret = getSecret(env);
  if (!secret)
    throw new Error(
      "WELCOME_CODE_SECRET is not configured (min 16 chars). Welcome codes cannot be issued.",
    );
  const body = randomBody();
  const tail = await hmacTail(body, secret);
  const expires = new Date(
    now.getTime() + WELCOME_OFFER.validityDays * 24 * 60 * 60 * 1000,
  );
  return {
    code: `${WELCOME_OFFER.prefix}-${body}-${tail}`,
    offerId: WELCOME_OFFER.id,
    percent: WELCOME_OFFER.percent,
    textVersion: WELCOME_OFFER.textVersion,
    issuedAt: now.toISOString(),
    expiresAt: expires.toISOString(),
  };
}

/** Structural + signature check. Does not touch the database. */
export async function verifyWelcomeCodeSignature(
  code: string,
  env: NodeJS.ProcessEnv = process.env,
): Promise<boolean> {
  const secret = getSecret(env);
  if (!secret) return false;
  const m = CODE_RE.exec(normaliseCode(code));
  if (!m) return false;
  const expected = await hmacTail(m[1], secret);
  return expected === m[2];
}

/** Shape of a `discount_codes` row the validator needs. */
export type DiscountCodeRow = {
  code: string;
  offer_id: string;
  percent: number;
  email_canonical: string;
  issued_at: string;
  expires_at: string;
  redeemed_at: string | null;
  redeemed_order_ref: string | null;
  locked_order_ref: string | null;
  locked_at: string | null;
  revoked_at: string | null;
};

export type DiscountLine = {
  productId: string;
  unitPrice: number;
  quantity: number;
};

export type WelcomeValidationInput = {
  code: string;
  row: DiscountCodeRow | null;
  signatureOk: boolean;
  /** Email the customer gave with the code (will be locked on the Stripe session). */
  email: string;
  /** Paid/fulfilled orders already on file for this email or signed-in user. */
  priorPaidOrders: number;
  market: MarketCode;
  currency: Currency;
  lines: DiscountLine[];
  /** The order ref of the checkout being created (a lock by the same ref is fine). */
  orderRef?: string;
  now?: Date;
};

export type WelcomeValidation =
  | {
      ok: true;
      code: string;
      percent: number;
      eligibleSubtotal: number;
      excludedSubtotal: number;
      discountAmount: number;
      conditions: string[];
    }
  | { ok: false; reason: WelcomeRejectReason; message: string };

export type WelcomeRejectReason =
  | "invalid"
  | "expired"
  | "redeemed"
  | "in_use"
  | "email_mismatch"
  | "not_first_order"
  | "market"
  | "minimum"
  | "no_eligible_lines";

export function validateWelcomeCode(
  input: WelcomeValidationInput,
): WelcomeValidation {
  const now = input.now ?? new Date();
  const code = normaliseCode(input.code);
  if (
    !CODE_RE.test(code) ||
    !input.signatureOk ||
    !input.row ||
    input.row.code !== code ||
    input.row.offer_id !== WELCOME_OFFER.id
  ) {
    return {
      ok: false,
      reason: "invalid",
      message:
        "That code isn't valid. Check for typos, or sign up for a new one.",
    };
  }
  const row = input.row;
  if (row.revoked_at)
    return {
      ok: false,
      reason: "invalid",
      message: "That code is no longer active.",
    };
  if (new Date(row.expires_at).getTime() < now.getTime()) {
    return {
      ok: false,
      reason: "expired",
      message: "That welcome code has expired. Contact us if you need a hand.",
    };
  }
  if (row.redeemed_at)
    return {
      ok: false,
      reason: "redeemed",
      message: "That code has already been used.",
    };
  if (
    row.locked_order_ref &&
    row.locked_order_ref !== input.orderRef &&
    row.locked_at
  ) {
    const lockAge = now.getTime() - new Date(row.locked_at).getTime();
    if (lockAge < WELCOME_OFFER.lockMinutes * 60 * 1000) {
      return {
        ok: false,
        reason: "in_use",
        message:
          "That code is being used in another checkout right now. Try again in an hour.",
      };
    }
  }
  if (
    !isValidEmail(input.email) ||
    canonicalEmail(input.email) !== row.email_canonical
  ) {
    return {
      ok: false,
      reason: "email_mismatch",
      message:
        "This code belongs to a different email address. Use the address you signed up with.",
    };
  }
  if (input.priorPaidOrders > 0) {
    return {
      ok: false,
      reason: "not_first_order",
      message:
        "Welcome codes are for first orders only, and this email has ordered before.",
    };
  }
  if (!WELCOME_ALLOWED_MARKETS.includes(input.market)) {
    return {
      ok: false,
      reason: "market",
      message:
        "The welcome offer isn't available for this delivery country yet.",
    };
  }
  let eligible = 0;
  let excluded = 0;
  for (const l of input.lines) {
    const amount = l.unitPrice * l.quantity;
    if (isWelcomeEligibleProduct(l.productId)) eligible += amount;
    else excluded += amount;
  }
  eligible = roundMoney(eligible);
  excluded = roundMoney(excluded);
  const min = WELCOME_MIN_SUBTOTAL[input.currency];
  if (eligible + excluded < min) {
    return {
      ok: false,
      reason: "minimum",
      message: `The welcome offer applies to baskets over ${input.currency === "usd" ? "$" : "£"}${min}.`,
    };
  }
  if (eligible <= 0) {
    return {
      ok: false,
      reason: "no_eligible_lines",
      message:
        "None of the items in your basket are eligible for the welcome offer.",
    };
  }
  const discountAmount = roundMoney(Math.floor(eligible * row.percent) / 100);
  if (discountAmount <= 0) {
    return {
      ok: false,
      reason: "no_eligible_lines",
      message: "The welcome offer doesn't apply to this basket.",
    };
  }
  const conditions = [
    `${row.percent}% off eligible items`,
    "first order only",
    "single use",
  ];
  if (excluded > 0) conditions.push("some items excluded");
  return {
    ok: true,
    code,
    percent: row.percent,
    eligibleSubtotal: eligible,
    excludedSubtotal: excluded,
    discountAmount,
    conditions,
  };
}
