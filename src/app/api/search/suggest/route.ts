import { NextResponse } from "next/server";
import { getCachedSearchSuggestions } from "@/lib/cache";

export async function GET(req: Request) {
  try {
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