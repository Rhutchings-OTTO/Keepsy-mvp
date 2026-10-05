-- ============================================================
-- Keepsy phase 2 — destination-aware checkout, welcome codes, consent
-- ============================================================
-- Additive and idempotent. Apply BEFORE 202609090002_crm.sql and
-- 202609090003_owner_ops.sql. Review in the Supabase SQL editor; the
-- coordinator never applies migrations from the implementation process.
-- ============================================================

-- ── orders: destination + shipping + discount + consent ────────────────────
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS destination_country text NULL;   -- ISO 3166-1 alpha-2 chosen by the customer
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS market text NULL;                -- GB | US | EU | CA | AU | NZ
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS checkout_email text NULL;        -- email locked on the Stripe session (discount/user), if any
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS subtotal_amount numeric(10,2) NULL;   -- currency units, before shipping/discount
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_amount numeric(10,2) NULL;   -- customer shipping charged (currency units)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS discount_code text NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS discount_amount numeric(10,2) NULL;   -- currency units
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS discount_kind text NULL;              -- welcome | stripe_promotion
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_country text NULL;           -- country Stripe collected at payment (must equal destination_country)
-- Explicit marketing consent captured on OUR checkout step. NULL = box not shown / no decision recorded.
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS marketing_consent boolean NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS consent_text_version text NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS consent_recorded_at timestamptz NULL;
CREATE INDEX IF NOT EXISTS orders_customer_email_lower_idx ON public.orders (lower(customer_email));
CREATE INDEX IF NOT EXISTS orders_checkout_email_lower_idx ON public.orders (lower(checkout_email));

-- ── discount_codes: signed, single-use, email-bound welcome codes ───────────
CREATE TABLE IF NOT EXISTS public.discount_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,                     -- KEEPSY-XXXXXX-YYYY (HMAC tail)
  offer_id text NOT NULL,                        -- welcome10
  percent integer NOT NULL CHECK (percent > 0 AND percent <= 100),
  email text NOT NULL,                           -- as typed at signup (lower-cased)
  email_canonical text NOT NULL,                 -- one code per person
  text_version text NOT NULL,                    -- offer wording version promised
  issued_source text NULL,                       -- homepage | footer | create-exit | owner
  issued_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  locked_order_ref text NULL,                    -- checkout currently holding the code
  locked_at timestamptz NULL,
  redeemed_at timestamptz NULL,
  redeemed_order_ref text NULL,
  stripe_coupon_id text NULL,                    -- one-off coupon created for the redeeming session
  revoked_at timestamptz NULL,
  revoke_reason text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS discount_codes_email_canonical_idx ON public.discount_codes (email_canonical);
CREATE INDEX IF NOT EXISTS discount_codes_live_idx ON public.discount_codes (email_canonical) WHERE redeemed_at IS NULL AND revoked_at IS NULL;
ALTER TABLE public.discount_codes ENABLE ROW LEVEL SECURITY;
-- No policies: service role only. Customers never read this table directly.
