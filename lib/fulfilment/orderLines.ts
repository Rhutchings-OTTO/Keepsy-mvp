/**
 * Rebuild fulfilment lines for a paid Stripe session.
 *
 * Preferred source: the rich `order_items` rows written at checkout
 * (product_id, size, color, design_url, cropped_image_url, source_kind).
 * Fallback: Stripe line-item product metadata (productId, size, color,
 * designUrl) plus the session-level design_url / cropped_image_url.
 *
 * Pure (no network) so it is unit-testable. Shipping lines are ignored.
 */
import type Stripe from "stripe";
import type { FulfilmentLine } from "./printifyFulfilment";

export type OrderItemRow = {
  product_id?: string | null;
  size?: string | null;
  color?: string | null;
  quantity: number;
  design_url?: string | null;
  cropped_image_url?: string | null;
  source_kind?: string | null;
};

function normaliseSourceKind(value: unknown): "ai" | "original" | null {
  return value === "ai" || value === "original" ? value : null;
}

export function linesFromOrderItems(rows: OrderItemRow[], fallback: {
  designUrl?: string | null;
  croppedImageUrl?: string | null;
}): FulfilmentLine[] {
  let canvasSeen = 0;
  return rows
    .filter((r) => typeof r.product_id === "string" && r.product_id)
    .map((r) => {
      const productId = String(r.product_id).toLowerCase();
      const isCanvas = productId.startsWith("canvas");
      // Session-level crop belongs to the first canvas line only (legacy single-item orders).
      const inheritCrop = isCanvas && canvasSeen === 0 ? fallback.croppedImageUrl ?? null : null;
      if (isCanvas) canvasSeen += 1;
      return {
        productId,
        size: r.size ?? null,
        color: r.color ?? null,
        quantity: Number(r.quantity) || 1,
        designUrl: r.design_url || fallback.designUrl || "",
        croppedImageUrl: r.cropped_image_url || inheritCrop,
        sourceKind: normaliseSourceKind(r.source_kind),
      };
    });
}

/**
 * Rich `order_items` rows rebuilt from Stripe line items — used by BOTH the
 * webhook route and the Inngest retry path when the checkout pre-insert never
 * happened, so retries and /account see the same per-line data.
 */
export function orderItemRowsFromStripeLineItems(orderRef: string, items: Stripe.LineItem[]) {
  return items.map((item) => {
    const product = item.price?.product;
    const meta =
      product && typeof product === "object" && "metadata" in product ? ((product as Stripe.Product).metadata ?? {}) : {};
    return {
      order_ref: orderRef,
      product_name: item.description || "Keepsy item",
      quantity: item.quantity || 1,
      unit_price_gbp: (item.price?.unit_amount ?? 0) / 100,
      line_total_gbp: (item.amount_total ?? 0) / 100,
      product_id: meta.productId || null,
      size: meta.size || null,
      color: meta.color || null,
      design_url: meta.designUrl || null,
      cropped_image_url: meta.croppedImageUrl || null,
      source_kind: meta.sourceKind || null,
      addon_id: meta.addonId || null,
    };
  });
}

export function linesFromStripeLineItems(items: Stripe.LineItem[], fallback: {
  designUrl?: string | null;
  croppedImageUrl?: string | null;
}): FulfilmentLine[] {
  const out: FulfilmentLine[] = [];
  let canvasSeen = 0;
  for (const item of items) {
    const product = item.price?.product;
    const meta =
      product && typeof product === "object" && "metadata" in product ? ((product as Stripe.Product).metadata ?? {}) : {};
    const productId = (meta.productId ?? "").toLowerCase().replace(/\s+/g, "");
    if (!productId) continue; // shipping line or malformed item
    const isCanvas = productId.startsWith("canvas");
    const inheritCrop = isCanvas && canvasSeen === 0 ? fallback.croppedImageUrl ?? null : null;
    if (isCanvas) canvasSeen += 1;
    out.push({
      productId,
      size: meta.size || null,
      color: meta.color || null,
      quantity: item.quantity ?? 1,
      designUrl: meta.designUrl || fallback.designUrl || "",
      croppedImageUrl: meta.croppedImageUrl || inheritCrop,
      sourceKind: normaliseSourceKind(meta.sourceKind),
    });
  }
  return out;
}
