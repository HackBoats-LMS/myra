import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { getCartItems } from "@/features/cart/service";
import CartPageClient from "@/features/cart/components/CartPageClient";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Shopping Bag | Myra Shopping Mall",
  description: "Review items in your shopping bag and proceed to checkout.",
};

export default async function CartPage() {
  const session = await getServerSession(authOptions);
  const items = await getCartItems();

  return (
    <div className="w-full bg-[#F5EFE6] min-h-screen">
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 md:py-16">
        <div className="flex flex-col items-center justify-center text-center mb-12 space-y-3">
          <h1 className="text-3xl md:text-4xl font-serif text-[#2D1F2F] tracking-wide">Shopping Bag</h1>
          <p className="text-sm text-gray-500 tracking-widest">
            {items.length} item{items.length !== 1 ? "s" : ""}
          </p>
        </div>

        <CartPageClient initialItems={items} isLoggedIn={Boolean(session?.user?.id)} />
      </div>
    </div>
  );
}

