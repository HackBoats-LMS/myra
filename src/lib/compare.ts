import { cookies } from "next/headers";

export const COMPARE_COOKIE = "compare";
export const COMPARE_MAX = 4;

export async function getCompareIds(): Promise<string[]> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(COMPARE_COOKIE)?.value;
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((id): id is string => typeof id === "string")
      .slice(0, COMPARE_MAX);
  } catch {
    return [];
  }
}
