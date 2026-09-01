import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { cleanupExpiredUnpaidOrders } from "@/lib/order-cleanup";
import { CACHE_TAGS } from "@/lib/cache";
import crypto from "crypto";

export const runtime = "nodejs";

function verifyCronAuth(req: Request): boolean {
  if (!process.env.CRON_SECRET) return false;
  const auth = req.headers.get("authorization");
  if (!auth || !auth.startsWith("Bearer ")) return false;
  const token = auth.slice(7);
  const secret = process.env.CRON_SECRET;
  if (token.length !== secret.length) return false;
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(secret));
}

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
