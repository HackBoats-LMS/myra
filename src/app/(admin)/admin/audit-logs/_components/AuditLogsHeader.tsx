interface AuditLogsHeaderProps {
  total: number;
}

export default function AuditLogsHeader({ total }: AuditLogsHeaderProps) {
  return (
    <div className="border-b border-[#7A0B2E]/20 pb-4">
      <h1 className="text-3xl font-serif font-bold text-[#2D1F2F] tracking-wide">Audit Logs</h1>
      <p className="text-xs text-[#7A0B2E] font-bold uppercase tracking-widest mt-2">
        Track restricted (admin) actions performed across the store. {total} total entries.
      </p>
    </div>
  );
}
