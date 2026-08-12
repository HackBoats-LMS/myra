import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Order Confirmed | Myra Shopping Mall",
};

export default async function OrderConfirmationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  const order = await prisma.order.findFirst({
    where: {
      id,
      ...(session?.user?.id ? { userId: session.user.id } : {}),
    },
    include: {
      address: true,
      orderItems: { include: { product: { select: { name: true, price: true } } } },
    },
  });

  if (!order) notFound();

  return (
    <div className="w-full bg-[#FAFAFA] min-h-screen">
      <div className="max-w-3xl mx-auto px-6 py-16 md:py-24 text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-50 border border-green-200 text-green-700 flex items-center justify-center text-3xl">
          ✓
        </div>
        <h1 className="text-3xl md:text-4xl font-serif text-[#4A3B2C] tracking-wide mb-3">Thank you, your order is confirmed!</h1>
        <p className="text-gray-500 mb-8">
          Order <span className="font-mono text-[#B6925B] font-bold">#{order.id.split("-")[0].toUpperCase()}</span> has been placed. A
          confirmation email is on its way.
        </p>

        <div className="bg-white border border-[#B6925B]/20 shadow-sm text-left">
          <div className="px-6 py-5 border-b border-[#B6925B]/20 flex items-center justify-between">
            <span className="text-sm font-bold uppercase tracking-widest text-[#4A3B2C]">Order Summary</span>
            <span className="text-xs text-gray-500">
              {new Date(order.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}
            </span>
          </div>

          <div className="p-6 space-y-4">
            <ul className="divide-y divide-[#B6925B]/10">
              {order.orderItems.map((item) => (
                <li key={item.id} className="flex items-center justify-between py-3">
                  <span className="text-sm text-[#4A3B2C]">
                    {item.product.name} <span className="text-gray-400">× {item.quantity}</span>
                  </span>
                  <span className="text-sm font-bold text-[#4A3B2C]">Rs. {item.price.toLocaleString('en-IN')}</span>
                </li>
              ))}
            </ul>

            <div className="flex justify-between pt-4 border-t border-[#B6925B]/20">
              <span className="text-sm font-bold text-[#4A3B2C]">Total (Cash on Delivery)</span>
              <span className="text-lg font-black text-[#4A3B2C]">Rs. {order.totalAmount.toLocaleString('en-IN')}</span>
            </div>

            {order.address && (
              <div className="bg-[#FAFAFA] border border-[#B6925B]/10 p-4 text-sm text-gray-700 mt-4">
                <span className="block text-xs font-bold uppercase tracking-widest text-[#B6925B] mb-2">Delivering to</span>
                {order.address.addressLine1}, {order.address.city}, {order.address.state} {order.address.postalCode},{" "}
                {order.address.country}
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/account/orders"
            className="px-8 py-3 bg-white border border-[#B6925B] text-[#B6925B] hover:bg-[#FDFBF7] text-xs font-bold uppercase tracking-widest transition-colors"
          >
            View My Orders
          </Link>
          <Link
            href="/collections"
            className="px-8 py-3 bg-[#B6925B] border border-[#B6925B] hover:bg-[#9c7d4e] text-white text-xs font-bold uppercase tracking-widest transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}