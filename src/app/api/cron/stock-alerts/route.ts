import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function POST(req: Request) {
  if (!process.env.CRON_SECRET) {
    return NextResponse.json({ error: "CRON_SECRET is not configured" }, { status: 500 });
  }
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
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