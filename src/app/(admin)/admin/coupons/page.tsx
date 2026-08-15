import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import Link from "next/link";
import CouponActions from "./CouponActions";
import { Coupon } from "@/generated/prisma";

const TYPE_LABELS: Record<string, { label: string; classes: string }> = {
  STANDARD: { label: "Standard", classes: "bg-gray-50 text-gray-700 border-gray-200" },
  FIRST_ORDER: { label: "First Order", classes: "bg-blue-50 text-blue-700 border-blue-200" },
  SINGLE_USE: { label: "Single Use", classes: "bg-purple-50 text-purple-700 border-purple-200" },
  FESTIVAL: { label: "Festival", classes: "bg-amber-50 text-amber-700 border-amber-200" },
  SHIPPING: { label: "Shipping", classes: "bg-teal-50 text-teal-700 border-teal-200" },
};

export const metadata: Metadata = {
  title: "Manage Coupons | Admin Portal",
};

export default async function AdminCouponsPage() {
  let coupons: Coupon[] = [];
  try {
    coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
    });
  } catch (error) {
    console.warn("Database unreachable in AdminCouponsPage:", error);
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 rounded-none">
      <div className="flex items-center justify-between border-b border-[#B6925B]/20 pb-4">
        <div>
          <h2 className="text-3xl font-serif font-bold text-[#4A3B2C] tracking-wide">Coupons & Discounts</h2>
          <p className="text-xs text-[#B6925B] font-bold uppercase tracking-widest mt-2">Create and manage promo codes for your store</p>
        </div>
        <Link 
          href="/admin/coupons/new"
          className="inline-flex items-center gap-2 bg-[#B6925B] hover:bg-[#9c7d4e] text-white px-4 py-2 text-xs font-bold uppercase tracking-widest transition-colors shadow-sm rounded-none"
        >
          <i className="ri-plus-line text-sm" />
          Create Coupon
        </Link>
      </div>

      <div className="bg-white border border-[#B6925B]/20 relative">
        <table className="w-full text-left text-sm text-[#4A3B2C]">
          <thead className="bg-[#FAFAFA] text-[#B6925B] text-[10px] uppercase font-bold tracking-widest border-b border-[#B6925B]/20">
            <tr>
              <th className="px-6 py-4 border-r border-[#B6925B]/10">Code</th>
              <th className="px-6 py-4 border-r border-[#B6925B]/10">Offer Type</th>
              <th className="px-6 py-4 border-r border-[#B6925B]/10">Discount</th>
              <th className="px-6 py-4 border-r border-[#B6925B]/10">Usage Limits</th>
              <th className="px-6 py-4 border-r border-[#B6925B]/10">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#B6925B]/10">
            {coupons.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500 text-xs font-bold uppercase tracking-widest">
                  No coupons found. Create your first discount code!
                </td>
              </tr>
            ) : (
              coupons.map((coupon) => {
                const isExpired = coupon.expiresAt && new Date(coupon.expiresAt) < new Date();
                const limitReached = coupon.maxUses && coupon.timesUsed >= coupon.maxUses;
                const isInactive = !coupon.isActive || isExpired || limitReached;

                return (
                  <tr key={coupon.id} className="hover:bg-[#FAFAFA] transition-colors group">
                    <td className="px-6 py-4 border-r border-[#B6925B]/10">
                      <span className="font-mono font-bold text-[#B6925B] text-sm uppercase tracking-widest">{coupon.code}</span>
                      {coupon.description && (
                        <p className="text-[11px] text-gray-500 mt-1">{coupon.description}</p>
                      )}
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Min. Order: Rs. {coupon.minOrderAmount.toFixed(2)}</p>
                    </td>
                    <td className="px-6 py-4 border-r border-[#B6925B]/10">
                      <span className={`inline-flex items-center px-2 py-1 border text-[10px] font-bold uppercase tracking-widest ${TYPE_LABELS[coupon.type]?.classes || TYPE_LABELS.STANDARD.classes}`}>
                        {TYPE_LABELS[coupon.type]?.label || coupon.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-[#4A3B2C] border-r border-[#B6925B]/10">
                      {coupon.discountType === "PERCENTAGE" 
                        ? `${coupon.discountValue}% OFF` 
                        : `Rs. ${coupon.discountValue.toFixed(2)} OFF`}
                    </td>
                    <td className="px-6 py-4 text-[10px] text-gray-500 font-bold uppercase tracking-widest space-y-1 border-r border-[#B6925B]/10">
                      <p>{coupon.timesUsed} / {coupon.maxUses || "∞"} used</p>
                      {coupon.maxUsesPerUser && (
                        <p>{coupon.maxUsesPerUser}× per customer</p>
                      )}
                      {coupon.expiresAt && (
                        <p>Expires: {new Date(coupon.expiresAt).toLocaleDateString()}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 border-r border-[#B6925B]/10">
                      <span className={`inline-flex items-center px-2 py-1 border text-[10px] font-bold uppercase tracking-widest
                        ${!isInactive ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}`}>
                        {!isInactive ? "Active" : isExpired ? "Expired" : limitReached ? "Limit Reached" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <CouponActions couponId={coupon.id} initialStatus={coupon.isActive} />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
