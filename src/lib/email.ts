import { Resend } from "resend";

// Initialize Resend with API key if available, otherwise just mock it for dev
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

interface SendEmailOptions {
  to: string;
  subject: string;
  react: React.ReactElement;
}

export async function sendEmail({ to, subject, react }: SendEmailOptions) {
  if (!resend) {
    console.log("=========================================");
    console.log("📧 MOCK EMAIL SENT");
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log("=========================================");
    return;
  }

  await retry(() =>
    resend.emails.send({
      from: "Myra Shopping Mall <noreply@myra.com>",
      to,
      subject,
      react,
    })
  );
}

// Retry transient (network/5xx) failures up to 3 times with small backoff.
async function retry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i < attempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, 500 * (i + 1)));
      }
    }
  }
  console.error("Failed to send email after retries:", lastError);
  throw new Error("Failed to send email");
}

export async function sendVerificationEmail(email: string, token: string) {
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/verify?token=${token}`;
  
  if (!resend) {
    console.log("=========================================");
    console.log("📧 MOCK EMAIL SENT");
    console.log(`To: ${email}`);
    console.log(`Subject: Verify your email address - Myra Shopping Mall`);
    console.log(`Verification URL: ${verificationUrl}`);
    console.log("=========================================");
    return;
  }

  try {
    await resend.emails.send({
      from: "Myra Shopping Mall <noreply@myra.com>", // In production, this must be a verified domain
      to: email,
      subject: "Verify your email address - Myra Shopping Mall",
      html: `
        <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; border: 1px solid #B6925B; padding: 24px; border-top: 4px solid #4A3B2C;">
          <h2 style="font-family: serif; color: #4A3B2C; text-align: center;">Welcome to Myra!</h2>
          <p style="color: #555; font-size: 14px;">Please verify your email address by clicking the button below:</p>
          <div style="text-align: center; margin: 24px 0;">
            <a href="${verificationUrl}" style="display: inline-block; padding: 12px 24px; background-color: #4A3B2C; color: white; text-decoration: none; font-weight: bold; border: 1px solid #B6925B; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em;">Verify Email</a>
          </div>
          <p style="margin-top: 24px; font-size: 11px; color: #888; border-top: 1px solid #eee; padding-top: 12px;">If you didn't create an account, you can safely ignore this email.</p>
        </div>
      `,
    });
  } catch (error) {
    console.error("Failed to send verification email:", error);
    throw new Error("Failed to send verification email");
  }
}

export async function sendWelcomeEmail(email: string, name: string) {
  const WelcomeEmail = (await import("@/emails/WelcomeEmail")).default;
  await sendEmail({
    to: email,
    subject: "Welcome to Myra Shopping Mall!",
    react: WelcomeEmail({ name }),
  });
}

export async function sendOrderShippedEmail(email: string, orderId: string, trackingUrl?: string) {
  const shortOrderId = orderId.split('-')[0].toUpperCase();
  const subject = `Your order #${shortOrderId} has shipped!`;

  const OrderShippedEmail = (await import("@/emails/OrderShippedEmail")).default;

  await sendEmail({
    to: email,
    subject,
    react: OrderShippedEmail({ orderId, trackingUrl })
  });
}

export async function sendLowStockAlert(items: { name: string; stockQuantity: number }[]) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return;

  const rows = items
    .map((item) => `• ${item.name} — ${item.stockQuantity} left`)
    .join("\n");

  if (!resend) {
    console.log("📧 [LOW STOCK] Notifying admin:");
    console.log(rows);
    return;
  }

  await retry(() =>
    resend.emails.send({
      from: "Myra Shopping Mall <noreply@myra.com>",
      to: adminEmail,
      subject: "Low stock alert — Myra Shopping Mall",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #B6925B; padding: 24px; border-top: 4px solid #4A3B2C;">
          <h2 style="font-family: serif; color: #4A3B2C;">Low Stock Alert</h2>
          <p style="color: #555; font-size: 14px;">The following products are running low:</p>
          <pre style="white-space: pre-line; background:#FAFAFA; padding:12px; border: 1px solid #eee;">${rows}</pre>
        </div>
      `,
    })
  );
}

export async function sendAbandonedCartEmail(email: string, items: { name: string; quantity: number }[]) {
  const cartUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/cart`;
  const rows = items
    .map((item) => `• ${escapeHtml(item.name)} × ${item.quantity}`)
    .join("<br/>");

  if (!resend) {
    console.log("📧 [ABANDONED CART] Reminding:");
    console.log(rows);
    return;
  }

  await retry(() =>
    resend.emails.send({
      from: "Myra Shopping Mall <noreply@myra.com>",
      to: email,
      subject: "Your Myra bag is waiting for you",
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;border: 1px solid #B6925B;padding:24px;border-top:4px solid #4A3B2C;">
          <h2 style="font-family: serif; color: #4A3B2C;">Did you forget something?</h2>
          <p style="color: #555; font-size: 14px;">We saved the following items in your bag:</p>
          <div style="background:#FAFAFA;padding:12px;border:1px solid #eee;margin-bottom:16px;">${rows}</div>
          <div style="text-align: center;">
            <a href="${cartUrl}" style="display:inline-block;padding:12px 24px;background:#4A3B2C;color:#fff;text-decoration:none;font-weight:bold;border: 1px solid #B6925B;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;">Return to your bag</a>
          </div>
        </div>
      `,
    })
  );
}

export async function sendStockBackInStockEmail(email: string, productName: string, productUrl: string) {
  if (!resend) {
    console.log("📧 [BACK IN STOCK] Notifying:", productName, "->", email);
    return;
  }
  await retry(() =>
    resend.emails.send({
      from: "Myra Shopping Mall <noreply@myra.com>",
      to: email,
      subject: `${productName} is back in stock!`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;border: 1px solid #B6925B;padding:24px;border-top:4px solid #4A3B2C;">
          <h2 style="font-family: serif; color: #4A3B2C;">Good news!</h2>
          <p style="color: #555; font-size: 14px;">The item you were waiting for is back in stock:</p>
          <p style="font-size: 16px; font-weight: bold; color: #4A3B2C;">${escapeHtml(productName)}</p>
          <div style="text-align: center;">
            <a href="${productUrl}" style="display:inline-block;padding:12px 24px;background:#4A3B2C;color:#fff;text-decoration:none;font-weight:bold;border: 1px solid #B6925B;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;">Shop it now</a>
          </div>
        </div>
      `,
    })
  );
}

export async function sendOrderDeliveredEmail(email: string, orderId: string) {
  const shortOrderId = orderId.split('-')[0].toUpperCase();
  const subject = `Your order #${shortOrderId} has been delivered!`;

  const OrderDeliveredEmail = (await import("@/emails/OrderDeliveredEmail")).default;

  await sendEmail({
    to: email,
    subject,
    react: OrderDeliveredEmail({ orderId })
  });
}

interface AdminOrderSummary {
  orderId: string;
  customerName: string;
  totalAmount: number;
  paymentMethod?: string;
  itemCount: number;
}

export async function sendAdminNewOrderEmail(order: AdminOrderSummary) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return;

  const shortOrderId = order.orderId.split('-')[0].toUpperCase();
  const rows = [
    `Order ID: #${shortOrderId}`,
    `Customer: ${escapeHtml(order.customerName)}`,
    `Items: ${order.itemCount}`,
    `Payment: ${order.paymentMethod || "N/A"}`,
    `Total: ₹${order.totalAmount.toFixed(2)}`,
  ].join("\n");

  if (!resend) {
    console.log("📧 [NEW ORDER] Notifying admin:");
    console.log(rows);
    return;
  }

  await retry(() =>
    resend.emails.send({
      from: "Myra Shopping Mall <noreply@myra.com>",
      to: adminEmail,
      subject: `New order #${shortOrderId} — Myra Shopping Mall`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #B6925B; padding: 24px; border-top: 4px solid #4A3B2C;">
          <h2 style="font-family: serif; color: #4A3B2C;">New Order Received</h2>
          <pre style="white-space: pre-line; background:#FAFAFA; padding:12px; border: 1px solid #eee;">${rows}</pre>
          <div style="text-align:center;margin:24px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/admin/orders/${order.orderId}" style="display:inline-block;padding:12px 24px;background:#4A3B2C;color:#fff;text-decoration:none;font-weight:bold;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;">View Order</a>
          </div>
        </div>
      `,
    })
  );
}

export async function sendAdminNewReturnEmail(input: {
  requestId: string;
  itemName: string;
  reason: string;
  customerName: string;
}) {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return;

  const rows = [
    `Request ID: #${input.requestId.split('-')[0].toUpperCase()}`,
    `Customer: ${escapeHtml(input.customerName)}`,
    `Item: ${escapeHtml(input.itemName)}`,
    `Reason: ${escapeHtml(input.reason)}`,
  ].join("\n");

  if (!resend) {
    console.log("📧 [NEW RETURN] Notifying admin:");
    console.log(rows);
    return;
  }

  await retry(() =>
    resend.emails.send({
      from: "Myra Shopping Mall <noreply@myra.com>",
      to: adminEmail,
      subject: `New return/replacement request — Myra Shopping Mall`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #B6925B; padding: 24px; border-top: 4px solid #4A3B2C;">
          <h2 style="font-family: serif; color: #4A3B2C;">New Return Request</h2>
          <pre style="white-space: pre-line; background:#FAFAFA; padding:12px; border: 1px solid #eee;">${rows}</pre>
          <div style="text-align:center;margin:24px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/admin/returns/${input.requestId}" style="display:inline-block;padding:12px 24px;background:#4A3B2C;color:#fff;text-decoration:none;font-weight:bold;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;">Review Request</a>
          </div>
        </div>
      `,
    })
  );
}
