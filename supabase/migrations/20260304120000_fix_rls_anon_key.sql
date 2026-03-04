-- ============================================================
-- FIX: Infinite recursion + anon-key-only RLS policies
-- Run in Supabase Dashboard → SQL Editor
-- ============================================================

-- ─── 1. Security-definer helper (bypasses RLS — no recursion) ───────────
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon;

-- ─── 2. Add email column to profiles (populated on signup) ──────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email TEXT;

-- ─── 3. Update trigger: also store email on new user signup ─────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, email)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    new.email
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Back-fill email for existing profiles
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND p.email IS NULL;

-- ─── 4. Drop the RECURSIVE policies I introduced ────────────────────────
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;

-- ─── 5. Non-recursive profile admin update policy ───────────────────────
CREATE POLICY "Admins can update any profile"
ON profiles FOR UPDATE
USING (is_admin())
WITH CHECK (is_admin());

-- ─── 6. Orders: admin can update ANY order (e.g. change status) ─────────
DROP POLICY IF EXISTS "Admins can update any order" ON orders;
CREATE POLICY "Admins can update any order"
ON orders FOR UPDATE
USING (is_admin())
WITH CHECK (is_admin());

-- Replace over-permissive "Service role can manage orders" with admin policy
DROP POLICY IF EXISTS "Service role can manage orders" ON orders;
CREATE POLICY "Admins can manage all orders"
ON orders FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- ─── 7. Delivery zones: replace service-role policy with admin ───────────
DROP POLICY IF EXISTS "Service role can manage delivery zones" ON delivery_zones;
CREATE POLICY "Admins can manage delivery zones"
ON delivery_zones FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- ─── 8. Delivery slots: replace service-role policy with admin ──────────
DROP POLICY IF EXISTS "Service role can manage delivery slots" ON delivery_slots;
CREATE POLICY "Admins can manage delivery slots"
ON delivery_slots FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- ─── 9. Promo codes: readable by authenticated users ────────────────────
ALTER TABLE IF EXISTS promo_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read active promo codes" ON promo_codes;
CREATE POLICY "Anyone can read active promo codes"
ON promo_codes FOR SELECT
USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage promo codes" ON promo_codes;
CREATE POLICY "Admins can manage promo codes"
ON promo_codes FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- ─── 10. Ensure products policies use is_admin() (non-recursive) ────────
-- These already query profiles (not profiles-in-profiles) so they're fine,
-- but let's replace with is_admin() for consistency and safety.
DROP POLICY IF EXISTS "Admins can insert products" ON products;
CREATE POLICY "Admins can insert products"
ON products FOR INSERT
WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admins can update products" ON products;
CREATE POLICY "Admins can update products"
ON products FOR UPDATE
USING (is_admin());

DROP POLICY IF EXISTS "Admins can delete products" ON products;
CREATE POLICY "Admins can delete products"
ON products FOR DELETE
USING (is_admin());

-- ─── 11. Categories policies ─────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can insert categories" ON categories;
CREATE POLICY "Admins can insert categories"
ON categories FOR INSERT
WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admins can update categories" ON categories;
CREATE POLICY "Admins can update categories"
ON categories FOR UPDATE
USING (is_admin());

DROP POLICY IF EXISTS "Admins can delete categories" ON categories;
CREATE POLICY "Admins can delete categories"
ON categories FOR DELETE
USING (is_admin());
