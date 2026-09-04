"use client";
import { useState } from "react";
import { updateCustomerProfile } from "@/actions/admin";
import { useToast } from "@/components/ui/Toast";
import { Pencil } from "lucide-react";

interface EditCustomerFormProps {
  userId: string;
  name: string | null;
  email: string | null;
  phoneNumber: string | null;
}

export default function EditCustomerForm({ userId, name, email, phoneNumber }: EditCustomerFormProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    try {
      await updateCustomerProfile(userId, formData);
      toast.success("Customer profile updated.");
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update profile.");
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-widest bg-white border border-[#7A0B2E]/30 text-[#2D1F2F] hover:bg-[#FAFAFA] transition-colors rounded-none"
      >
        <Pencil className="w-3.5 h-3.5" />
        {open ? "Cancel" : "Edit Profile"}
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="bg-white border border-[#7A0B2E]/20 p-6 shadow-sm space-y-4 mt-4">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#7A0B2E]">Edit Profile</h3>
          <div className="space-y-2">
            <label htmlFor="name" className="block text-[10px] font-bold text-[#2D1F2F] uppercase tracking-widest">Name *</label>
            <input
              id="name"
              name="name"
              required
              defaultValue={name || ""}
              className="w-full px-4 py-2 border border-[#7A0B2E]/20 rounded-none bg-white focus:outline-none focus:border-[#7A0B2E] text-[#2D1F2F]"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="email" className="block text-[10px] font-bold text-[#2D1F2F] uppercase tracking-widest">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              defaultValue={email || ""}
              className="w-full px-4 py-2 border border-[#7A0B2E]/20 rounded-none bg-white focus:outline-none focus:border-[#7A0B2E] text-[#2D1F2F]"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="phoneNumber" className="block text-[10px] font-bold text-[#2D1F2F] uppercase tracking-widest">Phone</label>
            <input
              id="phoneNumber"
              name="phoneNumber"
              defaultValue={phoneNumber || ""}
              className="w-full px-4 py-2 border border-[#7A0B2E]/20 rounded-none bg-white focus:outline-none focus:border-[#7A0B2E] text-[#2D1F2F]"
            />
          </div>
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={loading}
              className="bg-[#2D1F2F] hover:bg-[#220510] text-white px-6 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors disabled:opacity-50 rounded-none"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
