"use client";
import { useState } from "react";
import { submitReview } from "@/actions/review";
import StarRating from "./StarRating";
import { StarIcon as StarSolid } from "@heroicons/react/24/solid";
import { StarIcon as StarOutline } from "@heroicons/react/24/outline";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { useToast } from "@/components/ui/Toast";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
  user: {
    name: string | null;
    email: string | null;
  };
}

interface ReviewSectionProps {
  productId: string;
  reviews: Review[];
  isLoggedIn: boolean;
  userReview: Review | null;
  hasPurchased: boolean;
}

export default function ReviewSection({ productId, reviews, isLoggedIn, userReview, hasPurchased }: ReviewSectionProps) {
  const toast = useToast();
  const [rating, setRating] = useState(userReview?.rating || 0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState(userReview?.comment || "");
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
      toast.success(userReview ? "Review updated!" : "Review submitted!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit review.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12">
        {/* Reviews List */}
        <div className="lg:col-span-2 space-y-8">
          {reviews.length === 0 ? (
            <p className="text-gray-500 text-sm">No reviews yet. Be the first to review this product!</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {reviews.map((review) => (
                <div key={review.id} className="border border-[#B6925B]/20 p-5 flex flex-col gap-3 bg-white">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {/* Placeholder Avatar */}
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                        <span className="text-gray-500 font-bold text-lg">
                          {(review.user.name || "V").charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-serif font-bold text-[#4A3B2C] text-sm">
                          {review.user.name || "Verified Buyer"}
                        </span>
                        <StarRating rating={review.rating} sizeClassName="w-3.5 h-3.5 text-[#B6925B]" />
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] text-gray-500 font-medium">
                        {new Date(review.createdAt).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                      <span className="text-[9px] text-[#B6925B] font-bold uppercase tracking-widest mt-1">
                        Verified Purchase
                      </span>
                    </div>
                  </div>
                  {review.comment && (
                    <p className="text-xs text-gray-600 leading-relaxed mt-2">
                      {review.comment}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Review Form */}
        <div className="border border-[#B6925B]/20 p-6 bg-white h-fit space-y-6">
          <h4 className="font-serif font-bold text-[#4A3B2C] text-lg">
            {userReview ? "Update Your Review" : "Write a Review"}
          </h4>

          {!isLoggedIn ? (
            <p className="text-sm text-gray-500 leading-relaxed">
              Please sign in to leave reviews and share your feedback with other customers.
            </p>
          ) : !hasPurchased ? (
            <p className="text-sm text-[#B6925B] leading-relaxed bg-[#FDFBF7] p-4 border border-[#B6925B]/20">
              You can only review products that you have successfully purchased from our store.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Star Selection */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-[#4A3B2C] uppercase tracking-wider">
                  Rating
                </label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="text-[#B6925B] focus:outline-none transition-transform active:scale-95"
                    >
                      {star <= (hoverRating || rating) ? (
                        <StarSolid className="w-7 h-7" />
                      ) : (
                        <StarOutline className="w-7 h-7 text-gray-300 hover:text-[#B6925B]" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Comment Input */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-[#4A3B2C] uppercase tracking-wider">
                  Review
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your thoughts about this product..."
                  rows={4}
                  className="w-full bg-transparent border border-gray-200 p-3 text-sm focus:outline-none focus:border-[#B6925B] text-gray-900 placeholder-gray-400 resize-none"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#B6925B] hover:bg-[#9c7d4e] text-white py-3 text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <ArrowPathIcon className="w-4 h-4 animate-spin" />
                ) : userReview ? (
                  "Update Review"
                ) : (
                  "Submit Review"
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
