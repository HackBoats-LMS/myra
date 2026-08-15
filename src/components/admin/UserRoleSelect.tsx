"use client";
import { useState } from "react";
import { updateUserRole } from "@/actions/admin";
import { useToast } from "@/components/ui/Toast";
import { useRouter } from "next/navigation";

const ROLE_LABELS: Record<string, string> = {
  CUSTOMER: "Customer",
  DELIVERY: "Delivery Agent",
  MULTI_WORKER: "Multi-Worker",
};

export default function UserRoleSelect({ userId, currentRole }: { userId: string; currentRole: string }) {
  const router = useRouter();
  const toast = useToast();
  const [role, setRole] = useState(currentRole);
  const [loading, setLoading] = useState(false);

  if (currentRole === "ADMIN") {
    return (
      <span className="inline-flex items-center px-3 py-1 text-[10px] font-bold uppercase tracking-widest bg-[#4A3B2C] text-white">
        Admin
      </span>
    );
  }

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const next = e.target.value;
    setLoading(true);
    try {
      await updateUserRole(userId, next as "CUSTOMER" | "DELIVERY" | "MULTI_WORKER");
      setRole(next);
      toast.success("Role updated successfully!");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update role.");
      setRole(currentRole);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative inline-block">
      <select
        value={role}
        onChange={handleChange}
        disabled={loading}
        className="appearance-none bg-transparent border border-[#B6925B]/30 text-[10px] font-bold uppercase tracking-widest text-[#4A3B2C] rounded-none pl-3 pr-8 py-2 focus:outline-none focus:border-[#B6925B] disabled:opacity-50"
      >
        {(["CUSTOMER", "DELIVERY", "MULTI_WORKER"] as const).map((r) => (
          <option key={r} value={r}>
            {ROLE_LABELS[r]}
          </option>
        ))}
      </select>
      {loading && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center">
          <i className="ri-loader-4-line animate-spin text-sm text-[#B6925B]" />
        </div>
      )}
    </div>
  );
}