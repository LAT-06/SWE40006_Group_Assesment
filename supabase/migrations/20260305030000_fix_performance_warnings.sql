-- ── Fix all Performance Advisor warnings ─────────────────────────────────────
-- Run in Supabase Dashboard → SQL Editor

-- ═════════════════════════════════════════════════════════════════════════════
-- PART 1: auth_rls_initplan
-- Replace bare auth.uid() with (select auth.uid()) so Postgres evaluates it
-- once per query instead of once per row.
-- ═════════════════════════════════════════════════════════════════════════════

-- ── addresses ────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can manage own addresses" ON addresses;
CREATE POLICY "Users can manage own addresses"
ON addresses FOR ALL
USING  ((select auth.uid()) = user_id)
WITH CHECK ((select auth.uid()) = user_id);

-- ── user_addresses (separate table if it exists) ─────────────────────────────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
             WHERE c.relname = 'user_addresses' AND n.nspname = 'public') THEN
    DROP POLICY IF EXISTS "Users can manage own addresses" ON user_addresses;
    EXECUTE $p$
      CREATE POLICY "Users can manage own addresses"
      ON user_addresses FOR ALL
      USING  ((select auth.uid()) = user_id)
      WITH CHECK ((select auth.uid()) = user_id)
    $p$;
  END IF;
END $$;

-- ── reviews ───────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can create reviews" ON reviews;
CREATE POLICY "Users can create reviews"
ON reviews FOR INSERT
WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update own reviews" ON reviews;
CREATE POLICY "Users can update own reviews"
ON reviews FOR UPDATE
USING  ((select auth.uid()) = user_id)
WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own reviews" ON reviews;
CREATE POLICY "Users can delete own reviews"
ON reviews FOR DELETE
USING ((select auth.uid()) = user_id);

-- ── carts ─────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can manage own cart" ON carts;
CREATE POLICY "Users can manage own cart"
ON carts FOR ALL
USING  ((select auth.uid()) = user_id)
WITH CHECK ((select auth.uid()) = user_id);

-- ── cart_items ────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can manage own cart items" ON cart_items;
CREATE POLICY "Users can manage own cart items"
ON cart_items FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM carts
    WHERE carts.id = cart_items.cart_id
      AND carts.user_id = (select auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM carts
    WHERE carts.id = cart_items.cart_id
      AND carts.user_id = (select auth.uid())
  )
);

-- ── order_items INSERT ────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can create order items" ON order_items;
CREATE POLICY "Users can create order items"
ON order_items FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_items.order_id
      AND orders.user_id = (select auth.uid())
  )
);

-- ═════════════════════════════════════════════════════════════════════════════
-- PART 2: multiple_permissive_policies
-- Consolidate so each table has at most one policy per (role, action) pair.
-- ═════════════════════════════════════════════════════════════════════════════

-- ── profiles UPDATE: merge "Admins can update any profile" + "Users can update own profile" ──
DROP POLICY IF EXISTS "Admins can update any profile"  ON profiles;
DROP POLICY IF EXISTS "Users can update own profile"   ON profiles;
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING  (is_admin() OR id = (select auth.uid()))
WITH CHECK (is_admin() OR id = (select auth.uid()));

-- ── orders: collapse all overlapping SELECT / INSERT / UPDATE policies ────────
DROP POLICY IF EXISTS "Admins can manage all orders"                      ON orders;
DROP POLICY IF EXISTS "Admins can view all orders"                        ON orders;
DROP POLICY IF EXISTS "Admins can update any order"                       ON orders;
DROP POLICY IF EXISTS "Users can view own orders"                         ON orders;
DROP POLICY IF EXISTS "Users can create orders"                           ON orders;
DROP POLICY IF EXISTS "Users can cancel own pending orders"               ON orders;
DROP POLICY IF EXISTS "Users can update own pending order slot and notes" ON orders;

-- Single SELECT: admins see all rows; users see their own
CREATE POLICY "Orders: select"
ON orders FOR SELECT
USING (is_admin() OR user_id = (select auth.uid()));

-- Single INSERT: admins can create any order; users can create their own
CREATE POLICY "Orders: insert"
ON orders FOR INSERT
WITH CHECK (is_admin() OR (select auth.uid()) = user_id);

-- Single UPDATE: admins can update any; users can only update/cancel their own pending orders
CREATE POLICY "Orders: update"
ON orders FOR UPDATE
USING (
  is_admin()
  OR (user_id = (select auth.uid()) AND status = 'pending')
)
WITH CHECK (
  is_admin()
  OR user_id = (select auth.uid())
);

-- Single DELETE: admins only (users cancel via UPDATE → status='cancelled')
CREATE POLICY "Orders: delete"
ON orders FOR DELETE
USING (is_admin());

-- ── order_items SELECT: merge "Admins can view all order items" + "Users can view own order items" ──
DROP POLICY IF EXISTS "Admins can view all order items" ON order_items;
DROP POLICY IF EXISTS "Users can view own order items"  ON order_items;
CREATE POLICY "Order items: select"
ON order_items FOR SELECT
USING (
  is_admin()
  OR EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_items.order_id
      AND orders.user_id = (select auth.uid())
  )
);

-- ── delivery_slots: split FOR ALL into INSERT / UPDATE / DELETE ───────────────
-- "Delivery slots viewable by everyone" FOR SELECT USING(true) stays as the sole SELECT policy
DROP POLICY IF EXISTS "Admins can manage delivery slots" ON delivery_slots;
CREATE POLICY "Admins can manage delivery slots"
ON delivery_slots FOR INSERT
WITH CHECK (is_admin());

CREATE POLICY "Admins can update delivery slots"
ON delivery_slots FOR UPDATE
USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Admins can delete delivery slots"
ON delivery_slots FOR DELETE
USING (is_admin());

-- ── delivery_zones: same split ────────────────────────────────────────────────
-- "Delivery zones viewable by everyone" FOR SELECT USING(true) stays as the sole SELECT policy
DROP POLICY IF EXISTS "Admins can manage delivery zones" ON delivery_zones;
CREATE POLICY "Admins can manage delivery zones"
ON delivery_zones FOR INSERT
WITH CHECK (is_admin());

CREATE POLICY "Admins can update delivery zones"
ON delivery_zones FOR UPDATE
USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Admins can delete delivery zones"
ON delivery_zones FOR DELETE
USING (is_admin());

-- ── stores: same split ────────────────────────────────────────────────────────
-- "Stores are viewable by everyone" FOR SELECT USING(true) stays as the sole SELECT policy
DROP POLICY IF EXISTS "Admins can manage stores" ON stores;
CREATE POLICY "Admins can manage stores"
ON stores FOR INSERT
WITH CHECK (is_admin());

CREATE POLICY "Admins can update stores"
ON stores FOR UPDATE
USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Admins can delete stores"
ON stores FOR DELETE
USING (is_admin());

-- ── store_inventory: same split ───────────────────────────────────────────────
-- "Store inventory is viewable by everyone" FOR SELECT USING(true) stays as sole SELECT
DROP POLICY IF EXISTS "Admins can manage store inventory" ON store_inventory;
CREATE POLICY "Admins can manage store inventory"
ON store_inventory FOR INSERT
WITH CHECK (is_admin());

CREATE POLICY "Admins can update store inventory"
ON store_inventory FOR UPDATE
USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Admins can delete store inventory"
ON store_inventory FOR DELETE
USING (is_admin());

-- ── promo_codes: drop redundant extra SELECT policies, split admin FOR ALL ────
-- "Anyone can read active promo codes" FOR SELECT stays as the sole SELECT policy
DROP POLICY IF EXISTS "Active promo codes readable by service role" ON promo_codes;
DROP POLICY IF EXISTS "Admins can manage promo codes"              ON promo_codes;
CREATE POLICY "Admins can manage promo codes"
ON promo_codes FOR INSERT
WITH CHECK (is_admin());

CREATE POLICY "Admins can update promo codes"
ON promo_codes FOR UPDATE
USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Admins can delete promo codes"
ON promo_codes FOR DELETE
USING (is_admin());
