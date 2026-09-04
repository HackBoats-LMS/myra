import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { savePushSubscription, isPushConfigured } from "@/lib/push";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: Request) {
  if (!isPushConfigured()) {
    return NextResponse.json({ error: "Push notifications are not configured." }, { status: 400 });
  }

  // Rate-limit push subscription creation by IP
  try {
    const ip = getClientIp(req);
    await checkRateLimit({ bucket: "pushsub:ip", key: ip, limit: 20, windowSeconds: 3600 });
  } catch {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
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

  // Validate endpoint is a legitimate push service URL.
  try {
    const url = new URL(body.endpoint);
    const allowedHosts = [
      "fcm.googleapis.com",
      "updates.push.apple.com",
      "wns2-amt3.windows.com",
      "android.googleapis.com",
    ];
    // Use exact match or ".host" suffix to prevent bypasses like "evil-fcm.googleapis.com"
    if (!allowedHosts.some((host) => url.hostname === host || url.hostname.endsWith("." + host))) {
      return NextResponse.json({ error: "Invalid push endpoint." }, { status: 400 });
    }
    if (url.protocol !== "https:") {
      return NextResponse.json({ error: "Push endpoint must use HTTPS." }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid push endpoint URL." }, { status: 400 });
  }

  // Require authentication to prevent push subscription spam.
  let userId: string | null = null;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }
    userId = session.user.id;
  } catch {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  await savePushSubscription(body.endpoint, body.keys.p256dh, body.keys.auth, userId);
  return NextResponse.json({ ok: true });
}
