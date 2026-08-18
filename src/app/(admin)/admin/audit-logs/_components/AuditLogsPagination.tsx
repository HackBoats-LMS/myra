import Link from "next/link";

interface AuditLogsPaginationProps {
  totalPages: number;
  currentPage: number;
  actionFilter: string;
}

export default function AuditLogsPagination({ totalPages, currentPage, actionFilter }: AuditLogsPaginationProps) {
  if (totalPages <= 1) return null;

  return (
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
  );
}
