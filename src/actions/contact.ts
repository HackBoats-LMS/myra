"use server";
import { prisma } from "@/lib/db/prisma";

function escapeHtml(str: string): string {
  return str
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

  // Rate-limit contact form submissions by email
  const { checkRateLimit } = await import("@/lib/rate-limit");
  try {
    await checkRateLimit({ bucket: "contact:id", key: email.toLowerCase(), limit: 5, windowSeconds: 3600 });
  } catch {
    throw new Error("Too many messages from this email. Please try again later.");
  }

  const { resendSend } = await import("@/lib/email/email-raw");
  await resendSend({
    to: process.env.ADMIN_EMAIL || "support@myra.com",
    subject: `Contact form: ${escapeHtml(subject)}`,
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
  const email = String(formData.get("email") || "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Please enter a valid email address.");
  }

  await prisma.newsletter.upsert({
    where: { email },
    create: { email },
    update: {},
  });

  return { ok: true as const };
}
