import { prisma } from "@/lib/db/prisma";
import Link from "next/link";
import CreateWorkerForm from "@/app/(admin)/admin/workers/_components/CreateWorkerForm";
import WorkerCapabilitiesSelect from "@/app/(admin)/admin/customers/_components/WorkerCapabilitiesSelect";
import DisableUserButton from "@/app/(admin)/admin/customers/_components/DisableUserButton";
import { Eye } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminWorkersPage() {
  let workers: Awaited<ReturnType<typeof prisma.user.findMany>> = [];

  try {
    workers = await prisma.user.findMany({
      where: { role: "MULTI_WORKER" },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.warn("Database unreachable in AdminWorkersPage:", error instanceof Error ? error.message : "unknown error");
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b border-[#B6925B]/20 pb-4 flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-serif font-bold text-[#4A3B2C] tracking-wide">Workers</h2>
          <p className="text-xs text-[#B6925B] font-bold uppercase tracking-widest mt-2">
            Manage worker accounts and their assigned modules
          </p>
        </div>
        <CreateWorkerForm />
      </div>

      <div className="bg-white border border-[#B6925B]/20 relative rounded-none overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm text-[#4A3B2C]">
            <thead className="bg-[#FAFAFA] text-[#B6925B] text-[10px] uppercase font-bold tracking-widest border-b border-[#B6925B]/20">
              <tr>
                <th className="px-6 py-4 border-r border-[#B6925B]/10">Worker</th>
                <th className="px-6 py-4 border-r border-[#B6925B]/10">Contact</th>
                <th className="px-6 py-4 border-r border-[#B6925B]/10">Assigned Modules</th>
                <th className="px-6 py-4 border-r border-[#B6925B]/10">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#B6925B]/10">
              {workers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500 text-xs font-bold uppercase tracking-widest rounded-none">
                    No worker accounts yet. Use &ldquo;Create Worker&rdquo; to add one.
                  </td>
                </tr>
              ) : (
                workers.map((w) => (
                  <tr key={w.id} className="hover:bg-[#FAFAFA] transition-colors">
                    <td className="px-6 py-4 font-bold text-[#4A3B2C] border-r border-[#B6925B]/10">{w.name || "Unnamed"}</td>
                    <td className="px-6 py-4 border-r border-[#B6925B]/10">
                      <p className="text-xs font-bold uppercase tracking-widest text-[#B6925B]">{w.email || "—"}</p>
                      {w.phoneNumber && <p className="text-[10px] text-gray-400 font-mono mt-1">{w.phoneNumber}</p>}
                    </td>
                    <td className="px-6 py-4 border-r border-[#B6925B]/10">
                      <WorkerCapabilitiesSelect
                        userId={w.id}
                        canInventory={w.canManageInventory}
                        canShipping={w.canManageShipping}
                      />
                    </td>
                    <td className="px-6 py-4 border-r border-[#B6925B]/10">
                      <span className={`inline-flex items-center px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest border
                        ${w.isDisabled ? "bg-red-50 text-red-700 border-red-200" : "bg-[#FAFAFA] text-green-700 border-[#B6925B]/20"}`}>
                        {w.isDisabled ? "Disabled" : "Active"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center justify-end gap-1">
                        <Link
                          href={`/admin/customers/${w.id}`}
                          className="inline-flex text-[#B6925B] hover:text-[#4A3B2C] transition-colors p-1 items-center justify-center rounded-none"
                          title="View Profile"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <DisableUserButton userId={w.id} initialDisabled={w.isDisabled} />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
        Tip: Assigned modules determine which pages the worker sees at /worker. Direct access to a module the worker
        doesn&apos;t own is blocked automatically.
      </p>
    </div>
  );
}
