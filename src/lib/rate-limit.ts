type RateLimitInfo = {
  count: number;
  resetAt: number;
};

// In-memory store with periodic cleanup
// Note: In serverless (Vercel), this resets on cold starts
// For production, consider using Redis via @upstash/redis or similar
const store = new Map<string, RateLimitInfo>();

// Cleanup interval
let cleanupInterval: NodeJS.Timeout | null = null;

function startCleanup() {
  if (cleanupInterval) return;
  cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, info] of store.entries()) {
      if (now > info.resetAt) {
        store.delete(key);
      }
    }
  }, 60000);
}

function stopCleanup() {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
}

export function rateLimit(
  identifier: string,
  limit: number = 5,
  windowMs: number = 60000
): { success: boolean; remaining: number; reset: number } {
  startCleanup();
  
  const now = Date.now();
  let info = store.get(identifier);

  if (!info || now > info.resetAt) {
    info = { count: 0, resetAt: now + windowMs };
  }

  info.count += 1;
  store.set(identifier, info);

  return {
    success: info.count <= limit,
    remaining: Math.max(0, limit - info.count),
    reset: info.resetAt,
  };
}

// For testing or manual reset
export function resetRateLimit(identifier?: string) {
  if (identifier) {
    store.delete(identifier);
  } else {
    store.clear();
  }
}

// Export store for testing/inspection
export function getRateLimitStore() {
  return store;
}

// Cleanup on process exit (for long-running servers)
if (typeof process !== "undefined") {
  process.on("exit", stopCleanup);
  process.on("SIGINT", stopCleanup);
  process.on("SIGTERM", stopCleanup);
}