import StarRating from "@/components/shared/StarRating";
import ReviewSection from "@/app/(storefront)/products/[slug]/_components/ReviewSection";

interface ProductReviewsProps {
  reviews: any[];
  reviewCount: number;
  averageRating: number;
}

export default function ProductReviews({ reviews, reviewCount, averageRating }: ProductReviewsProps) {
  return (
    <section className="mt-16 border-t border-[#B6925B]/20 pt-12">
      <div className="flex items-center gap-4 mb-8">
        <h2 className="text-xl md:text-2xl font-serif text-[#4A3B2C]">Ratings & reviews:</h2>
      </div>
      
      <div className="flex items-center gap-2 mb-10 flex-wrap">
        {reviewCount > 0 ? (
          <>
            <StarRating rating={averageRating} sizeClassName="w-5 h-5 text-[#B6925B]" />
            <span className="text-xl text-[#4A3B2C] ml-2">
              {averageRating.toFixed(1)} out of 5
            </span>
          </>
        ) : (
          <span className="text-sm text-gray-500">No reviews yet.</span>
        )}
      </div>

      <ReviewSection reviews={reviews} />
    </section>
  );
}
