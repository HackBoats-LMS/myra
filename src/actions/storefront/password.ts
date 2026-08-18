"use server"
import { prisma } from "@/lib/db/prisma";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { sendEmail } from "@/lib/email/email";
import ResetPasswordEmail from "@/emails/ResetPasswordEmail";
import { checkRateLimit, RateLimitError } from "@/lib/rate-limit";

export async function generateResetToken(email: string) {
  // Emails are stored lowercase, so normalize the input or a reset request
  // typed with different casing would silently find no user.
  const normalizedEmail = (email || "").trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  
  if (!user) {
    // We return success anyway to prevent email enumeration attacks
    return { success: true };
  }

  // Generate secure random token
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

  await prisma.passwordResetToken.create({
    data: {
      email: normalizedEmail,
      token,
      expiresAt
    }
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const resetUrl = `${appUrl}/reset-password?token=${token}`;

  await sendEmail({
    to: email,
    subject: "Reset your Myra password",
    react: ResetPasswordEmail({ resetUrl })
  });

  return { success: true };
}

export async function resetPassword(token: string, newPassword: string) {
  if (!token) throw new Error("Missing reset token");
  if (!newPassword || newPassword.length < 6) throw new Error("Password must be at least 6 characters");

  // Defense-in-depth: limit rapid attempts against the same token (the token is
  // 256-bit random and single-use, so this is a cheap guard, not the primary
  // protection). Server actions don't expose a reliable client IP, so key on
  // the token itself.
  try {
    await checkRateLimit({ bucket: "password:reset", key: token, limit: 5, windowSeconds: 300 });
  } catch (error) {
    if (error instanceof RateLimitError) {
      throw new Error("Too many attempts. Please request a new reset link.");
    }
    throw error;
  }

  const resetRecord = await prisma.passwordResetToken.findUnique({
    where: { token }
  });

  if (!resetRecord) {
    throw new Error("Invalid reset token");
  }

  if (new Date() > resetRecord.expiresAt) {
    throw new Error("Reset token has expired");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // Update user password and invalidate token in one transaction
  await prisma.$transaction([
    prisma.user.update({
      where: { email: resetRecord.email },
      data: { password: hashedPassword }
    }),
    prisma.passwordResetToken.delete({
      where: { id: resetRecord.id }
    })
  ]);

  return { success: true };
}
