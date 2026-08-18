interface AuditLogsHeaderProps {
  total: number;
}

export default function AuditLogsHeader({ total }: AuditLogsHeaderProps) {
  return (
    <div className="border-b border-[#B6925B]/20 pb-4">
      <h1 className="text-3xl font-serif font-bold text-[#4A3B2C] tracking-wide">Audit Logs</h1>
      <p className="text-xs text-[#B6925B] font-bold uppercase tracking-widest mt-2">
        Track restricted (admin) actions performed across the store. {total} total entries.
      </p>
    </div>
  );
}
