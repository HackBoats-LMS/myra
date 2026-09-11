import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { unstable_cache } from "next/cache";
import type { Prisma } from "@/generated/prisma";
import { requireWorkerModule } from "@/lib/worker";
import { CACHE_TAGS } from "@/lib/cache";
import AdminFilters from "@/app/(admin)/admin/_components/AdminFilters";
import Pagination from "@/components/shared/Pagination";
import { Eye, Truck } from "lucide-react";

export const dynamic = "force-dynamic";

const ORDER_STATUSES = [
  "PENDING",
  "READY_TO_SHIP",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
] as const;

const ITEMS_PER_PAGE = 25;

type WorkerOrderRow = Prisma.OrderGetPayload<{
  include: {
    user: { select: { name: true; email: true; phoneNumber: true } };
    _count: { select: { orderItems: true } };
  };
}>;

const getCachedWorkerOrders = unstable_cache(
  async (search: string | undefined, status: string | undefined, skip: number, take: number) => {
    const where = {
      ...(status && ORDER_STATUSES.includes(status as typeof ORDER_STATUSES[number])
        ? { status: status as typeof ORDER_STATUSES[number] }
        : {}),
      ...(search
        ? {
            OR: [
              { id: { contains: search, mode: "insensitive" as const } },
              { user: { is: { name: { contains: search, mode: "insensitive" as const } } } },
              { user: { is: { email: { contains: search, mode: "insensitive" as const } } } },
              { user: { is: { phoneNumber: { contains: search, mode: "insensitive" as const } } } },
            ],
          }
        : {}),
    };

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          user: { select: { name: true, email: true, phoneNumber: true } },
          _count: { select: { orderItems: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prisma.order.count({ where }),
    ]);

    return { orders: orders as WorkerOrderRow[], total };
  },
  ["worker", "orders", "filtered"],
  { tags: [CACHE_TAGS.workerOrders], revalidate: 30 }
);

export default async function WorkerOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string; page?: string }>;
}) {
  await requireWorkerModule("shipping");
  const { search, status, page } = await searchParams;
  const currentPage = Math.max(1, parseInt(page || "1", 10));

  let orders: WorkerOrderRow[] = [];
  let totalOrders = 0;

  try {
    const result = await getCachedWorkerOrders(
      search,
      status,
      (currentPage - 1) * ITEMS_PER_PAGE,
      ITEMS_PER_PAGE
    );
    orders = result.orders;
    totalOrders = result.total;
  } catch (error) {
    console.warn("Database unreachable in WorkerOrdersPage:", error instanceof Error ? error.message : "unknown error");
  }

  const totalPages = Math.max(1, Math.ceil(totalOrders / ITEMS_PER_PAGE));
  const urlParams = new URLSearchParams();
  if (search) urlParams.set("search", search);
  if (status) urlParams.set("status", status);
  const qs = urlParams.toString();
  const baseUrl = qs ? `/worker/orders?${qs}` : "/worker/orders";

  const getStatusBadgeClass = (s: string) => {
    switch (s) {
      case "PENDING":
        return "bg-amber-50 text-amber-800 border-amber-200";
      case "READY_TO_SHIP":
        return "bg-blue-50 text-blue-800 border-blue-200";
      case "SHIPPED":
        return "bg-purple-50 text-purple-800 border-purple-200";
      case "OUT_FOR_DELIVERY":
        return "bg-indigo-50 text-indigo-800 border-indigo-200";
      case "DELIVERED":
        return "bg-emerald-50 text-emerald-800 border-emerald-200";
      case "CANCELLED":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#7A0B2E]/15 pb-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#2D1F2F] tracking-wide">
            Shipping & Fulfilment
          </h1>
          <p className="text-xs text-[#7A0B2E] font-bold uppercase tracking-widest mt-1">
            Review customer orders, create Shiprocket shipments, and generate AWBs
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-gray-500">
            Total Orders: <strong className="text-[#7A0B2E]">{totalOrders}</strong>
          </span>
        </div>
      </div>

      {/* Modern Filter & Search Bar */}
      <AdminFilters
        search={search}
        status={status}
        placeholder="Search by order ID, customer name, email or phone..."
        statusOptions={ORDER_STATUSES.map((s) => ({ value: s, label: s.replace(/_/g, " ") }))}
      />

      {/* Orders Table */}
      <div className="bg-white border border-[#7A0B2E]/15 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm text-[#2D1F2F]">
            <thead className="bg-[#F8F6F2] text-[#7A0B2E] text-[10px] uppercase font-bold tracking-widest border-b border-[#7A0B2E]/15">
              <tr>
                <th className="px-5 py-3.5 border-r border-[#7A0B2E]/10">Order ID</th>
                <th className="px-5 py-3.5 border-r border-[#7A0B2E]/10">Customer</th>
                <th className="px-5 py-3.5 border-r border-[#7A0B2E]/10">Items</th>
                <th className="px-5 py-3.5 border-r border-[#7A0B2E]/10">Total</th>
                <th className="px-5 py-3.5 border-r border-[#7A0B2E]/10">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400 text-xs font-medium">
                    No orders match your filter criteria.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-[#FDFBF7] transition-colors group">
                    <td className="px-5 py-4 font-mono text-[11px] font-bold text-[#7A0B2E] border-r border-gray-100">
                      #{order.id.split("-")[0]}
                    </td>
                    <td className="px-5 py-4 border-r border-gray-100">
                      <p className="font-bold text-xs text-[#2D1F2F]">
                        {order.user?.name || "Guest Customer"}
                      </p>
                      <p className="text-[11px] text-gray-500">
                        {order.user?.phoneNumber || order.user?.email || "No contact"}
                      </p>
                    </td>
                    <td className="px-5 py-4 border-r border-gray-100 text-xs font-semibold text-gray-600">
                      {order._count.orderItems} item(s)
                    </td>
                    <td className="px-5 py-4 font-serif font-bold text-sm text-[#2D1F2F] border-r border-gray-100">
                      ₹{order.totalAmount.toFixed(2)}
                    </td>
                    <td className="px-5 py-4 border-r border-gray-100">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider border ${getStatusBadgeClass(
                          order.status
                        )}`}
                      >
                        {order.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/worker/orders/${order.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#F8F6F2] hover:bg-[#7A0B2E] text-[#2D1F2F] hover:text-white border border-[#7A0B2E]/20 text-[10px] font-bold uppercase tracking-wider transition-colors shadow-2xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Manage</span>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <Pagination currentPage={currentPage} totalPages={totalPages} baseUrl={baseUrl} />
    </div>
  );
}
