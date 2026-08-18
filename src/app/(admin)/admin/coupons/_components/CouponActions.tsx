"use client";
import { useState } from "react";
import Link from "next/link";
import { toggleCouponStatus, deleteCoupon } from "@/actions/admin/coupons";
import { useToast } from "@/components/ui/Toast";
import DeleteButton from "@/components/shared/DeleteButton";

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
      <DeleteButton
        id={couponId}
        entityName="coupon"
        deleteAction={deleteCoupon}
        className="p-1.5 text-gray-400 hover:text-red-700 hover:bg-red-50 border border-transparent"
      />
    </div>
  );
}
