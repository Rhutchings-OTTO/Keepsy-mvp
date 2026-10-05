-- ============================================================
-- Keepsy — CRM, marketing consent, email queue (phase 2)
-- ============================================================
-- Additive and idempotent (IF NOT EXISTS everywhere). Apply AFTER
-- 202609090001 (which adds orders.marketing_consent, orders.consent_text_version,
-- orders.consent_recorded_at and the discount_codes table — referenced, not
-- duplicated here).
--
-- Access model: every table below is SERVICE ROLE ONLY. RLS is enabled with
-- no anon/authenticated policies, so the browser client can never read a
-- contact, a consent record or a queued email. All reads/writes go through
-- server code that checks the owner session (lib/admin/ownerAuth.ts), the
-- customer's own session (/api/crm/me) or an unguessable unsubscribe token.
--
-- Consent semantics (see lib/crm/contacts.ts):
--   unknown    — we hold the address (buyer / legacy list) but have NO
--                evidence of marketing consent. Never emailed marketing.
--   opted_in   — explicit, versioned consent recorded in contact_events.
--   opted_out  — unsubscribed / declined. Transactional order mail unaffected.
--   suppressed — bounce or complaint from the provider. Terminal unless an
--                owner clears it deliberately (not automated anywhere).
-- Historical buyers are imported as 'unknown'. A purchase alone never
-- becomes consent.
-- ============================================================

-- ── contacts ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  email_canonical text NOT NULL UNIQUE,
  first_name text NULL,
  last_name text NULL,
  country text NULL,
  user_id uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  first_source text NULL,
  marketing_status text NOT NULL DEFAULT 'unknown'
    CHECK (marketing_status IN ('unknown', 'opted_in', 'opted_out', 'suppressed')),
  marketing_status_changed_at timestamptz NULL,
  unsubscribe_token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  last_order_at timestamptz NULL,
  orders_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS contacts_user_id_idx ON public.contacts (user_id);
CREATE INDEX IF NOT EXISTS contacts_marketing_status_idx ON public.contacts (marketing_status);
CREATE INDEX IF NOT EXISTS contacts_created_at_idx ON public.contacts (created_at DESC);
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
-- No policies: service role only.

-- ── contact_events (append-only audit trail) ───────────────────────────────
CREATE TABLE IF NOT EXISTS public.contact_events (
  id bigserial PRIMARY KEY,
  contact_id uuid NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN (
    'signup', 'purchase', 'consent_opt_in', 'consent_opt_out', 'unsubscribe',
    'bounce', 'complaint', 'welcome_code_issued', 'email_queued', 'email_sent',
    'email_failed', 'legacy_import', 'owner_note'
  )),
  source text NULL,
  consent_text_version text NULL,
  consent_text text NULL,
  ip_hash text NULL,
  user_agent text NULL,
  order_ref text NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS contact_events_contact_created_idx
  ON public.contact_events (contact_id, created_at DESC);
CREATE INDEX IF NOT EXISTS contact_events_order_ref_idx ON public.contact_events (order_ref);
ALTER TABLE public.contact_events ENABLE ROW LEVEL SECURITY;

-- ── suppressions (bounces / complaints; keyed by canonical email) ──────────
CREATE TABLE IF NOT EXISTS public.suppressions (
  email_canonical text PRIMARY KEY,
  reason text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.suppressions ENABLE ROW LEVEL SECURITY;

-- ── orders → contacts link (no address copying; orders keep the address) ───
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS contact_id uuid NULL REFERENCES public.contacts(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS orders_contact_id_idx ON public.orders (contact_id);

-- ── campaigns ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  subject text NOT NULL DEFAULT '',
  preheader text NULL,
  template_key text NOT NULL DEFAULT 'campaign-generic',
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'ready', 'sending', 'paused', 'done', 'cancelled')),
  audience jsonb NOT NULL DEFAULT '{}'::jsonb,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  scheduled_for timestamptz NULL,
  stats jsonb NOT NULL DEFAULT '{}'::jsonb
);
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

-- ── email_queue (every outbound marketing/onboarding email goes through here)
CREATE TABLE IF NOT EXISTS public.email_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NULL REFERENCES public.campaigns(id) ON DELETE SET NULL,
  contact_id uuid NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  to_email text NOT NULL,
  template_key text NOT NULL,
  dedupe_key text NOT NULL UNIQUE,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'sending', 'sent', 'failed', 'skipped')),
  skip_reason text NULL,
  attempts integer NOT NULL DEFAULT 0,
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  last_error text NULL,
  provider_message_id text NULL,
  consent_checked_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz NULL,
  delivered_at timestamptz NULL
);
CREATE INDEX IF NOT EXISTS email_queue_status_next_idx ON public.email_queue (status, next_attempt_at);
CREATE INDEX IF NOT EXISTS email_queue_campaign_idx ON public.email_queue (campaign_id, status);
CREATE INDEX IF NOT EXISTS email_queue_contact_idx ON public.email_queue (contact_id);
CREATE INDEX IF NOT EXISTS email_queue_provider_message_idx ON public.email_queue (provider_message_id);
ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;

-- ── email_events (provider webhooks, idempotent on the Svix message id) ─────
CREATE TABLE IF NOT EXISTS public.email_events (
  id bigserial PRIMARY KEY,
  provider text NOT NULL DEFAULT 'resend',
  provider_event_id text NOT NULL UNIQUE,
  event_type text NOT NULL,
  provider_message_id text NULL,
  to_email text NULL,
  contact_id uuid NULL REFERENCES public.contacts(id) ON DELETE SET NULL,
  raw jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS email_events_message_idx ON public.email_events (provider_message_id);
ALTER TABLE public.email_events ENABLE ROW LEVEL SECURITY;

-- ── updated_at maintenance ─────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.crm_touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS contacts_touch_updated_at ON public.contacts;
CREATE TRIGGER contacts_touch_updated_at
  BEFORE UPDATE ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION public.crm_touch_updated_at();

DROP TRIGGER IF EXISTS campaigns_touch_updated_at ON public.campaigns;
CREATE TRIGGER campaigns_touch_updated_at
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION public.crm_touch_updated_at();
