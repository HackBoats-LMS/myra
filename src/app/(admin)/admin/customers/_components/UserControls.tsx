"use client";
import { useState } from "react";
import { updateUserRole, updateWorkerCapabilities, toggleUserDisabled } from "@/actions/admin/admin";
import { useToast } from "@/components/ui/Toast";
import { useRouter } from "next/navigation";

const ROLE_LABELS: Record<string, string> = {
  CUSTOMER: "Customer",
  DELIVERY: "Delivery Agent",
  MULTI_WORKER: "Multi-Worker",
};

export function UserRoleSelect({ userId, currentRole }: { userId: string; currentRole: string }) {
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

export function WorkerCapabilitiesSelect({
  userId,
  canInventory,
  canShipping,
}: {
  userId: string;
  canInventory: boolean;
  canShipping: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [inventory, setInventory] = useState(canInventory);
  const [shipping, setShipping] = useState(canShipping);
  const [loading, setLoading] = useState(false);

  const save = async (next: { inventory: boolean; shipping: boolean }) => {
    setLoading(true);
    try {
      await updateWorkerCapabilities(userId, next);
      toast.success("Worker capabilities updated!");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update capabilities.");
    } finally {
      setLoading(false);
    }
  };

  const toggleInventory = async () => {
    const next = { inventory: !inventory, shipping };
    setInventory(next.inventory);
    await save(next);
  };

  const toggleShipping = async () => {
    const next = { inventory, shipping: !shipping };
    setShipping(next.shipping);
    await save(next);
  };

  return (
    <div className="flex flex-col gap-2 pt-1">
      <label className="inline-flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={inventory}
          onChange={toggleInventory}
          disabled={loading}
          className="w-4 h-4 accent-[#B6925B]"
        />
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#4A3B2C]">
          Inventory Management
        </span>
      </label>
      <label className="inline-flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={shipping}
          onChange={toggleShipping}
          disabled={loading}
          className="w-4 h-4 accent-[#B6925B]"
        />
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#4A3B2C]">
          Shipping Management
        </span>
      </label>
    </div>
  );
}

export function DisableUserButton({ userId, initialDisabled }: { userId: string; initialDisabled: boolean }) {
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
      className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-none text-xs font-bold uppercase tracking-widest transition-all shadow-sm disabled:opacity-50
        ${disabled 
          ? "bg-green-700 hover:bg-green-800 text-white" 
          : "bg-red-700 hover:bg-red-800 text-white"}`}
    >
      {loading ? (
        <i className="ri-loader-4-line animate-spin text-sm leading-none" />
      ) : disabled ? (
        <i className="ri-lock-unlock-line text-sm leading-none" />
      ) : (
        <i className="ri-lock-line text-sm leading-none" />
      )}
      <span>{disabled ? "Activate Account" : "Disable Account"}</span>
    </button>
  );
}