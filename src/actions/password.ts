"use server"
import { prisma } from "@/lib/db/prisma";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { sendEmail } from "@/lib/email/email";
import ResetPasswordEmail from "@/emails/ResetPasswordEmail";
import { checkRateLimit, getClientIp, RateLimitError } from "@/lib/rate-limit";

function sha256(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export async function generateResetToken(email: string, req?: { headers?: unknown }) {
  // Rate-limit password reset requests to prevent email bombing.
  try {
    const ip = req ? getClientIp(req) : "unknown";
    await checkRateLimit({ bucket: "reset:ip", key: ip, limit: 5, windowSeconds: 900 });
    await checkRateLimit({ bucket: "reset:id", key: email.toLowerCase(), limit: 3, windowSeconds: 900 });
  } catch (error) {
    if (error instanceof RateLimitError) {
      throw new Error("Too many password reset requests. Please try again later.");
    }
    throw error;
  }

  const user = await prisma.user.findUnique({ where: { email } });
  
  if (!user) {
    // We return success anyway to prevent email enumeration attacks
    return { success: true };
  }

  // Invalidate any previous unused tokens for this email to prevent old token abuse.
  await prisma.passwordResetToken.deleteMany({ where: { email } });

  // Generate secure random token and hash it before storage
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = sha256(token);
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

  await prisma.passwordResetToken.create({
    data: {
      email,
      token: tokenHash,
      expiresAt
    }
  });

  // Clean up expired tokens periodically (best-effort, non-blocking)
  prisma.passwordResetToken.deleteMany({
    where: { expiresAt: { lt: new Date() } }
  }).catch(() => {});

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
  if (!newPassword || newPassword.length < 8) throw new Error("Password must be at least 8 characters");
  if (newPassword.length > 128) throw new Error("Password must not exceed 128 characters");

  // Rate-limit password reset attempts
  try {
    await checkRateLimit({ bucket: "pwreset:token", key: token.slice(0, 16), limit: 5, windowSeconds: 900 });
  } catch (error) {
    if (error instanceof RateLimitError) {
      throw new Error("Too many reset attempts. Please request a new reset link.");
    }
    throw error;
  }

  // Hash the incoming token to match against stored hash
  const tokenHash = sha256(token);

  const resetRecord = await prisma.passwordResetToken.findUnique({
    where: { token: tokenHash }
  });

  if (!resetRecord) {
    throw new Error("Invalid or expired reset token");
  }

  if (new Date() > resetRecord.expiresAt) {
    throw new Error("Invalid or expired reset token");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);

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
