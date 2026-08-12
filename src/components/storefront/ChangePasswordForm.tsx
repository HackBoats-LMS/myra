"use client";
import { useState } from "react";
import { changePassword } from "@/actions/user";
import { useToast } from "@/components/ui/Toast";
import { ArrowPathIcon } from "@heroicons/react/24/outline";

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
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm mt-8 space-y-4">
      <h3 className="text-lg font-bold text-gray-900 tracking-tight">Security</h3>
      <p className="text-xs text-gray-500">Update your account login password</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            Current Password
          </label>
          <input
            required
            name="currentPassword"
            type="password"
            className="w-full bg-white border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#0D3B66] text-gray-900"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            New Password
          </label>
          <input
            required
            name="newPassword"
            type="password"
            minLength={6}
            className="w-full bg-white border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#0D3B66] text-gray-900"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            Confirm New Password
          </label>
          <input
            required
            name="confirmPassword"
            type="password"
            minLength={6}
            className="w-full bg-white border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#0D3B66] text-gray-900"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#0D3B66] hover:bg-[#082a4d] text-white py-2.5 rounded-md text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading && <ArrowPathIcon className="w-4 h-4 animate-spin" />}
          <span>Change Password</span>
        </button>
      </form>
    </div>
  );
}
