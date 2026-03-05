-- ── Fix all Supabase security linter warnings ────────────────────────────────
-- Run in Supabase Dashboard → SQL Editor

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Fix mutable search_path on all flagged functions
--
--    Without SET search_path, a malicious user who can create objects in any
--    schema could shadow functions/tables the function relies on.
--    Using a DO loop handles functions whose argument lists we may not know.
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN (
        'get_admin_user_count',
        'decrement_product_quantity',
        'book_delivery_slot',
        'claim_delivery_slot',
        'update_store_updated_at',
        'update_slot_booked_count',
        'handle_new_user'
      )
  LOOP
    EXECUTE format(
      'ALTER FUNCTION public.%I(%s) SET search_path = public',
      r.proname, r.args
    );
  END LOOP;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Drop overly permissive "Service role" policies on categories & products
--
--    These have USING(true) WITH CHECK(true) which bypasses RLS entirely.
--    Specific admin policies (insert/update/delete via is_admin()) already
--    exist from migration 20260304120000_fix_rls_anon_key.sql so we only
--    need to drop the bad catch-all policies.
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Service role can manage categories" ON categories;
DROP POLICY IF EXISTS "Service role can manage products"   ON products;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Fix "Admins can update all orders" — WITH CHECK was (true)
--
--    "Admins can manage all orders" (FOR ALL via is_admin()) already exists
--    and covers UPDATE, so this duplicate policy is just dropped.
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can update all orders" ON orders;

-- ─────────────────────────────────────────────────────────────────────────────
-- NOTE: "Leaked Password Protection Disabled" (auth_leaked_password_protection)
--       cannot be fixed via SQL. Enable it in:
--       Supabase Dashboard → Authentication → Password Settings
--       → toggle ON "Prevent use of leaked passwords"
-- ─────────────────────────────────────────────────────────────────────────────
