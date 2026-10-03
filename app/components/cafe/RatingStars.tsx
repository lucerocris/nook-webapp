import { Star } from "@phosphor-icons/react/dist/ssr";

import { cn } from "@/lib/utils";

/** Five stars, filled to the rounded rating. Decorative: callers print the
 * number beside it for screen readers. */
export default function RatingStars({
  rating,
  size = 13,
  className,
}: {
  rating: number;
  size?: number;
  className?: string;
}) {
  const filled = Math.round(rating);
  return (
    <span aria-hidden className={cn("flex items-center gap-0.5 text-ink", className)}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          size={size}
          weight="fill"
          className={index < filled ? undefined : "text-line-strong"}
        />
      ))}
    </span>
  );
}
