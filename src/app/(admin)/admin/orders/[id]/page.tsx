import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import OrderStatusSelect from "@/components/admin/OrderStatusSelect";
import PrintInvoiceButton from "@/components/admin/PrintInvoiceButton";
import OrderInternalNotes from "@/components/admin/OrderInternalNotes";
import RefundButton from "@/components/admin/RefundButton";
import Image from "next/image";
import Link from "next/link";

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

      <Link href="/admin/orders" className="inline-flex items-center text-[10px] font-bold uppercase tracking-widest text-[#B6925B] hover:text-[#4A3B2C] transition-colors print:hidden rounded-none gap-1">
        <i className="ri-arrow-left-line text-xs" />
        Back to Orders
      </Link>

      <div className="flex items-center justify-between border-b border-[#B6925B]/20 pb-6">
        <div>
          <h2 className="text-3xl font-serif text-[#4A3B2C] tracking-wide">Order #{order.id.split('-')[0]}</h2>
          <p className="text-[10px] text-[#B6925B] uppercase tracking-widest font-bold mt-1">Placed on {new Date(order.createdAt).toLocaleDateString()}</p>
        </div>
        <div className="flex items-center gap-3">
          <PrintInvoiceButton />
          <div className="flex items-center gap-3 print:hidden">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#4A3B2C]">Update Status:</span>
            <OrderStatusSelect orderId={order.id} currentStatus={order.status} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Customer Details */}
        <div className="space-y-6">
          <div className="bg-white p-6 border border-[#B6925B]/20 shadow-sm space-y-4">
            <h3 className="font-serif text-lg text-[#4A3B2C] border-b border-[#B6925B]/20 pb-2">Customer Details</h3>
            <div className="text-[10px] uppercase tracking-widest font-bold text-gray-500 space-y-3 pt-1">
              <p><span className="text-[#4A3B2C]">Name:</span> {order.user.name || 'N/A'}</p>
              <p><span className="text-[#4A3B2C]">Email:</span> {order.user.email || 'N/A'}</p>
              <p><span className="text-[#4A3B2C]">Phone:</span> {order.user.phoneNumber || 'N/A'}</p>
            </div>
          </div>
          
          <OrderInternalNotes orderId={order.id} initialNotes={order.internalNotes} />
        </div>

        {/* Order Summary */}
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
                <div className="font-bold text-[#B6925B] text-sm">
                  ₹{(item.price * item.quantity).toFixed(2)}
                </div>
              </div>
            ))}
          </div>

          <div className="bg-[#FAFAFA] p-6 flex flex-col gap-2 border-t border-[#B6925B]/20">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#4A3B2C]">Total Amount</span>
              <span className="text-xl font-serif text-[#4A3B2C]">₹{order.totalAmount.toFixed(2)}</span>
            </div>
            
            {order.refundedAmount > 0 && (
              <div className="flex justify-between items-center text-red-600">
                <span className="text-[10px] font-bold uppercase tracking-widest">Refunded</span>
                <span className="font-bold">-₹{order.refundedAmount.toFixed(2)}</span>
              </div>
            )}
            
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-[#B6925B]/10">
              <RefundButton orderId={order.id} totalAmount={order.totalAmount} refundedAmount={order.refundedAmount || 0} />
              
              {order.refundedAmount > 0 && (
                <div className="text-right">
                  <span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold block">Net Total</span>
                  <span className="text-sm font-bold text-[#4A3B2C]">₹{(order.totalAmount - order.refundedAmount).toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
