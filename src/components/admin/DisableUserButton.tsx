"use client";
import { useState } from "react";
import { toggleUserDisabled } from "@/actions/admin";
import { useToast } from "@/components/ui/Toast";
import { ArrowPathIcon, LockClosedIcon, LockOpenIcon } from "@heroicons/react/24/outline";

export default function DisableUserButton({ userId, initialDisabled }: { userId: string; initialDisabled: boolean }) {
  const [disabled, setDisabled] = useState(initialDisabled);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleToggle = async () => {
    setLoading(true);
    try {
      await toggleUserDisabled(userId, !disabled);
      setDisabled(!disabled);
      toast.success(
        !disabled ? "User account disabled successfully." : "User account activated successfully."
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update user account status.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-md text-xs font-bold uppercase tracking-widest transition-all shadow-sm disabled:opacity-50
        ${disabled 
          ? "bg-green-700 hover:bg-green-800 text-white" 
          : "bg-red-700 hover:bg-red-800 text-white"}`}
    >
      {loading ? (
        <ArrowPathIcon className="w-4 h-4 animate-spin" />
      ) : disabled ? (
        <LockOpenIcon className="w-4 h-4" />
      ) : (
        <LockClosedIcon className="w-4 h-4" />
      )}
      <span>{disabled ? "Activate Account" : "Disable Account"}</span>
    </button>
  );
}
