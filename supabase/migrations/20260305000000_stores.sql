-- ── Stores & Store Inventory ────────────────────────────────────────────────

-- 1. STORES
CREATE TABLE IF NOT EXISTS stores (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name         TEXT NOT NULL,
  address      TEXT NOT NULL,
  phone        TEXT,
  email        TEXT,
  opening_hours JSONB,   -- e.g. {"mon":"9am-9pm","sat":"10am-6pm","sun":"closed"}
  is_active    BOOLEAN DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- 2. STORE INVENTORY  (links products ↔ stores with stock info)
CREATE TABLE IF NOT EXISTS store_inventory (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id   UUID REFERENCES stores(id)   ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  quantity   INTEGER DEFAULT 0 CHECK (quantity >= 0),
  in_stock   BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (store_id, product_id)
);

-- ── RLS ──────────────────────────────────────────────────────────────────────
ALTER TABLE stores          ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_inventory ENABLE ROW LEVEL SECURITY;

-- Public can read active stores
DROP POLICY IF EXISTS "Stores are viewable by everyone" ON stores;
CREATE POLICY "Stores are viewable by everyone"
  ON stores FOR SELECT USING (true);

-- Admins manage stores
DROP POLICY IF EXISTS "Admins can manage stores" ON stores;
CREATE POLICY "Admins can manage stores"
  ON stores FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Public can read store inventory
DROP POLICY IF EXISTS "Store inventory is viewable by everyone" ON store_inventory;
CREATE POLICY "Store inventory is viewable by everyone"
  ON store_inventory FOR SELECT USING (true);

-- Admins manage store inventory
DROP POLICY IF EXISTS "Admins can manage store inventory" ON store_inventory;
CREATE POLICY "Admins can manage store inventory"
  ON store_inventory FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- ── Auto-updated_at trigger ───────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_store_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS stores_updated_at ON stores;
CREATE TRIGGER stores_updated_at
  BEFORE UPDATE ON stores
  FOR EACH ROW EXECUTE FUNCTION update_store_updated_at();

DROP TRIGGER IF EXISTS store_inventory_updated_at ON store_inventory;
CREATE TRIGGER store_inventory_updated_at
  BEFORE UPDATE ON store_inventory
  FOR EACH ROW EXECUTE FUNCTION update_store_updated_at();

-- ── Seed a couple of demo stores ─────────────────────────────────────────────
INSERT INTO stores (name, address, phone, opening_hours) VALUES
  ('City Central', '123 Main St, Melbourne VIC 3000', '+61 3 9000 0001',
   '{"mon":"8am-9pm","tue":"8am-9pm","wed":"8am-9pm","thu":"8am-9pm","fri":"8am-10pm","sat":"9am-9pm","sun":"10am-8pm"}'),
  ('Suburb North', '45 Park Ave, Brunswick VIC 3056', '+61 3 9000 0002',
   '{"mon":"9am-8pm","tue":"9am-8pm","wed":"9am-8pm","thu":"9am-8pm","fri":"9am-9pm","sat":"9am-7pm","sun":"closed"}')
ON CONFLICT DO NOTHING;
