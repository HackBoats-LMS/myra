"use client";
import { useState } from "react";
import { addReview } from "@/actions/reviews";
import { StarIcon } from "@heroicons/react/24/solid";
import { StarIcon as StarOutlineIcon } from "@heroicons/react/24/outline";
import { useToast } from "@/components/ui/Toast";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
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
    <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
      <h3 className="font-bold text-gray-900 mb-4 uppercase tracking-wider text-sm">Write a Review</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Star Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Your Rating</label>
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
                  <StarIcon className="w-8 h-8 text-yellow-400" />
                ) : (
                  <StarOutlineIcon className="w-8 h-8 text-gray-300 hover:text-yellow-400" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Comment */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Your Review</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            className="w-full rounded-md border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D3B66]/50 transition-all resize-none"
            placeholder="What did you like or dislike? What did you use this product for?"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || rating === 0}
          className="bg-[#0D3B66] text-white px-6 py-2.5 rounded-md font-bold tracking-wider text-sm transition-colors hover:bg-[#082a4d] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <ArrowPathIcon className="w-4 h-4 animate-spin" />
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
