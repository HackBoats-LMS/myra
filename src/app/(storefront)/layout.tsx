import Navbar from "@/components/layout/Navbar";
import { validateEnv } from "@/lib/env";
import { CartProvider } from "@/context/CartContext";
import { WishlistProvider } from "@/context/WishlistContext";
import CartDrawer from "@/components/storefront/CartDrawer";
import WishlistDrawer from "@/components/storefront/WishlistDrawer";
import CookieConsent from "@/components/layout/CookieConsent";
import AnnouncementBar from "@/components/layout/AnnouncementBar";
import Footer from "@/components/layout/Footer";

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  validateEnv();
  return (
    <CartProvider>
      <WishlistProvider>
        <div className="w-full min-h-screen flex flex-col bg-white">
          <AnnouncementBar />
          <Navbar />
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
