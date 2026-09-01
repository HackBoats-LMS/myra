import { prisma } from "@/lib/db/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { AuditLog } from "@/generated/prisma";
import AuditLogsHeader from "@/app/(admin)/admin/audit-logs/_components/AuditLogsHeader";
import AuditLogsFilter from "@/app/(admin)/admin/audit-logs/_components/AuditLogsFilter";
import AuditLogsTable from "@/app/(admin)/admin/audit-logs/_components/AuditLogsTable";
import AuditLogsPagination from "@/app/(admin)/admin/audit-logs/_components/AuditLogsPagination";

export const metadata = {
  title: "Audit Logs | Admin Dashboard",
};

const PAGE_SIZE = 25;

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
    console.warn("Database unreachable in AdminAuditLogsPage:", error instanceof Error ? error.message : "unknown error");
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <AuditLogsHeader total={total} />

      <div className="bg-white border border-[#B6925B]/20 relative">
        <AuditLogsFilter distinctActions={distinctActions} actionFilter={actionFilter} />
        
        <AuditLogsTable logs={logs} />

        <AuditLogsPagination totalPages={totalPages} currentPage={currentPage} actionFilter={actionFilter} />
      </div>
    </div>
  );
}
