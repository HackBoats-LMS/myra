import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { cookies } from "next/headers";
import CartItem from "@/components/storefront/CartItem";
import CheckoutButton from "@/components/storefront/CheckoutButton";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shopping Bag | Myra Shopping Mall",
  description: "Review items in your shopping bag and proceed to checkout.",
};

async function getCartItems() {
  const session = await getServerSession(authOptions);
  
  if (session?.user?.id) {
    const userId = session.user.id;
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: { product: { include: { collection: true } } },
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    return cart?.items || [];
  } else {
    const cookieStore = await cookies();
    const cartCookie = cookieStore.get('guest_cart');
    if (!cartCookie) return [];
    
    const parsed = JSON.parse(cartCookie.value);
    
    // Fetch products for the guest cart
    const productIds = parsed.map((p: any) => p.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { collection: true }
    });
    
    return parsed.map((p: any) => {
      const prod = products.find(prod => prod.id === p.productId);
      return prod ? { ...p, product: prod, id: `guest-${prod.id}` } : null;
    }).filter(Boolean);
  }
}

export default async function CartPage() {
  const items = await getCartItems();
  const session = await getServerSession(authOptions);
  
  const totalAmount = items.reduce((sum: number, item: any) => sum + (item.product.price * item.quantity), 0);

  return (
    <div className="max-w-7xl mx-auto px-8 py-16 min-h-screen">
      <div className="flex flex-col items-center justify-center text-center mb-16 space-y-4">
        <h1 className="text-4xl md:text-5xl font-serif text-gray-900 tracking-tight">Shopping Bag</h1>
        <p className="text-sm text-gray-500 uppercase tracking-widest">{items.length} items</p>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-500 mb-6">Your bag is empty.</p>
          <Link
            href="/collections"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#0D3B66] hover:underline"
          >
            ← Continue Shopping
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          
          {/* Cart Items */}
          <div className="lg:col-span-8 flex flex-col">
            <div className="border-t border-gray-200 pt-6">
              {items.map((item: any) => (
                <CartItem key={item.id} item={item} />
              ))}
            </div>
            <div className="mt-6">
              <Link
                href="/collections"
                className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
              >
                ← Continue Shopping
              </Link>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-4">
            <div className="bg-gray-50 border border-gray-100 p-8 sticky top-32">
              <h3 className="text-sm font-bold uppercase tracking-widest text-gray-900 mb-6">Order Summary</h3>
              
              <div className="space-y-4 text-sm text-gray-600 mb-6">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹{totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="uppercase tracking-widest text-xs">Complimentary</span>
                </div>
              </div>
              
              <div className="border-t border-gray-200 pt-6 mb-8 flex justify-between items-end">
                <span className="text-sm font-bold uppercase tracking-widest text-gray-900">Total</span>
                <span className="text-2xl text-gray-900">₹{totalAmount.toFixed(2)}</span>
              </div>
              
              <CheckoutButton isLoggedIn={!!session} />
              
              {!session && (
                <p className="text-xs text-center text-gray-500 mt-4">
                  You are checking out as a guest. <br/> Log in to save your order to your account.
                </p>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
