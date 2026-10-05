/**
 * Destination countries, markets and currencies.
 *
 * The customer picks a DELIVERY COUNTRY (ISO 3166-1 alpha-2). Each country
 * belongs to a MARKET (a fulfilment/shipping group) and has a checkout
 * currency. A country is only sellable when `enabled` is true, and it is only
 * enabled when we hold provider cost + shipping evidence for it
 * (see a verified Printify snapshot and docs/keepsy-premium-release.md).
 *
 * Everything else in the app derives from the destination country:
 *   - currency (pricing.ts)                → currencyForCountry()
 *   - legacy Region "UK" | "US" (content,   → regionForCountry()
 *     catalogue ids like uscard/postcard)
 *   - Printify provider routing            → lib/commerce/routes.ts (per product)
 *   - shipping quote                       → lib/commerce/shipping.ts
 *
 * Safe for client bundles (no secrets, no Node-only imports).
 */
import type { Currency } from "@/lib/commerce/pricing";
import type { Region } from "@/lib/region";

export type MarketCode = "GB" | "US" | "EU" | "CA" | "AU" | "NZ";

export type CountryCode = string; // ISO 3166-1 alpha-2, upper case

export type ShipCountry = {
  code: CountryCode;
  name: string;
  market: MarketCode;
  /** Checkout currency. EUR/CAD/AUD are NOT offered until FX evidence exists. */
  currency: Currency;
  /** Pricing/content region used by the legacy catalogue (postcard vs uscard, GBP vs USD lists). */
  region: Region;
  /** Sellable today. False = shown as "not yet" in the selector and refused by checkout. */
  enabled: boolean;
  /** Where the enabling evidence lives (kept short; details in ../phase2). */
  evidence?: string;
};

export const DESTINATION_COOKIE = "keepsy_country";
export const DESTINATION_EVENT = "keepsy-destination-set";

function c(
  code: CountryCode,
  name: string,
  market: MarketCode,
  currency: Currency,
  region: Region,
  enabled: boolean,
  evidence?: string,
): ShipCountry {
  return { code, name, market, currency, region, enabled, evidence };
}

/**
 * Countries we can present in the selector. Order = display order.
 * ONLY GB and US are enabled from launch evidence (existing live routes).
 * Others stay disabled until a verified Printify snapshot carries
 * evidenced routes for them and the coordinator flips `enabled`.
 */
export const SHIP_COUNTRIES: ShipCountry[] = [
  c(
    "GB",
    "United Kingdom",
    "GB",
    "gbp",
    "UK",
    true,
    "live routes: T Shirt and Sons / Printify Choice / Prodigi / Print Pigeons / Jondo",
  ),
  c(
    "US",
    "United States",
    "US",
    "usd",
    "US",
    true,
    "live routes: SPOKE / Printify Choice / Taylor / Prodigi / Jondo",
  ),
  // European Union — priced in GBP (Stripe account is GB/GBP; no EUR FX evidence yet).
  c("IE", "Ireland", "EU", "gbp", "UK", false),
  c("DE", "Germany", "EU", "gbp", "UK", false),
  c("FR", "France", "EU", "gbp", "UK", false),
  c("NL", "Netherlands", "EU", "gbp", "UK", false),
  c("BE", "Belgium", "EU", "gbp", "UK", false),
  c("ES", "Spain", "EU", "gbp", "UK", false),
  c("IT", "Italy", "EU", "gbp", "UK", false),
  c("AT", "Austria", "EU", "gbp", "UK", false),
  c("PT", "Portugal", "EU", "gbp", "UK", false),
  c("SE", "Sweden", "EU", "gbp", "UK", false),
  c("DK", "Denmark", "EU", "gbp", "UK", false),
  c("FI", "Finland", "EU", "gbp", "UK", false),
  c("PL", "Poland", "EU", "gbp", "UK", false),
  // North America / Oceania — priced in USD (no CAD/AUD FX evidence yet).
  c("CA", "Canada", "CA", "usd", "US", false),
  c("AU", "Australia", "AU", "usd", "US", false),
  c("NZ", "New Zealand", "NZ", "usd", "US", false),
];

const BY_CODE: Record<string, ShipCountry> = Object.fromEntries(
  SHIP_COUNTRIES.map((x) => [x.code, x]),
);

export function normaliseCountryCode(value: unknown): CountryCode | null {
  if (typeof value !== "string") return null;
  const v = value.trim().toUpperCase();
  return /^[A-Z]{2}$/.test(v) ? v : null;
}

export function getCountry(code: unknown): ShipCountry | null {
  const norm = normaliseCountryCode(code);
  return norm ? (BY_CODE[norm] ?? null) : null;
}

export function isCountryEnabled(code: unknown): boolean {
  return getCountry(code)?.enabled === true;
}

export function enabledCountries(): ShipCountry[] {
  return SHIP_COUNTRIES.filter((x) => x.enabled);
}

export function currencyForCountry(code: unknown): Currency | null {
  return getCountry(code)?.currency ?? null;
}

export function regionForCountry(code: unknown): Region | null {
  return getCountry(code)?.region ?? null;
}

export function marketForCountry(code: unknown): MarketCode | null {
  return getCountry(code)?.market ?? null;
}

/** Legacy region cookie value → default destination country. */
export function countryForRegion(
  region: Region | null | undefined,
): CountryCode | null {
  if (region === "UK") return "GB";
  if (region === "US") return "US";
  return null;
}

/**
 * Soft auto-detect from headers (Vercel sets `x-vercel-ip-country`). Only a
 * suggestion — the customer always confirms/overrides in the selector.
 */
export function suggestCountryFromHeaders(
  headers: Headers,
): CountryCode | null {
  const raw =
    headers.get("x-vercel-ip-country") || headers.get("cf-ipcountry") || null;
  const code = normaliseCountryCode(raw);
  return code && BY_CODE[code] ? code : null;
}

export function countryDisplayName(code: unknown): string {
  return getCountry(code)?.name ?? normaliseCountryCode(code) ?? "your country";
}
