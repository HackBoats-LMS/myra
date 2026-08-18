"use client";
import dynamic from "next/dynamic";

// These heavy interactive drawers are client-only. `ssr: false` is only
// permitted in a Client Component, so they're loaded from this wrapper rather
// than the server layout.
const CartDrawer = dynamic(() => import("@/components/storefront/CartDrawer"), { ssr: false });
const WishlistDrawer = dynamic(() => import("@/components/storefront/WishlistDrawer"), { ssr: false });

export default function Drawers() {
  return (
    <>
      <CartDrawer />
      <WishlistDrawer />
    </>
  );
}
