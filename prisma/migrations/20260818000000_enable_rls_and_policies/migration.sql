-- Enable Row Level Security on all tables containing user data.
-- This is a critical security layer: even if the application connection string
-- leaks, database-level policies prevent unauthorized cross-user access.

-- =============================================================================
-- 1. ENABLE RLS ON ALL TABLES
-- =============================================================================

ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Address" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Wishlist" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WishlistItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Cart" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CartItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Order" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OrderItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ReturnRequest" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Review" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CouponUsage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PushSubscription" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "StockNotification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PasswordResetToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "VerificationToken" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Newsletter" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RateLimit" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Product" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProductVariant" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Collection" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Coupon" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ShippingConfig" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "StoreSetting" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FlashSale" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Pincode" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Banner" ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 2. SERVICE ROLE BYPASS POLICIES
--    The application uses SUPABASE_SERVICE_ROLE_KEY for all DB access via Prisma.
--    These policies allow the service_role to bypass RLS entirely.
-- =============================================================================

-- Allow service_role full access to all tables (bypasses RLS)
CREATE POLICY "service_role_all_user" ON "User" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_address" ON "Address" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_wishlist" ON "Wishlist" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_wishlistitem" ON "WishlistItem" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_cart" ON "Cart" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_cartitem" ON "CartItem" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_order" ON "Order" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_orderitem" ON "OrderItem" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_returnrequest" ON "ReturnRequest" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_review" ON "Review" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_couponusage" ON "CouponUsage" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_pushsubscription" ON "PushSubscription" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_stocknotification" ON "StockNotification" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_passwordresettoken" ON "PasswordResetToken" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_verificationtoken" ON "VerificationToken" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_auditlog" ON "AuditLog" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_newsletter" ON "Newsletter" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_ratelimit" ON "RateLimit" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_product" ON "Product" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_productvariant" ON "ProductVariant" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_collection" ON "Collection" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_coupon" ON "Coupon" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_shippingconfig" ON "ShippingConfig" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_storesetting" ON "StoreSetting" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_flashsale" ON "FlashSale" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_pincode" ON "Pincode" FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_all_banner" ON "Banner" FOR ALL TO service_role USING (true) WITH CHECK (true);

-- =============================================================================
-- 3. ANON (UNAUTHENTICATED) READ-ONLY POLICIES
--    The storefront is public; anon can read products, collections, banners,
--    pincodes, and shipping config. Writes require authentication.
-- =============================================================================

CREATE POLICY "anon_read_product" ON "Product" FOR SELECT TO anon USING ("deletedAt" IS NULL);
CREATE POLICY "anon_read_productvariant" ON "ProductVariant" FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_collection" ON "Collection" FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_coupon" ON "Coupon" FOR SELECT TO anon USING ("isActive" = true);
CREATE POLICY "anon_read_shippingconfig" ON "ShippingConfig" FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_storesetting" ON "StoreSetting" FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_flashsale" ON "FlashSale" FOR SELECT TO anon USING ("isActive" = true);
CREATE POLICY "anon_read_pincode" ON "Pincode" FOR SELECT TO anon USING ("isActive" = true);
CREATE POLICY "anon_read_banner" ON "Banner" FOR SELECT TO anon USING ("isActive" = true);
CREATE POLICY "anon_insert_newsletter" ON "Newsletter" FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon_insert_stocknotification" ON "StockNotification" FOR INSERT TO anon WITH CHECK (true);

-- =============================================================================
-- 4. AUTHENTICATED USER POLICIES
--    Uses current_setting('request.jwt.claims') to extract the user ID from
--    the JWT. These policies ensure users can only access their own data.
-- =============================================================================

-- Helper: extract user ID from JWT claims (Supabase sets this automatically)
-- current_setting('request.jwt.claims', true)::json->>'sub' returns the user ID

-- USER table: users can read/update their own row
CREATE POLICY "user_read_own_user" ON "User"
  FOR SELECT TO authenticated
  USING (id::text = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "user_update_own_user" ON "User"
  FOR UPDATE TO authenticated
  USING (id::text = current_setting('request.jwt.claims', true)::json->>'sub')
  WITH CHECK (id::text = current_setting('request.jwt.claims', true)::json->>'sub');

-- ADDRESS table: users can CRUD their own addresses
CREATE POLICY "user_read_own_address" ON "Address"
  FOR SELECT TO authenticated
  USING ("userId"::text = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "user_insert_own_address" ON "Address"
  FOR INSERT TO authenticated
  WITH CHECK ("userId"::text = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "user_update_own_address" ON "Address"
  FOR UPDATE TO authenticated
  USING ("userId"::text = current_setting('request.jwt.claims', true)::json->>'sub')
  WITH CHECK ("userId"::text = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "user_delete_own_address" ON "Address"
  FOR DELETE TO authenticated
  USING ("userId"::text = current_setting('request.jwt.claims', true)::json->>'sub');

-- WISHLIST: users can manage their own wishlist
CREATE POLICY "user_read_own_wishlist" ON "Wishlist"
  FOR SELECT TO authenticated
  USING ("userId"::text = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "user_insert_own_wishlist" ON "Wishlist"
  FOR INSERT TO authenticated
  WITH CHECK ("userId"::text = current_setting('request.jwt.claims', true)::json->>'sub');

-- WISHLIST ITEM: users can manage items in their own wishlist
CREATE POLICY "user_read_own_wishlistitem" ON "WishlistItem"
  FOR SELECT TO authenticated
  USING ("wishlistId" IN (
    SELECT id::text FROM "Wishlist"
    WHERE "userId"::text = current_setting('request.jwt.claims', true)::json->>'sub'
  ));

CREATE POLICY "user_insert_own_wishlistitem" ON "WishlistItem"
  FOR INSERT TO authenticated
  WITH CHECK ("wishlistId" IN (
    SELECT id::text FROM "Wishlist"
    WHERE "userId"::text = current_setting('request.jwt.claims', true)::json->>'sub'
  ));

CREATE POLICY "user_delete_own_wishlistitem" ON "WishlistItem"
  FOR DELETE TO authenticated
  USING ("wishlistId" IN (
    SELECT id::text FROM "Wishlist"
    WHERE "userId"::text = current_setting('request.jwt.claims', true)::json->>'sub'
  ));

-- CART: users can manage their own cart
CREATE POLICY "user_read_own_cart" ON "Cart"
  FOR SELECT TO authenticated
  USING ("userId"::text = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "user_insert_own_cart" ON "Cart"
  FOR INSERT TO authenticated
  WITH CHECK ("userId"::text = current_setting('request.jwt.claims', true)::json->>'sub');

-- CART ITEM: users can manage items in their own cart
CREATE POLICY "user_read_own_cartitem" ON "CartItem"
  FOR SELECT TO authenticated
  USING ("cartId" IN (
    SELECT id::text FROM "Cart"
    WHERE "userId"::text = current_setting('request.jwt.claims', true)::json->>'sub'
  ));

CREATE POLICY "user_insert_own_cartitem" ON "CartItem"
  FOR INSERT TO authenticated
  WITH CHECK ("cartId" IN (
    SELECT id::text FROM "Cart"
    WHERE "userId"::text = current_setting('request.jwt.claims', true)::json->>'sub'
  ));

CREATE POLICY "user_update_own_cartitem" ON "CartItem"
  FOR UPDATE TO authenticated
  USING ("cartId" IN (
    SELECT id::text FROM "Cart"
    WHERE "userId"::text = current_setting('request.jwt.claims', true)::json->>'sub'
  ))
  WITH CHECK ("cartId" IN (
    SELECT id::text FROM "Cart"
    WHERE "userId"::text = current_setting('request.jwt.claims', true)::json->>'sub'
  ));

CREATE POLICY "user_delete_own_cartitem" ON "CartItem"
  FOR DELETE TO authenticated
  USING ("cartId" IN (
    SELECT id::text FROM "Cart"
    WHERE "userId"::text = current_setting('request.jwt.claims', true)::json->>'sub'
  ));

-- ORDER: users can read their own orders
CREATE POLICY "user_read_own_order" ON "Order"
  FOR SELECT TO authenticated
  USING ("userId"::text = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "user_insert_own_order" ON "Order"
  FOR INSERT TO authenticated
  WITH CHECK ("userId"::text = current_setting('request.jwt.claims', true)::json->>'sub');

-- ORDER ITEM: users can read items from their own orders
CREATE POLICY "user_read_own_orderitem" ON "OrderItem"
  FOR SELECT TO authenticated
  USING ("orderId" IN (
    SELECT id::text FROM "Order"
    WHERE "userId"::text = current_setting('request.jwt.claims', true)::json->>'sub'
  ));

-- RETURN REQUEST: users can manage their own returns
CREATE POLICY "user_read_own_returnrequest" ON "ReturnRequest"
  FOR SELECT TO authenticated
  USING ("userId"::text = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "user_insert_own_returnrequest" ON "ReturnRequest"
  FOR INSERT TO authenticated
  WITH CHECK ("userId"::text = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "user_update_own_returnrequest" ON "ReturnRequest"
  FOR UPDATE TO authenticated
  USING ("userId"::text = current_setting('request.jwt.claims', true)::json->>'sub')
  WITH CHECK ("userId"::text = current_setting('request.jwt.claims', true)::json->>'sub');

-- REVIEW: users can read all reviews, but only manage their own
CREATE POLICY "anon_read_review" ON "Review" FOR SELECT TO anon USING (true);
CREATE POLICY "user_read_own_review" ON "Review"
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "user_insert_own_review" ON "Review"
  FOR INSERT TO authenticated
  WITH CHECK ("userId"::text = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "user_update_own_review" ON "Review"
  FOR UPDATE TO authenticated
  USING ("userId"::text = current_setting('request.jwt.claims', true)::json->>'sub')
  WITH CHECK ("userId"::text = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "user_delete_own_review" ON "Review"
  FOR DELETE TO authenticated
  USING ("userId"::text = current_setting('request.jwt.claims', true)::json->>'sub');

-- COUPON USAGE: users can read their own usage records
CREATE POLICY "user_read_own_couponusage" ON "CouponUsage"
  FOR SELECT TO authenticated
  USING ("userId"::text = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "user_insert_own_couponusage" ON "CouponUsage"
  FOR INSERT TO authenticated
  WITH CHECK ("userId"::text = current_setting('request.jwt.claims', true)::json->>'sub');

-- PUSH SUBSCRIPTION: users can manage their own push subscriptions
CREATE POLICY "user_read_own_pushsubscription" ON "PushSubscription"
  FOR SELECT TO authenticated
  USING ("userId"::text = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "user_insert_own_pushsubscription" ON "PushSubscription"
  FOR INSERT TO authenticated
  WITH CHECK ("userId"::text = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "user_delete_own_pushsubscription" ON "PushSubscription"
  FOR DELETE TO authenticated
  USING ("userId"::text = current_setting('request.jwt.claims', true)::json->>'sub');

-- STOCK NOTIFICATION: users can read their own notifications
CREATE POLICY "user_read_own_stocknotification" ON "StockNotification"
  FOR SELECT TO authenticated
  USING ("email" = current_setting('request.jwt.claims', true)::json->>'email');

-- PASSWORD RESET TOKEN: service_role only (tokens are hashed, no user access needed)
-- No user-level policies — these are managed exclusively server-side.

-- VERIFICATION TOKEN: service_role only — same as above.
-- No user-level policies.

-- AUDIT LOG: service_role only — audit records are admin-only.
-- No user-level policies.

-- NEWSLETTER: authenticated users can read their own subscription
CREATE POLICY "user_read_own_newsletter" ON "Newsletter"
  FOR SELECT TO authenticated
  USING ("email" = current_setting('request.jwt.claims', true)::json->>'email');

-- =============================================================================
-- 5. ADMIN POLICIES
--    Admins need full read/write access to all tables for management.
--    Supabase JWTs include a 'role' claim; we check it here.
-- =============================================================================

CREATE POLICY "admin_all_user" ON "User" FOR ALL TO authenticated
  USING (current_setting('request.jwt.claims', true)::json->>'role' = 'ADMIN')
  WITH CHECK (current_setting('request.jwt.claims', true)::json->>'role' = 'ADMIN');

CREATE POLICY "admin_all_address" ON "Address" FOR ALL TO authenticated
  USING (current_setting('request.jwt.claims', true)::json->>'role' = 'ADMIN')
  WITH CHECK (current_setting('request.jwt.claims', true)::json->>'role' = 'ADMIN');

CREATE POLICY "admin_all_order" ON "Order" FOR ALL TO authenticated
  USING (current_setting('request.jwt.claims', true)::json->>'role' = 'ADMIN')
  WITH CHECK (current_setting('request.jwt.claims', true)::json->>'role' = 'ADMIN');

CREATE POLICY "admin_all_orderitem" ON "OrderItem" FOR ALL TO authenticated
  USING (current_setting('request.jwt.claims', true)::json->>'role' = 'ADMIN')
  WITH CHECK (current_setting('request.jwt.claims', true)::json->>'role' = 'ADMIN');

CREATE POLICY "admin_all_returnrequest" ON "ReturnRequest" FOR ALL TO authenticated
  USING (current_setting('request.jwt.claims', true)::json->>'role' = 'ADMIN')
  WITH CHECK (current_setting('request.jwt.claims', true)::json->>'role' = 'ADMIN');

CREATE POLICY "admin_all_review" ON "Review" FOR ALL TO authenticated
  USING (current_setting('request.jwt.claims', true)::json->>'role' = 'ADMIN')
  WITH CHECK (current_setting('request.jwt.claims', true)::json->>'role' = 'ADMIN');

CREATE POLICY "admin_all_coupon" ON "Coupon" FOR ALL TO authenticated
  USING (current_setting('request.jwt.claims', true)::json->>'role' = 'ADMIN')
  WITH CHECK (current_setting('request.jwt.claims', true)::json->>'role' = 'ADMIN');

CREATE POLICY "admin_all_couponusage" ON "CouponUsage" FOR ALL TO authenticated
  USING (current_setting('request.jwt.claims', true)::json->>'role' = 'ADMIN')
  WITH CHECK (current_setting('request.jwt.claims', true)::json->>'role' = 'ADMIN');

CREATE POLICY "admin_all_product" ON "Product" FOR ALL TO authenticated
  USING (current_setting('request.jwt.claims', true)::json->>'role' = 'ADMIN')
  WITH CHECK (current_setting('request.jwt.claims', true)::json->>'role' = 'ADMIN');

CREATE POLICY "admin_all_productvariant" ON "ProductVariant" FOR ALL TO authenticated
  USING (current_setting('request.jwt.claims', true)::json->>'role' = 'ADMIN')
  WITH CHECK (current_setting('request.jwt.claims', true)::json->>'role' = 'ADMIN');

CREATE POLICY "admin_all_collection" ON "Collection" FOR ALL TO authenticated
  USING (current_setting('request.jwt.claims', true)::json->>'role' = 'ADMIN')
  WITH CHECK (current_setting('request.jwt.claims', true)::json->>'role' = 'ADMIN');

CREATE POLICY "admin_all_shippingconfig" ON "ShippingConfig" FOR ALL TO authenticated
  USING (current_setting('request.jwt.claims', true)::json->>'role' = 'ADMIN')
  WITH CHECK (current_setting('request.jwt.claims', true)::json->>'role' = 'ADMIN');

CREATE POLICY "admin_all_storesetting" ON "StoreSetting" FOR ALL TO authenticated
  USING (current_setting('request.jwt.claims', true)::json->>'role' = 'ADMIN')
  WITH CHECK (current_setting('request.jwt.claims', true)::json->>'role' = 'ADMIN');

CREATE POLICY "admin_all_flashsale" ON "FlashSale" FOR ALL TO authenticated
  USING (current_setting('request.jwt.claims', true)::json->>'role' = 'ADMIN')
  WITH CHECK (current_setting('request.jwt.claims', true)::json->>'role' = 'ADMIN');

CREATE POLICY "admin_all_pincode" ON "Pincode" FOR ALL TO authenticated
  USING (current_setting('request.jwt.claims', true)::json->>'role' = 'ADMIN')
  WITH CHECK (current_setting('request.jwt.claims', true)::json->>'role' = 'ADMIN');

CREATE POLICY "admin_all_banner" ON "Banner" FOR ALL TO authenticated
  USING (current_setting('request.jwt.claims', true)::json->>'role' = 'ADMIN')
  WITH CHECK (current_setting('request.jwt.claims', true)::json->>'role' = 'ADMIN');

CREATE POLICY "admin_all_auditlog" ON "AuditLog" FOR ALL TO authenticated
  USING (current_setting('request.jwt.claims', true)::json->>'role' = 'ADMIN')
  WITH CHECK (current_setting('request.jwt.claims', true)::json->>'role' = 'ADMIN');

CREATE POLICY "admin_all_newsletter" ON "Newsletter" FOR ALL TO authenticated
  USING (current_setting('request.jwt.claims', true)::json->>'role' = 'ADMIN')
  WITH CHECK (current_setting('request.jwt.claims', true)::json->>'role' = 'ADMIN');

CREATE POLICY "admin_all_passwordresettoken" ON "PasswordResetToken" FOR ALL TO authenticated
  USING (current_setting('request.jwt.claims', true)::json->>'role' = 'ADMIN')
  WITH CHECK (current_setting('request.jwt.claims', true)::json->>'role' = 'ADMIN');

CREATE POLICY "admin_all_verificationtoken" ON "VerificationToken" FOR ALL TO authenticated
  USING (current_setting('request.jwt.claims', true)::json->>'role' = 'ADMIN')
  WITH CHECK (current_setting('request.jwt.claims', true)::json->>'role' = 'ADMIN');

CREATE POLICY "admin_all_pushsubscription" ON "PushSubscription" FOR ALL TO authenticated
  USING (current_setting('request.jwt.claims', true)::json->>'role' = 'ADMIN')
  WITH CHECK (current_setting('request.jwt.claims', true)::json->>'role' = 'ADMIN');

CREATE POLICY "admin_all_stocknotification" ON "StockNotification" FOR ALL TO authenticated
  USING (current_setting('request.jwt.claims', true)::json->>'role' = 'ADMIN')
  WITH CHECK (current_setting('request.jwt.claims', true)::json->>'role' = 'ADMIN');

CREATE POLICY "admin_all_ratelimit" ON "RateLimit" FOR ALL TO authenticated
  USING (current_setting('request.jwt.claims', true)::json->>'role' = 'ADMIN')
  WITH CHECK (current_setting('request.jwt.claims', true)::json->>'role' = 'ADMIN');

-- =============================================================================
-- 6. DELIVERY AGENT POLICIES
--    Delivery agents can read orders and update order status.
-- =============================================================================

CREATE POLICY "delivery_read_order" ON "Order"
  FOR SELECT TO authenticated
  USING (current_setting('request.jwt.claims', true)::json->>'role' = 'DELIVERY');

CREATE POLICY "delivery_update_order" ON "Order"
  FOR UPDATE TO authenticated
  USING (current_setting('request.jwt.claims', true)::json->>'role' = 'DELIVERY')
  WITH CHECK (current_setting('request.jwt.claims', true)::json->>'role' = 'DELIVERY');

CREATE POLICY "delivery_read_orderitem" ON "OrderItem"
  FOR SELECT TO authenticated
  USING (current_setting('request.jwt.claims', true)::json->>'role' = 'DELIVERY');

-- =============================================================================
-- 7. FORCE RLS FOR TABLE OWNERS
--    By default, table owners bypass RLS. This ensures even the postgres
--    superuser role is subject to these policies unless explicitly overridden.
-- =============================================================================

ALTER TABLE "User" FORCE ROW LEVEL SECURITY;
ALTER TABLE "Address" FORCE ROW LEVEL SECURITY;
ALTER TABLE "Wishlist" FORCE ROW LEVEL SECURITY;
ALTER TABLE "WishlistItem" FORCE ROW LEVEL SECURITY;
ALTER TABLE "Cart" FORCE ROW LEVEL SECURITY;
ALTER TABLE "CartItem" FORCE ROW LEVEL SECURITY;
ALTER TABLE "Order" FORCE ROW LEVEL SECURITY;
ALTER TABLE "OrderItem" FORCE ROW LEVEL SECURITY;
ALTER TABLE "ReturnRequest" FORCE ROW LEVEL SECURITY;
ALTER TABLE "Review" FORCE ROW LEVEL SECURITY;
ALTER TABLE "CouponUsage" FORCE ROW LEVEL SECURITY;
ALTER TABLE "PushSubscription" FORCE ROW LEVEL SECURITY;
ALTER TABLE "StockNotification" FORCE ROW LEVEL SECURITY;
ALTER TABLE "PasswordResetToken" FORCE ROW LEVEL SECURITY;
ALTER TABLE "VerificationToken" FORCE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" FORCE ROW LEVEL SECURITY;
ALTER TABLE "Newsletter" FORCE ROW LEVEL SECURITY;
ALTER TABLE "RateLimit" FORCE ROW LEVEL SECURITY;
ALTER TABLE "Product" FORCE ROW LEVEL SECURITY;
ALTER TABLE "ProductVariant" FORCE ROW LEVEL SECURITY;
ALTER TABLE "Collection" FORCE ROW LEVEL SECURITY;
ALTER TABLE "Coupon" FORCE ROW LEVEL SECURITY;
ALTER TABLE "ShippingConfig" FORCE ROW LEVEL SECURITY;
ALTER TABLE "StoreSetting" FORCE ROW LEVEL SECURITY;
ALTER TABLE "FlashSale" FORCE ROW LEVEL SECURITY;
ALTER TABLE "Pincode" FORCE ROW LEVEL SECURITY;
ALTER TABLE "Banner" FORCE ROW LEVEL SECURITY;
