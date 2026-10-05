-- ============================================================
-- Keepsy — owner operations: order timeline, owner notification outbox,
-- web-push subscriptions, alert preferences, Stripe/Printify money facts.
-- ============================================================
-- Additive and idempotent (IF NOT EXISTS everywhere). Safe to re-run.
-- Every table here is written ONLY by the service role (server code).
-- RLS is enabled with no policies, so anon/authenticated clients get
-- nothing — owners read through server components, never the browser SDK.
--
-- Apply AFTER 202609090001_* (coordinator: destination/discount/consent
-- columns on orders — not duplicated here).
-- ============================================================

-- ── order_events: append-only timeline per order ─────────────────────────────
CREATE TABLE IF NOT EXISTS public.order_events (
  id bigserial PRIMARY KEY,
  order_ref text NOT NULL,
  type text NOT NULL,
  source text NOT NULL CHECK (source IN ('stripe', 'printify', 'system', 'owner', 'inngest')),
  external_id text NULL,
  -- Writers scope this as "<order_ref>:<key>" (lib/orders/events.ts) so the
  -- unique index is effectively per order.
  idempotency_key text NULL UNIQUE,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  actor text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS order_events_order_ref_created_idx ON public.order_events (order_ref, created_at);
ALTER TABLE public.order_events ENABLE ROW LEVEL SECURITY;

-- ── notification_outbox: owner alerts (email + web push), dedupe by key ──────
CREATE TABLE IF NOT EXISTS public.notification_outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dedupe_key text NOT NULL UNIQUE,
  kind text NOT NULL,
  severity text NOT NULL CHECK (severity IN ('critical', 'warning', 'info')),
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  url text NULL,
  order_ref text NULL,
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'sending', 'sent', 'partial', 'failed')),
  -- Per-channel results: { email: {...}, push: {...} } — written by the dispatcher.
  channels jsonb NOT NULL DEFAULT '{}'::jsonb,
  attempts integer NOT NULL DEFAULT 0,
  next_attempt_at timestamptz NULL,
  last_error text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz NULL
);
CREATE INDEX IF NOT EXISTS notification_outbox_status_next_idx ON public.notification_outbox (status, next_attempt_at);
CREATE INDEX IF NOT EXISTS notification_outbox_order_ref_idx ON public.notification_outbox (order_ref);
ALTER TABLE public.notification_outbox ENABLE ROW LEVEL SECURITY;

-- ── owner_push_subscriptions: one row per browser/device ─────────────────────
CREATE TABLE IF NOT EXISTS public.owner_push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint text NOT NULL UNIQUE,
  p256dh text NOT NULL,
  auth text NOT NULL,
  user_agent text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_success_at timestamptz NULL,
  last_failure_at timestamptz NULL,
  failure_count integer NOT NULL DEFAULT 0,
  disabled_at timestamptz NULL
);
CREATE INDEX IF NOT EXISTS owner_push_subscriptions_user_idx ON public.owner_push_subscriptions (user_id);
ALTER TABLE public.owner_push_subscriptions ENABLE ROW LEVEL SECURITY;

-- ── owner_alert_prefs: per-owner channel switches ────────────────────────────
CREATE TABLE IF NOT EXISTS public.owner_alert_prefs (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Lower-cased owner email, kept so the email dispatcher can match a
  -- recipient in OWNER_EMAILS to its preferences without an auth.users join.
  email text NULL,
  email_enabled boolean NOT NULL DEFAULT true,
  push_enabled boolean NOT NULL DEFAULT true,
  min_severity text NOT NULL DEFAULT 'info' CHECK (min_severity IN ('critical', 'warning', 'info')),
  -- { "start": "22:00", "end": "07:00", "tz": "Europe/London" } — push only,
  -- critical alerts ignore it.
  quiet_hours jsonb NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.owner_alert_prefs ADD COLUMN IF NOT EXISTS email text NULL;
ALTER TABLE public.owner_alert_prefs ENABLE ROW LEVEL SECURITY;

-- ── orders: money + review facts (read-only mirrors of Stripe / Printify) ────
-- All *_minor columns are integer minor units (pence / cents) in the currency
-- named alongside them: amount_* in orders.currency, stripe_fee/net in the
-- balance transaction's settlement currency (recorded in the sync event),
-- printify_* in printify_cost_currency.
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS stripe_charge_id text NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS amount_subtotal_minor integer NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS amount_shipping_minor integer NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS amount_discount_minor integer NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS amount_total_minor integer NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS stripe_fee_minor integer NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS stripe_net_minor integer NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS printify_total_cost_minor integer NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS printify_total_shipping_minor integer NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS printify_cost_currency text NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS manual_review_reason text NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS reviewed_at timestamptz NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS reviewed_by text NULL;

CREATE INDEX IF NOT EXISTS orders_stripe_payment_intent_idx ON public.orders (stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS orders_printify_status_idx ON public.orders (printify_status);
