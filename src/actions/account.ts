"use server";
import { prisma } from "@/lib/db/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";

function csvEscape(value: string | number | null | undefined): string {
  const s = value == null ? "" : String(value);
  // Neutralize spreadsheet formula injection (fields beginning with =, +, -, @).
  const trimmed = s.trim();
  if (/^[=+\-@]/.test(trimmed)) {
    return `'${s.replace(/"/g, '""')}`;
  }
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function toCsv(rows: (string | number | null | undefined)[][]): string {
  return rows.map((row) => row.map(csvEscape).join(",")).join("\n");
}

export async function exportOrdersCsv(): Promise<{ ok: true; csv: string; filename: string }> {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    throw new Error("You must be logged in to export orders.");
  }

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      orderItems: { include: { product: true } },
    },
  });

  const header = [
    "Order ID",
    "Date",
    "Status",
    "Payment",
    "Payment Status",
    "Items",
    "Item Total",
    "Shipping",
    "Discount",
    "Total",
    "AWB",
  ];

  const rows: (string | number | null | undefined)[][] = orders.map((o) => ({
    items: o.orderItems.map((it) => `${it.product.name} x${it.quantity}`).join("; "),
    lineTotal: o.orderItems.reduce((s, it) => s + it.price * it.quantity, 0),
    ...o,
  })).map(({ items, lineTotal, ...o }) => [
    o.id,
    o.createdAt.toISOString().split("T")[0],
    o.status,
    o.paymentMethod ?? "",
    o.paymentStatus,
    items,
    lineTotal.toFixed(2),
    o.shippingAmount.toFixed(2),
    o.discountAmount.toFixed(2),
    o.totalAmount.toFixed(2),
    o.awbNumber ?? "",
  ]);

  const csv = toCsv([header, ...rows]);
  return { ok: true, csv, filename: `myra-orders-${Date.now()}.csv` };
}
