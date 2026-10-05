/**
 * Versioned marketing-consent wording. Every consent record stores the
 * version AND the exact text shown, so an opt-in is auditable even after the
 * copy changes. Add a new version instead of editing an existing one.
 *
 * Client-safe (no secrets). Keep wording plain: what they get, how often,
 * how to stop.
 */
export const MARKETING_CONSENT_TEXT = {
  "newsletter-v1":
    "Yes — email me my 10% welcome code, gift ideas and new designs from Keepsy. A few emails a month at most; unsubscribe with one click any time.",
  "checkout-v1":
    "Email me occasional gift ideas and offers from Keepsy. Unsubscribe any time. (Order updates are always sent regardless.)",
} as const;

export type ConsentTextVersion = keyof typeof MARKETING_CONSENT_TEXT;

export const CURRENT_NEWSLETTER_CONSENT_VERSION: ConsentTextVersion =
  "newsletter-v1";
export const CURRENT_CHECKOUT_CONSENT_VERSION: ConsentTextVersion =
  "checkout-v1";

export function isConsentTextVersion(v: unknown): v is ConsentTextVersion {
  return (
    typeof v === "string" &&
    Object.prototype.hasOwnProperty.call(MARKETING_CONSENT_TEXT, v)
  );
}
