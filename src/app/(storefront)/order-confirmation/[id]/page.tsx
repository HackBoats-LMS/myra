import { prisma } from "@/lib/db/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
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
      <div className="max-w-3xl mx-auto px-6 py-10 md:py-24 text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-50 border border-green-200 text-green-700 flex items-center justify-center text-3xl">
          ✓
        </div>
        <h1 className="text-3xl md:text-4xl font-serif text-[#2D1F2F] tracking-wide mb-3">Thank you, your order is confirmed!</h1>
        <p className="text-gray-500 mb-8">
          Order <span className="font-mono text-[#7A0B2E] font-bold">#{order.id.split("-")[0].toUpperCase()}</span> has been placed. A
          confirmation email is on its way.
        </p>

        <div className="bg-white border border-[#7A0B2E]/20 shadow-sm text-left">
          <div className="px-6 py-5 border-b border-[#7A0B2E]/20 flex items-center justify-between">
            <span className="text-sm font-bold uppercase tracking-widest text-[#2D1F2F]">Order Summary</span>
            <span className="text-xs text-gray-500">
              {new Date(order.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}
            </span>
          </div>

          <div className="p-6 space-y-4">
            <ul className="divide-y divide-[#7A0B2E]/10">
              {order.orderItems.map((item) => (
                <li key={item.id} className="flex items-center justify-between py-3">
                  <span className="text-sm text-[#2D1F2F]">
                    {item.product.name} <span className="text-gray-400">× {item.quantity}</span>
                  </span>
                  <span className="text-sm font-bold text-[#2D1F2F]">Rs. {item.price.toLocaleString('en-IN')}</span>
                </li>
              ))}
            </ul>

            {order.discountAmount > 0 && (
              <div className="flex justify-between text-green-700 text-sm">
                <span>Discount{order.couponCode ? ` (${order.couponCode})` : ""}</span>
                <span>-Rs. {order.discountAmount.toLocaleString('en-IN')}</span>
              </div>
            )}
            {order.shippingAmount > 0 ? (
              <div className="flex justify-between text-sm text-gray-600">
                <span>Shipping</span>
                <span>Rs. {order.shippingAmount.toLocaleString('en-IN')}</span>
              </div>
            ) : (
              <div className="flex justify-between text-sm text-green-700">
                <span>Shipping</span>
                <span className="text-[10px] font-bold uppercase tracking-widest">Free</span>
              </div>
            )}

            <div className="flex justify-between pt-4 border-t border-[#7A0B2E]/20">
              <span className="text-sm font-bold text-[#2D1F2F]">
                Total ({order.paymentMethod === "RAZORPAY" ? "Paid Online" : "Cash on Delivery"})
              </span>
              <span className="text-lg font-black text-[#2D1F2F]">Rs. {order.totalAmount.toLocaleString('en-IN')}</span>
            </div>

            {order.giftName ? (
              <div className="bg-[#FAFAFA] border border-[#7A0B2E]/10 p-4 text-sm text-gray-700 mt-4 space-y-1">
                <span className="block text-xs font-bold uppercase tracking-widest text-[#7A0B2E] mb-1">Gift — Delivering to</span>
                <p><span className="font-bold text-[#2D1F2F]">{order.giftName}</span></p>
                {order.giftPhone && <p className="font-mono">Phone: {order.giftPhone}</p>}
                <p>{order.giftAddressLine1}, {order.giftCity}, {order.giftState} {order.giftPostalCode}, {order.giftCountry}</p>
              </div>
            ) : order.address && (
              <div className="bg-[#FAFAFA] border border-[#7A0B2E]/10 p-4 text-sm text-gray-700 mt-4">
                <span className="block text-xs font-bold uppercase tracking-widest text-[#7A0B2E] mb-2">Delivering to</span>
                {order.address.addressLine1}, {order.address.city}, {order.address.state} {order.address.postalCode},{" "}
                {order.address.country}
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/account/orders"
            className="px-8 py-3 bg-white border border-[#7A0B2E] text-[#7A0B2E] hover:bg-[#FAF0F2] text-xs font-bold uppercase tracking-widest transition-colors"
          >
            View My Orders
          </Link>
          <Link
            href="/collections"
            className="px-8 py-3 bg-[#7A0B2E] border border-[#7A0B2E] hover:bg-[#5C0820] text-white text-xs font-bold uppercase tracking-widest transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}