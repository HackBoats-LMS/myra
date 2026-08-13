import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
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
    <div className="max-w-4xl mx-auto px-4 md:px-8 py-12 md:py-16 min-h-screen space-y-6">
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

      <Link href="/account" className="inline-flex items-center text-[10px] font-bold uppercase tracking-widest text-[#B6925B] hover:text-[#4A3B2C] transition-colors print:hidden gap-1 rounded-none">
        <i className="ri-arrow-left-line text-sm" />
        Back to Account
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#B6925B]/20 pb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-serif text-[#4A3B2C] tracking-wide">Order Details</h1>
          <p className="text-[10px] text-[#B6925B] uppercase tracking-widest font-bold mt-1">Placed on {new Date(order.createdAt).toLocaleDateString("en-IN", {
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
        <div className="md:col-span-2 bg-white border border-[#B6925B]/20 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-[#B6925B]/20 bg-[#FAFAFA]">
            <h3 className="font-serif text-[#4A3B2C] text-lg tracking-wide">Items in Order</h3>
          </div>
          <div className="divide-y divide-[#B6925B]/10">
            {order.orderItems.map((item: OrderItemWithProduct) => (
              <div key={item.id} className="p-6 flex items-center gap-4">
                <Link href={`/products/${item.product.slug}`} className="relative w-20 h-28 bg-[#FAFAFA] overflow-hidden flex-shrink-0 border border-[#B6925B]/20 hover:opacity-90 transition-opacity">
                  {item.product.images[0] && (
                    <Image src={item.product.images[0]} alt={item.product.name} fill className="object-cover" />
                  )}
                </Link>
                <div className="flex-1">
                  <Link href={`/products/${item.product.slug}`} className="hover:underline underline-offset-4">
                    <h4 className="font-bold text-[#4A3B2C] text-sm">{item.product.name}</h4>
                  </Link>
                  <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mt-1">Qty: {item.quantity}</p>
                </div>
                <div className="text-sm font-bold text-[#B6925B]">
                  ₹{(item.price * item.quantity).toFixed(2)}
                </div>
              </div>
            ))}
          </div>

          <div className="bg-[#FAFAFA] p-6 flex justify-between items-center border-t border-[#B6925B]/20">
            <span className="font-bold text-[#4A3B2C] text-[10px] uppercase tracking-widest">Total Paid</span>
            <span className="text-xl font-serif text-[#4A3B2C]">₹{order.totalAmount.toFixed(2)}</span>
          </div>
        </div>

        {/* Right Column: Status & Shipping */}
        <div className="space-y-6">
          {/* Order Info */}
          <div className="bg-white p-6 border border-[#B6925B]/20 shadow-sm space-y-4">
            <div>
              <span className="block text-[10px] font-bold text-[#B6925B] uppercase tracking-widest mb-2">Status</span>
              <span className={`inline-flex items-center px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest
                ${order.status === 'DELIVERED' ? 'bg-[#FAFAFA] text-[#4A3B2C] border border-[#B6925B]/30' : 
                  order.status === 'SHIPPED' ? 'bg-[#FAFAFA] text-[#B6925B] border border-[#B6925B]/30' : 
                  order.status === 'CANCELLED' ? 'bg-red-50 text-red-700 border border-red-200' : 
                  'bg-[#FAFAFA] text-[#4A3B2C] border border-[#B6925B]/30'}`}>
                {order.status}
              </span>
            </div>
            <div>
              <span className="block text-[10px] font-bold text-[#B6925B] uppercase tracking-widest mb-1">Order ID</span>
              <span className="text-sm font-mono text-[#4A3B2C]">{order.id}</span>
            </div>
            <div>
              <span className="block text-[10px] font-bold text-[#B6925B] uppercase tracking-widest mb-1">Payment Method</span>
              <span className="text-sm font-bold text-[#4A3B2C]">Cash on Delivery</span>
            </div>
          </div>

          {/* Delivery Address */}
          <div className="bg-white p-6 border border-[#B6925B]/20 shadow-sm space-y-4">
            <h3 className="font-serif text-[#4A3B2C] text-lg tracking-wide border-b border-[#B6925B]/20 pb-3">Delivery Address</h3>
            <div className="text-[10px] uppercase tracking-widest font-bold text-gray-500 space-y-2 leading-relaxed pt-1">
              <p className="font-bold text-[#4A3B2C] text-sm tracking-normal capitalize mb-2">{order.user.name}</p>
              {order.address ? (
                <>
                  <p className="text-[8px] font-bold text-[#B6925B] uppercase tracking-widest mb-1">({order.address.label} Address)</p>
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
                <p className="mt-4 text-[#4A3B2C] font-mono tracking-normal">Phone: {order.user.phoneNumber}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
