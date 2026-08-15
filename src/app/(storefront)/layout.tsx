import { getServerSession } from "next-auth";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getWishlistCount } from "@/actions/wishlist";
import HeaderController from "@/components/layout/HeaderController";
import { validateEnv } from "@/lib/env";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import CartDrawer from "@/components/storefront/CartDrawer";
import WishlistDrawer from "@/components/storefront/WishlistDrawer";
import CookieConsent from "@/components/layout/CookieConsent";
import AnnouncementBar from "@/components/layout/AnnouncementBar";
import Footer from "@/components/layout/Footer";

async function getCartCount(userId: string | null): Promise<number> {
  if (userId) {
    const result = await prisma.cartItem.aggregate({
      where: { cart: { userId } },
      _sum: { quantity: true },
    });
    return result._sum.quantity ?? 0;
  }
  // Guest cart from cookie
  const cookieStore = await cookies();
  const raw = cookieStore.get("guest_cart")?.value;
  if (!raw) return 0;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return 0;
    return parsed.reduce((sum: number, item: { quantity?: number }) => sum + (item.quantity || 0), 0);
  } catch {
    return 0;
  }
}

export default async function StorefrontLayout({ children }: { children: React.ReactNode }) {
  validateEnv();

  let cartCount = 0;
  let wishlistCount = 0;
  let isLoggedIn = false;

  try {
    const session = await getServerSession(authOptions);
    isLoggedIn = !!session?.user?.id;
    const userId = session?.user?.id ?? null;
    const [cart, wishlist] = await Promise.all([getCartCount(userId), getWishlistCount()]);
    cartCount = cart;
    wishlistCount = wishlist;
  } catch (error) {
    console.warn("Database unreachable in storefront layout header:", error);
  }

  return (
    <CartProvider>
      <WishlistProvider>
        <div className="w-full min-h-screen flex flex-col bg-white">
          <AnnouncementBar />
          <HeaderController cartCount={cartCount} wishlistCount={wishlistCount} isLoggedIn={isLoggedIn} />
          <main id="main-content" className="flex-1">
            {children}
          </main>
          <Footer />
          <CartDrawer />
          <WishlistDrawer />
          <CookieConsent />
        </div>
      </WishlistProvider>
    </CartProvider>
  );
}