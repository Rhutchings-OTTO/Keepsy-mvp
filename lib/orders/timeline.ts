/**
 * Order timeline reader: one order + its lines + its events + a derived
 * summary (payment state, fulfilment state, whether the owner needs to act
 * and why, every external id we know about).
 *
 * Pure derivation lives in `deriveOrderSummary` so it can be unit-tested
 * without a database. Server-only (service-role client).
 */
import { listOrderEvents, type OrderEventRow, type OrdersDb } from "./events";

export type OrderRow = {
  id?: number | string;
  order_ref: string;
  stripe_session_id: string | null;
  status: string | null;
  currency: string | null;
  total_gbp: number | string | null;
  customer_email: string | null;
  customer_name: string | null;
  shipping_address: Record<string, unknown> | string | null;
  printify_order_id: string | null;
  printify_product_id: string | null;
  printify_image_id?: string | null;
  printify_status: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  fulfilment: {
    provider?: string;
    printifyOrderId?: string;
    lines?: Array<{
      printifyProductId?: string;
      printifyImageId?: string;
      variantId?: number;
      productId?: string;
      size?: string | null;
      color?: string | null;
      quantity?: number;
    }>;
  } | null;
  user_id?: string | null;
  region?: string | null;
  product_type?: string | null;
  prompt?: string | null;
  generated_image_url?: string | null;
  cropped_image_url?: string | null;
  created_at: string;
  // 202609090003 (ops)
  stripe_payment_intent_id?: string | null;
  stripe_charge_id?: string | null;
  amount_subtotal_minor?: number | null;
  amount_shipping_minor?: number | null;
  amount_discount_minor?: number | null;
  amount_total_minor?: number | null;
  stripe_fee_minor?: number | null;
  stripe_net_minor?: number | null;
  printify_total_cost_minor?: number | null;
  printify_total_shipping_minor?: number | null;
  printify_cost_currency?: string | null;
  manual_review_reason?: string | null;
  reviewed_at?: string | null;
  reviewed_by?: string | null;
  // 202609090001 (coordinator) — optional so the reader works before that migration lands
  destination_country?: string | null;
  discount_code?: string | null;
  discount_amount_minor?: number | null;
  marketing_consent?: boolean | null;
  consent_text_version?: string | null;
  consent_recorded_at?: string | null;
  [key: string]: unknown;
};

export type OrderItemRow = {
  id?: number | string;
  order_ref: string;
  product_name: string;
  quantity: number;
  unit_price_gbp: number | string | null;
  line_total_gbp: number | string | null;
  product_id?: string | null;
  size?: string | null;
  color?: string | null;
  design_url?: string | null;
  cropped_image_url?: string | null;
  source_kind?: "ai" | "original" | string | null;
  addon_id?: string | null;
  created_at?: string;
};

export type PaymentState =
  | "unpaid"
  | "paid"
  | "failed"
  | "cancelled"
  | "unknown";

export type FulfilmentState =
  | "not_started"
  | "fulfilling"
  | "submit_uncertain"
  | "needs_manual_review"
  | "pending_retry"
  | "submitted"
  | "printify_received"
  | "in_production"
  | "partially_shipped"
  | "partially_delivered"
  | "shipped"
  | "delivered"
  | "not_applicable";

export type NeedsActionReason =
  | "needs_manual_review"
  | "submit_uncertain"
  | "paid_no_printify_order"
  | "destination_mismatch"
  | "payment_failed";

export type OrderSummary = {
  paymentState: PaymentState;
  fulfilmentState: FulfilmentState;
  needsAction: boolean;
  reasons: NeedsActionReason[];
  reviewed: boolean;
  externalIds: {
    stripeSessionId: string | null;
    paymentIntentId: string | null;
    chargeId: string | null;
    printifyOrderId: string | null;
    printifyProductIds: string[];
    trackingNumber: string | null;
  };
};

export type OrderTimeline = {
  order: OrderRow;
  items: OrderItemRow[];
  events: OrderEventRow[];
  summary: OrderSummary;
};

export type DeriveOptions = {
  now?: Date;
  /** Minutes after creation before a paid order without a Printify id counts as stuck. Default 30. */
  stuckAfterMinutes?: number;
};

const PAID_STATUSES = new Set([
  "paid",
  "in_production",
  "shipped",
  "delivered",
]);

export function derivePaymentState(
  order: Pick<OrderRow, "status">,
): PaymentState {
  const s = order.status ?? "";
  if (PAID_STATUSES.has(s)) return "paid";
  if (s === "pending") return "unpaid";
  if (s === "failed") return "failed";
  if (s === "cancelled") return "cancelled";
  return "unknown";
}

export function deriveFulfilmentState(
  order: Pick<OrderRow, "status" | "printify_status" | "printify_order_id">,
): FulfilmentState {
  const payment = derivePaymentState(order);
  const ps = order.printify_status ?? "";
  if (order.status === "delivered" || ps === "delivered") return "delivered";
  if (order.status === "shipped" || ps === "shipped") return "shipped";
  if (ps === "partially_shipped" || ps === "partially_delivered") return ps;
  if (ps === "in_production") return "in_production";
  if (ps === "printify_received") return "printify_received";
  if (ps === "submit_uncertain") return "submit_uncertain";
  if (ps === "needs_manual_review") return "needs_manual_review";
  if (ps === "pending_retry") return "pending_retry";
  if (ps === "fulfilling") return "fulfilling";
  if (
    order.printify_order_id ||
    ps === "sent_to_printify" ||
    order.status === "in_production"
  )
    return "submitted";
  if (payment !== "paid") return "not_applicable";
  return "not_started";
}

export function deriveOrderSummary(
  order: OrderRow,
  events: OrderEventRow[],
  opts: DeriveOptions = {},
): OrderSummary {
  const now = opts.now ?? new Date();
  const stuckAfterMs = (opts.stuckAfterMinutes ?? 30) * 60 * 1000;
  const paymentState = derivePaymentState(order);
  const fulfilmentState = deriveFulfilmentState(order);
  const reviewed = Boolean(order.reviewed_at);
  const reasons: NeedsActionReason[] = [];

  const ps = order.printify_status ?? "";
  const mismatchFlagged =
    order.manual_review_reason === "destination_mismatch" ||
    events.some((e) => e.type === "destination_mismatch");

  if (!reviewed) {
    if (mismatchFlagged) reasons.push("destination_mismatch");
    if (ps === "needs_manual_review" && !mismatchFlagged)
      reasons.push("needs_manual_review");
    if (ps === "submit_uncertain") reasons.push("submit_uncertain");
  }

  if (
    paymentState === "paid" &&
    !order.printify_order_id &&
    !["needs_manual_review", "submit_uncertain"].includes(ps) &&
    !reviewed
  ) {
    const created = Date.parse(order.created_at);
    if (Number.isFinite(created) && now.getTime() - created >= stuckAfterMs)
      reasons.push("paid_no_printify_order");
  }

  if (paymentState === "failed" && !reviewed) reasons.push("payment_failed");

  const productIds = new Set<string>();
  if (order.printify_product_id)
    productIds.add(String(order.printify_product_id));
  for (const line of order.fulfilment?.lines ?? []) {
    if (line?.printifyProductId) productIds.add(String(line.printifyProductId));
  }
  for (const e of events) {
    if (e.type === "printify_product_created" && e.external_id)
      productIds.add(e.external_id);
  }

  return {
    paymentState,
    fulfilmentState,
    needsAction: reasons.length > 0,
    reasons,
    reviewed,
    externalIds: {
      stripeSessionId: order.stripe_session_id ?? null,
      paymentIntentId: order.stripe_payment_intent_id ?? null,
      chargeId: order.stripe_charge_id ?? null,
      printifyOrderId: order.printify_order_id
        ? String(order.printify_order_id)
        : (order.fulfilment?.printifyOrderId ?? null),
      printifyProductIds: [...productIds],
      trackingNumber: order.tracking_number ?? null,
    },
  };
}

/** Parse `shipping_address` which is stored as jsonb or as a JSON string (legacy writes). */
export function parseShippingAddress(
  raw: OrderRow["shipping_address"],
): Record<string, unknown> | null {
  if (!raw) return null;
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as unknown;
      return parsed && typeof parsed === "object"
        ? (parsed as Record<string, unknown>)
        : null;
    } catch {
      return null;
    }
  }
  return raw;
}

/** Load the full timeline for one order, or null when the order does not exist. Throws only on a database error. */
export async function loadOrderTimeline(
  db: OrdersDb,
  orderRef: string,
  opts: DeriveOptions = {},
): Promise<OrderTimeline | null> {
  const { data: order, error } = await db
    .from("orders")
    .select("*")
    .eq("order_ref", orderRef)
    .maybeSingle();
  if (error)
    throw new Error(`Failed to load order ${orderRef}: ${error.message}`);
  if (!order) return null;

  const [{ data: items, error: itemsError }, events] = await Promise.all([
    db
      .from("order_items")
      .select("*")
      .eq("order_ref", orderRef)
      .order("id", { ascending: true }),
    listOrderEvents(db, orderRef),
  ]);
  if (itemsError)
    throw new Error(
      `Failed to load order items for ${orderRef}: ${itemsError.message}`,
    );

  const row = order as OrderRow;
  return {
    order: row,
    items: (items ?? []) as OrderItemRow[],
    events,
    summary: deriveOrderSummary(row, events, opts),
  };
}
