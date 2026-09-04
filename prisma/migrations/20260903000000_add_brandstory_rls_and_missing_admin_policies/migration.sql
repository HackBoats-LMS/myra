-- Security audit fix: Enable RLS on BrandStory table and add missing admin
-- policies for Wishlist, WishlistItem, Cart, and CartItem.

-- =============================================================================
-- 1. ENABLE RLS ON BRANDSTORY (was missing from initial RLS migration)
-- =============================================================================

ALTER TABLE "BrandStory" ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 2. SERVICE ROLE BYPASS FOR BRANDSTORY
-- =============================================================================

CREATE POLICY "service_role_all_brandstory" ON "BrandStory" FOR ALL TO service_role USING (true) WITH CHECK (true);

-- =============================================================================
-- 3. ANON READ-ONLY FOR BRANDSTORY (storefront is public)
-- =============================================================================

CREATE POLICY "anon_read_brandstory" ON "BrandStory" FOR SELECT TO anon USING ("isActive" = true);

-- =============================================================================
-- 4. ADMIN POLICIES FOR BRANDSTORY
-- =============================================================================

CREATE POLICY "admin_all_brandstory" ON "BrandStory" FOR ALL TO authenticated
  USING (current_setting('request.jwt.claims', true)::json->>'role' = 'ADMIN')
  WITH CHECK (current_setting('request.jwt.claims', true)::json->>'role' = 'ADMIN');

-- =============================================================================
-- 5. MISSING ADMIN POLICIES FOR WISHLIST, WISHLISTITEM, CART, CARTITEM
--    These tables only had user-level and service_role policies. Admins need
--    full access for customer support and management operations.
-- =============================================================================

CREATE POLICY "admin_all_wishlist" ON "Wishlist" FOR ALL TO authenticated
  USING (current_setting('request.jwt.claims', true)::json->>'role' = 'ADMIN')
  WITH CHECK (current_setting('request.jwt.claims', true)::json->>'role' = 'ADMIN');

CREATE POLICY "admin_all_wishlistitem" ON "WishlistItem" FOR ALL TO authenticated
  USING (current_setting('request.jwt.claims', true)::json->>'role' = 'ADMIN')
  WITH CHECK (current_setting('request.jwt.claims', true)::json->>'role' = 'ADMIN');

CREATE POLICY "admin_all_cart" ON "Cart" FOR ALL TO authenticated
  USING (current_setting('request.jwt.claims', true)::json->>'role' = 'ADMIN')
  WITH CHECK (current_setting('request.jwt.claims', true)::json->>'role' = 'ADMIN');

CREATE POLICY "admin_all_cartitem" ON "CartItem" FOR ALL TO authenticated
  USING (current_setting('request.jwt.claims', true)::json->>'role' = 'ADMIN')
  WITH CHECK (current_setting('request.jwt.claims', true)::json->>'role' = 'ADMIN');

-- =============================================================================
-- 6. FORCE RLS ON BRANDSTORY (matches pattern of all other tables)
-- =============================================================================

ALTER TABLE "BrandStory" FORCE ROW LEVEL SECURITY;
