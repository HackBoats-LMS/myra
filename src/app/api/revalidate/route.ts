import { NextRequest, NextResponse } from "next/server";
import { revalidateTag, CACHE_TAGS } from "@/lib/cache";
import crypto from "crypto";

/**
 * POST /api/revalidate
 * Immediately purges the Next.js data cache for products (and optionally collections).
 *
 * Protected by REVALIDATE_SECRET (or falls back to NEXTAUTH_SECRET).
 * Authorization: Bearer <secret>
 *
 * Body (optional): { "tags": ["products", "collections"] }
 */
export async function POST(req: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Server not configured." }, { status: 500 });
  }

  const auth = req.headers.get("authorization") ?? "";
  if (!auth.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const token = auth.slice(7);
  if (token.length !== secret.length || !crypto.timingSafeEqual(Buffer.from(token), Buffer.from(secret))) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let requestedTags: string[] = ["products", "collections"];
  try {
    const body = await req.json().catch(() => ({}));
    if (Array.isArray(body?.tags)) requestedTags = body.tags;
  } catch {
    // Use defaults
  }

  const validTags: Record<string, string> = {
    products: CACHE_TAGS.products,
    collections: CACHE_TAGS.collections,
    navigation: CACHE_TAGS.navigation,
    banners: CACHE_TAGS.banners,
    brandStories: CACHE_TAGS.brandStories,
    workerProducts: CACHE_TAGS.workerProducts,
  };

  const revalidated: string[] = [];
  for (const tag of requestedTags) {
    const resolvedTag = validTags[tag];
    if (resolvedTag) {
      revalidateTag(resolvedTag);
      revalidated.push(resolvedTag);
    }
  }

  return NextResponse.json({ revalidated, timestamp: new Date().toISOString() });
}

/** GET /api/revalidate — quick health check (no auth needed) */
export async function GET() {
  return NextResponse.json({ status: "ok", endpoint: "/api/revalidate" });
}
