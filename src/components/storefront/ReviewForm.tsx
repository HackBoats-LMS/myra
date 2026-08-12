"use client";
import { useState } from "react";
import { addReview } from "@/actions/reviews";
import { useToast } from "@/components/ui/Toast";
import { useRouter } from "next/navigation";

export default function ReviewForm({ productId }: { productId: string }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error("Please select a rating.");
      return;
    }

    setIsLoading(true);
    try {
      await addReview(productId, rating, comment);
      toast.success("Review submitted successfully!");
      setRating(0);
      setComment("");
      router.refresh(); // Refresh page to see new review
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit review.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#FAFAFA] p-6 border border-[#B6925B]/20">
      <h3 className="font-serif text-xl text-[#4A3B2C] mb-6 tracking-wide">Write a Review</h3>
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Star Selector */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4A3B2C] mb-2">Your Rating</label>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className="focus:outline-none transition-colors"
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setRating(star)}
              >
                {star <= (hoverRating || rating) ? (
                  <i className="ri-star-fill text-2xl text-[#B6925B] leading-none" />
                ) : (
                  <i className="ri-star-line text-2xl text-gray-300 hover:text-[#B6925B] leading-none" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Comment */}
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-[#4A3B2C] mb-2">Your Review</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            className="w-full rounded-none border border-[#B6925B]/20 bg-white px-4 py-3 text-sm focus:outline-none focus:border-[#B6925B] focus:ring-1 focus:ring-[#B6925B] transition-all resize-none text-[#4A3B2C]"
            placeholder="What did you like or dislike? What did you use this product for?"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || rating === 0}
          className="bg-[#4A3B2C] text-white px-8 py-3 font-bold tracking-widest text-[10px] uppercase transition-colors hover:bg-[#34291f] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <i className="ri-loader-4-line animate-spin text-sm leading-none" />
              SUBMITTING...
            </>
          ) : (
            "SUBMIT REVIEW"
          )}
        </button>
      </form>
    </div>
  );
}
