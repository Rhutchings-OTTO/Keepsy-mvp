-- ============================================================
-- Keepsy — multi-line fulfilment, original-photo prints, order ownership
-- ============================================================
-- Additive and idempotent. Safe to run on the live project (all statements
-- use IF NOT EXISTS / DROP CONSTRAINT IF EXISTS). Review before applying:
--   Supabase Dashboard → SQL Editor, or `supabase db push`.
--
-- Background: the live `orders` table already carries columns that were
-- never captured in this repo's migrations (customer_email, printify_*,
-- tracking_*, product_type, variant_size, variant_color, region,
-- cropped_image_url). They are re-declared here with IF NOT EXISTS so a fresh
-- environment matches production.
-- ============================================================

-- ── orders: columns the application writes ─────────────────────────────────
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_email text NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_name text NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_address jsonb NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS product_type text NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS variant_size text NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS variant_color text NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS region text NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cropped_image_url text NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS printful_order_id integer NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS printify_image_id text NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS printify_product_id text NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS printify_order_id text NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS printify_status text NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_number text NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_url text NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS post_delivery_email_sent boolean NOT NULL DEFAULT false;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivered_at timestamptz NULL;

-- NEW: per-line fulfilment record (JSON) and the owning customer (nullable → guests keep working)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS fulfilment jsonb NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS user_id uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS orders_user_id_idx ON public.orders (user_id);

-- The original CHECK only allowed pending|paid|failed|cancelled, but the app
-- already writes in_production / shipped / delivered. Relax it to the real set.
-- The live constraint may not be named orders_status_check (schema drift), so
-- find any CHECK on orders that mentions "status" and drop it by its real name.
DO $$
DECLARE c text;
BEGIN
  FOR c IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'public.orders'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%status%'
  LOOP
    EXECUTE format('ALTER TABLE public.orders DROP CONSTRAINT %I', c);
  END LOOP;
END $$;
ALTER TABLE public.orders
  ADD CONSTRAINT orders_status_check
  CHECK (status IN ('pending', 'paid', 'failed', 'cancelled', 'in_production', 'shipped', 'delivered'));

-- ── order_items: per-line variant + print source (enables multi-size orders) ─
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS product_id text NULL;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS size text NULL;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS color text NULL;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS design_url text NULL;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS cropped_image_url text NULL;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS source_kind text NULL
  CHECK (source_kind IS NULL OR source_kind IN ('ai', 'original'));
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS addon_id text NULL;

-- ── saved_designs: the customer's design library (mirrors the local vault) ──
CREATE TABLE IF NOT EXISTS public.saved_designs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  design_url text NULL,
  prompt text NULL,
  source_kind text NULL CHECK (source_kind IS NULL OR source_kind IN ('ai', 'original')),
  width integer NULL,
  height integer NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS saved_designs_user_id_created_idx ON public.saved_designs (user_id, created_at DESC);
-- Lock the table down immediately (deny-by-default); owner policies come in 202609080002_account_rls.sql.
ALTER TABLE public.saved_designs ENABLE ROW LEVEL SECURITY;
