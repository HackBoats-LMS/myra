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

  const title = (body.title || "").trim().replace(/<[^>]*>/g, "");
  const text = (body.body || "").trim().replace(/<[^>]*>/g, "");
  if (!title) {
    return NextResponse.json({ error: "Title is required." }, { status: 400 });
  }

  const sent = await sendPushToAll(title, text, body.url || "/");
  return NextResponse.json({ ok: true, sent });
}
