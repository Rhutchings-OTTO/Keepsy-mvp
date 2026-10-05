/**
 * Welcome-discount POLICY knobs (which products / minimum basket).
 *
 * Existing welcome offer policy. The offer is not a claim that all legacy
 * products have verified 25–40% contribution margins. Review current account
 * costs, taxes and discount economics before live activation (see release doc).
 *
 * The arithmetic and Stripe wiring live in lib/commerce/discounts.ts and the
 * checkout route; this file is data only so it stays safe for client bundles
 * (the cart shows the conditions it reads from here).
 */
import type { Currency } from "@/lib/commerce/pricing";
import type { MarketCode } from "@/lib/commerce/markets";

export const WELCOME_PERCENT = 10;

/**
 * Minimum basket subtotal (before shipping, after nothing) for the welcome
 * code, per currency. 0 = no minimum. Set only with margin evidence.
 */
export const WELCOME_MIN_SUBTOTAL: Record<Currency, number> = {
  gbp: 0,
  usd: 0,
};

/**
 * Catalogue ids (or id prefixes ending in "_") that the welcome discount does
 * NOT apply to. Excluded lines still ship; they simply are not discounted and
 * the cart says so. Default: nothing excluded until the margin evidence says
 * otherwise — research MUST review this before launch.
 */
export const WELCOME_EXCLUDED_PRODUCTS: string[] = [];

/** Markets where the welcome discount may be applied at all. */
export const WELCOME_ALLOWED_MARKETS: MarketCode[] = ["GB", "US"];

export function isWelcomeEligibleProduct(productId: string): boolean {
  const p = productId.toLowerCase();
  return !WELCOME_EXCLUDED_PRODUCTS.some((x) =>
    x.endsWith("_") ? p.startsWith(x) : p === x,
  );
}

/** Plain-language conditions shown wherever the offer is promised. */
export function welcomeConditionsText(currency: Currency): string {
  const parts = [
    `${WELCOME_PERCENT}% off your first order`,
    "one code per person",
    "single use",
  ];
  const min = WELCOME_MIN_SUBTOTAL[currency];
  if (min > 0)
    parts.push(`on baskets over ${currency === "usd" ? "$" : "£"}${min}`);
  if (WELCOME_EXCLUDED_PRODUCTS.length > 0)
    parts.push("some products excluded");
  return parts.join(" · ");
}
