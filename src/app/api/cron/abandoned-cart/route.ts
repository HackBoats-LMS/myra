import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

const REMINDER_GAP_DAYS = 3;

export async function POST(req: Request) {
  if (!process.env.CRON_SECRET) {
    return NextResponse.json({ error: "CRON_SECRET is not configured" }, { status: 500 });
  }

  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - REMINDER_GAP_DAYS);

  // Eligible carts:
  //  - have at least one item
  //  - owner has no order in the last REMINDER_GAP_DAYS days
  //  - last reminder (if any) is older than REMINDER_GAP_DAYS
  const carts = await prisma.cart.findMany({
    where: {
      userId: { not: null },
      items: { some: {} },
      OR: [{ reminderSentAt: null }, { reminderSentAt: { lt: cutoff } }],
      user: {
        is: {
          email: { not: null },
          orders: {
            none: { createdAt: { gte: cutoff } },
          },
        },
      },
    },
    include: {
      user: { select: { id: true, email: true } },
      items: {
        include: { product: { select: { name: true } } },
        take: 5,
      },
    },
  });

  let sent = 0;
  for (const cart of carts) {
    if (!cart.user?.email || cart.items.length === 0) continue;

    const items = cart.items.map((i) => ({ name: i.product.name, quantity: i.quantity }));

    try {
      const { sendAbandonedCartEmail } = await import("@/lib/email/email");
      await sendAbandonedCartEmail(cart.user.email, items);
      await prisma.cart.update({
        where: { id: cart.id },
        data: { reminderSentAt: new Date() },
      });
      sent += 1;
    } catch (err) {
      console.error("Abandoned-cart email failed for", cart.user.email, err);
    }
  }

  return NextResponse.json({ ok: true, sent });
}