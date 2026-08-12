"use client";
import { useState } from "react";
import { deleteUserAccount } from "@/actions/user";
import { useToast } from "@/components/ui/Toast";
import { signOut } from "next-auth/react";
import { ArrowPathIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";

interface DeleteAccountCardProps {
  userEmail: string | null;
  userPhone: string | null;
}

export default function DeleteAccountCard({ userEmail, userPhone }: DeleteAccountCardProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmInput, setConfirmInput] = useState("");
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const expectedMatch = userEmail || userPhone || "";

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmInput.trim() !== expectedMatch) {
      toast.error("Input does not match your email or phone number.");
      return;
    }

    setLoading(true);
    try {
      await deleteUserAccount();
      toast.success("Account deleted successfully.");
      // Terminate next-auth session and redirect
      await signOut({ callbackUrl: "/login" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete account.");
      setLoading(false);
    }
  };

  return (
    <div className="bg-red-50/30 border border-red-200 rounded-lg p-6 shadow-sm mt-8 space-y-4">
      <div className="flex items-center gap-2 text-red-800">
        <ExclamationTriangleIcon className="w-5 h-5" />
        <h3 className="text-lg font-bold tracking-tight">Danger Zone</h3>
      </div>
      <p className="text-xs text-gray-500 leading-relaxed">
        Permanently delete your account and remove all saved addresses, shopping carts, wishlist items, 
        and reviews. This action is irreversible.
      </p>

      {!showConfirm ? (
        <button
          onClick={() => setShowConfirm(true)}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-md text-xs font-bold uppercase tracking-widest transition-colors shadow-sm"
        >
          Delete Account
        </button>
      ) : (
        <form onSubmit={handleDelete} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Confirm by typing your email or phone number (<span className="font-mono select-none">{expectedMatch}</span>):
            </label>
            <input
              required
              type="text"
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              className="w-full bg-white border border-red-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-red-500 text-gray-900"
              placeholder={expectedMatch}
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading || confirmInput.trim() !== expectedMatch}
              className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-md text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {loading && <ArrowPathIcon className="w-4 h-4 animate-spin" />}
              <span>Delete Permanently</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setShowConfirm(false);
                setConfirmInput("");
              }}
              className="px-4 py-2 text-xs font-medium text-gray-600 hover:text-gray-900 border border-gray-200 rounded-md"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
