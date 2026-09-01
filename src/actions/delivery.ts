"use server";
import { prisma } from "@/lib/db/prisma";
import { verifyDeliveryAgent } from "@/lib/auth/auth-utils";
import type { Prisma } from "@/generated/prisma";

type DeliveryOrderRow = Prisma.OrderGetPayload<{
  include: {
    user: { select: { name: true; email: true; phoneNumber: true } };
    address: true;
    orderItems: { include: { product: { select: { name: true; images: true } } } };
  };
}>;

export async function getDeliveryOrders(): Promise<DeliveryOrderRow[]> {
  await verifyDeliveryAgent();

  return prisma.order.findMany({
    where: {
      status: {
        in: ["SHIPPED", "OUT_FOR_DELIVERY"]
      },
      awbNumber: { not: null },
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
}
