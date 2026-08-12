import Link from "next/link";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import CreateCouponForm from "./CreateCouponForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Coupon | Admin Portal",
};

export default function NewCouponPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link href="/admin/coupons" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 transition-colors">
        <ArrowLeftIcon className="w-4 h-4 mr-1" />
        Back to Coupons
      </Link>
      
      <div>
        <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Create Coupon</h2>
        <p className="text-sm text-gray-500 mt-1">Generate a new discount code for your customers</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6 md:p-8 shadow-sm">
        <CreateCouponForm />
      </div>
    </div>
  );
}
