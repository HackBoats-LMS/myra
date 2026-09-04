"use client";
import { useState } from "react";
import { updateUserRole } from "@/actions/admin";
import { useToast } from "@/components/ui/Toast";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

const ROLE_LABELS: Record<"CUSTOMER" | "MULTI_WORKER", string> = {
  CUSTOMER: "Customer",
  MULTI_WORKER: "Staff / Worker",
};

export default function UserRoleSelect({
  userId,
  currentRole,
}: {
  userId: string;
  currentRole: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const next = e.target.value;
    if (next === currentRole) return;

    if (!confirm(`Are you sure you want to change this user's role to ${ROLE_LABELS[next as keyof typeof ROLE_LABELS]}?`)) {
      e.target.value = currentRole;
      return;
    }

    setLoading(true);
    try {
      await updateUserRole(userId, next as "CUSTOMER" | "MULTI_WORKER");
      toast.success("Role updated");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update role");
      e.target.value = currentRole;
    } finally {
      setLoading(false);
    }
  };

  if (currentRole === "ADMIN") {
    return (
      <span className="text-[10px] font-bold uppercase tracking-widest text-[#7A0B2E]">
        Admin
      </span>
    );
  }

  return (
    <div className="relative inline-block w-40">
      <select
        defaultValue={currentRole}
        onChange={handleChange}
        disabled={loading}
        className="w-full appearance-none rounded-none border border-[#7A0B2E]/30 bg-[#FAFAFA] px-3 py-1.5 pr-8 text-[10px] font-bold uppercase tracking-widest text-[#2D1F2F] outline-none focus:border-[#7A0B2E]"
      >
        {(["CUSTOMER", "MULTI_WORKER"] as const).map((r) => (
          <option key={r} value={r}>
            {ROLE_LABELS[r]}
          </option>
        ))}
      </select>
      {loading && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-[#7A0B2E]" />
        </div>
      )}
    </div>
  );
}
