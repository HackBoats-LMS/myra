import Link from 'next/link';
import { prisma } from '@/lib/db/prisma';
import { Prisma } from '@/generated/prisma';
import { unstable_cache } from 'next/cache';
import AdminFilters from '@/app/(admin)/admin/_components/AdminFilters';
import Pagination from '@/components/shared/Pagination';
import { Eye } from 'lucide-react';

const ORDER_STATUSES = [
  'PENDING', 'READY_TO_SHIP', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED',
] as const;

const ITEMS_PER_PAGE = 25;

type OrderWithUser = Prisma.OrderGetPayload<{
  include: {
    user: { select: { name: true; email: true; phoneNumber: true } }
    _count: { select: { orderItems: true } }
  }
}>;

export const dynamic = "force-dynamic";

const getCachedOrders = unstable_cache(
  async (search: string | undefined, status: string | undefined, skip: number, take: number) => {
    const where = {
      ...(status && ORDER_STATUSES.includes(status as typeof ORDER_STATUSES[number])
        ? { status: status as typeof ORDER_STATUSES[number] }
        : {}),
      ...(search
        ? {
            OR: [
              { id: { contains: search, mode: 'insensitive' as const } },
              { user: { is: { name: { contains: search, mode: 'insensitive' as const } } } },
              { user: { is: { email: { contains: search, mode: 'insensitive' as const } } } },
              { user: { is: { phoneNumber: { contains: search, mode: 'insensitive' as const } } } },
            ],
          }
        : {}),
    };
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          user: {
            select: { name: true, email: true, phoneNumber: true }
          },
          _count: {
            select: { orderItems: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.order.count({ where }),
    ]);
    return { orders: orders as OrderWithUser[], total };
  },
  ["admin", "orders"],
  { revalidate: 30 }
);

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string; page?: string }>;
}) {
  const { search, status } = await searchParams;
  const resolved = await searchParams;
  const currentPage = Math.max(1, parseInt(resolved.page || '1', 10));

  let orders: OrderWithUser[] = [];
  let totalOrders = 0;
  try {
    const result = await getCachedOrders(search, status, (currentPage - 1) * ITEMS_PER_PAGE, ITEMS_PER_PAGE);
    orders = result.orders;
    totalOrders = result.total;
  } catch (error) {
    console.warn("Database unreachable in AdminOrdersPage:", error instanceof Error ? error.message : "unknown error");
  }

  const totalPages = Math.max(1, Math.ceil(totalOrders / ITEMS_PER_PAGE));
  const urlParams = new URLSearchParams();
  if (search) urlParams.set("search", search);
  if (status) urlParams.set("status", status);
  const qs = urlParams.toString();
  const baseUrl = qs ? `/admin/orders?${qs}` : "/admin/orders";

  return (
    <div className="max-w-6xl mx-auto space-y-6 rounded-none">
      <div className="flex items-center justify-between border-b border-[#7A0B2E]/20 pb-4">
        <div>
          <h2 className="text-3xl font-serif font-bold text-[#2D1F2F] tracking-wide">Orders</h2>
          <p className="text-xs text-[#7A0B2E] font-bold uppercase tracking-widest mt-2">Manage and fulfill customer orders</p>
        </div>
        <a 
          href="/api/admin/orders/export" 
          download 
          className="bg-[#7A0B2E] hover:bg-[#5C0820] text-white px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors shadow-sm flex items-center gap-1.5 rounded-none"
        >
          Export CSV
        </a>
      </div>

      <AdminFilters
        search={search}
        status={status}
        placeholder="Search order ID, name, email or phone..."
        statusOptions={ORDER_STATUSES.map((s) => ({ value: s, label: s.replace(/_/g, ' ') }))}
      />

      <div className="bg-white border border-[#7A0B2E]/20 relative rounded-none">
        <table className="w-full text-left text-sm text-[#2D1F2F]">
          <thead className="bg-[#FAFAFA] text-[#7A0B2E] text-[10px] uppercase font-bold tracking-widest border-b border-[#7A0B2E]/20">
            <tr>
              <th className="px-6 py-4 border-r border-[#7A0B2E]/10">Order ID</th>
              <th className="px-6 py-4 border-r border-[#7A0B2E]/10">Customer</th>
              <th className="px-6 py-4 border-r border-[#7A0B2E]/10">Items</th>
              <th className="px-6 py-4 border-r border-[#7A0B2E]/10">Total</th>
              <th className="px-6 py-4 border-r border-[#7A0B2E]/10">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#7A0B2E]/10">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500 text-xs font-bold uppercase tracking-widest rounded-none">
                  No orders have been placed yet.
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="hover:bg-[#FAFAFA] transition-colors group">
                  <td className="px-6 py-4 font-mono text-[10px] text-gray-500 font-bold uppercase tracking-widest border-r border-[#7A0B2E]/10">{order.id.split('-')[0]}</td>
                  <td className="px-6 py-4 font-bold text-[#2D1F2F] border-r border-[#7A0B2E]/10">
                    {order.user?.name || order.user?.email || order.user?.phoneNumber || 'Guest'}
                  </td>
                  <td className="px-6 py-4 border-r border-[#7A0B2E]/10 text-xs font-bold uppercase tracking-widest text-[#7A0B2E]">{order._count.orderItems} items</td>
                  <td className="px-6 py-4 font-bold text-[#2D1F2F] border-r border-[#7A0B2E]/10">Rs. {order.totalAmount.toFixed(2)}</td>
                  <td className="px-6 py-4 border-r border-[#7A0B2E]/10">
                    <span className="inline-flex items-center px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest bg-[#FAFAFA] border border-[#7A0B2E]/30 text-[#2D1F2F]">
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/admin/orders/${order.id}`} className="inline-flex text-[#7A0B2E] hover:text-[#2D1F2F] transition-colors p-1 items-center justify-center rounded-none" title="View Details">
                      <Eye className="w-4 h-4" />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination currentPage={currentPage} totalPages={totalPages} baseUrl={baseUrl} />
    </div>
  );
}
