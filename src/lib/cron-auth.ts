import crypto from "crypto";

/**
 * Verify the Bearer token in the Authorization header against CRON_SECRET.
 * Uses timing-safe comparison to prevent timing attacks.
 * Returns false if CRON_SECRET is not set (denies access).
 */
export function verifyCronAuth(req: Request): boolean {
  if (!process.env.CRON_SECRET) return false;
  const auth = req.headers.get("authorization");
  if (!auth || !auth.startsWith("Bearer ")) return false;
  const token = auth.slice(7);
  const secret = process.env.CRON_SECRET;
  if (token.length !== secret.length) return false;
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(secret));
}
