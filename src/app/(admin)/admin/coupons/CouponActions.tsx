"use client";
import { useState } from "react";
import { toggleCouponStatus, deleteCoupon } from "@/actions/coupons";
import { useToast } from "@/components/ui/Toast";
import { ArrowPathIcon, TrashIcon, CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";

export default function CouponActions({ couponId, initialStatus }: { couponId: string; initialStatus: boolean }) {
  const [isActive, setIsActive] = useState(initialStatus);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleToggle = async () => {
    setLoading(true);
    try {
      await toggleCouponStatus(couponId, !isActive);
      setIsActive(!isActive);
      toast.success(!isActive ? "Coupon activated." : "Coupon deactivated.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update status.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this coupon? This action cannot be undone.")) return;
    setLoading(true);
    try {
      await deleteCoupon(couponId);
      toast.success("Coupon deleted.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete coupon.");
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-end gap-2">
      <button
        onClick={handleToggle}
        disabled={loading}
        className="p-1.5 text-gray-500 hover:text-[#0D3B66] hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
        title={isActive ? "Deactivate" : "Activate"}
      >
        {loading ? (
          <ArrowPathIcon className="w-5 h-5 animate-spin" />
        ) : isActive ? (
          <XCircleIcon className="w-5 h-5" />
        ) : (
          <CheckCircleIcon className="w-5 h-5" />
        )}
      </button>
      <button
        onClick={handleDelete}
        disabled={loading}
        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
        title="Delete"
      >
        <TrashIcon className="w-5 h-5" />
      </button>
    </div>
  );
}
