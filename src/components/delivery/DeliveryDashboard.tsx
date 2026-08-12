"use client";
import { useReducer } from "react";
import { updateDeliveryStatusAction } from "@/actions/delivery";
import { useToast } from "@/components/ui/Toast";

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

interface DashboardState {
  orders: Order[];
  loadingOrderId: string | null;
}

type DashboardAction =
  | { type: "UPDATE_STATUS"; orderId: string; status: "DELIVERED" | "CANCELLED" | "SHIPPED" }
  | { type: "LOADING"; orderId: string }
  | { type: "DONE" };

function dashboardReducer(state: DashboardState, action: DashboardAction): DashboardState {
  switch (action.type) {
    case "LOADING":
      return { ...state, loadingOrderId: action.orderId };
    case "DONE":
      return { ...state, loadingOrderId: null };
    case "UPDATE_STATUS":
      return {
        ...state,
        loadingOrderId: null,
        orders: state.orders.map(o =>
          o.id === action.orderId ? { ...o, status: action.status, updatedAt: new Date() } : o
        ),
      };
    default:
      return state;
  }
}

export default function DeliveryDashboard({ initialOrders }: { initialOrders: Order[] }) {
  const [state, dispatch] = useReducer(dashboardReducer, {
    orders: initialOrders,
    loadingOrderId: null,
  });
  const { orders, loadingOrderId } = state;
  const toast = useToast();

  const handleUpdateStatus = async (orderId: string, status: "DELIVERED" | "CANCELLED" | "SHIPPED") => {
    dispatch({ type: "LOADING", orderId });
    try {
      await updateDeliveryStatusAction(orderId, status);
      dispatch({ type: "UPDATE_STATUS", orderId, status });
      toast.success(`Order status updated to ${status}!`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update status.");
      dispatch({ type: "DONE" });
    }
  };

  const activeOrders = orders.filter(o => o.status === "SHIPPED");
  const completedOrders = orders.filter(o => o.status === "DELIVERED" || o.status === "CANCELLED");

  return (
    <div className="space-y-8">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 border border-[#B6925B]/20 shadow-sm flex items-center justify-between rounded-none">
          <div>
            <span className="block text-[10px] font-bold text-[#B6925B] uppercase tracking-widest mb-2">
              Active Shipments
            </span>
            <span className="text-3xl font-serif text-[#4A3B2C]">{activeOrders.length}</span>
          </div>
          <div className="w-10 h-10 text-[#B6925B] bg-[#FAFAFA] border border-[#B6925B]/20 flex items-center justify-center rounded-none">
            <i className="ri-truck-line text-xl" />
          </div>
        </div>

        <div className="bg-white p-6 border border-[#B6925B]/20 shadow-sm flex items-center justify-between rounded-none">
          <div>
            <span className="block text-[10px] font-bold text-[#B6925B] uppercase tracking-widest mb-2">
              Completed Shipments
            </span>
            <span className="text-3xl font-serif text-green-700">{completedOrders.length}</span>
          </div>
          <div className="w-10 h-10 text-green-600 bg-green-50 border border-green-200 flex items-center justify-center rounded-none">
            <i className="ri-checkbox-circle-line text-xl" />
          </div>
        </div>
      </div>

      {/* Active Shipments Section */}
      <div className="space-y-4">
        <h3 className="text-xl font-serif text-[#4A3B2C] tracking-wide">Active Shipments ({activeOrders.length})</h3>
        {activeOrders.length === 0 ? (
          <div className="bg-white p-8 border border-[#B6925B]/20 text-center text-[10px] font-bold uppercase tracking-widest text-[#B6925B] shadow-sm rounded-none">
            No active shipments out for delivery.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activeOrders.map(order => (
              <div key={order.id} className="bg-white border border-[#B6925B]/20 shadow-sm overflow-hidden flex flex-col justify-between rounded-none">
                
                {/* Header info */}
                <div className="bg-[#FAFAFA] border-b border-[#B6925B]/20 p-5 flex justify-between items-center">
                  <div>
                    <span className="block text-[8px] font-bold text-gray-400 uppercase tracking-widest">Order ID</span>
                    <span className="text-xs font-mono text-[#4A3B2C] font-bold">{order.id.split("-")[0]}</span>
                  </div>
                  <div className="text-right">
                    <span className="block text-[8px] font-bold text-gray-400 uppercase tracking-widest">COD Cash Collection</span>
                    <span className="text-sm font-bold text-[#B6925B]">₹{order.totalAmount.toFixed(2)}</span>
                  </div>
                </div>

                {/* Details */}
                <div className="p-5 space-y-4 flex-1">
                  {/* Delivery Address */}
                  <div>
                    <span className="block text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-2">Delivery Address</span>
                    {order.address ? (
                      <div className="text-[10px] uppercase tracking-widest font-bold text-gray-500 space-y-1.5 leading-relaxed">
                        <p className="font-bold text-[#4A3B2C] text-sm tracking-normal capitalize mb-2">{order.user.name}</p>
                        <p className="text-[8px] font-bold text-[#B6925B] uppercase tracking-widest mb-1">({order.address.label} Address)</p>
                        <p className="normal-case text-gray-600 font-semibold">{order.address.addressLine1}</p>
                        <p className="normal-case text-gray-600 font-semibold">{order.address.city}, {order.address.state} - {order.address.postalCode}</p>
                      </div>
                    ) : (
                      <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">No specific shipping address selected.</p>
                    )}
                  </div>

                  {/* Customer Contact */}
                  {order.user.phoneNumber && (
                    <div className="flex items-center gap-2 pt-1">
                      <a
                        href={`tel:${order.user.phoneNumber}`}
                        className="inline-flex items-center gap-1.5 bg-[#FAFAFA] hover:bg-white text-[#B6925B] hover:text-[#4A3B2C] px-3 py-1.5 rounded-none text-[10px] font-bold uppercase tracking-widest transition-all border border-[#B6925B]/20"
                      >
                        <i className="ri-phone-line text-xs" />
                        <span>Call Customer: {order.user.phoneNumber}</span>
                      </a>
                    </div>
                  )}

                  {/* Order Items list */}
                  <div className="border-t border-[#B6925B]/10 pt-3">
                    <span className="block text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-2">Items ({order.orderItems.length})</span>
                    <div className="text-xs text-gray-600 space-y-1">
                      {order.orderItems.map(item => (
                        <p key={item.id}>• {item.product.name} <span className="text-gray-400">(Qty: {item.quantity})</span></p>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Quick Action footer */}
                <div className="border-t border-[#B6925B]/10 p-4 bg-[#FAFAFA] flex gap-3">
                  <button
                    onClick={() => handleUpdateStatus(order.id, "DELIVERED")}
                    disabled={loadingOrderId === order.id}
                    className="flex-1 bg-[#4A3B2C] hover:bg-[#34291f] text-white py-2.5 rounded-none text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {loadingOrderId === order.id ? (
                      <i className="ri-loader-4-line animate-spin text-sm" />
                    ) : (
                      <i className="ri-check-line text-sm" />
                    )}
                    <span>Delivered</span>
                  </button>

                  <button
                    onClick={() => handleUpdateStatus(order.id, "CANCELLED")}
                    disabled={loadingOrderId === order.id}
                    className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-4 py-2.5 rounded-none text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <i className="ri-close-line text-sm" />
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
        <h3 className="text-xl font-serif text-[#4A3B2C] tracking-wide">Delivery History ({completedOrders.length})</h3>
        {completedOrders.length === 0 ? (
          <div className="text-center text-[10px] font-bold uppercase tracking-widest text-[#B6925B] py-6">No completed deliveries today.</div>
        ) : (
          <div className="bg-white border border-[#B6925B]/20 shadow-sm overflow-hidden divide-y divide-[#B6925B]/10 rounded-none">
            {completedOrders.map(order => (
              <div key={order.id} className="p-5 flex flex-wrap items-center justify-between gap-4 hover:bg-[#FAFAFA]/50 transition-colors">
                <div className="space-y-1">
                  <p className="text-sm font-bold text-[#4A3B2C]">Order #{order.id.split("-")[0]}</p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Customer: {order.user.name}</p>
                  {order.address && (
                    <p className="text-[10px] text-gray-400">{order.address.addressLine1}, {order.address.city}</p>
                  )}
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <span className="block text-[8px] font-bold text-gray-400 uppercase tracking-widest">COD Collected</span>
                    <span className="text-sm font-bold text-[#B6925B]">₹{order.totalAmount.toFixed(2)}</span>
                  </div>

                  <div>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-widest border rounded-none
                      ${order.status === "DELIVERED" ? "bg-[#FAFAFA] text-green-700 border-[#B6925B]/10" : "bg-red-50 text-red-700 border-red-200"}`}>
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
