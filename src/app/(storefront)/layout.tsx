import Navbar from "@/components/layout/Navbar";
import { validateEnv } from "@/lib/env";
import { CartProvider } from "@/context/CartContext";
import CartDrawer from "@/components/storefront/CartDrawer";
import CookieConsent from "@/components/layout/CookieConsent";
import AnnouncementBar from "@/components/layout/AnnouncementBar";
import Footer from "@/components/layout/Footer";

import Breadcrumbs from "@/components/storefront/Breadcrumbs";

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  validateEnv();
  return (
    <CartProvider>
      <div className="w-full min-h-screen flex flex-col bg-white">
        <AnnouncementBar />
        <Navbar />
        <div className="flex-1 max-w-7xl w-full mx-auto px-6 md:px-8 mt-6">
          <Breadcrumbs />
        </div>
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <Footer />
        <CartDrawer />
        <CookieConsent />
      </div>
    </CartProvider>
  );
}
