import { prisma } from "@/lib/db/prisma";
import EditCouponForm from "@/app/(admin)/admin/coupons/_components/EditCouponForm";

export const dynamic = "force-dynamic";

export default async function EditCouponPage({ params }: { params: { id: string } }) {
  const coupon = await prisma.coupon.findUnique({ where: { id: params.id } });
  if (!coupon) {
    return <div className="p-8 text-sm text-gray-500">Coupon not found.</div>;
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="font-serif text-2xl text-[#4A3B2C] mb-1">Edit Coupon</h1>
      <p className="text-xs text-gray-500 uppercase tracking-widest mb-6">{coupon.code}</p>
      <EditCouponForm
        coupon={{
          id: coupon.id,
          code: coupon.code,
          type: coupon.type,
          description: coupon.description,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          minOrderAmount: coupon.minOrderAmount,
          maxUses: coupon.maxUses,
          maxUsesPerUser: coupon.maxUsesPerUser,
          expiresAt: coupon.expiresAt,
        }}
      />
    </div>
  );
}