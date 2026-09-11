import type { Prisma } from "@/generated/prisma";
import FlashSaleBannerClient from "./FlashSaleBannerClient";

type FlashSaleWithCollection = Prisma.FlashSaleGetPayload<{ include: { collection: true } }>;

interface FlashSaleBannerProps {
  sales: FlashSaleWithCollection[];
}

export default function FlashSaleBanner({ sales }: FlashSaleBannerProps) {
  if (sales.length === 0) return null;

  const sale = sales[0];
  const isPercent = sale.discountType === "PERCENTAGE";
  const discountLabel = isPercent ? `${Math.round(sale.value)}% OFF` : `₹${sale.value} OFF`;
  const href = sale.collectionId ? `/collections/${sale.collection?.slug ?? ""}` : "/collections";
  const endAt = typeof sale.endAt === "string" ? sale.endAt : sale.endAt.toISOString();

  return (
    <FlashSaleBannerClient
      title={sale.title}
      discountLabel={discountLabel}
      collectionName={sale.collection?.name ?? null}
      endAt={endAt}
      href={href}
    />
  );
}
