import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import CancelOrderButton from "@/components/storefront/CancelOrderButton";
import PrintInvoiceButton from "@/components/admin/PrintInvoiceButton";
import type { Metadata } from "next";
import type { Prisma } from "@/generated/prisma";

type OrderItemWithProduct = Prisma.OrderItemGetPayload<{
  include: { product: true };
}>;

export const metadata: Metadata = {
  title: "Order Details | Myra Shopping Mall",
};

export default async function CustomerOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.id) {
    redirect("/login");
  }

  const { id } = await params;
  const userId = session.user.id;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      user: true,
      address: true,
      orderItems: {
        include: {
          product: true,
        },
      },
    },
  });

  if (!order || order.userId !== userId) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto px-8 py-16 min-h-screen space-y-6">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          /* Hide storefront header, mobile menus, footers, buttons */
          nav, header, footer, .print\\:hidden, button, select, a {
            display: none !important;
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

      <Link href="/account" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 transition-colors print:hidden">
        <ArrowLeftIcon className="w-4 h-4 mr-1" />
        Back to Account
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Order Details</h1>
          <p className="text-sm text-gray-500 mt-1">Placed on {new Date(order.createdAt).toLocaleDateString("en-IN", {
            year: "numeric",
            month: "long",
            day: "numeric"
          })}</p>
        </div>

        <div className="flex items-center gap-3">
          <PrintInvoiceButton />
          {order.status === "PENDING" && (
            <CancelOrderButton orderId={order.id} />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Items */}
        <div className="md:col-span-2 bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wider">Items in Order</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {order.orderItems.map((item: OrderItemWithProduct) => (
              <div key={item.id} className="p-6 flex items-center gap-4">
                <div className="relative w-16 h-20 bg-gray-50 rounded overflow-hidden flex-shrink-0 border border-gray-100">
                  {item.product.images[0] && (
                    <Image src={item.product.images[0]} alt={item.product.name} fill className="object-cover" />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 text-sm">{item.product.name}</h4>
                  <p className="text-xs text-gray-500 mt-1">Qty: {item.quantity}</p>
                </div>
                <div className="text-sm font-semibold text-gray-900">
                  ₹{(item.price * item.quantity).toFixed(2)}
                </div>
              </div>
            ))}
          </div>

          <div className="bg-gray-50 p-6 flex justify-between items-center border-t border-gray-100">
            <span className="font-semibold text-gray-900 text-sm uppercase tracking-wider">Total Paid</span>
            <span className="text-xl font-black text-[#0D3B66]">₹{order.totalAmount.toFixed(2)}</span>
          </div>
        </div>

        {/* Right Column: Status & Shipping */}
        <div className="space-y-6">
          {/* Order Info */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm space-y-4">
            <div>
              <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Status</span>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                ${order.status === 'DELIVERED' ? 'bg-green-50 text-green-700 border border-green-100' : 
                  order.status === 'SHIPPED' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 
                  order.status === 'CANCELLED' ? 'bg-red-50 text-red-700 border border-red-100' : 
                  'bg-yellow-50 text-yellow-700 border border-yellow-100'}`}>
                {order.status}
              </span>
            </div>
            <div>
              <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Order ID</span>
              <span className="text-sm font-mono text-gray-700">{order.id}</span>
            </div>
            <div>
              <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Payment Method</span>
              <span className="text-sm font-medium text-gray-700">Cash on Delivery</span>
            </div>
          </div>

          {/* Delivery Address */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm space-y-4">
            <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wider border-b border-gray-100 pb-2">Delivery Address</h3>
            <div className="text-xs text-gray-600 space-y-1.5 leading-relaxed">
              <p className="font-semibold text-gray-900 text-sm mb-1">{order.user.name}</p>
              {order.address ? (
                <>
                  <p className="text-[10px] font-bold text-[#0D3B66] uppercase tracking-wider mb-1">({order.address.label} Address)</p>
                  <p>{order.address.addressLine1}</p>
                  <p>{order.address.city}, {order.address.state} - {order.address.postalCode}</p>
                  <p className="capitalize">{order.address.country}</p>
                </>
              ) : (
                <>
                  <p>{order.user.addressLine1 || "No address provided"}</p>
                  <p>{order.user.city}, {order.user.state} - {order.user.postalCode}</p>
                  <p className="capitalize">{order.user.country}</p>
                </>
              )}
              {order.user.phoneNumber && (
                <p className="mt-2 text-gray-900 font-medium font-mono">Phone: {order.user.phoneNumber}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
