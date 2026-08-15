"use client";
import { useState } from "react";
import { addPincode, deletePincode, togglePincodeActive } from "@/actions/admin";
import { useToast } from "@/components/ui/Toast";
import { useRouter } from "next/navigation";
import type { Pincode } from "@/generated/prisma";

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
      <div className="bg-white border border-[#B6925B]/20 shadow-sm p-6">
        <h3 className="text-sm font-bold text-[#4A3B2C] uppercase tracking-widest mb-4">Add Deliverable Pincode</h3>
        <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-[#4A3B2C] uppercase tracking-wider mb-1">Pincode</label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              required
              inputMode="numeric"
              pattern="[0-9]{6}"
              className="w-full rounded-none border border-[#B6925B]/30 bg-white px-3 py-2 text-sm text-[#4A3B2C] focus:outline-none focus:border-[#B6925B]"
              placeholder="e.g. 110001"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-[#4A3B2C] uppercase tracking-wider mb-1">City (optional)</label>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full rounded-none border border-[#B6925B]/30 bg-white px-3 py-2 text-sm text-[#4A3B2C] focus:outline-none focus:border-[#B6925B]"
              placeholder="e.g. Delhi"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-[#4A3B2C] uppercase tracking-wider mb-1">State (optional)</label>
            <input
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="w-full rounded-none border border-[#B6925B]/30 bg-white px-3 py-2 text-sm text-[#4A3B2C] focus:outline-none focus:border-[#B6925B]"
              placeholder="e.g. Delhi"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#B6925B] hover:bg-[#9c7d4e] text-white px-4 py-2 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-colors disabled:opacity-70 rounded-none"
            >
              {loading ? <i className="ri-loader-4-line animate-spin text-sm" /> : <i className="ri-add-line text-sm" />}
              Add
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white border border-[#B6925B]/20 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm text-[#4A3B2C]">
          <thead className="bg-[#FAFAFA] text-[#B6925B] text-[10px] uppercase font-bold tracking-widest border-b border-[#B6925B]/20">
            <tr>
              <th className="px-6 py-4 border-r border-[#B6925B]/10">Pincode</th>
              <th className="px-6 py-4 border-r border-[#B6925B]/10">City</th>
              <th className="px-6 py-4 border-r border-[#B6925B]/10">State</th>
              <th className="px-6 py-4 border-r border-[#B6925B]/10">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#B6925B]/10">
            {pincodes.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500 text-xs font-bold uppercase tracking-widest rounded-none">
                  No pincodes added yet. Add your first deliverable pincode above.
                </td>
              </tr>
            ) : (
              pincodes.map((p) => (
                <tr key={p.id} className="hover:bg-[#FAFAFA] transition-colors">
                  <td className="px-6 py-4 font-mono text-xs font-bold text-[#4A3B2C] border-r border-[#B6925B]/10">{p.code}</td>
                  <td className="px-6 py-4 text-xs border-r border-[#B6925B]/10">{p.city || "—"}</td>
                  <td className="px-6 py-4 text-xs border-r border-[#B6925B]/10">{p.state || "—"}</td>
                  <td className="px-6 py-4 border-r border-[#B6925B]/10">
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
                      <i className="ri-delete-bin-line text-lg" />
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