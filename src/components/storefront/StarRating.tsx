import { StarIcon as StarSolid } from "@heroicons/react/24/solid";
import { StarIcon as StarOutline } from "@heroicons/react/24/outline";

interface StarRatingProps {
  rating: number;
  maxStars?: number;
  sizeClassName?: string;
}

export default function StarRating({ rating, maxStars = 5, sizeClassName = "w-4 h-4" }: StarRatingProps) {
  const stars = [];
  const roundedRating = Math.round(rating * 2) / 2; // Round to nearest 0.5

  for (let i = 1; i <= maxStars; i++) {
    if (i <= roundedRating) {
      // Full star
      stars.push(
        <StarSolid key={i} className={`${sizeClassName} text-amber-400 flex-shrink-0`} />
      );
    } else if (i - 0.5 === roundedRating) {
      // Half star: render outline star with half filled using styling or custom SVG for premium look.
      // For simplicity and crisp look, we can render custom SVG for half star or a solid star with custom coloring.
      // Let's render a custom SVG representing a half-filled star.
      stars.push(
        <span key={i} className="relative inline-block flex-shrink-0">
          <StarOutline className={`${sizeClassName} text-amber-400`} />
          <span className="absolute inset-0 overflow-hidden w-1/2">
            <StarSolid className={`${sizeClassName} text-amber-400`} />
          </span>
        </span>
      );
    } else {
      // Empty star
      stars.push(
        <StarOutline key={i} className={`${sizeClassName} text-gray-300 flex-shrink-0`} />
      );
    }
  }

  return <div className="flex items-center gap-0.5">{stars}</div>;
}
