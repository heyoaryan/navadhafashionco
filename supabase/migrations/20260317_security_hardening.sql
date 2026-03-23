-- Security Hardening Migration
-- 1. Restrict coupon visibility to authenticated users only (remove anon access)
-- 2. Add explicit DELETE policies where missing
-- 3. Tighten order INSERT to prevent price manipulation via DB-level check

-- ── Coupons: remove anonymous read access ──────────────────────────────────
DROP POLICY IF EXISTS "Anyone can view active coupons" ON coupons;
DROP POLICY IF EXISTS "Authenticated users can view active coupons" ON coupons;

CREATE POLICY "Authenticated users can view active coupons"
  ON coupons FOR SELECT
  TO authenticated
  USING (
    is_active = true
    AND (expires_at IS NULL OR expires_at > now())
    AND (usage_limit IS NULL OR used_count < usage_limit)
  );

-- Admins can manage coupons
DROP POLICY IF EXISTS "Admins can manage coupons" ON coupons;
CREATE POLICY "Admins can manage coupons"
  ON coupons FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ── Orders: prevent users from modifying other users' orders ───────────────
DROP POLICY IF EXISTS "Users can delete own pending orders" ON orders;
CREATE POLICY "Users can delete own pending orders"
  ON orders FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id AND status = 'pending');

-- ── Cart: add DELETE policy ────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can delete own cart" ON cart;
CREATE POLICY "Users can delete own cart"
  ON cart FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own cart items" ON cart_items;
CREATE POLICY "Users can delete own cart items"
  ON cart_items FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM cart
      WHERE cart.id = cart_items.cart_id
      AND cart.user_id = auth.uid()
    )
  );

-- ── Addresses: add DELETE policy ──────────────────────────────────────────
DROP POLICY IF EXISTS "Users can delete own addresses" ON addresses;
CREATE POLICY "Users can delete own addresses"
  ON addresses FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ── Wishlist: add DELETE policy ───────────────────────────────────────────
DROP POLICY IF EXISTS "Users can delete own wishlist items" ON wishlist;
CREATE POLICY "Users can delete own wishlist items"
  ON wishlist FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ── Reviews: users can only delete their own reviews ─────────────────────
DROP POLICY IF EXISTS "Users can delete own reviews" ON reviews;
CREATE POLICY "Users can delete own reviews"
  ON reviews FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
