"use client";
import { useState } from "react";
import { createWorker } from "@/actions/admin";
import { useToast } from "@/components/ui/Toast";
import { useRouter } from "next/navigation";
import { UserPlus, X, Loader2 } from "lucide-react";

export default function CreateWorkerForm() {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [inventory, setInventory] = useState(true);
  const [shipping, setShipping] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const formData = new FormData(e.currentTarget);
      if (inventory) formData.set("inventory", "on");
      if (shipping) formData.set("shipping", "on");
      await createWorker(formData);
      toast.success("Worker account created!");
      setOpen(false);
      e.currentTarget.reset();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create worker.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className="bg-[#B6925B] hover:bg-[#9c7d4e] text-white px-5 py-2 text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-colors shadow-sm rounded-none"
      >
        {open ? <X className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
        {open ? "Cancel" : "Create Worker"}
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="mt-4 bg-white border border-[#B6925B]/20 shadow-sm p-6 space-y-4">
          {error && <div className="p-3 text-xs font-bold uppercase tracking-widest text-red-600 bg-red-50 border border-red-200 text-center rounded-none">{error}</div>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-[#4A3B2C] uppercase tracking-wider mb-1">Full Name</label>
              <input name="name" required className="w-full bg-transparent border border-[#B6925B]/30 px-3 py-2 text-sm text-[#4A3B2C] focus:outline-none focus:border-[#B6925B] rounded-none" placeholder="Worker Name" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[#4A3B2C] uppercase tracking-wider mb-1">Email</label>
              <input name="email" type="email" required className="w-full bg-transparent border border-[#B6925B]/30 px-3 py-2 text-sm text-[#4A3B2C] focus:outline-none focus:border-[#B6925B] rounded-none" placeholder="worker@myra.com" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[#4A3B2C] uppercase tracking-wider mb-1">Phone (optional)</label>
              <input name="phoneNumber" className="w-full bg-transparent border border-[#B6925B]/30 px-3 py-2 text-sm text-[#4A3B2C] focus:outline-none focus:border-[#B6925B] rounded-none" placeholder="9999999999" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[#4A3B2C] uppercase tracking-wider mb-1">Temporary Password</label>
              <input name="password" type="password" required minLength={6} className="w-full bg-transparent border border-[#B6925B]/30 px-3 py-2 text-sm text-[#4A3B2C] focus:outline-none focus:border-[#B6925B] rounded-none" placeholder="At least 6 characters" />
            </div>
          </div>

          <div className="flex gap-6 pt-2">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={inventory} onChange={(e) => setInventory(e.target.checked)} className="w-4 h-4 accent-[#B6925B]" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#4A3B2C]">Inventory Management</span>
            </label>
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={shipping} onChange={(e) => setShipping(e.target.checked)} className="w-4 h-4 accent-[#B6925B]" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#4A3B2C]">Shipping Management</span>
            </label>
          </div>

          <button type="submit" disabled={loading} className="bg-[#4A3B2C] hover:bg-[#3a2d20] text-white px-5 py-2 text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-colors disabled:opacity-70 rounded-none">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            Create Worker Account
          </button>
        </form>
      )}
    </div>
  );
}
