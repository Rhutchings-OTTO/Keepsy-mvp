/**
 * Builds and submits a Printful order from a completed Stripe checkout session.
 */
import Stripe from "stripe";
import {
  createPrintfulOrder,
  type PrintfulRecipient,
  type PrintfulOrderItem,
} from "./client";
import { getPrintfulVariantId } from "./variants";

type LineItemWithMeta = {
  description: string | null;
  quantity: number | null;
  price?: {
    unit_amount?: number | null;
    product?: { metadata?: Record<string, string> } | string | null;
  } | null;
};

function buildRecipient(session: Stripe.Checkout.Session): PrintfulRecipient {
  const shipping = session.collected_information?.shipping_details;
  const billing = session.customer_details;
  const address = shipping?.address ?? billing?.address;
  const name =
    shipping?.name ?? billing?.name ?? "Keepsy Customer";

  if (!address?.line1 || !address?.city || !address?.country || !address?.postal_code) {
    throw new Error("No shipping address on Stripe session – cannot create Printful order.");
  }

  return {
    name,
    address1: address.line1,
    address2: address.line2 ?? undefined,
    city: address.city,
    state_code: address.state ?? undefined,
    country_code: address.country,
    zip: address.postal_code,
    email: billing?.email ?? undefined,
    phone: billing?.phone ?? undefined,
  };
}

function buildItems(
  lineItems: Stripe.ApiList<Stripe.LineItem>,
  designUrl: string
): PrintfulOrderItem[] {
  return lineItems.data.map((item) => {
    // Metadata is on the Stripe price's product metadata
    const productMeta =
      typeof item.price?.product === "object" && item.price.product !== null
        ? (item.price.product as Stripe.Product).metadata ?? {}
        : {};

    const productId = productMeta.productId ?? "card";
    const size = productMeta.size || undefined;
    const color = productMeta.color || undefined;
    const itemDesignUrl = productMeta.designUrl || designUrl;

    const variantId = getPrintfulVariantId(productId, size, color);

    return {
      variant_id: variantId,
      quantity: item.quantity ?? 1,
      files: [{ url: itemDesignUrl, type: "default" }],
    };
  });
}

/**
 * Creates a Printful order (draft by default — set confirm=true to go live).
 * Call this after a verified `checkout.session.completed` webhook.
 */
export async function submitPrintfulOrder(
  session: Stripe.Checkout.Session,
  lineItems: Stripe.ApiList<Stripe.LineItem>,
  { confirm = false }: { confirm?: boolean } = {}
): Promise<{ printfulOrderId: number }> {
  const designUrl = session.metadata?.design_url ?? "";
  const orderRef = session.metadata?.order_ref ?? session.id;

  const recipient = buildRecipient(session);
  const items = buildItems(lineItems, designUrl);

  const printfulOrder = await createPrintfulOrder({
    external_id: orderRef,
    recipient,
    items,
    confirm,
  });

  return { printfulOrderId: printfulOrder.id };
}
