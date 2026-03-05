-- ── Enhance delivery_zones: add suburbs coverage ────────────────────────────

-- Add suburbs column (list of area/suburb/district names the zone covers)
ALTER TABLE delivery_zones
  ADD COLUMN IF NOT EXISTS suburbs TEXT[] DEFAULT '{}';

-- Drop the old overly-permissive "service role" policies and replace with is_admin()
DROP POLICY IF EXISTS "Service role can manage delivery zones" ON delivery_zones;
DROP POLICY IF EXISTS "Admins can manage delivery zones" ON delivery_zones;

CREATE POLICY "Admins can manage delivery zones"
  ON delivery_zones FOR ALL
  USING (is_admin()) WITH CHECK (is_admin());

-- Seed sensible default zones with real suburb lists (only if no zones exist yet)
INSERT INTO delivery_zones (name, description, is_active, suburbs)
SELECT name, description, is_active, suburbs FROM (VALUES
  ('Zone A – City Centre',
   'Covers the central business district and inner suburbs',
   true,
   ARRAY['District 1','District 3','District 5','CBD','Inner City']),
  ('Zone B – Inner West',
   'Covers inner western suburbs',
   true,
   ARRAY['District 2','District 7','District 9','Inner West','Newtown']),
  ('Zone C – Northern Suburbs',
   'Covers northern and outer suburbs',
   false,
   ARRAY['District 12','Thu Duc','Northern Suburbs','Brunswick'])
) AS v(name, description, is_active, suburbs)
WHERE NOT EXISTS (SELECT 1 FROM delivery_zones WHERE delivery_zones.name = v.name);
