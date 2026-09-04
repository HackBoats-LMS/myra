import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { verifyCronAuth } from "@/lib/cron-auth";

export async function POST(req: Request) {
  if (!verifyCronAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pending = await prisma.stockNotification.findMany({
    where: { sentAt: null },
    include: { product: { select: { id: true, name: true, slug: true, stockQuantity: true } } },
    distinct: ["productId"],
  });

  const inStock = pending.filter((p) => p.product.stockQuantity > 0);
  let notified = 0;
  for (const sub of inStock) {
    const { notifyStockSubscribers } = await import("@/actions/stock-alert");
    const res = await notifyStockSubscribers(sub.productId);
    notified += res.notified;
  }

  return NextResponse.json({ ok: true, notified });
}
