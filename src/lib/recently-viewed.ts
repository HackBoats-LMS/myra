import { cookies } from "next/headers";
import { verifyCookieValue } from "@/lib/cookie-signing";

export const RECENTLY_VIEWED_COOKIE = "recently_viewed";
export const RECENTLY_VIEWED_MAX = 8;

export async function getRecentlyViewedProductIds(): Promise<string[]> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(RECENTLY_VIEWED_COOKIE)?.value;
  if (!raw) return [];
  try {
    const data = verifyCookieValue(raw);
    if (!data) return [];
    const parsed: unknown = JSON.parse(data);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((id): id is string => typeof id === "string")
      .slice(0, RECENTLY_VIEWED_MAX);
  } catch {
    return [];
  }
}


