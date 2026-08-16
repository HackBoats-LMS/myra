import { cookies } from "next/headers";

export const RECENTLY_VIEWED_COOKIE = "recently_viewed";
export const RECENTLY_VIEWED_MAX = 8;

export async function getRecentlyViewedProductIds(): Promise<string[]> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(RECENTLY_VIEWED_COOKIE)?.value;
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((id): id is string => typeof id === "string")
      .slice(0, RECENTLY_VIEWED_MAX);
  } catch {
    return [];
  }
}