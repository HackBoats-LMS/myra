import { prisma } from "@/lib/db/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import AdminReturnProcessor from "@/app/(admin)/admin/returns/_components/AdminReturnProcessor";
import { createReturnImageSignedUrls } from "@/lib/return-images";
import { ExternalLink } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminReturnDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const request = await prisma.returnRequest.findUnique({
    where: { id },
    include: {
      user: true,
      order: true,
      orderItem: {
        include: { product: true },
      },
    },
  });

  if (!request) {
    notFound();
  }

  const returnImageUrls = await createReturnImageSignedUrls(request.images);

  return (
    <div className="max-w-4xl mx-auto space-y-6 rounded-none">


      <div className="border-b border-[#7A0B2E]/20 pb-4 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-serif font-bold text-[#2D1F2F] tracking-wide">
            {request.type} Request
          </h2>
          <p className="text-[10px] text-[#7A0B2E] uppercase tracking-widest font-bold mt-1">
            Requested on {new Date(request.requestedAt).toLocaleDateString()}
          </p>
        </div>
        <span className={`inline-flex items-center px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest border rounded-none
          ${request.status === 'REFUNDED' || request.status === 'REPLACED' ? 'bg-green-50 text-green-700 border-green-200' :
            request.status === 'REJECTED' || request.status === 'CANCELLED' ? 'bg-red-50 text-red-700 border-red-200' :
            request.status === 'PICKED_UP' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
            request.status === 'APPROVED' ? 'bg-blue-50 text-blue-700 border-blue-200' :
            'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
          {request.status.replace(/_/g, " ")}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white border border-[#7A0B2E]/20 shadow-sm p-6 space-y-4">
            <h3 className="font-serif text-lg text-[#2D1F2F] border-b border-[#7A0B2E]/20 pb-2">Requested Item</h3>
            <div className="text-[10px] uppercase tracking-widest font-bold text-gray-500 space-y-2">
              <p><span className="text-[#2D1F2F]">Product:</span> <span className="normal-case tracking-normal">{request.orderItem.product.name}</span></p>
              <p><span className="text-[#2D1F2F]">Quantity:</span> {request.orderItem.quantity}</p>
              <p><span className="text-[#2D1F2F]">Line Total:</span> ₹{(request.orderItem.price * request.orderItem.quantity).toFixed(2)}</p>
              <p><span className="text-[#2D1F2F]">Reason:</span> <span className="normal-case tracking-normal">{request.reason}</span></p>
            </div>
            {request.images.length > 0 && (
              <div>
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#7A0B2E] mb-2">Customer Photos ({request.images.length})</h4>
                <div className="grid grid-cols-3 gap-3">
                  {returnImageUrls.map((src, idx) => (
                    <div key={src} className="relative aspect-square border border-[#7A0B2E]/20 overflow-hidden rounded-none">
                      <Image src={src} alt={`Return photo ${idx + 1}`} fill className="object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bg-white border border-[#7A0B2E]/20 shadow-sm p-6 space-y-4">
            <h3 className="font-serif text-lg text-[#2D1F2F] border-b border-[#7A0B2E]/20 pb-2">Customer</h3>
            <div className="text-[10px] uppercase tracking-widest font-bold text-gray-500 space-y-2">
              <p><span className="text-[#2D1F2F]">Name:</span> {request.user.name || "N/A"}</p>
              <p><span className="text-[#2D1F2F]">Email:</span> {request.user.email || "N/A"}</p>
              <p><span className="text-[#2D1F2F]">Phone:</span> {request.user.phoneNumber || "N/A"}</p>
            </div>
            <Link
              href={`/admin/orders/${request.orderId}`}
              className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#7A0B2E] hover:text-[#2D1F2F] transition-colors"
            >
              View Original Order <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>

          {request.adminNote && (
            <div className="bg-[#F5EFE6] border border-[#7A0B2E]/20 p-6">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#7A0B2E] mb-2">Admin Note</h4>
              <p className="text-sm text-[#2D1F2F]">{request.adminNote}</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <AdminReturnProcessor
            request={{
              id: request.id,
              status: request.status,
              type: request.type,
              adminNote: request.adminNote,
              order: { id: request.order.id, totalAmount: request.order.totalAmount, refundedAmount: request.order.refundedAmount },
              orderItem: { quantity: request.orderItem.quantity, price: request.orderItem.price },
              shipmentId: request.shipmentId,
              awbNumber: request.awbNumber,
              reversePickupScheduledAt: request.reversePickupScheduledAt,
            }}
          />
        </div>
      </div>
    </div>
  );
}