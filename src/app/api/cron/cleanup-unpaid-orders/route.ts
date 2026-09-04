import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { cleanupExpiredUnpaidOrders } from "@/lib/order-cleanup";
import { CACHE_TAGS } from "@/lib/cache";
import { verifyCronAuth } from "@/lib/cron-auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!verifyCronAuth(req)) {
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
