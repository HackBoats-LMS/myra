import { prisma } from "@/lib/prisma";
import webpush from "web-push";

const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || "mailto:support@myra.com";

export function isPushConfigured(): boolean {
  return Boolean(vapidPublic && vapidPrivate);
}

export function getVapidPublicKey(): string | null {
  return vapidPublic || null;
}

function getWebPush() {
  if (!vapidPublic || !vapidPrivate) {
    throw new Error("Push notifications are not configured (VAPID keys missing).");
  }
  webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);
  return webpush;
}

export async function savePushSubscription(
  endpoint: string,
  keysP256dh: string,
  keysAuth: string,
  userId: string | null
) {
  await prisma.pushSubscription.upsert({
    where: { endpoint },
    create: { endpoint, keysP256dh, keysAuth, userId },
    update: { keysP256dh, keysAuth, userId },
  });
}

/** Send a push notification to all stored subscriptions. Prunes invalid ones. */
export async function sendPushToAll(title: string, body: string, url = "/") {
  const webpush = getWebPush();
  const subs = await prisma.pushSubscription.findMany();

  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.keysP256dh, auth: sub.keysAuth },
        },
        JSON.stringify({ title, body, url })
      );
      await prisma.pushSubscription.update({
        where: { id: sub.id },
        data: { lastSentAt: new Date() },
      });
    } catch (err) {
      const code = (err as { statusCode?: number }).statusCode;
      // 404/410 means the subscription is gone/expired.
      if (code === 404 || code === 410) {
        await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
      }
    }
  }
  return subs.length;
}

export async function getPushSubscriptionCount() {
  return prisma.pushSubscription.count();
}