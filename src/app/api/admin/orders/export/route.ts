import { prisma } from "@/lib/db/prisma";
import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/auth/auth-utils";
import { checkRateLimit, getClientIp, RateLimitError } from "@/lib/rate-limit";

const MAX_EXPORT_ROWS = 10000;

export async function GET(req: Request) {
  try {
    await verifyAdmin();
  } catch {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // Rate-limit export to prevent abuse (5 per minute per admin)
  try {
    const ip = getClientIp(req);
    await checkRateLimit({ bucket: "export:admin", key: ip, limit: 5, windowSeconds: 60 });
  } catch (error) {
    if (error instanceof RateLimitError) {
      return new NextResponse("Too many requests. Please try again later.", { status: 429 });
    }
    throw error;
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
