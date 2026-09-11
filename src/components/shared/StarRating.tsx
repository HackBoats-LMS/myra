import { useId } from "react";

interface StarRatingProps {
  rating: number;
  maxStars?: number;
  sizeClassName?: string;
  className?: string;
}

export default function StarRating({
  rating,
  maxStars = 5,
  sizeClassName = "w-4 h-4 text-[#7A0B2E]",
  className = "",
}: StarRatingProps) {
  const baseId = useId().replace(/[^a-zA-Z0-9_-]/g, "_");
  const clampedRating = Math.max(0, Math.min(maxStars, Number(rating) || 0));

  const stars = [];

  for (let i = 1; i <= maxStars; i++) {
    // Calculate exact fill percentage for star i (0 to 100)
    const fillPercent = Math.max(0, Math.min(100, Math.round((clampedRating - (i - 1)) * 100)));
    const gradId = `${baseId}-star-grad-${i}`;

    stars.push(
      <svg
        key={i}
        viewBox="0 0 24 24"
        className={`shrink-0 ${!sizeClassName.includes("w-") && !sizeClassName.includes("h-") ? "w-[1em] h-[1em]" : ""} ${sizeClassName}`}
        aria-hidden="true"
      >
        <defs>
          {fillPercent > 0 && fillPercent < 100 && (
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset={`${fillPercent}%`} stopColor="currentColor" />
              <stop offset={`${fillPercent}%`} stopColor="#E5E7EB" stopOpacity="1" />
            </linearGradient>
          )}
        </defs>
        <path
          d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
          fill={
            fillPercent === 100
              ? "currentColor"
              : fillPercent === 0
              ? "#E5E7EB"
              : `url(#${gradId})`
          }
          stroke={fillPercent > 0 ? "currentColor" : "#D1D5DB"}
          strokeWidth="0.5"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-0.5 ${className}`}
      title={`${clampedRating.toFixed(1)} out of ${maxStars} stars`}
      aria-label={`${clampedRating.toFixed(1)} out of ${maxStars} stars`}
    >
      {stars}
    </div>
  );
}

