import Link from "next/link";
import CreateCouponForm from "./CreateCouponForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Coupon | Admin Portal",
};

export default function NewCouponPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6 rounded-none">
      <Link href="/admin/coupons" className="inline-flex items-center text-[10px] font-bold uppercase tracking-widest text-[#B6925B] hover:text-[#4A3B2C] transition-colors rounded-none gap-1">
        <i className="ri-arrow-left-line text-xs" />
        Back to Coupons
      </Link>
      
      <div className="border-b border-[#B6925B]/20 pb-6">
        <h2 className="text-3xl font-serif text-[#4A3B2C] tracking-wide">Create Coupon</h2>
        <p className="text-[10px] text-[#B6925B] uppercase tracking-widest font-bold mt-1">Generate a new discount code for your customers</p>
      </div>

      <div className="bg-white border border-[#B6925B]/20 p-6 md:p-8 shadow-sm rounded-none">
        <CreateCouponForm />
      </div>
    </div>
  );
}
