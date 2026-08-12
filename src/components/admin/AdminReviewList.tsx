"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { deleteReview } from "@/actions/review";
import { useToast } from "@/components/ui/Toast";
import type { Prisma } from "@/generated/prisma";

type ReviewWithRelations = Prisma.ReviewGetPayload<{
  include: {
    user: { select: { name: true; email: true } };
    product: { select: { name: true; slug: true; images: true } };
  };
}>;

export default function AdminReviewList({ initialReviews }: { initialReviews: ReviewWithRelations[] }) {
  const [reviews, setReviews] = useState(initialReviews);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const toast = useToast();

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this review?")) return;
    
    setDeletingId(id);
    try {
      await deleteReview(id);
      setReviews(reviews.filter((r) => r.id !== id));
      toast.success("Review deleted successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete review");
    } finally {
      setDeletingId(null);
    }
  };

  if (reviews.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500 text-xs font-bold uppercase tracking-widest rounded-none">
        No reviews have been submitted yet.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm text-[#4A3B2C]">
        <thead className="bg-[#FAFAFA] text-[#B6925B] border-b border-[#B6925B]/20 uppercase text-[10px] font-bold tracking-widest">
          <tr>
            <th className="p-4 border-r border-[#B6925B]/10">Product</th>
            <th className="p-4 border-r border-[#B6925B]/10">Rating</th>
            <th className="p-4 border-r border-[#B6925B]/10">Comment</th>
            <th className="p-4 border-r border-[#B6925B]/10">Customer</th>
            <th className="p-4 border-r border-[#B6925B]/10">Date</th>
            <th className="p-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#B6925B]/10">
          {reviews.map((review) => (
            <tr key={review.id} className="hover:bg-[#FAFAFA] transition-colors group">
              <td className="p-4 border-r border-[#B6925B]/10">
                <Link href={`/products/${review.product.slug}`} target="_blank" className="flex items-center gap-3 group/link">
                  <div className="relative w-10 h-10 bg-[#FAFAFA] border border-[#B6925B]/20 overflow-hidden flex-shrink-0 rounded-none">
                    {review.product.images[0] && (
                      <Image src={review.product.images[0]} alt={review.product.name} fill className="object-cover" />
                    )}
                  </div>
                  <span className="font-bold text-[#4A3B2C] group-hover/link:text-[#B6925B] transition-colors truncate max-w-[150px]">
                    {review.product.name}
                  </span>
                </Link>
              </td>
              <td className="p-4 border-r border-[#B6925B]/10">
                <div className="flex items-center gap-1">
                  <i className="ri-star-fill text-[#B6925B] text-base leading-none" />
                  <span className="font-bold text-[#4A3B2C]">{review.rating}</span>
                </div>
              </td>
              <td className="p-4 max-w-xs border-r border-[#B6925B]/10">
                <p className="truncate text-[#4A3B2C] text-xs">{review.comment || <span className="italic text-gray-400">No comment</span>}</p>
              </td>
              <td className="p-4 border-r border-[#B6925B]/10">
                <div className="text-[#4A3B2C] font-bold text-xs uppercase tracking-widest">{review.user.name || "Customer"}</div>
                <div className="text-xs font-medium text-gray-500 mt-0.5">{review.user.email || "No email"}</div>
              </td>
              <td className="p-4 text-[#B6925B] text-[10px] font-bold uppercase tracking-widest whitespace-nowrap border-r border-[#B6925B]/10">
                {new Date(review.createdAt).toLocaleDateString()}
              </td>
              <td className="p-4 text-right">
                <button
                  onClick={() => handleDelete(review.id)}
                  disabled={deletingId === review.id}
                  className="text-red-700 hover:text-red-900 p-2 hover:bg-red-50 transition-colors disabled:opacity-50 flex items-center justify-center rounded-none"
                  title="Delete Review"
                >
                  <i className="ri-delete-bin-line text-lg" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
