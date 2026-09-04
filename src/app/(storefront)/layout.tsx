import { getServerSession } from "next-auth";
import { cookies } from "next/headers";
import { authOptions } from "@/lib/auth/auth";
import HeaderController from "@/components/layout/HeaderController";
import { validateEnv } from "@/lib/env";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import { CompareProvider } from "@/context/CompareContext";
import { getCompareIds } from "@/lib/compare";
import { getCachedCartCount, getCachedWishlistCount, getCachedNavigationTree } from "@/lib/cache";
import { NAV_LINKS, type NavLink } from "@/lib/navigation";
import CookieConsent from "@/components/layout/CookieConsent";
import AnnouncementBar from "@/components/layout/AnnouncementBar";
import Footer from "@/components/layout/Footer";
import PwaRegister from "@/app/(storefront)/_components/PwaRegister";
import Drawers from "@/app/(storefront)/_components/Drawers";
import SmoothScroll from "@/components/layout/SmoothScroll";
import { verifyCookieValue } from "@/lib/cookie-signing";

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

export default async function StorefrontLayout({ children }: { children: React.ReactNode }) {
  validateEnv();

  let navLinks: NavLink[] = NAV_LINKS;
  let compareIds: string[] = [];

  try {
    const cachedNav = await getCachedNavigationTree();
    if (cachedNav && cachedNav.length > 0) {
      navLinks = cachedNav;
    }
    compareIds = await getCompareIds();
  } catch (error) {
    console.warn("Database unreachable in storefront layout header:", error instanceof Error ? error.message : "unknown error");
  }

  // Initial dummy state for static rendering. HeaderController will hydrate on client mount.
  const cartCount = 0;
  const wishlistCount = 0;
  const isLoggedIn = false;

  return (
    <CartProvider initialCartCount={cartCount}>
      <WishlistProvider>
        <CompareProvider initialIds={compareIds}>
          <div className="w-full min-h-screen flex flex-col bg-white">
            <AnnouncementBar />
            <HeaderController cartCount={cartCount} wishlistCount={wishlistCount} isLoggedIn={isLoggedIn} navLinks={navLinks} />
            <main id="main-content" className="flex-1">
              {children}
            </main>
            <Footer />
            <Drawers />
            <CookieConsent />
            <PwaRegister />
            <SmoothScroll />
          </div>
        </CompareProvider>
      </WishlistProvider>
    </CartProvider>
  );
}
