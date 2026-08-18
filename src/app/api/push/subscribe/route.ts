import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { savePushSubscription, isPushConfigured } from "@/lib/push";
import { checkRateLimit, getClientIp, RateLimitError } from "@/lib/rate-limit";

export async function POST(req: Request) {
  if (!isPushConfigured()) {
    return NextResponse.json({ error: "Push notifications are not configured." }, { status: 400 });
  }

  // Prevent anonymous flooding of the push-subscription table (each row is later
  // hit by sendPushToAll, so unbounded rows are a real DoS cost). Keyed by IP
  // when a reliable per-client IP is available.
  const clientIp = getClientIp(req);
  if (clientIp) {
    try {
      await checkRateLimit({ bucket: "push:subscribe", key: clientIp, limit: 20, windowSeconds: 3600 });
    } catch (error) {
      if (error instanceof RateLimitError) {
        return NextResponse.json({ error: "Too many subscriptions. Please try again later." }, { status: 429 });
      }
      throw error;
    }
  }

  let body: { endpoint?: string; keys?: { p256dh?: string; auth?: string } };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  if (!body.endpoint || !body.keys?.p256dh || !body.keys.auth) {
    return NextResponse.json({ error: "Incomplete subscription." }, { status: 400 });
  }

  let userId: string | null = null;
  try {
    const session = await getServerSession(authOptions);
    userId = session?.user?.id ?? null;
  } catch {
    // keep anonymous subscription
  }

  await savePushSubscription(body.endpoint, body.keys.p256dh, body.keys.auth, userId);
  return NextResponse.json({ ok: true });
}