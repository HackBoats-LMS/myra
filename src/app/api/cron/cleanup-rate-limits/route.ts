import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { verifyCronAuth } from "@/lib/cron-auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!verifyCronAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Delete rate limit records older than 24 hours
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const result = await prisma.rateLimit.deleteMany({
    where: { windowStart: { lt: cutoff } },
  });

  return NextResponse.json({ deleted: result.count });
}
