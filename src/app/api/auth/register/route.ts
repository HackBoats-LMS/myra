import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { checkRateLimit, getClientIp, RateLimitError } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    const { name, phoneNumber, email, password } = await req.json();

    if (!phoneNumber || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }
    if (password.length > 128) {
      return NextResponse.json({ error: "Password must not exceed 128 characters" }, { status: 400 });
    }

    // Validate phone number format (exactly 10 digits)
    if (!/^\d{10}$/.test(String(phoneNumber).trim())) {
      return NextResponse.json({ error: "Phone number must be exactly 10 digits" }, { status: 400 });
    }

    // Validate email format if provided
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim())) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    // Validate name length if provided
    if (name && String(name).trim().length > 100) {
      return NextResponse.json({ error: "Name must not exceed 100 characters" }, { status: 400 });
    }

    // Rate-limit signup by IP and by identifier to prevent account flooding/brute force.
    const ip = getClientIp(req);
    try {
      await checkRateLimit({ bucket: "register:ip", key: ip, limit: 10, windowSeconds: 900 });
      const identifier = String(phoneNumber ?? email ?? "").toLowerCase();
      await checkRateLimit({ bucket: "register:id", key: identifier, limit: 5, windowSeconds: 900 });
    } catch (error) {
      if (error instanceof RateLimitError) {
        return NextResponse.json(
          { error: error.message, retryAfterSeconds: error.retryAfterSeconds },
          { status: 429 }
        );
      }
      throw error;
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { phoneNumber },
          ...(email ? [{ email }] : [])
        ]
      },
    });

    if (existingUser) {
      return NextResponse.json({ error: "An account with these details already exists" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        phoneNumber,
        email: email || null,
        password: hashedPassword,
        role: "CUSTOMER",
      },
    });

    if (user.email) {
      const rawToken = crypto.randomUUID();
      const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
      await prisma.verificationToken.create({
        data: {
          email: user.email,
          token: tokenHash,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        }
      });
      
      const { sendVerificationEmail, sendWelcomeEmail } = await import("@/lib/email/email");
      sendVerificationEmail(user.email, rawToken).catch((err) => {
        console.error("Failed to send verification email:", err);
      });
      sendWelcomeEmail(user.email, user.name || "there").catch((err) => {
        console.error("Failed to send welcome email:", err);
      });
    }

    return NextResponse.json({ user: { name: user.name, email: user.email } }, { status: 201 });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
