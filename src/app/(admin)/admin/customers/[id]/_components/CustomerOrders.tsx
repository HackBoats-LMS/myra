import Link from "next/link";

interface OrderEntry {
  id: string;
  createdAt: Date;
  status: string;
  paymentMethod: string | null;
  paymentStatus: string;
  totalAmount: number;
}

interface CustomerOrdersProps {
  orders: OrderEntry[];
}

export default function CustomerOrders({ orders }: CustomerOrdersProps) {
  return (
    <div className="bg-white border border-[#7A0B2E]/20 p-6 shadow-sm space-y-4">
      <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#7A0B2E]">Order History ({orders.length})</h3>
      {orders.length === 0 ? (
        <div className="text-center py-12 text-[10px] font-bold uppercase tracking-widest text-gray-400">
          No orders placed by this customer yet.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-[#7A0B2E]/20 text-[10px] font-bold uppercase tracking-widest text-[#7A0B2E]">
                <th className="py-3">Order ID</th>
                <th className="py-3">Date</th>
                <th className="py-3">Status</th>
                <th className="py-3">Total</th>
                <th className="py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#7A0B2E]/10">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-[#F5EFE6]/50 transition-colors">
                  <td className="py-4 font-mono text-xs text-gray-600">#{order.id.split("-")[0]}</td>
                  <td className="py-4 text-xs font-semibold text-gray-600">
                    {new Date(order.createdAt).toLocaleDateString("en-IN", {
                      month: "short",
                      day: "numeric",
                      year: "numeric"
                    })}
                  </td>
                  <td className="py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest
                      ${order.status === "DELIVERED" ? "bg-[#F5EFE6] text-green-700 border border-[#7A0B2E]/10" :
                        order.status === "PENDING" ? "bg-[#F5EFE6] text-[#7A0B2E] border border-[#7A0B2E]/10" :
                        order.status === "SHIPPED" ? "bg-[#F5EFE6] text-[#2D1F2F] border border-[#7A0B2E]/10" :
                        "bg-[#F5EFE6] text-[#2D1F2F] border border-[#7A0B2E]/10"}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="py-4 font-bold text-[#2D1F2F]">₹{order.totalAmount.toFixed(2)}</td>
                  <td className="py-4 text-right">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="text-[10px] font-bold text-[#7A0B2E] hover:text-[#2D1F2F] uppercase tracking-widest transition-colors"
                    >
                      Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
