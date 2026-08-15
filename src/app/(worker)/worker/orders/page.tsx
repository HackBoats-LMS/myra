import Link from "next/link";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma";
import { requireWorkerModule } from "@/lib/worker";

export const dynamic = "force-dynamic";

export default async function WorkerOrdersPage() {
  await requireWorkerModule("shipping");
  let orders: Prisma.OrderGetPayload<{
    include: {
      user: { select: { name: true; email: true; phoneNumber: true } };
      _count: { select: { orderItems: true } };
    };
  }>[] = [];

  try {
    orders = await prisma.order.findMany({
      include: {
        user: { select: { name: true, email: true, phoneNumber: true } },
        _count: { select: { orderItems: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  } catch (error) {
    console.warn("Database unreachable in WorkerOrdersPage:", error);
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="border-b border-[#B6925B]/20 pb-4">
        <h2 className="text-3xl font-serif font-bold text-[#4A3B2C] tracking-wide">Shipping</h2>
        <p className="text-xs text-[#B6925B] font-bold uppercase tracking-widest mt-2">Review orders and create Shiprocket shipments</p>
      </div>

      <div className="bg-white border border-[#B6925B]/20 relative rounded-none overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm text-[#4A3B2C]">
            <thead className="bg-[#FAFAFA] text-[#B6925B] text-[10px] uppercase font-bold tracking-widest border-b border-[#B6925B]/20">
              <tr>
                <th className="px-6 py-4 border-r border-[#B6925B]/10">Order</th>
                <th className="px-6 py-4 border-r border-[#B6925B]/10">Customer</th>
                <th className="px-6 py-4 border-r border-[#B6925B]/10">Items</th>
                <th className="px-6 py-4 border-r border-[#B6925B]/10">Total</th>
                <th className="px-6 py-4 border-r border-[#B6925B]/10">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#B6925B]/10">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500 text-xs font-bold uppercase tracking-widest rounded-none">
                    No orders have been placed yet.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-[#FAFAFA] transition-colors">
                    <td className="px-6 py-4 font-mono text-[10px] text-gray-500 font-bold uppercase tracking-widest border-r border-[#B6925B]/10">
                      {order.id.split("-")[0]}
                    </td>
                    <td className="px-6 py-4 font-bold text-[#4A3B2C] border-r border-[#B6925B]/10">
                      {order.user?.name || order.user?.email || order.user?.phoneNumber || "Guest"}
                    </td>
                    <td className="px-6 py-4 border-r border-[#B6925B]/10 text-xs font-bold uppercase tracking-widest text-[#B6925B]">
                      {order._count.orderItems} items
                    </td>
                    <td className="px-6 py-4 font-bold text-[#4A3B2C] border-r border-[#B6925B]/10">
                      Rs. {order.totalAmount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 border-r border-[#B6925B]/10">
                      <span className="inline-flex items-center px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest bg-[#FAFAFA] border border-[#B6925B]/30 text-[#4A3B2C]">
                        {order.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/worker/orders/${order.id}`}
                        className="inline-flex text-[#B6925B] hover:text-[#4A3B2C] transition-colors p-1 items-center justify-center rounded-none"
                        title="View Order"
                      >
                        <i className="ri-eye-line text-lg" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}