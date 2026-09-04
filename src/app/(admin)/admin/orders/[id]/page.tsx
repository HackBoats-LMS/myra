import { prisma } from "@/lib/db/prisma";
import { notFound } from "next/navigation";
import OrderInternalNotes from "@/app/(admin)/admin/orders/_components/OrderInternalNotes";
import AdminOrderHeader from "@/app/(admin)/admin/orders/[id]/_components/AdminOrderHeader";
import AdminOrderCustomerDetails from "@/app/(admin)/admin/orders/[id]/_components/AdminOrderCustomerDetails";
import AdminOrderStatus from "@/app/(admin)/admin/orders/[id]/_components/AdminOrderStatus";
import AdminOrderItems from "@/app/(admin)/admin/orders/[id]/_components/AdminOrderItems";

export default async function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      user: true,
      address: true,
      orderItems: {
        include: {
          product: true,
          variant: true,
        }
      }
    }
  });

  if (!order) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 rounded-none">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          /* Hide sidebar, header, buttons and dropdowns */
          aside, header, .print\\:hidden, button, select, a {
            display: none !important;
          }
          /* Adjust container margins */
          .flex-1.ml-64 {
            margin-left: 0 !important;
            padding: 0 !important;
          }
          main {
            padding: 0 !important;
          }
          .shadow-sm, .border {
            box-shadow: none !important;
            border: none !important;
          }
        }
      `}} />

      <AdminOrderHeader 
        orderId={order.id} 
        createdAt={order.createdAt} 
        shipmentId={order.shipmentId} 
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Customer & Shipping Details */}
        <div className="space-y-6">
          <AdminOrderCustomerDetails order={order} />

          <AdminOrderStatus 
            status={order.status} 
            awbNumber={order.awbNumber} 
            courierName={order.courierName} 
            trackingUrl={order.trackingUrl} 
          />

          <OrderInternalNotes orderId={order.id} initialNotes={order.internalNotes} />
        </div>

        {/* Order Items */}
        <AdminOrderItems 
          orderId={order.id} 
          orderItems={order.orderItems} 
          totalAmount={order.totalAmount} 
          refundedAmount={order.refundedAmount || 0} 
          orderStatus={order.status}
          paymentStatus={order.paymentStatus}
        />
      </div>
    </div>
  );
}
