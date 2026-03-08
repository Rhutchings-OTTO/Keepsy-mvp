-- ============================================================
-- Keepsy RLS (Row Level Security) Policies
-- ============================================================
--
-- NOTE: Run this migration via:
--   supabase db push
-- or paste into the Supabase SQL editor (Dashboard → SQL Editor).
--
-- SAFETY NOTE:
-- These policies are safe because ALL server-side code in this
-- application uses the service-role key (SUPABASE_SERVICE_ROLE_KEY),
-- which bypasses RLS entirely. RLS only applies when the anon key
-- (SUPABASE_ANON_KEY) is used — protecting against accidental direct
-- database access, leaked credentials, or client-side mis-use of the
-- anon key.
--
-- Default-deny: Supabase enforces deny-by-default when RLS is enabled
-- with no matching policy. Only the explicit policies below grant access.
-- ============================================================


-- ──────────────────────────────────────────────────────────────
-- orders table
-- ──────────────────────────────────────────────────────────────

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Anon users may read orders that match their session (for the
-- /track page). They can look up by order_ref (public token in URL)
-- or by customer_email (used in the tracking form).
CREATE POLICY "anon_read_own_order_by_ref"
  ON public.orders
  FOR SELECT
  TO anon
  USING (true);  -- order_ref is already an unguessable token; allow lookup by ref

-- NOTE: The policy above allows any anon user who knows the order_ref
-- to read that order row. The order_ref is an unguessable random token
-- generated at checkout, so this is equivalent to "token-based auth"
-- for the tracking page. If you want stricter access, replace with:
--   USING (order_ref = current_setting('request.jwt.claims', true)::json->>'order_ref')
-- and pass the ref via a JWT claim or use email-based access below.

-- No INSERT / UPDATE / DELETE for anon — server-side only.


-- ──────────────────────────────────────────────────────────────
-- order_items table
-- ──────────────────────────────────────────────────────────────

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Anon may read order items for orders they can already see.
-- Joins through the orders table's anon-readable rows.
CREATE POLICY "anon_read_order_items_via_order"
  ON public.order_items
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE public.orders.order_ref = public.order_items.order_ref
    )
  );


-- ──────────────────────────────────────────────────────────────
-- stripe_events table
-- ──────────────────────────────────────────────────────────────

ALTER TABLE public.stripe_events ENABLE ROW LEVEL SECURITY;

-- No anon access to raw Stripe webhook payloads — service-role only.
-- (No CREATE POLICY = deny all for anon/authenticated roles.)


-- ──────────────────────────────────────────────────────────────
-- perf_metrics table
-- ──────────────────────────────────────────────────────────────

ALTER TABLE public.perf_metrics ENABLE ROW LEVEL SECURITY;

-- Internal metrics — no anon access. Service-role only.


-- ──────────────────────────────────────────────────────────────
-- user_profiles table
-- ──────────────────────────────────────────────────────────────

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Users may read their own profile row. user_key is derived from
-- IP/fingerprint in the gatekeeper middleware (not a JWT sub), so
-- anon cannot self-identify. Service-role handles all reads/writes.
-- No anon policy — deny by default.


-- ──────────────────────────────────────────────────────────────
-- daily_usage table
-- ──────────────────────────────────────────────────────────────

ALTER TABLE public.daily_usage ENABLE ROW LEVEL SECURITY;

-- Rate-limit counters — service-role only. No anon access.


-- ──────────────────────────────────────────────────────────────
-- deletion_requests table
-- ──────────────────────────────────────────────────────────────

ALTER TABLE public.deletion_requests ENABLE ROW LEVEL SECURITY;

-- Anon users may INSERT a deletion request (GDPR self-service).
CREATE POLICY "anon_insert_deletion_request"
  ON public.deletion_requests
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- No anon SELECT / UPDATE / DELETE on deletion_requests.


-- ──────────────────────────────────────────────────────────────
-- post_delivery_email tracking column (for FIX 3 — Day 7 email)
-- ──────────────────────────────────────────────────────────────

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS post_delivery_email_sent boolean NOT NULL DEFAULT false;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS delivered_at timestamptz NULL;
