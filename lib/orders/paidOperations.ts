import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";
import { recordOrderEvent } from "./events";
import { recordConsentFromOrder } from "@/lib/crm/contacts";
import { enqueueTips } from "@/lib/email/queue";
import { enqueueOwnerNotification } from "@/lib/notifications/outbox";
import { redeemWelcomeCode } from "@/lib/commerce/discountServer";
import { canonicalEmail } from "@/lib/commerce/discounts";
import { isCountryEnabled } from "@/lib/commerce/markets";
export async function paidOperations(
  db: SupabaseClient,
  session: Stripe.Checkout.Session,
  orderRef: string,
) {
  const { data: order, error } = await db
    .from("orders")
    .select("*")
    .eq("order_ref", orderRef)
    .single();
  if (error || !order) throw new Error("Cannot verify paid order");
  const shipping =
    session.collected_information?.shipping_details?.address?.country ||
    session.customer_details?.address?.country;
  const destination =
    order.destination_country ||
    session.metadata?.destination_country ||
    shipping;
  let reason =
    !shipping || shipping !== destination || !isCountryEnabled(destination)
      ? "destination_mismatch"
      : null;
  if (
    order.discount_code &&
    order.checkout_email &&
    canonicalEmail(order.checkout_email) !==
      canonicalEmail(session.customer_details?.email || "")
  )
    reason = "discount_email_mismatch";
  if (!reason && order.discount_kind === "welcome" && order.discount_code) {
    const result = await redeemWelcomeCode(db, order.discount_code, orderRef);
    if (!["redeemed", "already_this_order"].includes(result))
      reason = "discount_redemption_conflict";
  }
  const { error: save } = await db
    .from("orders")
    .update({
      shipping_country: shipping,
      amount_total_minor: session.amount_total,
      amount_subtotal_minor: session.amount_subtotal,
      amount_shipping_minor: session.total_details?.amount_shipping,
      amount_discount_minor: session.total_details?.amount_discount,
    })
    .eq("order_ref", orderRef);
  if (save) throw new Error("Cannot save payment totals");
  const event = await recordOrderEvent(db, {
    orderRef,
    type: "payment_paid",
    source: "stripe",
    externalId: session.id,
    idempotencyKey: "paid:" + session.id,
    data: { currency: session.currency, totalMinor: session.amount_total },
  });
  if (!event.ok) throw new Error("Cannot record payment event");
  const consent = await recordConsentFromOrder(db, {
    ...order,
    shipping_address: undefined,
  });
  if (consent.contact?.marketing_status === "opted_in")
    await enqueueTips(db, consent.contact);
  await enqueueOwnerNotification(db, {
    key: "paid:" + orderRef,
    kind: "new_order",
    title: "New Keepsy order",
    body:
      "Payment received for " +
      orderRef +
      ". Open your order timeline for details.",
    severity: "info",
    orderRef,
    url: "/admin/orders/" + encodeURIComponent(orderRef),
  });
  if (reason) {
    const { error: reviewError } = await db
      .from("orders")
      .update({
        printify_status: "needs_manual_review",
        manual_review_reason: reason,
      })
      .eq("order_ref", orderRef);
    if (reviewError) throw new Error("Cannot save review requirement");
    await recordOrderEvent(db, {
      orderRef,
      type: "needs_manual_review",
      source: "system",
      idempotencyKey: reason,
      data: { reason },
    });
    await enqueueOwnerNotification(db, {
      key: reason + ":" + orderRef,
      kind: "review",
      title: "Keepsy order needs attention",
      body: orderRef + " requires review before printing.",
      severity: "critical",
      orderRef,
    });
    return false;
  }
  return true;
}
