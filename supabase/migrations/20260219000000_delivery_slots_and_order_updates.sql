-- ============================================================
-- DELIVERY ZONES
-- ============================================================
CREATE TABLE IF NOT EXISTS delivery_zones (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- DELIVERY SLOTS
-- (Admin creates time-window slots; orders are assigned to one)
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'slot_status') THEN
    CREATE TYPE slot_status AS ENUM ('open', 'full', 'closed');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS delivery_slots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  zone_id UUID REFERENCES delivery_zones(id) ON DELETE SET NULL,
  slot_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 20,      -- max orders for this slot
  booked INTEGER NOT NULL DEFAULT 0,         -- current bookings
  status slot_status DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- EXTEND ORDERS
-- ============================================================
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS delivery_slot_id UUID REFERENCES delivery_slots(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;

-- ============================================================
-- RLS — DELIVERY ZONES
-- ============================================================
ALTER TABLE delivery_zones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Delivery zones viewable by everyone" ON delivery_zones;
CREATE POLICY "Delivery zones viewable by everyone"
ON delivery_zones FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service role can manage delivery zones" ON delivery_zones;
CREATE POLICY "Service role can manage delivery zones"
ON delivery_zones FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- RLS — DELIVERY SLOTS
-- ============================================================
ALTER TABLE delivery_slots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Delivery slots viewable by everyone" ON delivery_slots;
CREATE POLICY "Delivery slots viewable by everyone"
ON delivery_slots FOR SELECT USING (true);

DROP POLICY IF EXISTS "Service role can manage delivery slots" ON delivery_slots;
CREATE POLICY "Service role can manage delivery slots"
ON delivery_slots FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- RLS — ORDERS: allow user to cancel own pending order
-- ============================================================
DROP POLICY IF EXISTS "Users can cancel own pending orders" ON orders;
CREATE POLICY "Users can cancel own pending orders"
ON orders FOR UPDATE
USING (
  auth.uid() = user_id
  AND status = 'pending'
)
WITH CHECK (
  auth.uid() = user_id
  AND status = 'cancelled'
);

-- Allow users to update delivery_slot_id and notes on their own pending orders
DROP POLICY IF EXISTS "Users can update own pending order slot and notes" ON orders;
CREATE POLICY "Users can update own pending order slot and notes"
ON orders FOR UPDATE
USING (
  auth.uid() = user_id
  AND status = 'pending'
)
WITH CHECK (
  auth.uid() = user_id
);

-- Service role full access on orders (for backend API)
DROP POLICY IF EXISTS "Service role can manage orders" ON orders;
CREATE POLICY "Service role can manage orders"
ON orders FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- FUNCTION: auto-update booked count when order gets a slot
-- ============================================================
CREATE OR REPLACE FUNCTION update_slot_booked_count()
RETURNS TRIGGER AS $$
BEGIN
  -- If a slot was assigned, increment
  IF NEW.delivery_slot_id IS NOT NULL AND (OLD.delivery_slot_id IS DISTINCT FROM NEW.delivery_slot_id) THEN
    UPDATE delivery_slots SET booked = booked + 1,
      status = CASE WHEN booked + 1 >= capacity THEN 'full' ELSE status END
    WHERE id = NEW.delivery_slot_id;
  END IF;

  -- If a slot was removed (cancelled), decrement previous slot
  IF OLD.delivery_slot_id IS NOT NULL AND (OLD.delivery_slot_id IS DISTINCT FROM NEW.delivery_slot_id) THEN
    UPDATE delivery_slots SET
      booked = GREATEST(booked - 1, 0),
      status = CASE WHEN status = 'full' AND booked - 1 < capacity THEN 'open' ELSE status END
    WHERE id = OLD.delivery_slot_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_update_slot_booked ON orders;
CREATE TRIGGER trg_update_slot_booked
  AFTER UPDATE OF delivery_slot_id ON orders
  FOR EACH ROW EXECUTE FUNCTION update_slot_booked_count();
