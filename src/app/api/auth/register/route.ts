import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { checkRateLimit, getClientIp, RateLimitError } from "@/lib/rate-limit";
import { normalizeIndianPhone } from "@/lib/phone";

export async function POST(req: Request) {
  try {
    const { name, phoneNumber, email, password } = await req.json();

    if (!phoneNumber || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Normalize the phone to a canonical form so the same real number can't be
    // registered in multiple formats (e.g. "+91 63010 67189" vs "6301067189").
    const normalizedPhone = normalizeIndianPhone(String(phoneNumber));
    if (!/^\d{10}$/.test(normalizedPhone)) {
      return NextResponse.json({ error: "Please enter a valid 10-digit mobile number." }, { status: 400 });
    }

    // Normalize email to lowercase so the same mailbox can't be registered in
    // different casings (e.g. "Bob@x.com" vs "bob@x.com").
    const normalizedEmail = email ? String(email).trim().toLowerCase() : null;

    // Rate-limit signup by IP and by identifier to prevent account flooding/brute force.
    // The identifier bucket always applies; the IP bucket is skipped when no
    // reliable per-client IP can be determined.
    const ip = getClientIp(req);
    try {
      if (ip) {
        await checkRateLimit({ bucket: "register:ip", key: ip, limit: 10, windowSeconds: 900 });
      }
      const identifier = String((normalizedPhone || email) ?? "").toLowerCase();
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
          { phoneNumber: normalizedPhone },
          ...(normalizedEmail ? [{ email: normalizedEmail }] : [])
        ]
      },
    });

    if (existingUser) {
      return NextResponse.json({ error: "Phone number or email already in use" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        phoneNumber: normalizedPhone,
        email: normalizedEmail,
        password: hashedPassword,
        role: "CUSTOMER",
      },
    });

    if (user.email) {
      const token = crypto.randomUUID();
      await prisma.verificationToken.create({
        data: {
          email: user.email,
          token,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        }
      });
      
      const { sendVerificationEmail, sendWelcomeEmail } = await import("@/lib/email");
      sendVerificationEmail(user.email, token).catch(console.error);
      sendWelcomeEmail(user.email, user.name || "there").catch(console.error);
    }

    return NextResponse.json({ user: { id: user.id, name: user.name, email: user.email } }, { status: 201 });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
