"use server";
import { cookies } from "next/headers";
import { RECENTLY_VIEWED_COOKIE, RECENTLY_VIEWED_MAX } from "@/lib/recently-viewed";

export async function trackProductView(productId: string) {
  if (!productId) return;
  const cookieStore = await cookies();

  let current: string[] = [];
  const raw = cookieStore.get(RECENTLY_VIEWED_COOKIE)?.value;
  if (raw) {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        current = parsed.filter((id): id is string => typeof id === "string");
      }
    } catch {
      /* ignore malformed cookie */
    }
  }

  const next = [productId, ...current.filter((id) => id !== productId)].slice(0, RECENTLY_VIEWED_MAX);

  cookieStore.set(RECENTLY_VIEWED_COOKIE, JSON.stringify(next), {
    maxAge: 60 * 60 * 24 * 30, // 30 days
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });
}
