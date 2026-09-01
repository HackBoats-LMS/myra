"use client";
import { useState } from "react";
import { updateWorkerCapabilities } from "@/actions/admin";
import { useToast } from "@/components/ui/Toast";
import { useRouter } from "next/navigation";

export default function WorkerCapabilitiesSelect({
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
