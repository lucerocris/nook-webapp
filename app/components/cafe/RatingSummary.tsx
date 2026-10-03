import type { Review } from "@/lib/data/cafes-mappers";
import RatingStars from "./RatingStars";

/**
 * Big average, review count and a 5-to-1 distribution. The bars are computed
 * from the reviews passed in; when those are only the newest few, the caption
 * says so rather than presenting a sample as the whole.
 */
export default function RatingSummary({
  rating,
  reviewCount,
  reviews,
}: {
  rating: number;
  reviewCount: number;
  reviews: Review[];
}) {
  const counts = [5, 4, 3, 2, 1].map(
    (stars) => reviews.filter((r) => Math.round(r.rating) === stars).length,
  );
  const total = reviews.length || 1;
  const isSample = reviewCount > reviews.length;

  return (
    <div>
      <div className="flex items-end gap-3">
        <span className="text-5xl font-semibold leading-none tracking-[-0.03em] text-ink">
          {rating.toFixed(1)}
        </span>
        <div className="pb-1">
          <RatingStars rating={rating} size={14} />
          <p className="mt-1 text-xs text-muted">
            {reviewCount} {reviewCount === 1 ? "review" : "reviews"}
          </p>
        </div>
      </div>

      <dl className="mt-5 space-y-1.5">
        {[5, 4, 3, 2, 1].map((stars, i) => (
          <div key={stars} className="flex items-center gap-3 text-xs">
            <dt className="w-2 shrink-0 text-muted">{stars}</dt>
            <dd className="h-1.5 flex-1 overflow-hidden rounded-full bg-subtle">
              <span
                className="block h-full rounded-full bg-ink"
                style={{ width: `${(counts[i] / total) * 100}%` }}
              />
            </dd>
          </div>
        ))}
      </dl>
      {isSample ? (
        <p className="mt-3 text-xs text-muted">
          Breakdown of the {reviews.length} most recent
        </p>
      ) : null}
    </div>
  );
}
