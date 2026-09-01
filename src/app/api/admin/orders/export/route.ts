import { prisma } from "@/lib/db/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { NextResponse } from "next/server";

const MAX_EXPORT_ROWS = 10000;

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const orders = await prisma.order.findMany({
      take: MAX_EXPORT_ROWS,
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Helper to sanitize CSV fields
    const escapeCsv = (str: string | null | undefined) => {
      if (!str) return '""';
      const clean = str.replace(/["]/g, '""');
      // Neutralize spreadsheet formula injection (fields beginning with =, +, -, @).
      if (/^[=+\-@]/.test(clean.trim())) {
        return `'${clean}'`;
      }
      return `"${clean}"`;
    };

    // CSV Headers
    const headers = ["Order ID", "Date", "Customer Name", "Customer Email", "Status", "Payment Method", "Total Amount"];
    
    // CSV Rows
    const rows = orders.map((order) => {
      const date = new Date(order.createdAt).toISOString().split("T")[0];
      return [
        escapeCsv(order.id),
        escapeCsv(date),
        escapeCsv(order.user?.name),
        escapeCsv(order.user?.email),
        escapeCsv(order.status),
        escapeCsv(order.paymentMethod || "N/A"),
        order.totalAmount.toFixed(2),
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");

    return new Response(csvContent, {
      headers: {
        "Content-Disposition": 'attachment; filename="myra_orders.csv"',
        "Content-Type": "text/csv; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("CSV Export Failed:", error);
    return new NextResponse("Export Failed", { status: 500 });
  }
}
