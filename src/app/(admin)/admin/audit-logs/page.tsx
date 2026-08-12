import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AuditLog } from "@/generated/prisma";

export const metadata = {
  title: "Audit Logs | Admin Dashboard",
};

const PAGE_SIZE = 25;

const ACTION_LABELS: Record<string, string> = {
  "product.create": "Product created",
  "product.update": "Product updated",
  "product.delete": "Product deleted",
  "product.bulkDelete": "Products bulk deleted",
  "product.bulkUpdateStock": "Stock bulk updated",
  "collection.create": "Collection created",
  "collection.update": "Collection updated",
  "collection.delete": "Collection deleted",
  "order.statusUpdate": "Order status updated",
  "order.deliveryStatusUpdate": "Delivery status updated",
  "order.refund": "Refund processed",
  "order.notesUpdate": "Order notes updated",
  "user.toggleDisabled": "User disabled/enabled",
  "coupon.create": "Coupon created",
  "coupon.toggleStatus": "Coupon status toggled",
  "coupon.delete": "Coupon deleted",
  "review.delete": "Review deleted",
};

function formatAction(action: string) {
  return ACTION_LABELS[action] || action;
}

function formatDate(date: Date) {
  return new Date(date).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default async function AdminAuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string; page?: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    redirect("/admin/login");
  }

  const resolved = await searchParams;
  const actionFilter = resolved.action?.trim() || "";
  const currentPage = Math.max(1, parseInt(resolved.page || "1", 10));

  const where = actionFilter ? { action: actionFilter } : {};

  let logs: AuditLog[] = [];
  let total = 0;
  let distinctActions: { action: string }[] = [];

  try {
    const results = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (currentPage - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      prisma.auditLog.count({ where }),
      prisma.auditLog.groupBy({
        by: ["action"],
        orderBy: { _count: { action: "desc" } },
      })
    ]);
    logs = results[0];
    total = results[1];
    distinctActions = results[2];
  } catch (error) {
    console.warn("Database unreachable in AdminAuditLogsPage:", error);
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div className="border-b border-[#B6925B]/20 pb-4">
        <h1 className="text-3xl font-serif font-bold text-[#4A3B2C] tracking-wide">Audit Logs</h1>
        <p className="text-xs text-[#B6925B] font-bold uppercase tracking-widest mt-2">
          Track restricted (admin) actions performed across the store. {total} total entries.
        </p>
      </div>

      <div className="bg-white border border-[#B6925B]/20 relative">
        <div className="border-b border-[#B6925B]/20 px-4 py-3 flex items-center justify-between gap-4 flex-wrap bg-[#FAFAFA]">
          <div className="flex items-center gap-2 flex-wrap text-sm">
            <Link
              href="/admin/audit-logs"
              className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest transition-colors ${
                !actionFilter ? "bg-[#B6925B] text-white" : "bg-white border border-[#B6925B]/30 text-[#4A3B2C] hover:bg-[#FAFAFA]"
              }`}
            >
              All
            </Link>
            {distinctActions.map((a) => (
              <Link
                key={a.action}
                href={`/admin/audit-logs?action=${encodeURIComponent(a.action)}`}
                className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest transition-colors ${
                  actionFilter === a.action
                    ? "bg-[#B6925B] text-white"
                    : "bg-white border border-[#B6925B]/30 text-[#4A3B2C] hover:bg-[#FAFAFA]"
                }`}
              >
                {formatAction(a.action)}
              </Link>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-[#4A3B2C]">
            <thead className="bg-[#FAFAFA] text-[#B6925B] uppercase text-[10px] font-bold tracking-widest border-b border-[#B6925B]/20">
              <tr>
                <th className="px-4 py-3 border-r border-[#B6925B]/10">Action</th>
                <th className="px-4 py-3 border-r border-[#B6925B]/10">Entity</th>
                <th className="px-4 py-3 border-r border-[#B6925B]/10">Actor</th>
                <th className="px-4 py-3 border-r border-[#B6925B]/10">Details</th>
                <th className="px-4 py-3">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#B6925B]/10">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-gray-500 text-xs font-bold uppercase tracking-widest">
                    No audit entries found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#FAFAFA] transition-colors group">
                    <td className="px-4 py-3 font-bold text-[#4A3B2C] border-r border-[#B6925B]/10">{formatAction(log.action)}</td>
                    <td className="px-4 py-3 text-[#4A3B2C] border-r border-[#B6925B]/10">
                      {log.entity ? (
                        <>
                          <span className="font-bold text-xs uppercase tracking-widest">{log.entity}</span>
                          {log.entityId && (
                            <span className="block text-[10px] text-gray-500 font-mono mt-0.5">{log.entityId}</span>
                          )}
                        </>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[#4A3B2C] border-r border-[#B6925B]/10">
                      {log.actorId ? (
                        <span className="font-mono text-xs">{log.actorId}</span>
                      ) : (
                        <span className="text-gray-400 font-bold text-xs uppercase tracking-widest">System</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[#4A3B2C] border-r border-[#B6925B]/10">
                      {log.meta ? (
                        <pre className="text-[10px] text-gray-500 bg-white border border-[#B6925B]/20 p-2 inline-block max-w-[280px] overflow-x-auto">
                          {JSON.stringify(log.meta)}
                        </pre>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[#B6925B] text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">{formatDate(log.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="border-t border-[#B6925B]/20 px-4 py-3 flex items-center justify-between text-sm bg-[#FAFAFA]">
            <span className="text-xs font-bold uppercase tracking-widest text-[#4A3B2C]">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              {currentPage > 1 && (
                <Link
                  href={`/admin/audit-logs?${new URLSearchParams({ ...(actionFilter ? { action: actionFilter } : {}), page: String(currentPage - 1) }).toString()}`}
                  className="px-3 py-1 bg-white border border-[#B6925B]/30 text-[10px] font-bold uppercase tracking-widest text-[#4A3B2C] hover:bg-[#FAFAFA] transition-colors"
                >
                  Previous
                </Link>
              )}
              {currentPage < totalPages && (
                <Link
                  href={`/admin/audit-logs?${new URLSearchParams({ ...(actionFilter ? { action: actionFilter } : {}), page: String(currentPage + 1) }).toString()}`}
                  className="px-3 py-1 bg-white border border-[#B6925B]/30 text-[10px] font-bold uppercase tracking-widest text-[#4A3B2C] hover:bg-[#FAFAFA] transition-colors"
                >
                  Next
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}