import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { cookies } from "next/headers";
import { CartItemData } from "@/lib/cart-service";
import CartItem from "@/components/storefront/CartItem";
import CheckoutButton from "@/components/storefront/CheckoutButton";
import CartCouponBox from "@/components/storefront/CartCouponBox";
import Link from "next/link";
import type { Metadata } from "next";

interface CartLineItem {
  id: string;
  productId: string;
  quantity: number;
  variantId?: string | null;
  product: {
    id: string;
    slug: string;
    price: number;
    name: string;
    images: string[];
    collection?: { name: string | null } | null;
  };
  variant?: { priceOffset: number; size?: string | null; color?: string | null } | null;
}

export const metadata: Metadata = {
  title: "Shopping Bag | Myra Shopping Mall",
  description: "Review items in your shopping bag and proceed to checkout.",
};

async function getCartItems(): Promise<CartLineItem[]> {
  const session = await getServerSession(authOptions);
  
  if (session?.user?.id) {
    const userId = session.user.id;
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: { 
            product: { include: { collection: true } },
            variant: true
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    return cart?.items || [];
  } else {
    const cookieStore = await cookies();
    const cartCookie = cookieStore.get('guest_cart');
    if (!cartCookie) return [];
    
    const parsed = JSON.parse(cartCookie.value) as CartItemData[];
    
    const productIds = parsed.map((p) => p.productId);
    const variantIds = parsed.map((p) => p.variantId).filter((id): id is string => Boolean(id));
    
    const [products, variants] = await Promise.all([
      prisma.product.findMany({
        where: { id: { in: productIds }, deletedAt: null },
        include: { collection: true }
      }),
      prisma.productVariant.findMany({
        where: { id: { in: variantIds } }
      })
    ]);
    
    return parsed.map((p, idx) => {
      const prod = products.find((prod) => prod.id === p.productId);
      const vrnt = p.variantId ? variants.find((v) => v.id === p.variantId) : null;
      return prod ? { ...p, product: prod, variant: vrnt, id: `guest-${idx}` } : null;
    }).filter(Boolean) as CartLineItem[];
  }
}

export default async function CartPage() {
  const items = await getCartItems();
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id ?? null;

  const [addresses, shippingConfig, checkoutUser] = await Promise.all([
    userId ? prisma.address.findMany({ where: { userId }, orderBy: { createdAt: "asc" } }) : Promise.resolve([]),
    prisma.shippingConfig.findUnique({ where: { id: "global" } }),
    userId ? prisma.user.findUnique({ where: { id: userId }, select: { phoneNumber: true, phoneNumber2: true } }) : Promise.resolve(null),
  ]);
  
  const totalAmount = items.reduce((sum: number, item) => {
    const basePrice = item.product.price;
    const offset = item.variant?.priceOffset || 0;
    return sum + ((basePrice + offset) * item.quantity);
  }, 0);

  return (
    <div className="w-full bg-[#FAFAFA] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-16">
        <div className="flex flex-col items-center justify-center text-center mb-16 space-y-4">
          <h1 className="text-3xl md:text-4xl font-serif text-[#4A3B2C] tracking-wide">Shopping Bag</h1>
          <p className="text-sm text-gray-500 tracking-widest">{items.length} items</p>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-10 md:py-10 md:py-20 bg-white border border-[#B6925B]/20">
            <p className="text-gray-500 mb-6 font-serif">Your bag is empty.</p>
            <Link
              href="/collections"
              className="inline-flex items-center gap-2 text-sm font-bold text-[#B6925B] hover:text-[#9c7d4e] uppercase tracking-widest transition-colors"
            >
              ← Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
            
            {/* Cart Items */}
            <div className="lg:col-span-8 flex flex-col">
              <div className="border-t border-[#B6925B]/20 pt-6">
                {items.map((item) => (
                  <CartItem key={item.id} item={item} />
                ))}
              </div>
              <div className="mt-8">
                <Link
                  href="/collections"
                  className="inline-flex items-center gap-2 text-sm font-bold text-[#B6925B] hover:text-[#9c7d4e] uppercase tracking-widest transition-colors"
                >
                  ← Continue Shopping
                </Link>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-4">
              {session && <CartCouponBox subtotal={totalAmount} />}
              <CheckoutButton
                isLoggedIn={!!session}
                addresses={addresses}
                subtotal={totalAmount}
                shipping={{
                  flatRate: shippingConfig?.flatRate ?? 49,
                  freeShippingThreshold: shippingConfig?.freeShippingThreshold ?? 999,
                }}
                phones={[checkoutUser?.phoneNumber, checkoutUser?.phoneNumber2].filter(Boolean) as string[]}
              />
              
              {!session && (
                <p className="text-xs text-center text-gray-500 mt-6 leading-relaxed">
                  You are checking out as a guest. <br/> Log in to save your order to your account.
                </p>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
