import { getServerSession } from "next-auth";
import { cookies } from "next/headers";
import { authOptions } from "@/lib/auth";
import HeaderController from "@/components/layout/HeaderController";
import { validateEnv } from "@/lib/env";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { CompareProvider } from "@/context/CompareContext";
import { getCompareIds } from "@/lib/compare";
import { getCachedCartCount, getCachedWishlistCount } from "@/lib/cache";
import CookieConsent from "@/components/layout/CookieConsent";
import AnnouncementBar from "@/components/layout/AnnouncementBar";
import Footer from "@/components/layout/Footer";
import PwaRegister from "@/components/storefront/PwaRegister";
import Drawers from "@/components/storefront/Drawers";

function parseGuestCartCount(raw: string | undefined): number {
  if (!raw) return 0;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return 0;
    return parsed.reduce((sum: number, item: { quantity?: number }) => sum + (item.quantity || 0), 0);
  } catch {
    return 0;
  }
}

function parseGuestWishlistCount(raw: string | undefined): number {
  if (!raw) return 0;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return 0;
    return parsed.length;
  } catch {
    return 0;
  }
}

export default async function StorefrontLayout({ children }: { children: React.ReactNode }) {
  validateEnv();

  let cartCount = 0;
  let wishlistCount = 0;
  let isLoggedIn = false;
  let compareIds: string[] = [];

  try {
    const session = await getServerSession(authOptions);
    isLoggedIn = !!session?.user?.id;
    const userId = session?.user?.id ?? null;

    if (userId) {
      // Cached per-user counts (short TTL) to avoid a DB hit on every page.
      const [cart, wishlist] = await Promise.all([
        getCachedCartCount(userId),
        getCachedWishlistCount(userId),
      ]);
      cartCount = cart;
      wishlistCount = wishlist;
    } else {
      const cookieStore = await cookies();
      cartCount = parseGuestCartCount(cookieStore.get("guest_cart")?.value);
      wishlistCount = parseGuestWishlistCount(cookieStore.get("guest_wishlist")?.value);
    }

    compareIds = await getCompareIds();
  } catch (error) {
    console.warn("Database unreachable in storefront layout header:", error);
  }

  return (
    <CartProvider>
      <WishlistProvider>
        <CompareProvider initialIds={compareIds}>
          <div className="w-full min-h-screen flex flex-col bg-white">
            <AnnouncementBar />
            <HeaderController cartCount={cartCount} wishlistCount={wishlistCount} isLoggedIn={isLoggedIn} />
            <main id="main-content" className="flex-1">
              {children}
            </main>
            <Footer />
            <Drawers />
            <CookieConsent />
            <PwaRegister />
          </div>
        </CompareProvider>
      </WishlistProvider>
    </CartProvider>
  );
}