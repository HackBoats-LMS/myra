"use client";
import { useState } from "react";
import Link from "next/link";
import { toggleCouponStatus, deleteCoupon } from "@/actions/coupons";
import { useToast } from "@/components/ui/Toast";
import { Pencil, Loader2, XCircle, CheckCircle2, Trash2 } from "lucide-react";

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
        className="p-1.5 text-[#7A0B2E] hover:text-[#2D1F2F] hover:bg-[#FAFAFA] border border-[#7A0B2E]/20 rounded-none transition-colors flex items-center justify-center"
        title="Edit"
      >
        <Pencil className="w-4 h-4" />
      </Link>
      <button
        onClick={handleToggle}
        disabled={loading}
        className="p-1.5 text-[#7A0B2E] hover:text-[#2D1F2F] hover:bg-[#FAFAFA] border border-[#7A0B2E]/20 rounded-none transition-colors disabled:opacity-50 flex items-center justify-center"
        title={isActive ? "Deactivate" : "Activate"}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isActive ? (
          <XCircle className="w-4 h-4" />
        ) : (
          <CheckCircle2 className="w-4 h-4" />
        )}
      </button>
      <button
        onClick={handleDelete}
        disabled={loading}
        className="p-1.5 text-gray-400 hover:text-red-700 hover:bg-red-50 border border-transparent rounded-none transition-colors disabled:opacity-50 flex items-center justify-center"
        title="Delete"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
