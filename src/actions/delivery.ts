"use server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { verifyDeliveryAgent } from "@/lib/auth-utils";
import { logAudit } from "@/lib/audit";

export async function getDeliveryOrders() {
  await verifyDeliveryAgent();

  return await prisma.order.findMany({
    where: {
      status: {
        in: ["SHIPPED", "DELIVERED", "CANCELLED"]
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

export async function updateDeliveryStatusAction(orderId: string, status: "DELIVERED" | "CANCELLED" | "SHIPPED") {
  await verifyDeliveryAgent();

  await prisma.order.update({
    where: { id: orderId },
    data: { status }
  });

  await logAudit("order.deliveryStatusUpdate", "Order", orderId, { status });

  revalidatePath("/delivery");
  revalidatePath("/account");
  revalidatePath(`/account/orders/${orderId}`);
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
}
