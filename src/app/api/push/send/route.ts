import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { sendPushToAll, isPushConfigured } from "@/lib/push";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isPushConfigured()) {
    return NextResponse.json({ error: "Push notifications are not configured." }, { status: 400 });
  }

  let body: { title?: string; body?: string; url?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const title = (body.title || "").trim().replace(/<[^>]*>/g, "").slice(0, 100);
  const text = (body.body || "").trim().replace(/<[^>]*>/g, "").slice(0, 500);
  if (!title) {
    return NextResponse.json({ error: "Title is required." }, { status: 400 });
  }

  // Validate url: must be relative or same-origin, no javascript: protocol
  let targetUrl = body.url || "/";
  try {
    // Relative paths pass through; absolute URLs are checked for same-origin
    if (targetUrl.startsWith("http://") || targetUrl.startsWith("https://")) {
      const parsed = new URL(targetUrl, process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000");
      if (parsed.origin !== (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000")) {
        return NextResponse.json({ error: "URL must be same-origin." }, { status: 400 });
      }
      targetUrl = parsed.pathname + parsed.search + parsed.hash;
    }
    if (targetUrl.trim().toLowerCase().startsWith("javascript:")) {
      return NextResponse.json({ error: "Invalid URL." }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid URL." }, { status: 400 });
  }

  const sent = await sendPushToAll(title, text, targetUrl);
  return NextResponse.json({ ok: true, sent });
}
