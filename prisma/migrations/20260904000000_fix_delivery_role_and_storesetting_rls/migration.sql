-- Security audit fix: Replace DELIVERY role policies with MULTI_WORKER
-- (DELIVERY does not exist in the Prisma Role enum; MULTI_WORKER is the correct role).
-- Also remove StoreSetting anon read policy to prevent exposing arbitrary key-value config.

-- =============================================================================
-- 1. DROP DELIVERY ROLE POLICIES
-- =============================================================================

DROP POLICY IF EXISTS "delivery_read_order" ON "Order";
DROP POLICY IF EXISTS "delivery_update_order" ON "Order";
DROP POLICY IF EXISTS "delivery_read_orderitem" ON "OrderItem";

-- =============================================================================
-- 2. ADD MULTI_WORKER POLICIES (read-only for orders, like delivery agents)
-- =============================================================================

CREATE POLICY "worker_read_order" ON "Order"
  FOR SELECT TO authenticated
  USING (current_setting('request.jwt.claims', true)::json->>'role' = 'MULTI_WORKER');

CREATE POLICY "worker_read_orderitem" ON "OrderItem"
  FOR SELECT TO authenticated
  USING (current_setting('request.jwt.claims', true)::json->>'role' = 'MULTI_WORKER');

-- =============================================================================
-- 3. REMOVE StoreSetting ANON READ POLICY
--    StoreSetting contains arbitrary key-value config that may be sensitive.
--    Only admins (via service_role or admin JWT) should read these values.
-- =============================================================================

DROP POLICY IF EXISTS "anon_read_storesetting" ON "StoreSetting";
