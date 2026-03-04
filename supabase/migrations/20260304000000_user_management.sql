-- ============================================================
-- User Management: RLS policies and helpers
-- Run this in Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Allow admins to UPDATE any profile (e.g. change role) 
--    when calling from the frontend JWT (complementary to service role).
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
CREATE POLICY "Admins can update any profile"
ON profiles FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
)
WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 2. Allow admins to view all profiles (already covered by the
--    "Public profiles are viewable by everyone" policy, but this
--    makes the intent explicit and survives accidental policy drops).
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles"
ON profiles FOR SELECT
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 3. RPC: get_admin_user_count — quick dashboard stat
CREATE OR REPLACE FUNCTION public.get_admin_user_count()
RETURNS TABLE(total_users BIGINT, total_admins BIGINT, total_customers BIGINT)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    COUNT(*)                                     AS total_users,
    COUNT(*) FILTER (WHERE role = 'admin')       AS total_admins,
    COUNT(*) FILTER (WHERE role = 'customer')    AS total_customers
  FROM public.profiles;
$$;

-- Grant execute to authenticated users (admins use it via backend)
GRANT EXECUTE ON FUNCTION public.get_admin_user_count() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_user_count() TO service_role;

-- ============================================================
-- IMPORTANT — Service Role Key (run in your backend .env)
-- ============================================================
-- The GET /admin/users endpoint calls supabase.auth.admin.listUsers()
-- which REQUIRES the SERVICE ROLE KEY (not the anon key).
--
-- In Supabase Dashboard:
--   Project Settings → API → "service_role" key (keep this secret!)
--
-- In backend/.env set:
--   SUPABASE_SERVICE_ROLE_KEY=<your service_role key>
--
-- The anon key goes to:
--   SUPABASE_ANON_KEY=<your anon key>
--   (and VITE_SUPABASE_ANON_KEY in frontend/.env)
-- ============================================================
