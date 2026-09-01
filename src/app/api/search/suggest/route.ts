import { NextResponse } from "next/server";
import { getCachedSearchSuggestions } from "@/lib/cache";
import { checkRateLimit, getClientIp, RateLimitError } from "@/lib/rate-limit";

export async function GET(req: Request) {
  try {
    // Rate-limit search suggestions to prevent abuse
    const ip = getClientIp(req);
    try {
      await checkRateLimit({ bucket: "search:ip", key: ip, limit: 60, windowSeconds: 60 });
    } catch (error) {
      if (error instanceof RateLimitError) {
        return NextResponse.json({ products: [] }, { status: 429 });
      }
      throw error;
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");

    if (!query || query.length < 2) {
      return NextResponse.json({ products: [] });
    }

    const products = await getCachedSearchSuggestions(query);

    return NextResponse.json({ products });
  } catch (error) {
    console.error("Auto-suggest error:", error);
    return NextResponse.json({ products: [] }, { status: 500 });
  }
}
