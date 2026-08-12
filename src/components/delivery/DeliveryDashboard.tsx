"use client";
import { useState } from "react";
import { updateDeliveryStatusAction } from "@/actions/delivery";
import { useToast } from "@/components/ui/Toast";
import { ArrowPathIcon, CheckIcon, XMarkIcon, PhoneIcon, TruckIcon } from "@heroicons/react/24/outline";

interface Order {
  id: string;
  status: string;
  totalAmount: number;
  paymentMethod: string | null;
  updatedAt: Date;
  user: {
    name: string | null;
    email: string | null;
    phoneNumber: string | null;
  };
  address: {
    label: string;
    addressLine1: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  } | null;
  orderItems: {
    id: string;
    quantity: number;
    price: number;
    product: {
      name: string;
      images: string[];
    };
  }[];
}

export default function DeliveryDashboard({ initialOrders }: { initialOrders: Order[] }) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [loadingOrderId, setLoadingOrderId] = useState<string | null>(null);
  const toast = useToast();

  const handleUpdateStatus = async (orderId: string, status: "DELIVERED" | "CANCELLED" | "SHIPPED") => {
    setLoadingOrderId(orderId);
    try {
      await updateDeliveryStatusAction(orderId, status);
      setOrders(prev =>
        prev.map(o => (o.id === orderId ? { ...o, status, updatedAt: new Date() } : o))
      );
      toast.success(`Order status updated to ${status}!`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update status.");
    } finally {
      setLoadingOrderId(null);
    }
  };

  const activeOrders = orders.filter(o => o.status === "SHIPPED");
  const completedOrders = orders.filter(o => o.status === "DELIVERED" || o.status === "CANCELLED");

  return (
    <div className="space-y-8">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Active Shipments
            </span>
            <span className="text-3xl font-black text-[#0D3B66]">{activeOrders.length}</span>
          </div>
          <TruckIcon className="w-10 h-10 text-blue-500 bg-blue-50 p-2 rounded-full" />
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Completed Shipments
            </span>
            <span className="text-3xl font-black text-green-700">{completedOrders.length}</span>
          </div>
          <CheckIcon className="w-10 h-10 text-green-600 bg-green-50 p-2 rounded-full" />
        </div>
      </div>

      {/* Active Shipments Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-900 tracking-tight">Active Shipments ({activeOrders.length})</h3>
        {activeOrders.length === 0 ? (
          <div className="bg-white p-8 border border-gray-200 rounded-lg text-center text-gray-500 shadow-sm">
            No active shipments out for delivery.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activeOrders.map(order => (
              <div key={order.id} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden flex flex-col justify-between">
                
                {/* Header info */}
                <div className="bg-gray-50/50 border-b border-gray-100 p-5 flex justify-between items-center">
                  <div>
                    <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Order ID</span>
                    <span className="text-xs font-mono text-gray-700 font-semibold">{order.id.split("-")[0]}</span>
                  </div>
                  <div className="text-right">
                    <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">COD Cash Collection</span>
                    <span className="text-sm font-extrabold text-[#0D3B66]">₹{order.totalAmount.toFixed(2)}</span>
                  </div>
                </div>

                {/* Details */}
                <div className="p-5 space-y-4 flex-1">
                  {/* Delivery Address */}
                  <div>
                    <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Delivery Address</span>
                    {order.address ? (
                      <div className="text-xs text-gray-600 space-y-0.5">
                        <p className="font-semibold text-gray-900 text-sm mb-1">{order.user.name}</p>
                        <p className="font-bold text-[#0D3B66] uppercase text-[9px] mb-1">({order.address.label} Address)</p>
                        <p>{order.address.addressLine1}</p>
                        <p>{order.address.city}, {order.address.state} - {order.address.postalCode}</p>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500">No specific shipping address selected.</p>
                    )}
                  </div>

                  {/* Customer Contact */}
                  {order.user.phoneNumber && (
                    <div className="flex items-center gap-2 pt-1">
                      <a
                        href={`tel:${order.user.phoneNumber}`}
                        className="inline-flex items-center gap-1.5 bg-[#0D3B66]/5 hover:bg-[#0D3B66]/10 text-[#0D3B66] px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-colors border border-[#0D3B66]/10"
                      >
                        <PhoneIcon className="w-3.5 h-3.5" />
                        <span>Call Customer: {order.user.phoneNumber}</span>
                      </a>
                    </div>
                  )}

                  {/* Order Items list */}
                  <div className="border-t border-gray-100 pt-3">
                    <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Items ({order.orderItems.length})</span>
                    <div className="text-xs text-gray-600 space-y-1">
                      {order.orderItems.map(item => (
                        <p key={item.id}>• {item.product.name} <span className="text-gray-400">(Qty: {item.quantity})</span></p>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Quick Action footer */}
                <div className="border-t border-gray-100 p-4 bg-gray-50/50 flex gap-3">
                  <button
                    onClick={() => handleUpdateStatus(order.id, "DELIVERED")}
                    disabled={loadingOrderId === order.id}
                    className="flex-1 bg-green-700 hover:bg-green-800 text-white py-2.5 rounded text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {loadingOrderId === order.id ? (
                      <ArrowPathIcon className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckIcon className="w-4 h-4" />
                    )}
                    <span>Delivered</span>
                  </button>

                  <button
                    onClick={() => handleUpdateStatus(order.id, "CANCELLED")}
                    disabled={loadingOrderId === order.id}
                    className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-4 py-2.5 rounded text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <XMarkIcon className="w-4 h-4" />
                    <span>Failed</span>
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

      {/* Completed Shipments Section */}
      <div className="space-y-4 pt-6">
        <h3 className="text-lg font-bold text-gray-900 tracking-tight">Delivery History ({completedOrders.length})</h3>
        {completedOrders.length === 0 ? (
          <div className="text-center text-sm text-gray-500 py-6">No completed deliveries today.</div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden divide-y divide-gray-100">
            {completedOrders.map(order => (
              <div key={order.id} className="p-5 flex flex-wrap items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors">
                <div className="space-y-1">
                  <p className="text-sm font-bold text-gray-900">Order #{order.id.split("-")[0]}</p>
                  <p className="text-xs text-gray-500">Customer: {order.user.name}</p>
                  {order.address && (
                    <p className="text-[10px] text-gray-400">{order.address.addressLine1}, {order.address.city}</p>
                  )}
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">COD Collected</span>
                    <span className="text-sm font-bold text-[#0D3B66]">₹{order.totalAmount.toFixed(2)}</span>
                  </div>

                  <div>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider
                      ${order.status === "DELIVERED" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
