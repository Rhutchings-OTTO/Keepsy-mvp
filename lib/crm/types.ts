/**
 * Row shapes for the CRM tables (supabase/migrations/202609090002_crm.sql).
 * Kept narrow on purpose: routes select only what they need.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

/** Any Supabase client with service-role access (tests pass a fake). */
export type CrmDb = SupabaseClient;

export type MarketingStatus =
  | "unknown"
  | "opted_in"
  | "opted_out"
  | "suppressed";

export type ContactRow = {
  id: string;
  email: string;
  email_canonical: string;
  first_name: string | null;
  last_name: string | null;
  country: string | null;
  user_id: string | null;
  first_source: string | null;
  marketing_status: MarketingStatus;
  marketing_status_changed_at: string | null;
  unsubscribe_token: string;
  last_order_at: string | null;
  orders_count: number;
  created_at: string;
  updated_at: string;
};

export type ContactEventType =
  | "signup"
  | "purchase"
  | "consent_opt_in"
  | "consent_opt_out"
  | "unsubscribe"
  | "bounce"
  | "complaint"
  | "welcome_code_issued"
  | "email_queued"
  | "email_sent"
  | "email_failed"
  | "legacy_import"
  | "owner_note";

export type ContactEventRow = {
  id: number | string;
  contact_id: string;
  type: ContactEventType;
  source: string | null;
  consent_text_version: string | null;
  consent_text: string | null;
  ip_hash: string | null;
  user_agent: string | null;
  order_ref: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type ConsentSource =
  | "homepage"
  | "footer"
  | "create-exit"
  | "checkout"
  | "account"
  | "owner"
  | "unsubscribe"
  | "legacy";

export type EmailQueueStatus =
  | "queued"
  | "sending"
  | "sent"
  | "failed"
  | "skipped";

export type EmailQueueRow = {
  id: string;
  campaign_id: string | null;
  contact_id: string;
  to_email: string;
  template_key: string;
  dedupe_key: string;
  payload: Record<string, unknown>;
  status: EmailQueueStatus;
  skip_reason: string | null;
  attempts: number;
  first_attempt_at: string | null;
  next_attempt_at: string;
  last_error: string | null;
  provider_message_id: string | null;
  consent_checked_at: string | null;
  created_at: string;
  sent_at: string | null;
  delivered_at: string | null;
};

export type CampaignStatus =
  | "draft"
  | "ready"
  | "sending"
  | "paused"
  | "done"
  | "cancelled";

export type CampaignRow = {
  id: string;
  name: string;
  subject: string;
  preheader: string | null;
  template_key: string;
  status: CampaignStatus;
  audience: AudienceFilter;
  content: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  scheduled_for: string | null;
  stats: Record<string, unknown>;
};

/** Stored on campaigns.audience. Every field optional; opted_in is always implied. */
export type AudienceFilter = {
  country?: string | null;
  /** ISO date: only contacts whose last order is on/after this. */
  lastOrderAfter?: string | null;
  /** ISO date: only contacts whose last order is on/before this. */
  lastOrderBefore?: string | null;
  /** true → only buyers, false → only non-buyers, undefined → everyone. */
  hasOrdered?: boolean | null;
};
