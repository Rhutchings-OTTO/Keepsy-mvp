/**
 * Consent facade — the names other agents import (see ../phase2/contracts.md).
 *
 *   recordConsent(db, …)          explicit decision from a form
 *   recordConsentFromOrder(db, o) paid webhook: link order; consent only if the box was shown
 *   linkOrderToContact(db, …)     purchase bookkeeping, never consent
 *
 * Implementation lives in lib/crm/contacts.ts.
 */
export {
  recordConsent,
  recordConsentFromOrder,
  linkOrderToContact,
  setUnsubscribedByToken,
  isSuppressed,
  getContactByEmail,
  upsertContact,
  recordContactEvent,
  countPaidOrdersForEmail,
} from "@/lib/crm/contacts";
export type {
  RecordConsentInput,
  RecordConsentResult,
  OrderForCrm,
  LinkOrderInput,
} from "@/lib/crm/contacts";
export {
  MARKETING_CONSENT_TEXT,
  isConsentTextVersion,
  CURRENT_NEWSLETTER_CONSENT_VERSION,
  CURRENT_CHECKOUT_CONSENT_VERSION,
} from "@/lib/crm/consentText";
export type { ConsentTextVersion } from "@/lib/crm/consentText";
