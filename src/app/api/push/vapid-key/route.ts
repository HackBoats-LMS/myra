import { NextResponse } from "next/server";
import { getVapidPublicKey, isPushConfigured } from "@/lib/push";

export async function GET() {
  if (!isPushConfigured()) {
    return NextResponse.json({ publicKey: null });
  }
  return NextResponse.json({ publicKey: getVapidPublicKey() });
}