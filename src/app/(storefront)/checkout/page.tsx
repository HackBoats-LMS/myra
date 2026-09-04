import { prisma } from "@/lib/db/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { getCartItems } from "@/features/cart/service";
import CheckoutWizard from "@/app/(storefront)/checkout/_components/CheckoutWizard";
import { getStoreSettings } from "@/lib/settings";
import { estimateCheckoutTotal } from "@/actions/cart";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Checkout | Myra Shopping Mall",
  description: "Complete your purchase securely.",
};

export default async function CheckoutPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id ?? null;

  // Guests must log in before seeing the payment form (cart is saved to the
  // account on sign-in, so nothing is lost).
  if (!userId) {
    redirect("/login?callbackUrl=/checkout");
  }

  const items = await getCartItems();
  if (items.length === 0) {
    redirect("/cart");
  }

  const [addresses, shippingConfig, checkoutUser, storeSettings] = await Promise.all([
    prisma.address.findMany({ where: { userId }, orderBy: { createdAt: "asc" } }),
    prisma.shippingConfig.findUnique({ where: { id: "global" } }),
    prisma.user.findUnique({ where: { id: userId }, select: { phoneNumber: true, phoneNumber2: true } }),
    getStoreSettings(),
  ]);

  let autoCoupon: { code: string | null; discount: number } = { code: null, discount: 0 };
  try {
    const est = await estimateCheckoutTotal({});
    autoCoupon = { code: est.appliedCouponCode, discount: est.discountAmount };
  } catch {
    // Non-fatal: fall back to no auto-applied coupon.
  }

  const lines = items.map((item) => {
    const unitPrice = (item.flashPrice ?? item.product.price) + (item.variant?.priceOffset || 0);
    const originalUnitPrice =
      (item.product.originalPrice && item.product.originalPrice > item.product.price
        ? item.product.originalPrice
        : item.product.price) + (item.variant?.priceOffset || 0);
    return {
      id: item.id,
      productId: item.productId,
      quantity: item.quantity,
      name: item.product.name,
      variantLabel: item.variant
        ? [item.variant.size, item.variant.color].filter(Boolean).join(" - ")
        : undefined,
      images: item.product.images,
      unitPrice,
      originalUnitPrice,
      flashPercent: item.flashPercent,
    };
  });

  return (
    <div className="w-full bg-[#FAFAFA] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-16">
        <div className="flex flex-col items-center justify-center text-center mb-12 space-y-4">
          <h1 className="text-3xl md:text-4xl font-serif text-[#2D1F2F] tracking-wide">Checkout</h1>
          <p className="text-sm text-gray-500 tracking-widest">Complete your purchase securely</p>
        </div>

        <CheckoutWizard
          addresses={addresses.map((a) => ({
            id: a.id,
            label: a.label,
            addressLine1: a.addressLine1,
            city: a.city,
            state: a.state,
            postalCode: a.postalCode,
            country: a.country,
            phone: a.phone,
            isDefault: a.isDefault,
          }))}
          phones={[checkoutUser?.phoneNumber, checkoutUser?.phoneNumber2].filter(Boolean) as string[]}
          shipping={{
            flatRate: shippingConfig?.flatRate ?? 49,
            freeShippingThreshold: shippingConfig?.freeShippingThreshold ?? 999,
          }}
          taxPercent={storeSettings.taxPercent}
          autoAppliedCoupon={autoCoupon.code}
          autoDiscountAmount={autoCoupon.discount}
          lines={lines}
        />

        {addresses.length === 0 && (
          <p className="mt-8 text-center text-xs text-gray-500">
            Tip: you can add a delivery address right in the Delivery step below.
            <Link href="/account" className="ml-1 underline font-bold text-[#7A0B2E]">
              Manage in account
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
