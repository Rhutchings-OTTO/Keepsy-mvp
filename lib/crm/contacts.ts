/**
 * Contacts + consent ledger.
 *
 * Every function takes the Supabase client first (service role in prod,
 * tests/helpers/fakeSupabase.ts in tests). Nothing here sends email.
 *
 * Consent rules (the important bit):
 *   - A contact starts 'unknown'. Only an explicit decision moves it.
 *   - recordConsent() stores the version AND the exact wording shown, plus
 *     source / ip hash / user agent, in contact_events. That row is the
 *     evidence; contacts.marketing_status is just the current summary.
 *   - 'suppressed' (bounce/complaint) is sticky: consent events are still
 *     recorded for the audit trail but do not change the status.
 *   - A purchase links the order and bumps counters. It NEVER changes
 *     marketing_status. recordConsentFromOrder() only acts when the checkout
 *     box was actually shown (marketing_consent is true/false, not null).
 *   - An unticked checkout box ("declined") is recorded as consent_opt_out
 *     with metadata.declined = true, and only moves 'unknown' → 'opted_out'.
 *     It does not revoke an earlier explicit newsletter opt-in; the customer
 *     has a one-click unsubscribe in every email for that.
 */
import { randomBytes } from "node:crypto";
import { canonicalEmail, isValidEmail } from "@/lib/commerce/discounts";
import {
  MARKETING_CONSENT_TEXT,
  isConsentTextVersion,
} from "@/lib/crm/consentText";
import type {
  ConsentSource,
  ContactEventRow,
  ContactEventType,
  ContactRow,
  CrmDb,
  MarketingStatus,
} from "@/lib/crm/types";

export { canonicalEmail };

export const CONTACT_COLUMNS =
  "id, email, email_canonical, first_name, last_name, country, user_id, first_source, marketing_status, marketing_status_changed_at, unsubscribe_token, last_order_at, orders_count, created_at, updated_at";

/** Order statuses that count as "has paid us before". */
export const PAID_ORDER_STATUSES = [
  "paid",
  "in_production",
  "shipped",
  "delivered",
] as const;

function nowIso(now?: Date): string {
  return (now ?? new Date()).toISOString();
}

function newUnsubscribeToken(): string {
  return randomBytes(24).toString("hex");
}

function splitName(name: string | null | undefined): {
  first: string | null;
  last: string | null;
} {
  const n = (name ?? "").trim().replace(/\s+/g, " ");
  if (!n) return { first: null, last: null };
  const idx = n.indexOf(" ");
  if (idx < 0) return { first: n.slice(0, 80), last: null };
  return {
    first: n.slice(0, idx).slice(0, 80),
    last: n.slice(idx + 1).slice(0, 80),
  };
}

export type UpsertContactInput = {
  email: string;
  source: ConsentSource | string;
  country?: string | null;
  userId?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  now?: Date;
};

/**
 * Find-or-create by canonical email. Existing rows are enriched (name,
 * country, user id) only where they are currently empty — we never
 * overwrite what a customer told us earlier with a guess.
 */
export async function upsertContact(
  db: CrmDb,
  input: UpsertContactInput,
): Promise<ContactRow> {
  const email = input.email.trim();
  if (!isValidEmail(email)) throw new Error("upsertContact: invalid email");
  const canonical = canonicalEmail(email);
  const existing = await getContactByEmail(db, email);
  if (existing) {
    const patch: Partial<ContactRow> = {};
    if (!existing.first_name && input.firstName)
      patch.first_name = input.firstName.trim().slice(0, 80);
    if (!existing.last_name && input.lastName)
      patch.last_name = input.lastName.trim().slice(0, 80);
    if (!existing.country && input.country)
      patch.country = input.country.trim().toUpperCase().slice(0, 2);
    if (!existing.user_id && input.userId) patch.user_id = input.userId;
    if (!existing.first_source && input.source)
      patch.first_source = String(input.source).slice(0, 40);
    if (Object.keys(patch).length === 0) return existing;
    patch.updated_at = nowIso(input.now);
    const { data, error } = await db
      .from("contacts")
      .update(patch)
      .eq("id", existing.id)
      .select(CONTACT_COLUMNS)
      .maybeSingle();
    if (error) throw new Error(`upsertContact update failed: ${error.message}`);
    return (data as ContactRow | null) ?? { ...existing, ...patch };
  }

  const ts = nowIso(input.now);
  const row = {
    email: email.toLowerCase(),
    email_canonical: canonical,
    first_name: input.firstName?.trim().slice(0, 80) || null,
    last_name: input.lastName?.trim().slice(0, 80) || null,
    country: input.country
      ? input.country.trim().toUpperCase().slice(0, 2)
      : null,
    user_id: input.userId ?? null,
    first_source: String(input.source).slice(0, 40),
    marketing_status: "unknown" as MarketingStatus,
    marketing_status_changed_at: null,
    unsubscribe_token: newUnsubscribeToken(),
    last_order_at: null,
    orders_count: 0,
    created_at: ts,
    updated_at: ts,
  };
  const { data, error } = await db
    .from("contacts")
    .insert(row)
    .select(CONTACT_COLUMNS)
    .single();
  if (error) {
    // Lost a race with a concurrent insert for the same canonical email.
    if (error.code === "23505") {
      const again = await getContactByEmail(db, email);
      if (again) return again;
    }
    throw new Error(`upsertContact insert failed: ${error.message}`);
  }
  return data as ContactRow;
}

export async function getContactByEmail(
  db: CrmDb,
  email: string,
): Promise<ContactRow | null> {
  const canonical = canonicalEmail(email);
  const { data, error } = await db
    .from("contacts")
    .select(CONTACT_COLUMNS)
    .eq("email_canonical", canonical)
    .maybeSingle();
  if (error) throw new Error(`getContactByEmail failed: ${error.message}`);
  return (data as ContactRow | null) ?? null;
}

export async function getContactById(
  db: CrmDb,
  id: string,
): Promise<ContactRow | null> {
  const { data, error } = await db
    .from("contacts")
    .select(CONTACT_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`getContactById failed: ${error.message}`);
  return (data as ContactRow | null) ?? null;
}

export async function getContactByToken(
  db: CrmDb,
  token: string,
): Promise<ContactRow | null> {
  if (!/^[a-f0-9]{48}$/.test(token)) return null;
  const { data, error } = await db
    .from("contacts")
    .select(CONTACT_COLUMNS)
    .eq("unsubscribe_token", token)
    .maybeSingle();
  if (error) throw new Error(`getContactByToken failed: ${error.message}`);
  return (data as ContactRow | null) ?? null;
}

export async function isSuppressed(db: CrmDb, email: string): Promise<boolean> {
  const canonical = canonicalEmail(email);
  const { data, error } = await db
    .from("suppressions")
    .select("email_canonical")
    .eq("email_canonical", canonical)
    .maybeSingle();
  if (error) throw new Error(`isSuppressed failed: ${error.message}`);
  return Boolean(data);
}

export type RecordContactEventInput = {
  contactId: string;
  type: ContactEventType;
  source?: string | null;
  consentTextVersion?: string | null;
  consentText?: string | null;
  ipHash?: string | null;
  userAgent?: string | null;
  orderRef?: string | null;
  metadata?: Record<string, unknown>;
  now?: Date;
};

export async function recordContactEvent(
  db: CrmDb,
  input: RecordContactEventInput,
): Promise<ContactEventRow> {
  const row = {
    contact_id: input.contactId,
    type: input.type,
    source: input.source ?? null,
    consent_text_version: input.consentTextVersion ?? null,
    consent_text: input.consentText ?? null,
    ip_hash: input.ipHash ?? null,
    user_agent: input.userAgent ?? null,
    order_ref: input.orderRef ?? null,
    metadata: input.metadata ?? {},
    created_at: nowIso(input.now),
  };
  const { data, error } = await db
    .from("contact_events")
    .insert(row)
    .select("*")
    .single();
  if (error) throw new Error(`recordContactEvent failed: ${error.message}`);
  return data as ContactEventRow;
}

async function setStatus(
  db: CrmDb,
  contact: ContactRow,
  status: MarketingStatus,
  now?: Date,
): Promise<ContactRow> {
  if (contact.marketing_status === status) return contact;
  const patch = {
    marketing_status: status,
    marketing_status_changed_at: nowIso(now),
    updated_at: nowIso(now),
  };
  const { error } = await db
    .from("contacts")
    .update(patch)
    .eq("id", contact.id);
  if (error) throw new Error(`setStatus failed: ${error.message}`);
  return { ...contact, ...patch };
}

export type RecordConsentInput = {
  email: string;
  decision: "opt_in" | "opt_out";
  source: ConsentSource | string;
  /** Key of MARKETING_CONSENT_TEXT. Unknown versions are stored as given with text = null. */
  textVersion: string;
  /** Override the wording (legacy import / owner evidence). Defaults to the versioned text. */
  text?: string | null;
  ipHash?: string | null;
  userAgent?: string | null;
  orderRef?: string | null;
  userId?: string | null;
  country?: string | null;
  firstName?: string | null;
  metadata?: Record<string, unknown>;
  /**
   * "explicit" (default): the person ticked/unticked a box or clicked
   * unsubscribe — status always follows the decision (unless suppressed).
   * "declined": a consent box was shown and left unticked — recorded, but
   * only moves 'unknown' → 'opted_out'.
   */
  mode?: "explicit" | "declined";
  now?: Date;
};

export type RecordConsentResult = {
  contact: ContactRow;
  event: ContactEventRow;
  statusChanged: boolean;
};

export async function recordConsent(
  db: CrmDb,
  input: RecordConsentInput,
): Promise<RecordConsentResult> {
  const contact = await upsertContact(db, {
    email: input.email,
    source: input.source,
    userId: input.userId,
    country: input.country,
    firstName: input.firstName,
    now: input.now,
  });
  const text =
    input.text ??
    (isConsentTextVersion(input.textVersion)
      ? MARKETING_CONSENT_TEXT[input.textVersion]
      : null);
  const suppressed =
    contact.marketing_status === "suppressed" ||
    (await isSuppressed(db, contact.email));

  const target: MarketingStatus =
    input.decision === "opt_in" ? "opted_in" : "opted_out";
  let next = contact;
  let applied = false;
  if (!suppressed) {
    if (input.mode === "declined") {
      if (contact.marketing_status === "unknown") {
        next = await setStatus(db, contact, target, input.now);
        applied = true;
      }
    } else {
      next = await setStatus(db, contact, target, input.now);
      applied = next.marketing_status === target;
    }
  }

  const event = await recordContactEvent(db, {
    contactId: contact.id,
    type: input.decision === "opt_in" ? "consent_opt_in" : "consent_opt_out",
    source: String(input.source),
    consentTextVersion: input.textVersion,
    consentText: text,
    ipHash: input.ipHash ?? null,
    userAgent: input.userAgent ?? null,
    orderRef: input.orderRef ?? null,
    metadata: {
      ...(input.metadata ?? {}),
      mode: input.mode ?? "explicit",
      applied,
      ...(suppressed ? { blocked_by: "suppressed" } : {}),
      previous_status: contact.marketing_status,
      resulting_status: next.marketing_status,
    },
    now: input.now,
  });
  return {
    contact: next,
    event,
    statusChanged: next.marketing_status !== contact.marketing_status,
  };
}

/** Minimal `orders` shape the CRM needs (customer_email is required to do anything). */
export type OrderForCrm = {
  order_ref: string;
  customer_email?: string | null;
  customer_name?: string | null;
  user_id?: string | null;
  status?: string | null;
  marketing_consent?: boolean | null;
  consent_text_version?: string | null;
  consent_recorded_at?: string | null;
  shipping_address?: {
    country?: string | null;
    country_code?: string | null;
  } | null;
  destination_country?: string | null;
  paid_at?: string | null;
  created_at?: string | null;
};

function orderCountry(order: OrderForCrm): string | null {
  const c =
    order.destination_country ||
    order.shipping_address?.country_code ||
    order.shipping_address?.country ||
    null;
  return c && /^[A-Za-z]{2}$/.test(c) ? c.toUpperCase() : null;
}

export type LinkOrderInput = {
  orderRef: string;
  email: string;
  name?: string | null;
  country?: string | null;
  userId?: string | null;
  paidAt?: string | Date | null;
  now?: Date;
};

/**
 * Link a paid order to its contact: sets orders.contact_id, records ONE
 * purchase event per order_ref (idempotent across webhook retries) and
 * maintains orders_count / last_order_at. marketing_status is untouched.
 */
export async function linkOrderToContact(
  db: CrmDb,
  input: LinkOrderInput,
): Promise<{ contact: ContactRow; created: boolean }> {
  const { first, last } = splitName(input.name);
  const contact = await upsertContact(db, {
    email: input.email,
    source: "checkout",
    country: input.country,
    userId: input.userId,
    firstName: first,
    lastName: last,
    now: input.now,
  });

  const { error: linkErr } = await db
    .from("orders")
    .update({ contact_id: contact.id })
    .eq("order_ref", input.orderRef);
  if (linkErr)
    throw new Error(
      `linkOrderToContact: orders update failed: ${linkErr.message}`,
    );

  const { error: eventError } = await db.from("contact_events").insert({
    contact_id: contact.id,
    type: "purchase",
    source: "checkout",
    order_ref: input.orderRef,
  });
  if (eventError && eventError.code !== "23505")
    throw new Error("Could not record purchase history");
  const { error: countError } = await db.rpc("crm_recount_orders", {
    contact: contact.id,
  });
  if (countError) throw new Error("Could not update customer order count");
  return {
    contact: (await getContactById(db, contact.id)) || contact,
    created: !eventError,
  };
}

/**
 * Called from the paid webhook. Always links the order; records a consent
 * decision only when the checkout box was shown (true/false). null = no box
 * → nothing but the link. Safe to call repeatedly (purchase event is
 * idempotent; a repeated consent event is harmless audit noise, so we
 * skip it when one already exists for this order_ref).
 */
export async function recordConsentFromOrder(
  db: CrmDb,
  order: OrderForCrm,
  now?: Date,
): Promise<{ contact: ContactRow | null; consentRecorded: boolean }> {
  const email = order.customer_email?.trim();
  if (!email || !isValidEmail(email))
    return { contact: null, consentRecorded: false };

  const { contact } = await linkOrderToContact(db, {
    orderRef: order.order_ref,
    email,
    name: order.customer_name,
    country: orderCountry(order),
    userId: order.user_id,
    paidAt: order.paid_at ?? order.created_at ?? null,
    now,
  });

  if (typeof order.marketing_consent !== "boolean")
    return { contact, consentRecorded: false };
  // A delayed payment must never undo a newer unsubscribe or preference change.
  if (
    contact.marketing_status_changed_at &&
    order.consent_recorded_at &&
    contact.marketing_status_changed_at > order.consent_recorded_at
  )
    return { contact, consentRecorded: false };

  const { data: prior } = await db
    .from("contact_events")
    .select("id")
    .eq("contact_id", contact.id)
    .eq("order_ref", order.order_ref)
    .in("type", ["consent_opt_in", "consent_opt_out"])
    .limit(1);
  if (prior && prior.length > 0) return { contact, consentRecorded: false };

  const result = await recordConsent(db, {
    email,
    decision: order.marketing_consent ? "opt_in" : "opt_out",
    mode: order.marketing_consent ? "explicit" : "declined",
    source: "checkout",
    textVersion: order.consent_text_version || "checkout-v1",
    orderRef: order.order_ref,
    userId: order.user_id,
    metadata: order.consent_recorded_at
      ? { consent_recorded_at: order.consent_recorded_at }
      : {},
    now,
  });
  return { contact: result.contact, consentRecorded: true };
}

/** Token flow (email footer / one-click). Never returns the email. */
export async function setUnsubscribedByToken(
  db: CrmDb,
  token: string,
  opts: {
    source?: "unsubscribe" | "one-click";
    userAgent?: string | null;
    now?: Date;
  } = {},
): Promise<{ ok: boolean; alreadyOut?: boolean }> {
  const contact = await getContactByToken(db, token);
  if (!contact) return { ok: false };
  const alreadyOut = contact.marketing_status === "opted_out";
  if (contact.marketing_status !== "suppressed" && !alreadyOut)
    await setStatus(db, contact, "opted_out", opts.now);
  await recordContactEvent(db, {
    contactId: contact.id,
    type: "unsubscribe",
    source: opts.source ?? "unsubscribe",
    userAgent: opts.userAgent ?? null,
    metadata: { previous_status: contact.marketing_status },
    now: opts.now,
  });
  return { ok: true, alreadyOut };
}

/** Bounce/complaint from the provider: suppress + mark contact. Idempotent. */
export async function suppressEmail(
  db: CrmDb,
  email: string,
  reason: "bounce" | "complaint",
  opts: { metadata?: Record<string, unknown>; now?: Date } = {},
): Promise<{ contact: ContactRow | null }> {
  const canonical = canonicalEmail(email);
  const { error } = await db
    .from("suppressions")
    .upsert(
      { email_canonical: canonical, reason, created_at: nowIso(opts.now) },
      { onConflict: "email_canonical", ignoreDuplicates: true },
    );
  if (error) throw new Error(`suppressEmail failed: ${error.message}`);
  const contact = await getContactByEmail(db, email);
  if (!contact) return { contact: null };
  const next = await setStatus(db, contact, "suppressed", opts.now);
  await recordContactEvent(db, {
    contactId: contact.id,
    type: reason,
    source: "resend",
    metadata: opts.metadata ?? {},
    now: opts.now,
  });
  return { contact: next };
}

/** Count paid orders for an address (exact lower-case OR canonical form). */
export async function countPaidOrdersForEmail(
  db: CrmDb,
  email: string,
): Promise<number> {
  const { data, error } = await db.rpc("crm_count_paid_orders", {
    email_address: email,
    customer_id: null,
  });
  if (error || typeof data !== "number")
    throw new Error("Cannot verify first-order eligibility");
  return data;
}
