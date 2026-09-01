import { prisma } from "@/lib/db/prisma";
import type { Metadata } from "next";
import Link from "next/link";
import { unstable_cache } from "next/cache";
import { Prisma } from "@/generated/prisma";
import AdminFilters from "@/app/(admin)/admin/_components/AdminFilters";
import Pagination from "@/components/shared/Pagination";

export const metadata: Metadata = {
  title: "Customers Directory | Admin Portal",
};

const ITEMS_PER_PAGE = 25;

type CustomerRow = Prisma.UserGetPayload<{
  where: { role: 'CUSTOMER' };
  include: { orders: { select: { totalAmount: true } } };
}>;

export const dynamic = "force-dynamic";

const getCachedCustomers = unstable_cache(
  async (search: string | undefined, skip: number, take: number) => {
    const where = {
      role: 'CUSTOMER' as const,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' as const } },
              { email: { contains: search, mode: 'insensitive' as const } },
              { phoneNumber: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };
    const [customers, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          orders: {
            select: {
              totalAmount: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.user.count({ where }),
    ]);
    return { customers: customers as CustomerRow[], total };
  },
  ["admin", "customers"],
  { revalidate: 30 }
);

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string }>;
}) {
  const { search } = await searchParams;
  const resolved = await searchParams;
  const currentPage = Math.max(1, parseInt(resolved.page || '1', 10));

  let customers: CustomerRow[] = [];
  let totalCustomers = 0;
  try {
    const result = await getCachedCustomers(search, (currentPage - 1) * ITEMS_PER_PAGE, ITEMS_PER_PAGE);
    customers = result.customers;
    totalCustomers = result.total;
  } catch (error) {
    console.warn("Database unreachable in AdminCustomersPage:", error instanceof Error ? error.message : "unknown error");
  }

  const totalPages = Math.max(1, Math.ceil(totalCustomers / ITEMS_PER_PAGE));
  const urlParams = new URLSearchParams();
  if (search) urlParams.set("search", search);
  const qs = urlParams.toString();
  const baseUrl = qs ? `/admin/customers?${qs}` : "/admin/customers";

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="border-b border-[#B6925B]/20 pb-4">
        <h2 className="text-3xl font-serif font-bold text-[#4A3B2C] tracking-wide">Customers</h2>
        <p className="text-xs text-[#B6925B] font-bold uppercase tracking-widest mt-2">Manage your customer database and view aggregate spending</p>
      </div>

      <AdminFilters search={search} placeholder="Search name, email or phone..." />

      <div className="bg-white border border-[#B6925B]/20 relative">
        <table className="w-full text-left text-sm text-[#4A3B2C]">
          <thead className="bg-[#FAFAFA] text-[#B6925B] text-[10px] uppercase font-bold tracking-widest border-b border-[#B6925B]/20">
            <tr>
              <th className="px-6 py-4 border-r border-[#B6925B]/10">Customer Info</th>
              <th className="px-6 py-4 border-r border-[#B6925B]/10">Phone Number</th>
              <th className="px-6 py-4 border-r border-[#B6925B]/10">Signup Date</th>
              <th className="px-6 py-4 text-center border-r border-[#B6925B]/10">Orders Count</th>
              <th className="px-6 py-4 text-right">Total Spent</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#B6925B]/10">
            {customers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500 text-xs font-bold uppercase tracking-widest">
                  No customers found.
                </td>
              </tr>
            ) : (
              customers.map((customer) => {
                const orderCount = customer.orders.length;
                const totalSpent = customer.orders.reduce((sum: number, order) => sum + order.totalAmount, 0);

                return (
                  <tr key={customer.id} className="hover:bg-[#FAFAFA] transition-colors group">
                    <td className="px-6 py-4 border-r border-[#B6925B]/10">
                      <div>
                        <Link href={`/admin/customers/${customer.id}`} className="font-bold text-[#B6925B] hover:text-[#4A3B2C] hover:underline block uppercase tracking-widest text-[10px]">
                          {customer.name || 'No name provided'}
                        </Link>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-medium text-gray-500">{customer.email}</span>
                          {customer.isDisabled && (
                            <span className="bg-red-50 text-red-700 px-2 py-0.5 border border-red-200 text-[8px] font-bold uppercase tracking-widest">
                              Banned
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-[#4A3B2C] border-r border-[#B6925B]/10">
                      {customer.phoneNumber || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-[#B6925B] border-r border-[#B6925B]/10">
                      {new Date(customer.createdAt).toLocaleDateString("en-IN", {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-[#4A3B2C] border-r border-[#B6925B]/10">
                      {orderCount}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-[#4A3B2C]">
                      Rs. {totalSpent.toFixed(2)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <Pagination currentPage={currentPage} totalPages={totalPages} baseUrl={baseUrl} />
    </div>
  );
}
