"use client";
import { useState } from "react";
import { addPincode, deletePincode, togglePincodeActive } from "@/actions/admin";
import { useToast } from "@/components/ui/Toast";
import { useRouter } from "next/navigation";
import type { Pincode } from "@/generated/prisma";
import { Loader2, Plus, Trash2 } from "lucide-react";

export default function PincodeManager({ pincodes }: { pincodes: Pincode[] }) {
  const router = useRouter();
  const toast = useToast();
  const [code, setCode] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      formData.set("code", code);
      formData.set("city", city);
      formData.set("state", state);
      await addPincode(formData);
      toast.success("Pincode added for delivery!");
      setCode("");
      setCity("");
      setState("");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add pincode.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-[#7A0B2E]/20 shadow-sm p-6">
        <h3 className="text-sm font-bold text-[#2D1F2F] uppercase tracking-widest mb-4">Add Deliverable Pincode</h3>
        <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-[#2D1F2F] uppercase tracking-wider mb-1">Pincode</label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              required
              inputMode="numeric"
              pattern="[0-9]{6}"
              className="w-full rounded-none border border-[#7A0B2E]/30 bg-white px-3 py-2 text-sm text-[#2D1F2F] focus:outline-none focus:border-[#7A0B2E]"
              placeholder="e.g. 110001"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-[#2D1F2F] uppercase tracking-wider mb-1">City (optional)</label>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full rounded-none border border-[#7A0B2E]/30 bg-white px-3 py-2 text-sm text-[#2D1F2F] focus:outline-none focus:border-[#7A0B2E]"
              placeholder="e.g. Delhi"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-[#2D1F2F] uppercase tracking-wider mb-1">State (optional)</label>
            <input
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="w-full rounded-none border border-[#7A0B2E]/30 bg-white px-3 py-2 text-sm text-[#2D1F2F] focus:outline-none focus:border-[#7A0B2E]"
              placeholder="e.g. Delhi"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#7A0B2E] hover:bg-[#5C0820] text-white px-4 py-2 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-colors disabled:opacity-70 rounded-none"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Add
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white border border-[#7A0B2E]/20 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm text-[#2D1F2F]">
          <thead className="bg-[#F5EFE6] text-[#7A0B2E] text-[10px] uppercase font-bold tracking-widest border-b border-[#7A0B2E]/20">
            <tr>
              <th className="px-6 py-4 border-r border-[#7A0B2E]/10">Pincode</th>
              <th className="px-6 py-4 border-r border-[#7A0B2E]/10">City</th>
              <th className="px-6 py-4 border-r border-[#7A0B2E]/10">State</th>
              <th className="px-6 py-4 border-r border-[#7A0B2E]/10">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#7A0B2E]/10">
            {pincodes.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500 text-xs font-bold uppercase tracking-widest rounded-none">
                  No pincodes added yet. Add your first deliverable pincode above.
                </td>
              </tr>
            ) : (
              pincodes.map((p) => (
                <tr key={p.id} className="hover:bg-[#F5EFE6] transition-colors">
                  <td className="px-6 py-4 font-mono text-xs font-bold text-[#2D1F2F] border-r border-[#7A0B2E]/10">{p.code}</td>
                  <td className="px-6 py-4 text-xs border-r border-[#7A0B2E]/10">{p.city || "—"}</td>
                  <td className="px-6 py-4 text-xs border-r border-[#7A0B2E]/10">{p.state || "—"}</td>
                  <td className="px-6 py-4 border-r border-[#7A0B2E]/10">
                    <button
                      onClick={async () => {
                        try {
                          await togglePincodeActive(p.id, !p.isActive);
                          toast.success(p.isActive ? "Pincode disabled." : "Pincode enabled.");
                          router.refresh();
                        } catch (err) {
                          toast.error(err instanceof Error ? err.message : "Failed to toggle.");
                        }
                      }}
                      className={`inline-flex items-center px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest border rounded-none
                        ${p.isActive ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}`}
                    >
                      {p.isActive ? "Active" : "Disabled"}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={async () => {
                        if (!confirm(`Remove pincode ${p.code}?`)) return;
                        try {
                          await deletePincode(p.id);
                          toast.success("Pincode removed.");
                          router.refresh();
                        } catch (err) {
                          toast.error(err instanceof Error ? err.message : "Failed to remove.");
                        }
                      }}
                      className="inline-flex items-center justify-center text-red-600 hover:text-red-800 transition-colors p-1 rounded-none"
                      title="Delete Pincode"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
