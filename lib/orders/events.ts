/**
 * Order timeline writer.
 *
 * `recordOrderEvent` appends one row to `order_events`. It NEVER throws —
 * it is called from webhooks and fulfilment code paths where a logging
 * failure must not change the outcome of the order. Supply `idempotencyKey`
 * to make a call safe across webhook redeliveries: the key is stored scoped
 * to the order (`<order_ref>:<key>`) and a unique violation (23505) is
 * reported as `duplicate: true`, not as an error.
 *
 * Server-only (service-role client).
 */
import type { SupabaseClient } from "@supabase/supabase-js";

export type OrderEventSource =
  | "stripe"
  | "printify"
  | "system"
  | "owner"
  | "inngest";

export type OrderEventType =
  | "checkout_created"
  | "payment_paid"
  | "payment_failed"
  | "session_expired"
  | "discount_locked"
  | "discount_redeemed"
  | "fulfilment_started"
  | "printify_product_created"
  | "printify_order_submitted"
  | "printify_submit_uncertain"
  | "printify_received"
  | "in_production"
  | "shipment_created"
  | "shipment_delivered"
  | "shipped"
  | "delivered"
  | "needs_manual_review"
  | "owner_note"
  | "retry_requested"
  | "destination_mismatch"
  | "review_completed"
  | "payment_details_synced"
  | "printify_details_synced";

export const ORDER_EVENT_TYPES: readonly OrderEventType[] = [
  "checkout_created",
  "payment_paid",
  "payment_failed",
  "session_expired",
  "discount_locked",
  "discount_redeemed",
  "fulfilment_started",
  "printify_product_created",
  "printify_order_submitted",
  "printify_submit_uncertain",
  "printify_received",
  "in_production",
  "shipment_created",
  "shipment_delivered",
  "shipped",
  "delivered",
  "needs_manual_review",
  "owner_note",
  "retry_requested",
  "destination_mismatch",
  "review_completed",
  "payment_details_synced",
  "printify_details_synced",
];

export type RecordOrderEventInput = {
  orderRef: string;
  type: OrderEventType;
  source: OrderEventSource;
  data?: Record<string, unknown>;
  externalId?: string | null;
  /** Scoped to the order when stored; same (orderRef, key) twice ⇒ duplicate. */
  idempotencyKey?: string | null;
  /** Owner email for owner actions, or a system label such as "stripe-webhook". */
  actor?: string | null;
};

export type RecordOrderEventResult =
  | { ok: true; duplicate: boolean; id: number | string | null }
  | { ok: false; duplicate: false; error: string };

export type OrderEventRow = {
  id: number | string;
  order_ref: string;
  type: OrderEventType | string;
  source: OrderEventSource | string;
  external_id: string | null;
  idempotency_key: string | null;
  data: Record<string, unknown> | null;
  actor: string | null;
  created_at: string;
};

/** Minimal client shape so tests can pass the fake and callers can pass the real service-role client. */
export type OrdersDb = Pick<SupabaseClient, "from">;

export function scopedIdempotencyKey(orderRef: string, key: string): string {
  const prefix = `${orderRef}:`;
  return key.startsWith(prefix) ? key : `${prefix}${key}`;
}

export async function recordOrderEvent(
  db: OrdersDb | null | undefined,
  input: RecordOrderEventInput,
): Promise<RecordOrderEventResult> {
  if (!db) return { ok: false, duplicate: false, error: "db_unavailable" };
  if (!input.orderRef || !input.type || !input.source)
    return { ok: false, duplicate: false, error: "invalid_input" };

  const row = {
    order_ref: input.orderRef,
    type: input.type,
    source: input.source,
    external_id: input.externalId ?? null,
    idempotency_key: input.idempotencyKey
      ? scopedIdempotencyKey(input.orderRef, input.idempotencyKey)
      : null,
    data: sanitiseData(input.data),
    actor: input.actor ?? null,
  };

  try {
    const { data, error } = await db
      .from("order_events")
      .insert(row)
      .select("id")
      .maybeSingle();
    if (error) {
      if (error.code === "23505")
        return { ok: true, duplicate: true, id: null };
      console.error(
        "[order-events] insert failed:",
        input.orderRef,
        input.type,
        error.message,
      );
      return { ok: false, duplicate: false, error: error.message };
    }
    return {
      ok: true,
      duplicate: false,
      id: (data as { id?: number | string } | null)?.id ?? null,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(
      "[order-events] insert threw:",
      input.orderRef,
      input.type,
      message,
    );
    return { ok: false, duplicate: false, error: message };
  }
}

/** Keep event payloads JSON-safe and bounded; drop undefined, stringify errors. */
function sanitiseData(
  data: Record<string, unknown> | undefined,
): Record<string, unknown> {
  if (!data) return {};
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    if (v === undefined) continue;
    if (v instanceof Error) {
      out[k] = { name: v.name, message: v.message };
      continue;
    }
    if (typeof v === "string" && v.length > 4000) {
      out[k] = `${v.slice(0, 4000)}…`;
      continue;
    }
    out[k] = v;
  }
  return out;
}

/** All events for one order, oldest first. Never throws (returns [] on error). */
export async function listOrderEvents(
  db: OrdersDb | null | undefined,
  orderRef: string,
): Promise<OrderEventRow[]> {
  if (!db) return [];
  try {
    const { data, error } = await db
      .from("order_events")
      .select(
        "id, order_ref, type, source, external_id, idempotency_key, data, actor, created_at",
      )
      .eq("order_ref", orderRef)
      .order("created_at", { ascending: true })
      .order("id", { ascending: true });
    if (error) {
      console.error("[order-events] list failed:", orderRef, error.message);
      return [];
    }
    return (data ?? []) as OrderEventRow[];
  } catch (err) {
    console.error(
      "[order-events] list threw:",
      orderRef,
      err instanceof Error ? err.message : err,
    );
    return [];
  }
}
