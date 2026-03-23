-- Security Fixes Migration
-- 1. Enforce admin-only blacklist operations at DB level
-- 2. Ensure orders RLS uses auth.uid() strictly
-- 3. Prevent price manipulation via DB check constraint
-- 4. Coupon: add length constraint

-- ── Blacklist: only admins can insert/update/delete ───────────────────────
DROP POLICY IF EXISTS "Admins can manage blacklist" ON blacklist;
CREATE POLICY "Admins can manage blacklist"
  ON blacklist FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Authenticated users can only read blacklist entries for themselves
DROP POLICY IF EXISTS "Users can check own blacklist status" ON blacklist;
CREATE POLICY "Users can check own blacklist status"
  ON blacklist FOR SELECT
  TO authenticated
  USING (entity_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ── Orders: strict user_id = auth.uid() enforcement ──────────────────────
DROP POLICY IF EXISTS "Users can insert own orders" ON orders;
CREATE POLICY "Users can insert own orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own orders" ON orders;
CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ── Orders: add DB-level check to prevent zero/negative totals ────────────
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_total_positive;
ALTER TABLE orders ADD CONSTRAINT orders_total_positive CHECK (total > 0 AND subtotal >= 0);

-- ── Coupons: add length constraint on code ────────────────────────────────
ALTER TABLE coupons DROP CONSTRAINT IF EXISTS coupons_code_length;
ALTER TABLE coupons ADD CONSTRAINT coupons_code_length CHECK (char_length(code) BETWEEN 3 AND 50);

-- ── Order items: price must be positive ───────────────────────────────────
ALTER TABLE order_items DROP CONSTRAINT IF EXISTS order_items_price_positive;
ALTER TABLE order_items ADD CONSTRAINT order_items_price_positive CHECK (price > 0 AND subtotal > 0);
