import Link from "next/link";
import { DeviceMobile, Star } from "@phosphor-icons/react/dist/ssr";

import type { Review } from "@/lib/data/cafes-mappers";
import RatingSummary from "./RatingSummary";
import ReviewCard from "./ReviewCard";

const SHOWN = 4;

/** Reviews are written in the mobile app, so the web says where to go. */
function LeaveReviewPrompt({ first }: { first: boolean }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-line p-5">
      <DeviceMobile size={22} className="text-fern" aria-hidden />
      <p className="mt-3 text-sm font-semibold text-ink">
        {first ? "Be the first to review" : "Been here?"}
      </p>
      <p className="mt-1 text-sm text-body">Reviews are written in the Nook app.</p>
      <Link
        href="/download-app"
        className="mt-4 inline-flex h-10 items-center rounded-full border border-brand px-4 text-sm font-semibold text-brand transition-colors hover:bg-brand-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        Get the app
      </Link>
    </div>
  );
}

/**
 * Reviews (Airbnb's section): "★ 4.8 · 12 reviews" as the heading, the score
 * with its 5-to-1 bars beside a leave-a-review prompt (Product Hunt), then up
 * to four reviews in two columns and "Show all N reviews". With none yet, the
 * prompt is the whole section.
 */
export default function CafeReviews({
  cafeId,
  rating,
  reviewCount,
  reviews,
}: {
  cafeId: string;
  rating: number;
  reviewCount: number;
  reviews: Review[];
}) {
  const visible = reviews.slice(0, SHOWN);

  return (
    <div>
      <h2 className="flex items-center gap-2 text-xl font-semibold tracking-[-0.02em] text-ink">
        {reviewCount > 0 ? (
          <>
            <Star size={18} weight="fill" className="text-fern" aria-hidden />
            <span className="tabular-nums">{rating.toFixed(1)}</span>
            <span aria-hidden>·</span>
            {reviewCount} {reviewCount === 1 ? "review" : "reviews"}
          </>
        ) : (
          "Reviews"
        )}
      </h2>

      {visible.length === 0 ? (
        <div className="mt-5 max-w-sm">
          <p className="mb-4 text-sm text-muted">No reviews yet.</p>
          <LeaveReviewPrompt first />
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-6 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] sm:gap-10">
            <RatingSummary rating={rating} reviewCount={reviewCount} reviews={reviews} />
            <LeaveReviewPrompt first={false} />
          </div>
          <div className="mt-10 grid gap-x-10 gap-y-8 sm:grid-cols-2">
            {visible.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
          {reviewCount > visible.length ? (
            <Link
              href={`/cafes/${cafeId}/reviews`}
              className="mt-8 inline-flex h-11 items-center rounded-full border border-ink px-5 text-sm font-semibold text-ink transition-colors hover:bg-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              Show all {reviewCount} reviews
            </Link>
          ) : null}
        </>
      )}
    </div>
  );
}
