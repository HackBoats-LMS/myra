import Link from "next/link";

interface CustomerOrdersProps {
  orders: any[];
}

export default function CustomerOrders({ orders }: CustomerOrdersProps) {
  return (
    <div className="bg-white border border-[#B6925B]/20 p-6 shadow-sm space-y-4">
      <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#B6925B]">Order History ({orders.length})</h3>
      {orders.length === 0 ? (
        <div className="text-center py-12 text-[10px] font-bold uppercase tracking-widest text-gray-400">
          No orders placed by this customer yet.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-[#B6925B]/20 text-[10px] font-bold uppercase tracking-widest text-[#B6925B]">
                <th className="py-3">Order ID</th>
                <th className="py-3">Date</th>
                <th className="py-3">Status</th>
                <th className="py-3">Total</th>
                <th className="py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#B6925B]/10">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-[#FAFAFA]/50 transition-colors">
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
                      ${order.status === "DELIVERED" ? "bg-[#FAFAFA] text-green-700 border border-[#B6925B]/10" :
                        order.status === "PENDING" ? "bg-[#FAFAFA] text-[#B6925B] border border-[#B6925B]/10" :
                        order.status === "SHIPPED" ? "bg-[#FAFAFA] text-[#4A3B2C] border border-[#B6925B]/10" :
                        "bg-[#FAFAFA] text-[#4A3B2C] border border-[#B6925B]/10"}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="py-4 font-bold text-[#4A3B2C]">₹{order.totalAmount.toFixed(2)}</td>
                  <td className="py-4 text-right">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="text-[10px] font-bold text-[#B6925B] hover:text-[#4A3B2C] uppercase tracking-widest transition-colors"
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
