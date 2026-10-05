/**
 * Database + Stripe side of the welcome discount (server only, edge-safe).
 * Pure validation lives in lib/commerce/discounts.ts.
 */
import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  WELCOME_OFFER,
  canonicalEmail,
  normaliseCode,
  validateWelcomeCode,
  verifyWelcomeCodeSignature,
  type DiscountCodeRow,
  type DiscountLine,
  type WelcomeValidation,
} from "@/lib/commerce/discounts";
import type { Currency } from "@/lib/commerce/pricing";
import type { MarketCode } from "@/lib/commerce/markets";

/** Order statuses that count as "has bought before". */
export const PAID_STATUSES = [
  "paid",
  "in_production",
  "shipped",
  "delivered",
] as const;

export async function lookupWelcomeCode(
  db: SupabaseClient,
  code: string,
): Promise<DiscountCodeRow | null> {
  const { data } = await db
    .from("discount_codes")
    .select(
      "code, offer_id, percent, email_canonical, issued_at, expires_at, redeemed_at, redeemed_order_ref, locked_order_ref, locked_at, revoked_at",
    )
    .eq("code", normaliseCode(code))
    .maybeSingle();
  return (data as DiscountCodeRow | null) ?? null;
}

/** Paid orders on file for this email (case-insensitive) and/or user id. */
export async function countPriorPaidOrders(
  db: SupabaseClient,
  args: { email?: string | null; userId?: string | null },
): Promise<number> {
  const { data, error } = await db.rpc("crm_count_paid_orders", {
    email_address: args.email || null,
    customer_id: args.userId || null,
  });
  if (error || typeof data !== "number")
    throw new Error("Cannot verify first-order eligibility");
  return data;
}

export type ResolvedDiscount =
  | {
      kind: "welcome";
      validation: Extract<WelcomeValidation, { ok: true }>;
      row: DiscountCodeRow;
    }
  | {
      kind: "stripe_promotion";
      promotionCodeId: string;
      code: string;
      percent: number;
      discountAmount: number;
      conditions: string[];
    };

export type DiscountResolution =
  | { ok: true; discount: ResolvedDiscount }
  | { ok: false; reason: string; message: string; status: number };

/**
 * Resolve a customer-typed code against (1) our signed welcome codes, then
 * (2) legacy Stripe promotion codes issued by the old subscribe route
 * (KEEPSY-XXXXXX, coupon WELCOME10) — honoured only when the `subscribers`
 * row binds the code to this email and it is still a first order.
 */
export async function resolveDiscount(args: {
  db: SupabaseClient;
  stripe: Stripe | null;
  code: string;
  email: string;
  userId?: string | null;
  market: MarketCode;
  currency: Currency;
  lines: DiscountLine[];
  orderRef?: string;
  now?: Date;
}): Promise<DiscountResolution> {
  const now = args.now ?? new Date();
  const code = normaliseCode(args.code);
  const priorPaidOrders = await countPriorPaidOrders(args.db, {
    email: args.email,
    userId: args.userId,
  });

  const signatureOk = await verifyWelcomeCodeSignature(code);
  if (signatureOk) {
    const row = await lookupWelcomeCode(args.db, code);
    const validation = validateWelcomeCode({
      code,
      row,
      signatureOk,
      email: args.email,
      priorPaidOrders,
      market: args.market,
      currency: args.currency,
      lines: args.lines,
      orderRef: args.orderRef,
      now,
    });
    if (!validation.ok)
      return {
        ok: false,
        reason: validation.reason,
        message: validation.message,
        status: 400,
      };
    return {
      ok: true,
      discount: { kind: "welcome", validation, row: row as DiscountCodeRow },
    };
  }

  // Legacy Stripe promotion codes (created by the previous subscribe flow).
  const legacy = /^KEEPSY-[A-Z2-9]{6}$/.test(
    args.code.trim().toUpperCase().replace(/\s+/g, ""),
  )
    ? args.code.trim().toUpperCase().replace(/\s+/g, "")
    : null;
  if (legacy && args.stripe) {
    const { data: sub } = await args.db
      .from("subscribers")
      .select("email, promo_code")
      .eq("promo_code", legacy)
      .maybeSingle();
    const boundEmail = (sub as { email?: string } | null)?.email;
    if (
      !boundEmail ||
      canonicalEmail(boundEmail) !== canonicalEmail(args.email)
    ) {
      return {
        ok: false,
        reason: "email_mismatch",
        message:
          "This code belongs to a different email address. Use the address you signed up with.",
        status: 400,
      };
    }
    if (priorPaidOrders > 0) {
      return {
        ok: false,
        reason: "not_first_order",
        message:
          "Welcome codes are for first orders only, and this email has ordered before.",
        status: 400,
      };
    }
    let promo: Stripe.PromotionCode | undefined;
    try {
      const list = await args.stripe.promotionCodes.list({
        code: legacy,
        active: true,
        limit: 1,
        expand: ["data.promotion.coupon"],
      });
      promo = list.data[0];
    } catch {
      return {
        ok: false,
        reason: "invalid",
        message: "We couldn't check that code right now. Please try again.",
        status: 503,
      };
    }
    const coupon =
      typeof promo?.promotion.coupon === "object"
        ? promo.promotion.coupon
        : null;
    if (
      !promo ||
      !coupon ||
      !coupon.valid ||
      coupon.percent_off !== WELCOME_OFFER.percent ||
      (promo.times_redeemed ?? 0) >= (promo.max_redemptions ?? 1)
    ) {
      return {
        ok: false,
        reason: "invalid",
        message:
          "That code isn't valid any more. Sign up for a new welcome code.",
        status: 400,
      };
    }
    const subtotal = args.lines.reduce(
      (s, l) => s + l.unitPrice * l.quantity,
      0,
    );
    const discountAmount = Math.floor(subtotal * WELCOME_OFFER.percent) / 100;
    return {
      ok: true,
      discount: {
        kind: "stripe_promotion",
        promotionCodeId: promo.id,
        code: legacy,
        percent: WELCOME_OFFER.percent,
        discountAmount: Math.round(discountAmount * 100) / 100,
        conditions: [
          `${WELCOME_OFFER.percent}% off`,
          "first order only",
          "single use",
        ],
      },
    };
  }

  return {
    ok: false,
    reason: "invalid",
    message:
      "That code isn't valid. Check for typos, or sign up for a new one.",
    status: 400,
  };
}

/** Compare-and-set lock of a welcome code to one checkout. Returns false when another live checkout holds it. */
export async function lockWelcomeCode(
  db: SupabaseClient,
  code: string,
  orderRef: string,
  now: Date = new Date(),
): Promise<boolean> {
  const staleBefore = new Date(
    now.getTime() - WELCOME_OFFER.lockMinutes * 60 * 1000,
  ).toISOString();
  const { data, error } = await db
    .from("discount_codes")
    .update({ locked_order_ref: orderRef, locked_at: now.toISOString() })
    .eq("code", normaliseCode(code))
    .is("redeemed_at", null)
    .is("revoked_at", null)
    .or(
      `locked_order_ref.is.null,locked_order_ref.eq.${orderRef},locked_at.lt.${staleBefore}`,
    )
    .select("code")
    .maybeSingle();
  return !error && Boolean(data);
}

export async function releaseWelcomeLock(
  db: SupabaseClient,
  orderRef: string,
): Promise<void> {
  await db
    .from("discount_codes")
    .update({ locked_order_ref: null, locked_at: null })
    .eq("locked_order_ref", orderRef)
    .is("redeemed_at", null);
}

export type RedeemOutcome =
  | "redeemed"
  | "already_this_order"
  | "already_other_order"
  | "missing";

/** Mark redeemed on payment. Idempotent per order; detects a double-redeem by another order. */
export async function redeemWelcomeCode(
  db: SupabaseClient,
  code: string,
  orderRef: string,
  now: Date = new Date(),
): Promise<RedeemOutcome> {
  const norm = normaliseCode(code);
  const { data: row } = await db
    .from("discount_codes")
    .select("code, redeemed_at, redeemed_order_ref")
    .eq("code", norm)
    .maybeSingle();
  if (!row) return "missing";
  const r = row as {
    redeemed_at: string | null;
    redeemed_order_ref: string | null;
  };
  if (r.redeemed_at)
    return r.redeemed_order_ref === orderRef
      ? "already_this_order"
      : "already_other_order";
  const { data } = await db
    .from("discount_codes")
    .update({
      redeemed_at: now.toISOString(),
      redeemed_order_ref: orderRef,
      locked_order_ref: null,
      locked_at: null,
    })
    .eq("code", norm)
    .is("redeemed_at", null)
    .select("code")
    .maybeSingle();
  if (data) return "redeemed";
  const { data: again } = await db
    .from("discount_codes")
    .select("redeemed_order_ref")
    .eq("code", norm)
    .maybeSingle();
  return (again as { redeemed_order_ref?: string } | null)
    ?.redeemed_order_ref === orderRef
    ? "already_this_order"
    : "already_other_order";
}
