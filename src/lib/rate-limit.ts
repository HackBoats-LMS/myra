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
    // Use upsert to avoid race condition on initial create
    await prisma.rateLimit.upsert({
      where: { id },
      create: { id, bucket, key, count: 1, windowStart: new Date(now) },
      update: {
        count: { increment: 1 },
      },
    });
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
  if (!trustProxy) {
    const cf = get("cf-connecting-ip");
    if (cf) return cf;
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
