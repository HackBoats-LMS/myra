-- Security hardening migration

-- Fix: Filter unapproved reviews from anon/public read policy
-- Previously, anon users could read unapproved (hidden/flagged) reviews
DROP POLICY IF EXISTS "anon_read_review" ON "Review";
CREATE POLICY "anon_read_review" ON "Review"
  FOR SELECT
  TO anon
  USING ("isApproved" = true);
