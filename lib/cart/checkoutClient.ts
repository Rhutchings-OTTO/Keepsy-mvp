"use client";

/**
 * Shared "start checkout" client used by the create flow and the global cart
 * drawer, so both send identical, complete payloads (per-line design URLs,
 * crops, sizes, add-ons, destination, discount, consent) to
 * /api/create-checkout-session.
 */
import { currencyForRegion, type Currency } from "@/lib/commerce/pricing";
import { linePrice, type CartLine } from "@/lib/cart/store";
import { getCountry, type CountryCode } from "@/lib/commerce/markets";

function httpsOnly(url?: string | null): string | undefined {
  return url && url.startsWith("https://") ? url : undefined;
}

export type CheckoutOptions = {
  /** ISO country the customer chose in the destination selector. Required. */
  destinationCountry: CountryCode;
  /** Welcome code + the email it was issued to (locks the Stripe email field). */
  discount?: { code: string; email: string } | null;
  /** Explicit marketing consent captured on our checkout step (never inferred). */
  marketing?: { consent: boolean; textVersion: string } | null;
};

export function buildCheckoutPayload(
  lines: CartLine[],
  options: CheckoutOptions,
) {
  const country = getCountry(options.destinationCountry);
  const currency: Currency = country
    ? country.currency
    : currencyForRegion("UK");
  const primary = lines[0];
  return {
    currency,
    destinationCountry: options.destinationCountry,
    ...(options.discount?.code
      ? {
          discountCode: options.discount.code.trim(),
          discountEmail: options.discount.email.trim(),
        }
      : {}),
    ...(options.marketing
      ? {
          marketingConsent: options.marketing.consent,
          consentTextVersion: options.marketing.textVersion,
        }
      : {}),
    imageDataUrl: primary?.imageUrl ? "1" : undefined,
    designUrl: httpsOnly(primary?.designUrl),
    croppedImageUrl: primary?.productId.startsWith("canvas")
      ? httpsOnly(primary?.croppedImageUrl)
      : undefined,
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

export class CheckoutError extends Error {
  code: string;
  details?: unknown;
  constructor(code: string, message: string, details?: unknown) {
    super(message);
    this.name = "CheckoutError";
    this.code = code;
    this.details = details;
  }
}

export async function startCheckout(
  lines: CartLine[],
  options: CheckoutOptions,
): Promise<CheckoutClientResult> {
  if (lines.length === 0)
    throw new CheckoutError("EMPTY", "Your basket is empty.");
  const missingImage = lines.find((l) => !l.imageUrl && !l.designUrl);
  if (missingImage)
    throw new CheckoutError(
      "MISSING_IMAGE",
      `"${missingImage.name}" has no design attached. Please remove it and add it again.`,
    );
  if (!getCountry(options.destinationCountry))
    throw new CheckoutError(
      "DESTINATION_REQUIRED",
      "Choose your delivery country first.",
    );

  const payload = buildCheckoutPayload(lines, options);
  const res = await fetch("/api/create-checkout-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  let data: {
    url?: string;
    error?: string | { code?: string; message?: string };
    message?: string;
    orderRef?: string;
    details?: unknown;
  };
  try {
    data = JSON.parse(text);
  } catch {
    throw new CheckoutError(
      "CHECKOUT_FAILED",
      "Checkout couldn't start. Please try again.",
    );
  }
  if (!res.ok) {
    const code =
      typeof data.error === "string"
        ? data.error
        : (data.error?.code ?? "CHECKOUT_FAILED");
    const msg =
      data.message ||
      (typeof data.error === "object" ? data.error?.message : undefined) ||
      "Checkout couldn't start. Please try again.";
    throw new CheckoutError(
      code,
      typeof msg === "string"
        ? msg
        : "Checkout couldn't start. Please try again.",
      data.details,
    );
  }
  if (!data.url || typeof data.url !== "string")
    throw new CheckoutError(
      "CHECKOUT_FAILED",
      "Checkout couldn't start. Please try again.",
    );
  return { url: data.url, orderRef: data.orderRef };
}
