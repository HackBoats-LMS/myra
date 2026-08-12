"use client";
import { useState } from "react";
import { changePassword } from "@/actions/user";
import { useToast } from "@/components/ui/Toast";

export default function ChangePasswordForm() {
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);

    try {
      await changePassword(formData);
      toast.success("Password changed successfully!");
      (e.target as HTMLFormElement).reset();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to change password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-[#B6925B]/20 shadow-sm mt-8 relative rounded-none">
      <div className="p-6 border-b border-[#B6925B]/20 bg-[#FAFAFA]">
        <h3 className="text-xl font-serif text-[#4A3B2C] tracking-wide">Security</h3>
        <p className="text-[10px] text-[#B6925B] uppercase tracking-widest font-bold mt-1">Update your account login password</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 p-6">
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4A3B2C] mb-1">
            Current Password
          </label>
          <input
            required
            name="currentPassword"
            type="password"
            className="w-full bg-white border border-[#B6925B]/20 rounded-none px-3 py-2 text-sm focus:outline-none focus:border-[#B6925B] focus:ring-1 focus:ring-[#B6925B] text-[#4A3B2C] transition-all"
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4A3B2C] mb-1">
            New Password
          </label>
          <input
            required
            name="newPassword"
            type="password"
            minLength={6}
            className="w-full bg-white border border-[#B6925B]/20 rounded-none px-3 py-2 text-sm focus:outline-none focus:border-[#B6925B] focus:ring-1 focus:ring-[#B6925B] text-[#4A3B2C] transition-all"
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4A3B2C] mb-1">
            Confirm New Password
          </label>
          <input
            required
            name="confirmPassword"
            type="password"
            minLength={6}
            className="w-full bg-white border border-[#B6925B]/20 rounded-none px-3 py-2 text-sm focus:outline-none focus:border-[#B6925B] focus:ring-1 focus:ring-[#B6925B] text-[#4A3B2C] transition-all"
          />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#4A3B2C] hover:bg-[#34291f] text-white py-3 text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2 disabled:opacity-50 rounded-none"
          >
            {loading && <i className="ri-loader-4-line animate-spin text-base" />}
            <span>Change Password</span>
          </button>
        </div>
      </form>
    </div>
  );
}
