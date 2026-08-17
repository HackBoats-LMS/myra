"use client";
import Image from "next/image";
import StarRating from "./StarRating";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  images: string[];
  createdAt: Date;
  user: {
    name: string | null;
  };
}

export default function ReviewSection({ reviews }: { reviews: Review[] }) {
  return (
    <div>
      {reviews.length === 0 ? (
        <p className="text-gray-500 text-sm">
          No reviews yet. Leave a review for this product from your orders page after it&apos;s delivered.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reviews.map((review) => (
            <div key={review.id} className="border border-[#B6925B]/20 p-5 flex flex-col gap-3 bg-white rounded-none">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                  {/* Placeholder Avatar */}
                  <div className="w-10 h-10 rounded-none border border-[#B6925B]/20 bg-[#FAFAFA] flex items-center justify-center overflow-hidden shrink-0">
                    <span className="text-gray-500 font-bold text-lg">
                      {(review.user.name || "V").charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-serif font-bold text-[#4A3B2C] text-sm">
                      {review.user.name || "Verified Buyer"}
                    </span>
                    <StarRating rating={review.rating} sizeClassName="text-[10px] text-[#B6925B]" />
                  </div>
                </div>
                <div className="flex flex-col items-start md:items-end">
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
                <p className="text-xs text-gray-600 leading-relaxed mt-2 break-words">
                  {review.comment}
                </p>
              )}
              {review.images.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-1">
                  {review.images.map((src, i) => (
                    <div key={`${src}-${i}`} className="relative w-16 h-16 border border-[#B6925B]/20 overflow-hidden rounded-none bg-[#FAFAFA]">
                      <Image src={src} alt={`${review.user.name || "Review"} photo ${i + 1}`} fill className="object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
