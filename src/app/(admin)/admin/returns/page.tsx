import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { unstable_cache } from "next/cache";
import type { Prisma } from "@/generated/prisma";
import Pagination from "@/components/shared/Pagination";
import { ArrowRightCircle } from "lucide-react";

type ReturnRow = Prisma.ReturnRequestGetPayload<{
  include: {
    user: { select: { name: true; email: true } };
    orderItem: { include: { product: { select: { name: true; images: true } } } };
  };
}>;

const ITEMS_PER_PAGE = 25;

export const dynamic = "force-dynamic";

const getCachedReturns = unstable_cache(
  async (skip: number, take: number) => {
    const [returns, total] = await Promise.all([
      prisma.returnRequest.findMany({
        include: {
          user: { select: { name: true, email: true } },
          orderItem: { include: { product: { select: { name: true, images: true } } } },
        },
        orderBy: { requestedAt: "desc" },
        skip,
        take,
      }),
      prisma.returnRequest.count(),
    ]);
    return { returns: returns as ReturnRow[], total };
  },
  ["admin", "returns"],
  { revalidate: 30 }
);

export default async function AdminReturnsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  const currentPage = Math.max(1, parseInt(page || "1", 10));

  let returns: ReturnRow[] = [];
  let totalReturns = 0;
  try {
    const result = await getCachedReturns((currentPage - 1) * ITEMS_PER_PAGE, ITEMS_PER_PAGE);
    returns = result.returns;
    totalReturns = result.total;
  } catch (error) {
    console.warn("Database unreachable in AdminReturnsPage:", error instanceof Error ? error.message : "unknown error");
  }

  const totalPages = Math.max(1, Math.ceil(totalReturns / ITEMS_PER_PAGE));

  const statusBadge: Record<string, string> = {
    PENDING: "bg-yellow-50 text-yellow-700 border-yellow-200",
    APPROVED: "bg-blue-50 text-blue-700 border-blue-200",
    PICKED_UP: "bg-indigo-50 text-indigo-700 border-indigo-200",
    REFUNDED: "bg-green-50 text-green-700 border-green-200",
    REPLACED: "bg-green-50 text-green-700 border-green-200",
    REJECTED: "bg-red-50 text-red-700 border-red-200",
    CANCELLED: "bg-gray-100 text-gray-500 border-gray-200",
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 rounded-none">
      <div className="border-b border-[#7A0B2E]/20 pb-4">
        <h2 className="text-3xl font-serif font-bold text-[#2D1F2F] tracking-wide">Returns &amp; Replacements</h2>
        <p className="text-xs text-[#7A0B2E] font-bold uppercase tracking-widest mt-2">
          Review and process customer return / replacement requests
        </p>
      </div>

      <div className="bg-white border border-[#7A0B2E]/20 relative rounded-none">
        <table className="w-full text-left text-sm text-[#2D1F2F]">
          <thead className="bg-[#F5EFE6] text-[#7A0B2E] text-[10px] uppercase font-bold tracking-widest border-b border-[#7A0B2E]/20">
            <tr>
              <th className="px-6 py-4 border-r border-[#7A0B2E]/10">Product</th>
              <th className="px-6 py-4 border-r border-[#7A0B2E]/10">Customer</th>
              <th className="px-6 py-4 border-r border-[#7A0B2E]/10">Type</th>
              <th className="px-6 py-4 border-r border-[#7A0B2E]/10">Requested</th>
              <th className="px-6 py-4 border-r border-[#7A0B2E]/10">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#7A0B2E]/10">
            {returns.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500 text-xs font-bold uppercase tracking-widest rounded-none">
                  No return or replacement requests yet.
                </td>
              </tr>
            ) : (
              returns.map((r) => (
                <tr key={r.id} className="hover:bg-[#F5EFE6] transition-colors group">
                  <td className="px-6 py-4 font-bold text-[#2D1F2F] border-r border-[#7A0B2E]/10 max-w-[220px] truncate">
                    {r.orderItem.product.name}
                  </td>
                  <td className="px-6 py-4 text-xs border-r border-[#7A0B2E]/10">
                    <p className="font-bold text-[#2D1F2F]">{r.user.name || "Customer"}</p>
                    <p className="text-gray-400">{r.user.email}</p>
                  </td>
                  <td className="px-6 py-4 border-r border-[#7A0B2E]/10">
                    <span className="inline-flex items-center px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest border border-[#7A0B2E]/30 text-[#2D1F2F] bg-[#F5EFE6]">
                      {r.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[10px] font-mono text-gray-500 border-r border-[#7A0B2E]/10">
                    {new Date(r.requestedAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 border-r border-[#7A0B2E]/10">
                    <span className={`inline-flex items-center px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest border rounded-none ${statusBadge[r.status]}`}>
                      {r.status.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/admin/returns/${r.id}`}
                      className="inline-flex text-[#7A0B2E] hover:text-[#2D1F2F] transition-colors p-1 items-center justify-center rounded-none"
                      title="Process Request"
                    >
                      <ArrowRightCircle className="w-5 h-5" />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination currentPage={currentPage} totalPages={totalPages} baseUrl="/admin/returns" />
    </div>
  );
}
