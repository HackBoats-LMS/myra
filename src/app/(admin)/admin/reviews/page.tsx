import { prisma } from "@/lib/db/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth";
import { redirect } from "next/navigation";
import { unstable_cache } from "next/cache";
import AdminReviewList from "@/app/(admin)/admin/reviews/_components/AdminReviewList";
import Pagination from "@/components/shared/Pagination";
import { Prisma } from "@/generated/prisma";
import { createSignedObjectUrls, REVIEW_IMAGES_BUCKET } from "@/lib/storage/image-storage";

export const metadata = {
  title: "Review Management | Admin Dashboard",
};

const ITEMS_PER_PAGE = 25;

type ReviewRow = Prisma.ReviewGetPayload<{
  include: {
    user: { select: { name: true, email: true } };
    product: { select: { name: true, slug: true, images: true } };
  }
}>;

export const dynamic = "force-dynamic";

const getCachedAdminReviews = unstable_cache(
  async (skip: number, take: number) => {
    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        include: {
          user: { select: { name: true, email: true } },
          product: { select: { name: true, slug: true, images: true } }
        },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prisma.review.count(),
    ]);
    return { reviews: reviews as ReviewRow[], total };
  },
  ["admin", "reviews"],
  { revalidate: 30 }
);

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    redirect("/admin/login");
  }

  const { page } = await searchParams;
  const currentPage = Math.max(1, parseInt(page || "1", 10));

  let reviews: ReviewRow[] = [];
  let totalReviews = 0;
  try {
    const result = await getCachedAdminReviews((currentPage - 1) * ITEMS_PER_PAGE, ITEMS_PER_PAGE);
    reviews = await Promise.all(
      result.reviews.map(async (review) => ({
        ...review,
        images: review.images.length > 0 ? await createSignedObjectUrls(REVIEW_IMAGES_BUCKET, review.images) : [],
      }))
    );
    totalReviews = result.total;
  } catch (error) {
    console.warn("Database unreachable in AdminReviewsPage:", error instanceof Error ? error.message : "unknown error");
  }

  const totalPages = Math.max(1, Math.ceil(totalReviews / ITEMS_PER_PAGE));

  return (
    <div className="space-y-6">
      <div className="border-b border-[#B6925B]/20 pb-4">
        <h1 className="text-3xl font-serif font-bold text-[#4A3B2C] tracking-wide">Customer Reviews</h1>
        <p className="text-xs text-[#B6925B] font-bold uppercase tracking-widest mt-2">Manage and moderate product reviews.</p>
      </div>

      <div className="bg-white border border-[#B6925B]/20 relative">
        <AdminReviewList initialReviews={reviews} />
      </div>

      <Pagination currentPage={currentPage} totalPages={totalPages} baseUrl="/admin/reviews" />
    </div>
  );
}
