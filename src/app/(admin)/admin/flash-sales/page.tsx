import { prisma } from "@/lib/prisma";
import FlashSaleManager from "@/components/admin/FlashSaleManager";

export const dynamic = "force-dynamic";

export default async function AdminFlashSalesPage() {
  const [sales, collections] = await Promise.all([
    prisma.flashSale.findMany({ include: { collection: true }, orderBy: { endAt: "desc" } }),
    prisma.collection.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="border-b border-[#B6925B]/20 pb-4">
        <h1 className="text-3xl font-serif font-bold text-[#4A3B2C] tracking-wide">Flash Sales</h1>
        <p className="text-xs text-[#B6925B] font-bold uppercase tracking-widest mt-2">Create timed discounts with storefront countdowns</p>
      </div>
      <FlashSaleManager sales={sales} collections={collections} />
    </div>
  );
}