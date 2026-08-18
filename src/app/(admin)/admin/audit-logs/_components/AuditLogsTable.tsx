import { formatAction, formatDate } from "../utils";

interface AuditLogsTableProps {
  logs: any[];
}

export default function AuditLogsTable({ logs }: AuditLogsTableProps) {
  return (
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
  );
}
