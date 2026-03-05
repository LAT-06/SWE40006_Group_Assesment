-- ── Product stock management ──────────────────────────────────────────────────
-- Run in Supabase Dashboard → SQL Editor

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Ensure quantity column has a floor of 0 (prevent negative stock)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE products
  ALTER COLUMN quantity SET DEFAULT 0;

-- Add CHECK constraint if not present (safe on Supabase)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.products'::regclass
      AND conname = 'products_quantity_non_negative'
  ) THEN
    ALTER TABLE products
      ADD CONSTRAINT products_quantity_non_negative CHECK (quantity >= 0);
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. decrement_product_quantity(p_product_id, p_amount)
--
--    Atomically:
--      - Deducts min(p_amount, current_quantity) from quantity
--      - Sets in_stock = false when quantity reaches 0
--      - Returns the actual amount deducted (≤ p_amount)
--
--    Using FOR UPDATE to lock the row and prevent race conditions.
-- ─────────────────────────────────────────────────────────────────────────────
DROP FUNCTION IF EXISTS public.decrement_product_quantity(UUID, INTEGER);
CREATE FUNCTION public.decrement_product_quantity(
  p_product_id UUID,
  p_amount     INTEGER
)
RETURNS INTEGER          -- actual units deducted
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current  INTEGER;
  v_deduct   INTEGER;
BEGIN
  -- Lock the row
  SELECT quantity INTO v_current
  FROM products
  WHERE id = p_product_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  -- Clamp: never deduct more than what's available
  v_deduct := LEAST(p_amount, v_current);

  UPDATE products
  SET
    quantity = quantity - v_deduct,
    in_stock = CASE WHEN quantity - v_deduct <= 0 THEN FALSE ELSE TRUE END
  WHERE id = p_product_id;

  RETURN v_deduct;
END;
$$;

GRANT EXECUTE ON FUNCTION public.decrement_product_quantity(UUID, INTEGER)
  TO authenticated, service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. check_product_stock(items JSONB)
--
--    Pre-order validation: given [{product_id, quantity}…] returns rows where
--    requested quantity exceeds available stock, so the backend can reject or
--    clamp before inserting the order.
--
--    Returns: product_id, name, requested, available
-- ─────────────────────────────────────────────────────────────────────────────
DROP FUNCTION IF EXISTS public.check_product_stock(JSONB);
CREATE FUNCTION public.check_product_stock(items JSONB)
RETURNS TABLE(
  product_id UUID,
  name       TEXT,
  requested  INTEGER,
  available  INTEGER
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id                          AS product_id,
    p.name,
    (item->>'quantity')::INTEGER  AS requested,
    p.quantity                    AS available
  FROM jsonb_array_elements(items) AS item
  JOIN products p ON p.id = (item->>'product_id')::UUID
  WHERE (item->>'quantity')::INTEGER > p.quantity;
$$;

GRANT EXECUTE ON FUNCTION public.check_product_stock(JSONB)
  TO authenticated, service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Trigger: auto set in_stock = false whenever quantity → 0 via direct UPDATE
--    (covers admin edits in addition to order flow)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.sync_product_in_stock()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.in_stock := (NEW.quantity > 0);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_product_in_stock ON products;
CREATE TRIGGER trg_sync_product_in_stock
  BEFORE UPDATE OF quantity ON products
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_product_in_stock();
