import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import CartItem from "@/features/cart/components/CartItem";
import { getCartItems } from "@/features/cart/service";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shopping Bag | Myra Shopping Mall",
  description: "Review items in your shopping bag and proceed to checkout.",
};

export default async function CartPage() {
  const session = await getServerSession(authOptions);
  const items = await getCartItems();

  const subtotal = items.reduce((sum, item) => {
    const unitPrice = (item.flashPrice ?? item.product.price) + (item.variant?.priceOffset || 0);
    return sum + unitPrice * item.quantity;
  }, 0);

  return (
    <div className="w-full bg-[#FAFAFA] min-h-screen">
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 md:py-16">
        <div className="flex flex-col items-center justify-center text-center mb-16 space-y-4">
          <h1 className="text-3xl md:text-4xl font-serif text-[#2D1F2F] tracking-wide">Shopping Bag</h1>
          <p className="text-sm text-gray-500 tracking-widest">{items.length} item{items.length !== 1 ? 's' : ''}</p>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-16 bg-white border border-[#7A0B2E]/20">
            <p className="text-gray-500 mb-6 font-serif">Your bag is empty.</p>
            <Link
              href="/collections"
              className="inline-block px-8 py-3 bg-[#7A0B2E] hover:bg-[#5C0820] text-white text-xs font-bold uppercase tracking-widest transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="bg-white border border-[#7A0B2E]/20">
            <div className="px-6 py-5 border-b border-[#7A0B2E]/20 flex items-center justify-between">
              <span className="text-sm font-bold uppercase tracking-widest text-[#2D1F2F]">Your Items</span>
              <Link href="/collections" className="text-[10px] font-bold text-[#7A0B2E] uppercase tracking-widest hover:text-[#2D1F2F]">
                + Add More
              </Link>
            </div>
            <div className="px-6">
              {items.map((item) => (
                <CartItem key={item.id} item={item} />
              ))}
            </div>

            <div className="border-t border-[#7A0B2E]/20 px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500">Subtotal</span>
                <span className="text-2xl font-serif text-[#2D1F2F]">Rs. {subtotal.toLocaleString('en-IN')}</span>
              </div>
              <Link
                href={session?.user?.id ? "/checkout" : "/login?callbackUrl=/checkout"}
                className="w-full sm:w-auto text-center bg-[#7A0B2E] hover:bg-[#5C0820] text-white px-12 py-4 text-xs font-bold uppercase tracking-widest transition-colors shadow-sm rounded-none"
              >
                Proceed to Checkout
              </Link>
            </div>

            {!session && (
              <p className="px-6 pb-6 text-xs text-center text-gray-500 leading-relaxed">
                You are checking out as a guest. Log in to save your order to your account.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
