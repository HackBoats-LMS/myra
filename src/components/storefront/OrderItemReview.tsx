"use client";
import { useState } from "react";
import { submitReview } from "@/actions/review";
import { useToast } from "@/components/ui/Toast";

interface ExistingReview {
  rating: number;
  comment: string | null;
}

export default function OrderItemReview({
  productId,
  productName,
  existingReview,
}: {
  productId: string;
  productName: string;
  existingReview: ExistingReview | null;
}) {
  const toast = useToast();
  const [open, setOpen] = useState(Boolean(existingReview));
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState(existingReview?.comment || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error("Please select a star rating.");
      return;
    }
    setIsSubmitting(true);
    try {
      await submitReview(productId, rating, comment);
      toast.success(existingReview ? "Review updated!" : "Review submitted!");
      setOpen(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit review.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-4 border-t border-[#B6925B]/10 pt-3">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#B6925B] hover:text-[#4A3B2C] transition-colors"
        >
          <i className="ri-star-line text-sm" />
          Write a Review
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3 bg-[#FAFAFA] border border-[#B6925B]/20 p-4">
          <p className="text-[11px] font-bold text-[#4A3B2C] uppercase tracking-widest">{productName}</p>

          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="text-[#B6925B] focus:outline-none transition-transform active:scale-95 flex items-center justify-center"
              >
                {star <= (hoverRating || rating) ? (
                  <i className="ri-star-fill text-xl" />
                ) : (
                  <i className="ri-star-line text-xl text-gray-300 hover:text-[#B6925B]" />
                )}
              </button>
            ))}
          </div>

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your thoughts about this product..."
            rows={3}
            className="w-full bg-white border border-[#B6925B]/20 rounded-none p-3 text-xs focus:outline-none focus:border-[#B6925B] text-[#4A3B2C] placeholder-gray-400 resize-none"
          />

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-3 py-2 rounded-none text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-[#4A3B2C] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#B6925B] hover:bg-[#9c7d4e] text-white px-4 py-2 rounded-none text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <i className="ri-loader-4-line animate-spin text-sm leading-none" />
              ) : existingReview ? (
                "Update Review"
              ) : (
                "Submit Review"
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}