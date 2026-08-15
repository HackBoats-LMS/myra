"use server";
import { prisma } from "@/lib/prisma";
import { verifyDeliveryAgent } from "@/lib/auth-utils";

export async function getDeliveryOrders() {
  await verifyDeliveryAgent();

  return await prisma.order.findMany({
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
  });
}
