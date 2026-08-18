import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { cleanupExpiredUnpaidOrders } from "@/lib/order-cleanup";
import { CACHE_TAGS } from "@/lib/cache";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!process.env.CRON_SECRET) {
    return NextResponse.json({ error: "CRON_SECRET is not configured" }, { status: 500 });
  }

  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await cleanupExpiredUnpaidOrders();

  if (result.cancelled > 0) {
    revalidateTag(CACHE_TAGS.products, { expire: 0 });
    revalidateTag(CACHE_TAGS.workerOrders, { expire: 0 });
    revalidateTag(CACHE_TAGS.deliveryOrders, { expire: 0 });
  }

  return NextResponse.json({ ok: true, ...result });
}
