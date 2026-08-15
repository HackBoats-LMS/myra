import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { name, phoneNumber, email, password } = await req.json();

    if (!phoneNumber || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
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
      return NextResponse.json({ error: "Phone number or email already in use" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

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
