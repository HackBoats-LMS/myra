import Link from "next/link";
import { formatAction } from "../utils";

interface AuditLogsFilterProps {
  distinctActions: { action: string }[];
  actionFilter: string;
}

export default function AuditLogsFilter({ distinctActions, actionFilter }: AuditLogsFilterProps) {
  return (
    <div className="border-b border-[#7A0B2E]/20 px-4 py-3 flex items-center justify-between gap-4 flex-wrap bg-[#F5EFE6]">
      <div className="flex items-center gap-2 flex-wrap text-sm">
        <Link
          href="/admin/audit-logs"
          className={`px-3 py-1 text-[10px] font-bold uppercase tracking-widest transition-colors ${
            !actionFilter ? "bg-[#7A0B2E] text-white" : "bg-white border border-[#7A0B2E]/30 text-[#2D1F2F] hover:bg-[#F5EFE6]"
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
                ? "bg-[#7A0B2E] text-white"
                : "bg-white border border-[#7A0B2E]/30 text-[#2D1F2F] hover:bg-[#F5EFE6]"
            }`}
          >
            {formatAction(a.action)}
          </Link>
        ))}
      </div>
    </div>
  );
}
