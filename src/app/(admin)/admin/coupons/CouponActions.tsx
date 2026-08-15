"use client";
import { useState } from "react";
import Link from "next/link";
import { toggleCouponStatus, deleteCoupon } from "@/actions/coupons";
import { useToast } from "@/components/ui/Toast";

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
      <Link
        href={`/admin/coupons/${couponId}`}
        className="p-1.5 text-[#B6925B] hover:text-[#4A3B2C] hover:bg-[#FAFAFA] border border-[#B6925B]/20 rounded-none transition-colors flex items-center justify-center"
        title="Edit"
      >
        <i className="ri-pencil-line text-lg" />
      </Link>
      <button
        onClick={handleToggle}
        disabled={loading}
        className="p-1.5 text-[#B6925B] hover:text-[#4A3B2C] hover:bg-[#FAFAFA] border border-[#B6925B]/20 rounded-none transition-colors disabled:opacity-50 flex items-center justify-center"
        title={isActive ? "Deactivate" : "Activate"}
      >
        {loading ? (
          <i className="ri-loader-4-line animate-spin text-lg" />
        ) : isActive ? (
          <i className="ri-close-circle-line text-lg" />
        ) : (
          <i className="ri-checkbox-circle-line text-lg" />
        )}
      </button>
      <button
        onClick={handleDelete}
        disabled={loading}
        className="p-1.5 text-gray-400 hover:text-red-700 hover:bg-red-50 border border-transparent rounded-none transition-colors disabled:opacity-50 flex items-center justify-center"
        title="Delete"
      >
        <i className="ri-delete-bin-line text-lg" />
      </button>
    </div>
  );
}
