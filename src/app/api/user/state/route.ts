import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { cookies } from "next/headers";
import { authOptions } from "@/lib/auth/auth";
import { verifyCookieValue } from "@/lib/cookie-signing";
import { getCachedCartCount, getCachedWishlistCount } from "@/lib/cache";

function parseGuestCartCount(raw: string | undefined): number {
  if (!raw) return 0;
  try {
    const data = verifyCookieValue(raw) ?? raw;
    const parsed: unknown = JSON.parse(data);
    if (!Array.isArray(parsed)) return 0;
    return parsed.reduce((sum: number, item: { quantity?: number }) => sum + (item.quantity || 0), 0);
  } catch {
    return 0;
  }
}

function parseGuestWishlistCount(raw: string | undefined): number {
  if (!raw) return 0;
  try {
    const data = verifyCookieValue(raw) ?? raw;
    const parsed: unknown = JSON.parse(data);
    if (!Array.isArray(parsed)) return 0;
    return parsed.length;
  } catch {
    return 0;
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const isLoggedIn = !!session?.user?.id;
    const userId = session?.user?.id ?? null;

    let cartCount = 0;
    let wishlistCount = 0;

    if (userId) {
      const [userCart, userWishlist] = await Promise.all([
        getCachedCartCount(userId),
        getCachedWishlistCount(userId),
      ]);
      cartCount = userCart ?? 0;
      wishlistCount = userWishlist ?? 0;
    } else {
      const cookieStore = await cookies();
      cartCount = parseGuestCartCount(cookieStore.get("guest_cart")?.value);
      wishlistCount = parseGuestWishlistCount(cookieStore.get("guest_wishlist")?.value);
    }

    return NextResponse.json({ isLoggedIn, cartCount, wishlistCount });
  } catch (error) {
    console.error("Failed to fetch user state:", error);
    return NextResponse.json({ isLoggedIn: false, cartCount: 0, wishlistCount: 0 }, { status: 500 });
  }
}
