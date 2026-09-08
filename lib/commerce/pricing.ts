/**
 * Shared pricing rules. Imported by the client (display) AND the server
 * (authoritative). Keep this file free of secrets and Node-only imports.
 */
import { PRODUCT_CATALOG, type CatalogProduct } from "@/lib/commerce/catalog";
import type { Region } from "@/lib/region";

export type Currency = "gbp" | "usd";

export const FREE_SHIPPING_THRESHOLD = 75;
export const SHIPPING_FEE: Record<Currency, number> = { gbp: 3.99, usd: 4.99 };

export function currencyForRegion(region: Region): Currency {
  return region === "US" ? "usd" : "gbp";
}

export function getCatalogProduct(productId: string): CatalogProduct | null {
  return PRODUCT_CATALOG[productId] ?? null;
}

/** Unit price for a catalogue product in a currency. Null when the product is unknown. */
export function getUnitPrice(productId: string, currency: Currency): number | null {
  const item = PRODUCT_CATALOG[productId];
  if (!item) return null;
  return currency === "usd" ? (item.priceUSD ?? item.priceGBP) : item.priceGBP;
}

export function shippingFor(subtotal: number, currency: Currency): number {
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE[currency];
}

export function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

const GBP = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });
const USD = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export function formatMoney(n: number, currency: Currency): string {
  return currency === "usd" ? USD.format(n) : GBP.format(n);
}
