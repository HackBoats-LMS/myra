import { prisma } from "@/lib/db/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import MarkAsPackedButton from "@/components/shared/MarkAsPackedButton";
import ShipOrderButton from "@/components/shared/ShipOrderButton";
import { requireWorkerModule } from "@/lib/worker";
import { ExternalLink } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function WorkerOrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  await requireWorkerModule("shipping");
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      user: true,
      address: true,
      orderItems: { include: { product: true } },
    },
  });

  if (!order) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 rounded-none">


      <div className="flex items-center justify-between border-b border-[#7A0B2E]/20 pb-6">
        <div>
          <h2 className="text-3xl font-serif text-[#2D1F2F] tracking-wide">Order #{order.id.split("-")[0]}</h2>
          <p className="text-[10px] text-[#7A0B2E] uppercase tracking-widest font-bold mt-1">Placed on {new Date(order.createdAt).toLocaleDateString()}</p>
        </div>
        <div className="flex items-center gap-3">
          {order.status === "PENDING" && <MarkAsPackedButton orderId={order.id} />}
          {(order.status === "READY_TO_SHIP" || order.shipmentId) && (
            <ShipOrderButton orderId={order.id} shipped={Boolean(order.shipmentId)} />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Shipping info */}
        <div className="space-y-6">
          <div className="bg-white p-6 border border-[#7A0B2E]/20 shadow-sm space-y-2">
            <h3 className="font-serif text-lg text-[#2D1F2F] border-b border-[#7A0B2E]/20 pb-2">Delivery Address</h3>
            <div className="text-[10px] uppercase tracking-widest font-bold text-gray-500 space-y-1 pt-1">
              {order.giftName ? (
                <>
                  <p><span className="text-[#2D1F2F]">Recipient:</span> {order.giftName}</p>
                  <p><span className="text-[#2D1F2F]">Phone:</span> {order.giftPhone || "N/A"}</p>
                  <p className="normal-case tracking-normal text-[11px]">
                    {order.giftAddressLine1}, {order.giftCity}, {order.giftState} {order.giftPostalCode}, {order.giftCountry}
                  </p>
                </>
              ) : order.address ? (
                <>
                  <p><span className="text-[#2D1F2F]">Name:</span> {order.user.name || "N/A"}</p>
                  {order.address.phone && <p><span className="text-[#2D1F2F]">Phone:</span> {order.address.phone}</p>}
                  <p className="normal-case tracking-normal text-[11px]">
                    {order.address.addressLine1}, {order.address.city}, {order.address.state} {order.address.postalCode},{" "}
                    {order.address.country}
                  </p>
                </>
              ) : (
                <p>No delivery address on file.</p>
              )}
            </div>
          </div>

          <div className="bg-white p-6 border border-[#7A0B2E]/20 shadow-sm space-y-2">
            <h3 className="font-serif text-lg text-[#2D1F2F] border-b border-[#7A0B2E]/20 pb-2">Shipment / Tracking</h3>
            <div className="text-[10px] uppercase tracking-widest font-bold text-gray-500 space-y-1 pt-1">
              <p><span className="text-[#2D1F2F]">Status:</span> {order.status.replace(/_/g, " ")}</p>
              <p><span className="text-[#2D1F2F]">AWB:</span> {order.awbNumber || "Not assigned"}</p>
              {order.courierName && <p><span className="text-[#2D1F2F]">Courier:</span> {order.courierName}</p>}
              {order.trackingUrl && (
                <p>
                  <a
                    href={order.trackingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#7A0B2E] hover:text-[#2D1F2F] underline underline-offset-2 normal-case tracking-normal text-[11px] inline-flex items-center gap-1"
                  >
                    Track on Shiprocket <ExternalLink className="w-3.5 h-3.5 inline" />
                  </a>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Order summary */}
        <div className="md:col-span-2 bg-white border border-[#7A0B2E]/20 shadow-sm overflow-hidden">
          <h3 className="font-serif text-lg text-[#2D1F2F] border-b border-[#7A0B2E]/20 p-6 pb-4">Order Items</h3>
          <div className="divide-y divide-[#7A0B2E]/10">
            {order.orderItems.map((item) => (
              <div key={item.id} className="p-6 flex items-center gap-4">
                <div className="relative w-16 h-24 bg-[#FAFAFA] border border-[#7A0B2E]/20 overflow-hidden flex-shrink-0">
                  {item.product.images[0] && (
                    <Image src={item.product.images[0]} alt={item.product.name} fill className="object-cover" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-[#2D1F2F] text-sm">{item.product.name}</p>
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mt-1">Qty: {item.quantity}</p>
                </div>
                <div className="font-bold text-[#7A0B2E] text-sm">₹{(item.price * item.quantity).toFixed(2)}</div>
              </div>
            ))}
          </div>
          <div className="bg-[#FAFAFA] p-6 flex justify-between items-center border-t border-[#7A0B2E]/20">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#2D1F2F]">Total Amount</span>
            <span className="text-xl font-serif text-[#2D1F2F]">₹{order.totalAmount.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}