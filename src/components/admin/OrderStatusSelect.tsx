"use client";
import { useState } from "react";
import { updateOrderStatus } from "@/actions/admin";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { useToast } from "@/components/ui/Toast";
import { useRouter } from "next/navigation";

export default function OrderStatusSelect({ orderId, currentStatus }: { orderId: string, currentStatus: string }) {
  const router = useRouter();
  const toast = useToast();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    setIsUpdating(true);
    try {
      await updateOrderStatus(orderId, e.target.value as any);
      router.refresh();
    } catch (error) {
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
        className="appearance-none bg-white border border-gray-300 text-sm rounded-md pl-3 pr-8 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#0D3B66]/50 disabled:opacity-50"
      >
        <option value="PENDING">Pending</option>
        <option value="SHIPPED">Shipped</option>
        <option value="DELIVERED">Delivered</option>
        <option value="CANCELLED">Cancelled</option>
      </select>
      {isUpdating && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          <ArrowPathIcon className="w-3 h-3 animate-spin text-gray-500" />
        </div>
      )}
    </div>
  );
}
