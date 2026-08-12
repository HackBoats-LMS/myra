import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import OrderStatusSelect from "@/components/admin/OrderStatusSelect";
import PrintInvoiceButton from "@/components/admin/PrintInvoiceButton";
import OrderInternalNotes from "@/components/admin/OrderInternalNotes";
import RefundButton from "@/components/admin/RefundButton";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

export default async function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      user: true,
      orderItems: {
        include: {
          product: true
        }
      }
    }
  });

  if (!order) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
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

      <Link href="/admin/orders" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 transition-colors print:hidden">
        <ArrowLeftIcon className="w-4 h-4 mr-1" />
        Back to Orders
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Order #{order.id.split('-')[0]}</h2>
          <p className="text-sm text-gray-500 mt-1">Placed on {new Date(order.createdAt).toLocaleDateString()}</p>
        </div>
        <div className="flex items-center gap-3">
          <PrintInvoiceButton />
          <div className="flex items-center gap-3 print:hidden">
            <span className="text-sm font-medium text-gray-700">Update Status:</span>
            <OrderStatusSelect orderId={order.id} currentStatus={order.status} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Customer Details */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-4">
            <h3 className="font-semibold text-gray-900 border-b border-gray-100 pb-2">Customer Details</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p><span className="font-medium">Name:</span> {order.user.name || 'N/A'}</p>
              <p><span className="font-medium">Email:</span> {order.user.email || 'N/A'}</p>
              <p><span className="font-medium">Phone:</span> {order.user.phoneNumber || 'N/A'}</p>
            </div>
          </div>
          
          <OrderInternalNotes orderId={order.id} initialNotes={order.internalNotes} />
        </div>

        {/* Order Summary */}
        <div className="md:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <h3 className="font-semibold text-gray-900 border-b border-gray-100 p-6 pb-4">Order Items</h3>
          
          <div className="divide-y divide-gray-100">
            {order.orderItems.map((item) => (
              <div key={item.id} className="p-6 flex items-center gap-4">
                <div className="relative w-16 h-16 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                  {item.product.images[0] && (
                    <Image src={item.product.images[0]} alt={item.product.name} fill className="object-cover" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 text-sm">{item.product.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Qty: {item.quantity}</p>
                </div>
                <div className="font-medium text-gray-900 text-sm">
                  ₹{(item.price * item.quantity).toFixed(2)}
                </div>
              </div>
            ))}
          </div>

          <div className="bg-gray-50 p-6 flex flex-col gap-2 border-t border-gray-100">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-gray-900">Total Amount</span>
              <span className="text-lg font-bold text-[#0D3B66]">₹{order.totalAmount.toFixed(2)}</span>
            </div>
            
            {order.refundedAmount > 0 && (
              <div className="flex justify-between items-center text-red-600">
                <span className="font-medium text-sm">Refunded</span>
                <span className="font-semibold">-₹{order.refundedAmount.toFixed(2)}</span>
              </div>
            )}
            
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
              <RefundButton orderId={order.id} totalAmount={order.totalAmount} refundedAmount={order.refundedAmount || 0} />
              
              {order.refundedAmount > 0 && (
                <div className="text-right">
                  <span className="text-xs text-gray-500 block">Net Total</span>
                  <span className="text-sm font-bold text-gray-900">₹{(order.totalAmount - order.refundedAmount).toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
