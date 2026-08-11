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
}

export default function ReviewSection({ productId, reviews, isLoggedIn, userReview }: ReviewSectionProps) {
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
    } catch (err: any) {
      toast.error(err.message || "Failed to submit review.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-12">
      <h3 className="text-xl md:text-2xl font-serif text-gray-900 tracking-tight border-b border-gray-100 pb-4">
        Customer Reviews ({reviews.length})
      </h3>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Reviews List */}
        <div className="lg:col-span-2 space-y-8">
          {reviews.length === 0 ? (
            <p className="text-gray-500 text-sm">No reviews yet. Be the first to review this product!</p>
          ) : (
            <div className="divide-y divide-gray-100 space-y-8">
              {reviews.map((review) => (
                <div key={review.id} className="pt-8 first:pt-0 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-900 text-sm">
                      {review.user.name || "Verified Buyer"}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(review.createdAt).toLocaleDateString("en-IN", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <StarRating rating={review.rating} sizeClassName="w-3.5 h-3.5" />
                  {review.comment && (
                    <p className="text-sm text-gray-600 leading-relaxed font-normal">
                      {review.comment}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Review Form */}
        <div className="bg-gray-50/50 border border-gray-100 p-6 rounded-lg h-fit space-y-6">
          <h4 className="font-bold text-gray-900 text-sm uppercase tracking-wider">
            {userReview ? "Update Your Review" : "Write a Review"}
          </h4>

          {!isLoggedIn ? (
            <p className="text-sm text-gray-500 leading-relaxed">
              Please sign in to leave reviews and share your feedback with other customers.
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Star Selection */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
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
                      className="text-amber-400 focus:outline-none transition-transform active:scale-95"
                    >
                      {star <= (hoverRating || rating) ? (
                        <StarSolid className="w-7 h-7" />
                      ) : (
                        <StarOutline className="w-7 h-7 text-gray-300 hover:text-amber-400" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Comment Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Review Comment
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your thoughts about this product..."
                  rows={4}
                  className="w-full bg-white border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#0D3B66] text-gray-900 placeholder-gray-400"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#0D3B66] hover:bg-[#082a4d] text-white py-2.5 rounded-md text-xs font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
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
