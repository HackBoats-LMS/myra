interface StarRatingProps {
  rating: number;
  maxStars?: number;
  sizeClassName?: string;
}

export default function StarRating({ rating, maxStars = 5, sizeClassName = "text-sm" }: StarRatingProps) {
  const stars = [];
  const roundedRating = Math.round(rating * 2) / 2; // Round to nearest 0.5

  for (let i = 1; i <= maxStars; i++) {
    if (i <= roundedRating) {
      // Full star
      stars.push(
        <i key={i} className={`ri-star-fill text-amber-400 flex-shrink-0 ${sizeClassName} leading-none`} />
      );
    } else if (i - 0.5 === roundedRating) {
      // Half star: render outline star with half filled using styling or custom SVG for premium look.
      stars.push(
        <span key={i} className="relative inline-block flex-shrink-0 leading-none">
          <i className={`ri-star-line text-amber-400 ${sizeClassName}`} />
          <span className="absolute inset-0 overflow-hidden w-1/2">
            <i className={`ri-star-fill text-amber-400 ${sizeClassName}`} />
          </span>
        </span>
      );
    } else {
      // Empty star
      stars.push(
        <i key={i} className={`ri-star-line text-gray-300 flex-shrink-0 ${sizeClassName} leading-none`} />
      );
    }
  }

  return <div className="flex items-center gap-0.5">{stars}</div>;
}
