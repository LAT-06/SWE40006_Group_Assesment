-- Fix RLS policies for admin operations from backend (service role)

-- Products: Allow service role to bypass RLS or add explicit policy
DROP POLICY IF EXISTS "Service role can manage products" ON products;
CREATE POLICY "Service role can manage products" 
ON products FOR ALL 
USING (true)
WITH CHECK (true);

-- Categories: Allow service role full access
DROP POLICY IF EXISTS "Service role can manage categories" ON categories;
CREATE POLICY "Service role can manage categories" 
ON categories FOR ALL 
USING (true)
WITH CHECK (true);

-- Alternative: Add DELETE policies for admins
DROP POLICY IF EXISTS "Admins can delete products" ON products;
CREATE POLICY "Admins can delete products" 
ON products FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Admins can delete categories" ON categories;
CREATE POLICY "Admins can delete categories" 
ON categories FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Update existing admin policies to be more permissive
-- Note: These policies will work when called with service_role key which bypasses RLS
-- But we keep them for frontend admin UI that uses user JWT
