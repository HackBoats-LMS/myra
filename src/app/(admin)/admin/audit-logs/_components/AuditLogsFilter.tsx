import Link from "next/link";
import { formatAction } from "../utils";

interface AuditLogsFilterProps {
  distinctActions: { action: string }[];
  actionFilter: string;
}

export default function AuditLogsFilter({ distinctActions, actionFilter }: AuditLogsFilterProps) {
  return (
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
  );
}
