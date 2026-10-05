/**
 * Schema for provider cost/shipping evidence captured from the LIVE Printify
 * API (catalog v1). No account-level snapshot is checked in yet. Each future
 * snapshot must include capture timestamps and exact provider responses;
 * see docs/keepsy-premium-release.md for release requirements.
 *
 * All money here is in integer minor units of the stated currency (Printify
 * quotes production and shipping in USD cents).
 */
import type { MarketCode } from "@/lib/commerce/markets";

export type MoneyCents = { amount: number; currency: "USD" };

export type VariantCost = {
  variantId: number;
  /** Printify variant title, e.g. "Black / M" or "iPhone 15 Pro / Glossy". */
  title: string;
  /** Option values Printify reports (color, size, phone model, ...). */
  options: Record<string, string>;
  /** Production cost from the draft product's `variants[].cost` (USD cents). */
  cost: MoneyCents;
  isAvailable: boolean;
};

export type ShippingProfile = {
  /** ISO country codes this profile applies to, or "REST_OF_THE_WORLD". */
  countries: string[];
  variantIds: number[];
  firstItem: MoneyCents;
  additionalItem: MoneyCents;
};

export type PrintAreaSpec = {
  position: string; // e.g. "front"
  widthPx: number;
  heightPx: number;
  /** Safe-area notes (camera cut-outs, bleed) from provider docs, if any. */
  notes?: string;
};

export type ProviderRoute = {
  /** Keepsy catalogue product family, e.g. "tee", "hoodie", "phone_case_tough". */
  productFamily: string;
  blueprintId: number;
  blueprintTitle: string;
  printProviderId: number;
  printProviderTitle: string;
  /** Provider location as reported by Printify (country code). */
  providerCountry: string | null;
  handlingDays: { min: number; max: number } | null;
  variants: VariantCost[];
  shipping: ShippingProfile[];
  printAreas: PrintAreaSpec[];
  /** Draft "Keepsy QA" product created to read costs/mockups; never published. */
  qaProductId?: string;
  /** Mockup image URLs returned by Printify for the QA product (provider-generated). */
  mockupImages?: Array<{ src: string; variantIds: number[]; position: string }>;
};

export type PrintifySnapshot = {
  capturedAt: string; // ISO timestamp
  source: "printify-api-v1";
  shopId: string;
  routes: ProviderRoute[];
  /** Free-text caveats: rate limits hit, providers skipped, etc. */
  notes: string[];
};

/**
 * Which markets a product can ship to, with the route to use. Derived from the
 * snapshot by scripts/research (not by hand) and reviewed by the coordinator.
 */
export type MarketRoute = {
  productFamily: string;
  market: MarketCode;
  blueprintId: number;
  printProviderId: number;
  /** Shipping to a representative country in this market, USD cents. */
  shippingFirstItem: MoneyCents;
  shippingAdditionalItem: MoneyCents;
  /** Countries in the market that the profile explicitly covers. */
  coveredCountries: string[];
  /** Why this route is/isn't enabled. */
  status: "enabled" | "candidate" | "rejected";
  reason: string;
};
