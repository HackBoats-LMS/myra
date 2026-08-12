"use client";
import { useState } from "react";
import { updateOrderStatus } from "@/actions/admin";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { useToast } from "@/components/ui/Toast";
import { useRouter } from "next/navigation";
import type { OrderStatus } from "@/generated/prisma";

export default function OrderStatusSelect({ orderId, currentStatus }: { orderId: string, currentStatus: string }) {
  const router = useRouter();
  const toast = useToast();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    setIsUpdating(true);
    try {
      await updateOrderStatus(orderId, e.target.value as OrderStatus);
      router.refresh();
    } catch {
      toast.error("Failed to update status.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="relative inline-block">
      <select 
        value={currentStatus} 
        onChange={handleChange}
        disabled={isUpdating}
        className="appearance-none bg-transparent border border-[#B6925B]/30 text-[10px] font-bold uppercase tracking-widest text-[#4A3B2C] rounded-none pl-3 pr-8 py-2 focus:outline-none focus:border-[#B6925B] disabled:opacity-50"
      >
        <option value="PENDING">Pending</option>
        <option value="SHIPPED">Shipped</option>
        <option value="DELIVERED">Delivered</option>
        <option value="CANCELLED">Cancelled</option>
      </select>
      {isUpdating && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          <ArrowPathIcon className="w-3 h-3 animate-spin text-[#B6925B]" />
        </div>
      )}
    </div>
  );
}
