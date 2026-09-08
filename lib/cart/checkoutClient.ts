"use client";

/**
 * Shared "start checkout" client used by the create flow and the global cart
 * drawer, so both send identical, complete payloads (per-line design URLs,
 * crops, sizes, add-ons) to /api/create-checkout-session.
 */
import { currencyForRegion, type Currency } from "@/lib/commerce/pricing";
import { linePrice, type CartLine } from "@/lib/cart/store";
import type { Region } from "@/lib/region";

function httpsOnly(url?: string | null): string | undefined {
  return url && url.startsWith("https://") ? url : undefined;
}

export function buildCheckoutPayload(lines: CartLine[], region: Region) {
  const currency: Currency = currencyForRegion(region);
  const primary = lines[0];
  return {
    currency,
    imageDataUrl: primary?.imageUrl ? "1" : undefined,
    designUrl: httpsOnly(primary?.designUrl),
    croppedImageUrl: primary?.productId.startsWith("canvas") ? httpsOnly(primary?.croppedImageUrl) : undefined,
    productType: primary?.productId,
    cart: lines.map((line) => ({
      productId: line.productId,
      name: line.name,
      color: line.color,
      size: line.size,
      imageUrl: line.imageUrl ? "1" : undefined,
      designUrl: httpsOnly(line.designUrl),
      croppedImageUrl: httpsOnly(line.croppedImageUrl),
      sourceKind: line.sourceKind,
      addonId: line.addonId,
      unitPrice: linePrice(line, currency),
      quantity: line.quantity,
    })),
  };
}

export type CheckoutClientResult = { url: string; orderRef?: string };

export async function startCheckout(lines: CartLine[], region: Region): Promise<CheckoutClientResult> {
  if (lines.length === 0) throw new Error("Your basket is empty.");
  const missingImage = lines.find((l) => !l.imageUrl && !l.designUrl);
  if (missingImage) throw new Error(`"${missingImage.name}" has no design attached. Please remove it and add it again.`);

  const payload = buildCheckoutPayload(lines, region);
  const res = await fetch("/api/create-checkout-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  let data: { url?: string; error?: string; message?: string };
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("Checkout couldn't start. Please try again.");
  }
  if (!res.ok) {
    const msg = data?.message || data?.error || "Checkout couldn't start. Please try again.";
    throw new Error(typeof msg === "string" ? msg : "Checkout couldn't start. Please try again.");
  }
  if (!data.url || typeof data.url !== "string") throw new Error("Checkout couldn't start. Please try again.");
  return { url: data.url, orderRef: (data as { orderRef?: string }).orderRef };
}
