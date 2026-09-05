import { prisma } from "@/lib/db/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import OrderTrackingTimeline from "@/components/shared/OrderTrackingTimeline";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Order Tracking | Myra Shopping Mall" };

export default async function PublicTrackOrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ email?: string }>;
}) {
  const { orderId } = await params;
  const { email } = await searchParams;

  if (!email || !email.trim()) {
    notFound();
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: { select: { email: true } },
      address: true,
      orderItems: { include: { product: true } },
    },
  });

  if (!order) {
    notFound();
  }

  if (email.trim().toLowerCase() !== (order.user?.email || "").toLowerCase()) {
    notFound();
  }

  const total = order.totalAmount;
  const isCancelled = order.status === "CANCELLED";

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-6">
      <div className="flex items-center justify-between border-b border-[#7A0B2E]/20 pb-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-[#2D1F2F] tracking-wide">Order #{order.id.split("-")[0].toUpperCase()}</h1>
          <p className="text-[10px] text-[#7A0B2E] uppercase tracking-widest font-bold mt-1">
            Status: {order.status.replace(/_/g, " ")}
          </p>
        </div>
        <Link href="/track" className="text-[10px] font-bold uppercase tracking-widest text-[#7A0B2E] hover:text-[#2D1F2F]">
          Track another
        </Link>
      </div>

      <OrderTrackingTimeline status={order.status} order={order as unknown as Record<string, unknown>} />

      {order.awbNumber && (
        <div className="bg-[#F5EFE6] border border-[#7A0B2E]/20 p-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Tracking / AWB Number</p>
            <p className="font-mono text-sm text-[#2D1F2F] font-bold">{order.awbNumber}</p>
          </div>
          {order.trackingUrl && (
            <a
              href={order.trackingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 bg-[#7A0B2E] hover:bg-[#5C0820] text-white px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest rounded-none transition-colors"
            >
              <i className="ri-truck-line text-sm" />
              Track with Carrier
            </a>
          )}
        </div>
      )}

      {!isCancelled && (
        <div className="bg-white border border-[#7A0B2E]/20 shadow-sm">
          <h3 className="font-serif text-lg text-[#2D1F2F] border-b border-[#7A0B2E]/20 p-4">Items</h3>
          <div className="divide-y divide-[#7A0B2E]/10">
            {order.orderItems.map((item) => (
              <div key={item.id} className="flex items-center gap-4 p-4">
                <div className="relative w-14 h-14 border border-[#7A0B2E]/20 overflow-hidden rounded-none bg-[#F5EFE6] shrink-0">
                  {item.product.images[0] ? (
                    <Image src={item.product.images[0]} alt={item.product.name} fill className="object-cover" />
                  ) : (
                    <span className="flex items-center justify-center w-full h-full text-gray-300 text-xs">NA</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <Link href={`/products/${item.product.slug}`} className="text-sm font-bold text-[#2D1F2F] hover:text-[#7A0B2E] line-clamp-1">
                    {item.product.name}
                  </Link>
                  <p className="text-[10px] text-gray-500">Qty: {item.quantity}</p>
                </div>
                <span className="text-sm font-bold text-[#1a1a1a]">₹{(item.price * item.quantity).toLocaleString("en-IN")}</span>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-[#7A0B2E]/20 flex justify-end">
            <span className="text-sm font-bold text-[#2D1F2F]">Total: ₹{total.toLocaleString("en-IN")}</span>
          </div>
        </div>
      )}

      <p className="text-center text-xs text-gray-400">
        Need help? <Link href="/contact" className="text-[#7A0B2E] hover:underline">Contact us</Link>
      </p>
    </div>
  );
}