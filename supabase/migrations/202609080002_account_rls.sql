-- ============================================================
-- Keepsy — RLS for customer accounts
-- ============================================================
-- Apply AFTER 202609080001_multi_line_orders.sql and BEFORE adding
-- NEXT_PUBLIC_SUPABASE_ANON_KEY to the app environment.
--
-- Why: 20260308_add_rls_policies.sql created an anon SELECT policy on
-- `orders` with USING (true). With no anon key in the app that was inert, but
-- the moment a browser client exists it would expose every order row
-- (customer_email, shipping_address, …) to anyone. All server reads use the
-- service role (which bypasses RLS), so anon read access was never required.
-- ============================================================

-- ── orders ──────────────────────────────────────────────────────────────────
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_read_own_order_by_ref" ON public.orders;
DROP POLICY IF EXISTS "anon_select_orders" ON public.orders;

DROP POLICY IF EXISTS "authenticated_read_own_orders" ON public.orders;
CREATE POLICY "authenticated_read_own_orders"
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- No INSERT / UPDATE / DELETE for anon or authenticated — server-side only.

-- ── order_items ─────────────────────────────────────────────────────────────
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_read_order_items_via_order" ON public.order_items;
DROP POLICY IF EXISTS "anon_select_order_items" ON public.order_items;

DROP POLICY IF EXISTS "authenticated_read_own_order_items" ON public.order_items;
CREATE POLICY "authenticated_read_own_order_items"
  ON public.order_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.order_ref = public.order_items.order_ref
        AND o.user_id = auth.uid()
    )
  );

-- ── saved_designs (owner-only) ──────────────────────────────────────────────
ALTER TABLE public.saved_designs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "saved_designs_select_own" ON public.saved_designs;
CREATE POLICY "saved_designs_select_own"
  ON public.saved_designs FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "saved_designs_insert_own" ON public.saved_designs;
CREATE POLICY "saved_designs_insert_own"
  ON public.saved_designs FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "saved_designs_delete_own" ON public.saved_designs;
CREATE POLICY "saved_designs_delete_own"
  ON public.saved_designs FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ── deletion_requests: keep GDPR self-service insert for anon (unchanged) ───
-- (policy "anon_insert_deletion_request" from 20260308 remains in place)
