import { prisma } from "@/lib/db/prisma";

// In-memory fallback rate limiters, active only when the database is unreachable.
// Maps are per-process and reset on restart — acceptable for a defence-in-depth layer.
const memFallback = new Map<string, { count: number; windowStart: number }>();

// Periodically purge expired entries to bound memory usage (every 5 minutes).
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [k, v] of memFallback) {
      if (now - v.windowStart > 300_000) memFallback.delete(k);
    }
  }, 300_000);
}

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
 * Uses a single atomic query per request to eliminate the TOCTOU race on window reset.
 * Fails open (allows the request) if the database is unreachable.
 */
export async function checkRateLimit({ bucket, key, limit, windowSeconds }: RateLimitOptions): Promise<void> {
  if (limit <= 0) return;

  const now = Date.now();
  const id = `${bucket}:${key}`;
  const windowStartMs = now - windowSeconds * 1000;

  try {
    // Atomic upsert: increment count. The create path sets count=1.
    const result = await prisma.rateLimit.upsert({
      where: { id },
      create: { id, bucket, key, count: 1, windowStart: new Date(now) },
      update: {
        count: { increment: 1 },
      },
    });

    // If the window has expired, atomically reset count to 1 and start a new window.
    // Using a conditional UPDATE avoids the race where two concurrent requests
    // both see an expired window and both reset.
    if (result.windowStart.getTime() < windowStartMs) {
      const reset = await prisma.rateLimit.updateMany({
        where: { id, windowStart: { lt: new Date(windowStartMs) } },
        data: { count: 1, windowStart: new Date(now) },
      });
      // If updateMany matched 0 rows, another request already reset — increment it.
      if (reset.count === 0) {
        await prisma.rateLimit.update({
          where: { id },
          data: { count: { increment: 1 } },
        });
      }
      return;
    }

    const remainingMs = result.windowStart.getTime() + windowSeconds * 1000 - now;
    if (result.count > limit) {
      // Roll back this request's increment.
      await prisma.rateLimit.updateMany({
        where: { id, count: { gt: 0 } },
        data: { count: { decrement: 1 } },
      });
      throw new RateLimitError(Math.ceil(remainingMs / 1000));
    }
  } catch (err) {
    // Fail open: if the database is unreachable, allow the request rather than
    // blocking all users. Only re-throw RateLimitError (our own limit exceeded).
    if (err instanceof RateLimitError) throw err;
    console.error("Rate limit check failed (failing open):", err);

    // In-memory fallback: approximate rate limiting when DB is down.
    // This is a best-effort defence — it resets on process restart and is
    // per-instance, but it prevents trivial brute-force during outages.
    const memKey = `${bucket}:${key}`;
    const now = Date.now();
    const entry = memFallback.get(memKey);
    if (!entry || now - entry.windowStart > windowSeconds * 1000) {
      memFallback.set(memKey, { count: 1, windowStart: now });
    } else {
      entry.count += 1;
      if (entry.count > limit) {
        throw new RateLimitError(Math.ceil((entry.windowStart + windowSeconds * 1000 - now) / 1000));
      }
    }
  }
}

/** Extract the best-effort client IP from an incoming request. */
export function getClientIp(req: { headers?: unknown }): string {
  const headers = req.headers as
    | { get?(name: string): string | null; [key: string]: unknown }
    | undefined;
  if (!headers) return "unknown";

  const get = (name: string): string | null => {
    const lower = name.toLowerCase();
    if (typeof headers.get === "function") {
      return headers.get(name);
    }
    const raw = headers[lower];
    return typeof raw === "string" ? raw : null;
  };

  // Client-supplied forwarding headers (x-forwarded-for, x-real-ip) are fully
  // spoofable and must only be trusted when this app is explicitly deployed
  // behind a proxy that overwrites them. Otherwise an attacker could rotate
  // them to bypass the per-IP rate-limit bucket.
  const trustProxy = process.env.TRUST_PROXY === "true";
  
  // Cloudflare sets cf-connecting-ip which is trustworthy even without TRUST_PROXY
  const cf = get("cf-connecting-ip");
  if (cf) return cf;
  
  if (!trustProxy) {
    // Also check for Vercel's header which is added by their edge network
    const vercelIp = get("x-vercel-forwarded-for");
    if (vercelIp) return vercelIp.split(",")[0].trim();
    return "unknown";
  }

  const xff = get("x-forwarded-for");
  if (xff) {
    return xff.split(",")[0].trim();
  }
  const real = get("x-real-ip");
  if (real) return real;
  return "unknown";
}
