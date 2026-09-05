"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { deleteReview, setReviewApproved, replyToReview } from "@/actions/review";
import { useToast } from "@/components/ui/Toast";
import type { Prisma } from "@/generated/prisma";
import { Star, Eye, EyeOff, Trash2 } from "lucide-react";

type ReviewWithRelations = Prisma.ReviewGetPayload<{
  include: {
    user: { select: { name: true; email: true } };
    product: { select: { name: true; slug: true; images: true } };
  };
}>;

export default function AdminReviewList({ initialReviews }: { initialReviews: ReviewWithRelations[] }) {
  const [reviews, setReviews] = useState(initialReviews);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const toast = useToast();

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this review?")) return;

    setBusyId(id);
    try {
      await deleteReview(id);
      setReviews(reviews.filter((r) => r.id !== id));
      toast.success("Review deleted successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete review");
    } finally {
      setBusyId(null);
    }
  };

  const handleToggle = async (review: ReviewWithRelations) => {
    setBusyId(review.id);
    try {
      await setReviewApproved(review.id, !review.isApproved);
      setReviews(reviews.map((r) => (r.id === review.id ? { ...r, isApproved: !r.isApproved } : r)));
      toast.success(review.isApproved ? "Review hidden from storefront." : "Review approved and published.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update review.");
    } finally {
      setBusyId(null);
    }
  };

  const handleReply = async (id: string) => {
    if (!replyText.trim()) {
      toast.error("Reply cannot be empty.");
    }
    setBusyId(id);
    try {
      await replyToReview(id, replyText);
      setReviews(reviews.map((r) => (r.id === id ? { ...r, reply: replyText.trim() } : r)));
      setReplyingId(null);
      setReplyText("");
      toast.success("Reply saved.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save reply.");
    } finally {
      setBusyId(null);
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
      <table className="w-full text-left text-sm text-[#2D1F2F]">
        <thead className="bg-[#F5EFE6] text-[#7A0B2E] border-b border-[#7A0B2E]/20 uppercase text-[10px] font-bold tracking-widest">
          <tr>
            <th className="p-4 border-r border-[#7A0B2E]/10">Product</th>
            <th className="p-4 border-r border-[#7A0B2E]/10">Rating</th>
            <th className="p-4 border-r border-[#7A0B2E]/10">Comment</th>
            <th className="p-4 border-r border-[#7A0B2E]/10">Customer</th>
            <th className="p-4 border-r border-[#7A0B2E]/10">Status</th>
            <th className="p-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#7A0B2E]/10">
          {reviews.map((review) => (
            <tr key={review.id} className="hover:bg-[#F5EFE6] transition-colors group">
              <td className="p-4 border-r border-[#7A0B2E]/10">
                <Link href={`/products/${review.product.slug}`} target="_blank" className="flex items-center gap-3 group/link">
                  <div className="relative w-10 h-10 bg-[#F5EFE6] border border-[#7A0B2E]/20 overflow-hidden flex-shrink-0 rounded-none">
                    {review.product.images[0] && (
                      <Image src={review.product.images[0]} alt={review.product.name} fill className="object-cover" />
                    )}
                  </div>
                  <span className="font-bold text-[#2D1F2F] group-hover/link:text-[#7A0B2E] transition-colors truncate max-w-[150px]">
                    {review.product.name}
                  </span>
                </Link>
              </td>
              <td className="p-4 border-r border-[#7A0B2E]/10">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-[#7A0B2E] text-[#7A0B2E] shrink-0" />
                  <span className="font-bold text-[#2D1F2F]">{review.rating}</span>
                </div>
              </td>
              <td className="p-4 max-w-xs border-r border-[#7A0B2E]/10">
                <p className="text-[#2D1F2F] text-xs">{review.comment || <span className="italic text-gray-400">No comment</span>}</p>
                {review.images && review.images.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {review.images.map((src, i) => (
                      <div key={`${src}-${i}`} className="relative w-10 h-10 border border-[#7A0B2E]/20 overflow-hidden rounded-none bg-[#F5EFE6]">
                        <Image src={src} alt="Review photo" fill className="object-cover" />
                      </div>
                    ))}
                  </div>
                )}
                {review.reply ? (
                  <div className="mt-2 pl-3 border-l-2 border-[#7A0B2E]/30 text-[11px] text-[#7A0B2E]">
                    <span className="font-bold uppercase tracking-widest text-[9px]">Store reply:</span> {review.reply}
                  </div>
                ) : null}
                {replyingId === review.id ? (
                  <div className="mt-2 space-y-2">
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      rows={2}
                      placeholder="Write a reply..."
                      className="w-full px-3 py-2 text-xs border border-[#7A0B2E]/30 rounded-none focus:outline-none focus:border-[#7A0B2E]"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleReply(review.id)}
                        disabled={busyId === review.id}
                        className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest bg-[#2D1F2F] text-white disabled:opacity-50 rounded-none"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => { setReplyingId(null); setReplyText(""); }}
                        className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest border border-[#7A0B2E]/30 text-[#2D1F2F] rounded-none"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  !review.reply && (
                    <button
                      onClick={() => { setReplyingId(review.id); setReplyText(""); }}
                      className="mt-2 text-[10px] font-bold uppercase tracking-widest text-[#7A0B2E] hover:text-[#2D1F2F]"
                    >
                      Reply
                    </button>
                  )
                )}
              </td>
              <td className="p-4 border-r border-[#7A0B2E]/10">
                <div className="text-[#2D1F2F] font-bold text-xs uppercase tracking-widest">{review.user.name || "Customer"}</div>
                <div className="text-xs font-medium text-gray-500 mt-0.5">{review.user.email || "No email"}</div>
              </td>
              <td className="p-4 border-r border-[#7A0B2E]/10">
                <span className={`inline-flex items-center px-2 py-1 text-[9px] font-bold uppercase tracking-widest border rounded-none ${review.isApproved ? "bg-green-50 text-green-700 border-green-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
                  {review.isApproved ? "Approved" : "Hidden"}
                </span>
              </td>
              <td className="p-4 text-right whitespace-nowrap">
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={() => handleToggle(review)}
                    disabled={busyId === review.id}
                    className={review.isApproved ? "text-amber-600 hover:text-amber-800 p-2 hover:bg-amber-50 transition-colors disabled:opacity-50 rounded-none" : "text-green-600 hover:text-green-800 p-2 hover:bg-green-50 transition-colors disabled:opacity-50 rounded-none"}
                    title={review.isApproved ? "Hide from storefront" : "Approve / publish"}
                  >
                    {review.isApproved ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => handleDelete(review.id)}
                    disabled={busyId === review.id}
                    className="text-red-700 hover:text-red-900 p-2 hover:bg-red-50 transition-colors disabled:opacity-50 rounded-none"
                    title="Delete Review"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
