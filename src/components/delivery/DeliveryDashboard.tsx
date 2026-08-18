"use client";

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
    phone?: string | null;
  } | null;
  giftName: string | null;
  giftPhone: string | null;
  giftAddressLine1: string | null;
  giftCity: string | null;
  giftState: string | null;
  giftPostalCode: string | null;
  giftCountry: string | null;
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
  const orders = initialOrders;

  const activeOrders = orders.filter(o => o.status === "SHIPPED" || o.status === "OUT_FOR_DELIVERY");
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
                    {order.giftName ? (
                      <div className="text-[10px] uppercase tracking-widest font-bold text-gray-500 space-y-1.5 leading-relaxed">
                        <p className="font-bold text-[#4A3B2C] text-sm tracking-normal capitalize mb-2">{order.giftName}</p>
                        <p className="text-[8px] font-bold text-[#B6925B] uppercase tracking-widest mb-1">Gift Recipient</p>
                        <p className="normal-case text-gray-600 font-semibold">{order.giftAddressLine1}</p>
                        <p className="normal-case text-gray-600 font-semibold">{order.giftCity}, {order.giftState} - {order.giftPostalCode}</p>
                      </div>
                    ) : order.address ? (
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
                  {(() => {
                    const contactPhone = order.giftPhone || order.address?.phone || order.user.phoneNumber;
                    if (!contactPhone) return null;
                    const label = order.giftName ? "Call Recipient" : (order.address?.phone ? "Call Delivery Contact" : "Call Customer");
                    return (
                      <div className="flex items-center gap-2 pt-1">
                        <a
                          href={`tel:${contactPhone}`}
                          className="inline-flex items-center gap-1.5 bg-[#FAFAFA] hover:bg-white text-[#B6925B] hover:text-[#4A3B2C] px-3 py-1.5 rounded-none text-[10px] font-bold uppercase tracking-widest transition-all border border-[#B6925B]/20"
                        >
                          <i className="ri-phone-line text-xs" />
                          <span>{label}: {contactPhone}</span>
                        </a>
                      </div>
                    );
                  })()}

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

                {/* Status footer */}
                <div className="border-t border-[#B6925B]/10 p-4 bg-[#FAFAFA] flex items-center justify-between gap-3">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest border rounded-none ${
                    order.status === "OUT_FOR_DELIVERY"
                      ? "bg-[#FAFAFA] text-[#B6925B] border-[#B6925B]/30"
                      : "bg-[#FAFAFA] text-[#4A3B2C] border-[#B6925B]/30"
                  }`}>
                    <i className={`${order.status === "OUT_FOR_DELIVERY" ? "ri-truck-line" : "ri-box-3-line"} text-xs`} />
                    {order.status.replace(/_/g, " ")}
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400">
                    Updated {new Date(order.updatedAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </span>
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
