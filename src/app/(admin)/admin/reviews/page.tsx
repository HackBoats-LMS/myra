import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminReviewList from "@/components/admin/AdminReviewList";
import { Prisma } from "@/generated/prisma";

export const metadata = {
  title: "Review Management | Admin Dashboard",
};

export default async function AdminReviewsPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    redirect("/admin/login");
  }

  let reviews: Prisma.ReviewGetPayload<{
    include: {
      user: { select: { name: true; email: true } };
      product: { select: { name: true; slug: true; images: true } };
    }
  }>[] = [];
  try {
    reviews = await prisma.review.findMany({
      include: {
        user: { select: { name: true, email: true } },
        product: { select: { name: true, slug: true, images: true } }
      },
      orderBy: { createdAt: "desc" }
    });
  } catch (error) {
    console.warn("Database unreachable in AdminReviewsPage:", error);
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-[#B6925B]/20 pb-4">
        <h1 className="text-3xl font-serif font-bold text-[#4A3B2C] tracking-wide">Customer Reviews</h1>
        <p className="text-xs text-[#B6925B] font-bold uppercase tracking-widest mt-2">Manage and moderate product reviews.</p>
      </div>

      <div className="bg-white border border-[#B6925B]/20 relative">
        <AdminReviewList initialReviews={reviews} />
      </div>
    </div>
  );
}
