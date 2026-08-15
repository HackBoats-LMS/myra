import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import ShipOrderButton from "@/components/admin/ShipOrderButton";
import { requireWorkerModule } from "@/lib/worker";

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
      <Link href="/worker/orders" className="inline-flex items-center text-[10px] font-bold uppercase tracking-widest text-[#B6925B] hover:text-[#4A3B2C] transition-colors rounded-none gap-1">
        <i className="ri-arrow-left-line text-xs" />
        Back to Shipping
      </Link>

      <div className="flex items-center justify-between border-b border-[#B6925B]/20 pb-6">
        <div>
          <h2 className="text-3xl font-serif text-[#4A3B2C] tracking-wide">Order #{order.id.split("-")[0]}</h2>
          <p className="text-[10px] text-[#B6925B] uppercase tracking-widest font-bold mt-1">Placed on {new Date(order.createdAt).toLocaleDateString()}</p>
        </div>
        <div className="flex items-center gap-3">
          <ShipOrderButton orderId={order.id} shipped={Boolean(order.shipmentId)} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Shipping info */}
        <div className="space-y-6">
          <div className="bg-white p-6 border border-[#B6925B]/20 shadow-sm space-y-2">
            <h3 className="font-serif text-lg text-[#4A3B2C] border-b border-[#B6925B]/20 pb-2">Delivery Address</h3>
            <div className="text-[10px] uppercase tracking-widest font-bold text-gray-500 space-y-1 pt-1">
              {order.giftName ? (
                <>
                  <p><span className="text-[#4A3B2C]">Recipient:</span> {order.giftName}</p>
                  <p><span className="text-[#4A3B2C]">Phone:</span> {order.giftPhone || "N/A"}</p>
                  <p className="normal-case tracking-normal text-[11px]">
                    {order.giftAddressLine1}, {order.giftCity}, {order.giftState} {order.giftPostalCode}, {order.giftCountry}
                  </p>
                </>
              ) : order.address ? (
                <>
                  <p><span className="text-[#4A3B2C]">Name:</span> {order.user.name || "N/A"}</p>
                  {order.address.phone && <p><span className="text-[#4A3B2C]">Phone:</span> {order.address.phone}</p>}
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

          <div className="bg-white p-6 border border-[#B6925B]/20 shadow-sm space-y-2">
            <h3 className="font-serif text-lg text-[#4A3B2C] border-b border-[#B6925B]/20 pb-2">Shipment / Tracking</h3>
            <div className="text-[10px] uppercase tracking-widest font-bold text-gray-500 space-y-1 pt-1">
              <p><span className="text-[#4A3B2C]">Status:</span> {order.status.replace(/_/g, " ")}</p>
              <p><span className="text-[#4A3B2C]">AWB:</span> {order.awbNumber || "Not assigned"}</p>
              {order.courierName && <p><span className="text-[#4A3B2C]">Courier:</span> {order.courierName}</p>}
              {order.trackingUrl && (
                <p>
                  <a
                    href={order.trackingUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#B6925B] hover:text-[#4A3B2C] underline underline-offset-2 normal-case tracking-normal text-[11px]"
                  >
                    Track on Shiprocket <i className="ri-external-link-line text-xs align-middle" />
                  </a>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Order summary */}
        <div className="md:col-span-2 bg-white border border-[#B6925B]/20 shadow-sm overflow-hidden">
          <h3 className="font-serif text-lg text-[#4A3B2C] border-b border-[#B6925B]/20 p-6 pb-4">Order Items</h3>
          <div className="divide-y divide-[#B6925B]/10">
            {order.orderItems.map((item) => (
              <div key={item.id} className="p-6 flex items-center gap-4">
                <div className="relative w-16 h-24 bg-[#FAFAFA] border border-[#B6925B]/20 overflow-hidden flex-shrink-0">
                  {item.product.images[0] && (
                    <Image src={item.product.images[0]} alt={item.product.name} fill className="object-cover" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-[#4A3B2C] text-sm">{item.product.name}</p>
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mt-1">Qty: {item.quantity}</p>
                </div>
                <div className="font-bold text-[#B6925B] text-sm">₹{(item.price * item.quantity).toFixed(2)}</div>
              </div>
            ))}
          </div>
          <div className="bg-[#FAFAFA] p-6 flex justify-between items-center border-t border-[#B6925B]/20">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#4A3B2C]">Total Amount</span>
            <span className="text-xl font-serif text-[#4A3B2C]">₹{order.totalAmount.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}