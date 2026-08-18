"use server";
import { prisma } from "@/lib/db/prisma";
import { unstable_cache } from "next/cache";
import { verifyDeliveryAgent } from "@/lib/auth/auth-utils";
import { CACHE_TAGS } from "@/lib/cache";
import type { Prisma } from "@/generated/prisma";

type DeliveryOrderRow = Prisma.OrderGetPayload<{
  include: {
    user: { select: { name: true; email: true; phoneNumber: true } };
    address: true;
    orderItems: { include: { product: { select: { name: true; images: true } } } };
  };
}>;

const getCachedDeliveryOrders = unstable_cache(
  async () => {
    return prisma.order.findMany({
      where: {
        status: {
          in: ["SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"]
        }
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phoneNumber: true,
          }
        },
        address: true,
        orderItems: {
          include: {
            product: {
              select: {
                name: true,
                images: true,
              }
            }
          }
        }
      },
      orderBy: { updatedAt: "desc" }
    }) as Promise<DeliveryOrderRow[]>;
  },
  ["delivery", "orders"],
  { tags: [CACHE_TAGS.deliveryOrders], revalidate: 30 }
);

export async function getDeliveryOrders() {
  await verifyDeliveryAgent();
  return getCachedDeliveryOrders();
}
