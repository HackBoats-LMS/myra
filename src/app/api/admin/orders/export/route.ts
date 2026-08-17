import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // Bound the export so a large order table can't blow up memory. Defaults to
  // the most recent 5000 orders; callers can request more via ?limit= (capped).
  const url = new URL(req.url);
  const rawLimit = Number.parseInt(url.searchParams.get("limit") || "5000", 10);
  const limit = Number.isInteger(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 20000) : 5000;

  try {
    const orders = await prisma.order.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    // Helper to sanitize CSV fields
    const escapeCsv = (str: string | null | undefined) => {
      if (!str) return '""';
      // Neutralize spreadsheet formula injection (fields beginning with =, +, -, @).
      const clean = str.replace(/["]/g, '""');
      if (/^[=+\-@]/.test(clean.trim())) {
        return `"'${clean}"`;
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
