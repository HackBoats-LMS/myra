"use server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, RateLimitError } from "@/lib/rate-limit";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function sendContactMessage(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const subject = String(formData.get("subject") || "").trim();
  const message = String(formData.get("message") || "").trim();

  if (!name || !email || !subject || !message) {
    throw new Error("All fields are required.");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Please enter a valid email address.");
  }

  // Public, unauthenticated server action that emails the admin, so throttle by
  // sender address to blunt inbox flooding. (No reliable client IP is available
  // in server actions; this is defense-in-depth, not a hard guarantee.)
  try {
    await checkRateLimit({ bucket: "contact:message", key: email.toLowerCase(), limit: 3, windowSeconds: 3600 });
  } catch (error) {
    if (error instanceof RateLimitError) {
      throw new Error("Too many messages from this address. Please try again later.");
    }
    throw error;
  }

  const { resendSend } = await import("@/lib/email-raw");
  await resendSend({
    to: process.env.ADMIN_EMAIL || "support@myra.com",
    subject: `Contact form: ${subject}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;border:1px solid #B6925B;padding:24px;border-top:4px solid #4A3B2C;">
        <h2 style="font-family:serif;color:#4A3B2C;">New Contact Message</h2>
        <p><strong>Name:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
        <div style="background:#FAFAFA;padding:12px;border:1px solid #eee;margin-top:12px;white-space:pre-line;">${escapeHtml(message)}</div>
      </div>
    `,
  });
}

export async function subscribeNewsletter(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Please enter a valid email address.");
  }

  // Throttle repeated signups for the same address to limit newsletter-table flooding.
  try {
    await checkRateLimit({ bucket: "newsletter:email", key: email, limit: 5, windowSeconds: 3600 });
  } catch (error) {
    if (error instanceof RateLimitError) {
      throw new Error("Too many signups. Please try again later.");
    }
    throw error;
  }

  await prisma.newsletter.upsert({
    where: { email },
    create: { email },
    update: {},
  });

  return { ok: true as const };
}