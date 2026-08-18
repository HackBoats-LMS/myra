import { prisma } from "@/lib/db/prisma";

export class RateLimitError extends Error {
  retryAfterSeconds: number;
  constructor(retryAfterSeconds: number) {
    super("Too many attempts. Please try again later.");
    this.name = "RateLimitError";
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export interface RateLimitOptions {
  bucket: string;
  key: string;
  limit: number;
  windowSeconds: number;
}

/**
 * Fixed-window rate limiter backed by the database.
 * Throws RateLimitError when the caller has exceeded `limit` attempts within `windowSeconds`.
 * Safe to use in server actions, route handlers, and NextAuth authorize.
 */
export async function checkRateLimit({ bucket, key, limit, windowSeconds }: RateLimitOptions): Promise<void> {
  if (limit <= 0) return;

  const now = Date.now();
  const id = `${bucket}:${key}`;
  const windowStartMs = now - windowSeconds * 1000;

  const existing = await prisma.rateLimit.findUnique({ where: { id } });

  if (!existing) {
    try {
      await prisma.rateLimit.create({
        data: { id, bucket, key, count: 1, windowStart: new Date(now) },
      });
    } catch {
      // Concurrent create race — fall through to the read/increment path below.
    }
    return;
  }

  if (existing.windowStart.getTime() < windowStartMs) {
    // Window expired — reset atomically.
    await prisma.rateLimit.update({
      where: { id },
      data: { count: 1, windowStart: new Date(now) },
    });
    return;
  }

  const remainingMs = existing.windowStart.getTime() + windowSeconds * 1000 - now;
  if (existing.count >= limit) {
    throw new RateLimitError(Math.ceil(remainingMs / 1000));
  }

  const updated = await prisma.rateLimit.updateMany({
    where: { id, count: { lt: limit } },
    data: { count: { increment: 1 } },
  });
  if (updated.count === 0) {
    throw new RateLimitError(Math.ceil(remainingMs / 1000));
  }
}

/** Extract the best-effort client IP from an incoming request. */
export function getClientIp(req: { headers?: unknown; socket?: { remoteAddress?: string } }): string | null {
  // Trusted proxy deployment: overwrite/populate forwarding headers. The app
  // must be configured to only accept these when a real proxy rewrites them.
  if (process.env.TRUST_PROXY === "true") {
    const headers = req.headers as
      | { get?(name: string): string | null; [key: string]: unknown }
      | undefined;
    const get = (name: string): string | null => {
      if (!headers) return null;
      const lower = name.toLowerCase();
      if (typeof headers.get === "function") return headers.get(name);
      const raw = headers[lower];
      return typeof raw === "string" ? raw : null;
    };
    const xff = get("x-forwarded-for");
    if (xff) return xff.split(",")[0].trim();
    const real = get("x-real-ip");
    if (real) return real;
    const cf = get("cf-connecting-ip");
    if (cf) return cf;
  }

  // Not behind a trusted proxy: forwarding headers are spoofable and MUST NOT
  // be trusted. Fall back to the actual TCP peer address (not client-spoofable).
  // If we can't determine a real per-client IP, return null so callers can skip
  // IP-based limiting rather than collapsing everyone into one "unknown" bucket.
  return req?.socket?.remoteAddress || null;
}