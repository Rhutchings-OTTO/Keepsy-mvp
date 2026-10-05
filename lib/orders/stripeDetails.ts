/**
 * Pull the money facts for one order from Stripe and mirror them onto the
 * `orders` row (minor units) plus a `payment_details_synced` event.
 *
 * READ-ONLY against Stripe: retrieves the Checkout Session with the payment
 * intent, its latest charge and the charge's balance transaction expanded.
 * Never creates, captures, refunds or transfers anything.
 *
 * Reserved for a future read-only refresh endpoint; not invoked by this release.
 */
import type Stripe from "stripe";
import { recordOrderEvent, type OrdersDb } from "./events";

export type StripeReader = {
  checkout: {
    sessions: {
      retrieve: (
        id: string,
        params?: Stripe.Checkout.SessionRetrieveParams,
      ) => Promise<
        Stripe.Checkout.Session | Stripe.Response<Stripe.Checkout.Session>
      >;
    };
  };
};

export type StripePaymentDetails = {
  sessionId: string;
  paymentStatus: string | null;
  sessionStatus: string | null;
  currency: string | null;
  amountSubtotalMinor: number | null;
  amountShippingMinor: number | null;
  amountDiscountMinor: number | null;
  amountTotalMinor: number | null;
  paymentIntentId: string | null;
  chargeId: string | null;
  paymentIntentStatus: string | null;
  chargeStatus: string | null;
  balanceTransactionId: string | null;
  feeMinor: number | null;
  netMinor: number | null;
  /** Settlement currency of fee/net (may differ from the order currency). */
  balanceCurrency: string | null;
  refundedMinor: number | null;
  disputed: boolean;
};

export type SyncStripeResult =
  | { ok: true; details: StripePaymentDetails; eventDuplicate: boolean }
  | {
      ok: false;
      error: string;
      code: "order_not_found" | "no_session" | "stripe_error" | "db_error";
    };

function idOf(
  value: string | { id: string } | null | undefined,
): string | null {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}

export function extractStripePaymentDetails(
  session: Stripe.Checkout.Session,
): StripePaymentDetails {
  const pi =
    typeof session.payment_intent === "object" && session.payment_intent
      ? session.payment_intent
      : null;
  const charge =
    pi && typeof pi.latest_charge === "object" && pi.latest_charge
      ? pi.latest_charge
      : null;
  const bt =
    charge &&
    typeof charge.balance_transaction === "object" &&
    charge.balance_transaction
      ? charge.balance_transaction
      : null;

  return {
    sessionId: session.id,
    paymentStatus: session.payment_status ?? null,
    sessionStatus: session.status ?? null,
    currency: session.currency ?? null,
    amountSubtotalMinor: session.amount_subtotal ?? null,
    amountShippingMinor:
      session.total_details?.amount_shipping ??
      session.shipping_cost?.amount_total ??
      null,
    amountDiscountMinor: session.total_details?.amount_discount ?? null,
    amountTotalMinor: session.amount_total ?? null,
    paymentIntentId: idOf(
      session.payment_intent as string | { id: string } | null,
    ),
    chargeId: charge
      ? charge.id
      : idOf(pi?.latest_charge as string | { id: string } | null),
    paymentIntentStatus: pi?.status ?? null,
    chargeStatus: charge?.status ?? null,
    balanceTransactionId: bt
      ? bt.id
      : idOf(charge?.balance_transaction as string | { id: string } | null),
    feeMinor: bt ? bt.fee : null,
    netMinor: bt ? bt.net : null,
    balanceCurrency: bt ? bt.currency : null,
    refundedMinor: charge ? charge.amount_refunded : null,
    disputed: Boolean(charge?.disputed),
  };
}

export async function syncStripePaymentDetails(
  db: OrdersDb,
  stripe: StripeReader,
  orderRef: string,
  opts: { actor?: string } = {},
): Promise<SyncStripeResult> {
  const { data: order, error } = await db
    .from("orders")
    .select("order_ref, stripe_session_id")
    .eq("order_ref", orderRef)
    .maybeSingle();
  if (error) return { ok: false, error: error.message, code: "db_error" };
  if (!order)
    return { ok: false, error: "Order not found.", code: "order_not_found" };
  const sessionId = (order as { stripe_session_id?: string | null })
    .stripe_session_id;
  if (!sessionId)
    return {
      ok: false,
      error: "Order has no Stripe session id.",
      code: "no_session",
    };

  let session: Stripe.Checkout.Session;
  try {
    session = (await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["payment_intent.latest_charge.balance_transaction"],
    })) as Stripe.Checkout.Session;
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
      code: "stripe_error",
    };
  }

  const details = extractStripePaymentDetails(session);

  const patch: Record<string, unknown> = {
    stripe_payment_intent_id: details.paymentIntentId,
    stripe_charge_id: details.chargeId,
    amount_subtotal_minor: details.amountSubtotalMinor,
    amount_shipping_minor: details.amountShippingMinor,
    amount_discount_minor: details.amountDiscountMinor,
    amount_total_minor: details.amountTotalMinor,
  };
  // Only overwrite fee/net when the balance transaction was actually returned.
  if (details.feeMinor != null) patch.stripe_fee_minor = details.feeMinor;
  if (details.netMinor != null) patch.stripe_net_minor = details.netMinor;

  const { error: updateError } = await db
    .from("orders")
    .update(patch)
    .eq("order_ref", orderRef);
  if (updateError)
    return { ok: false, error: updateError.message, code: "db_error" };

  const eventResult = await recordOrderEvent(db, {
    orderRef,
    type: "payment_details_synced",
    source: "stripe",
    externalId:
      details.chargeId ?? details.paymentIntentId ?? details.sessionId,
    // One event per charge (or per session until a charge exists).
    idempotencyKey: `payment_details_synced:${details.chargeId ?? details.sessionId}:${details.balanceTransactionId ?? "no-bt"}`,
    actor: opts.actor ?? null,
    data: {
      paymentStatus: details.paymentStatus,
      sessionStatus: details.sessionStatus,
      currency: details.currency,
      amountSubtotalMinor: details.amountSubtotalMinor,
      amountShippingMinor: details.amountShippingMinor,
      amountDiscountMinor: details.amountDiscountMinor,
      amountTotalMinor: details.amountTotalMinor,
      paymentIntentStatus: details.paymentIntentStatus,
      chargeStatus: details.chargeStatus,
      balanceTransactionId: details.balanceTransactionId,
      feeMinor: details.feeMinor,
      netMinor: details.netMinor,
      balanceCurrency: details.balanceCurrency,
      refundedMinor: details.refundedMinor,
      disputed: details.disputed,
    },
  });

  return {
    ok: true,
    details,
    eventDuplicate: eventResult.ok ? eventResult.duplicate : false,
  };
}
