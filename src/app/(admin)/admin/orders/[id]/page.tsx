import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import OrderStatusSelect from "@/components/admin/OrderStatusSelect";
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
      <Link href="/admin/orders" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 transition-colors">
        <ArrowLeftIcon className="w-4 h-4 mr-1" />
        Back to Orders
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Order #{order.id.split('-')[0]}</h2>
          <p className="text-sm text-gray-500 mt-1">Placed on {new Date(order.createdAt).toLocaleDateString()}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-700">Update Status:</span>
          <OrderStatusSelect orderId={order.id} currentStatus={order.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Customer Details */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-4">
          <h3 className="font-semibold text-gray-900 border-b border-gray-100 pb-2">Customer Details</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <p><span className="font-medium">Name:</span> {order.user.name || 'N/A'}</p>
            <p><span className="font-medium">Email:</span> {order.user.email || 'N/A'}</p>
            <p><span className="font-medium">Phone:</span> {order.user.phoneNumber || 'N/A'}</p>
          </div>
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

          <div className="bg-gray-50 p-6 flex justify-between items-center border-t border-gray-100">
            <span className="font-semibold text-gray-900">Total Amount</span>
            <span className="text-lg font-bold text-[#0D3B66]">₹{order.totalAmount.toFixed(2)}</span>
          </div>
        </div>

      </div>
    </div>
  );
}
