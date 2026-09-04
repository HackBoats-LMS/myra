import Link from "next/link";
import CreateCouponForm from "./CreateCouponForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Coupon | Admin Portal",
};

export default function NewCouponPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6 rounded-none">

      
      <div className="border-b border-[#7A0B2E]/20 pb-6">
        <h2 className="text-3xl font-serif text-[#2D1F2F] tracking-wide">Create Coupon</h2>
        <p className="text-[10px] text-[#7A0B2E] uppercase tracking-widest font-bold mt-1">Generate a new discount code for your customers</p>
      </div>

      <div className="bg-white border border-[#7A0B2E]/20 p-6 md:p-8 shadow-sm rounded-none">
        <CreateCouponForm />
      </div>
    </div>
  );
}
