import Image from "next/image";
import Link from "next/link";
import { Coffee } from "@phosphor-icons/react/dist/ssr";

import RatingStars from "@/app/components/cafe/RatingStars";
import type { PublicReview } from "@/lib/data/profiles";

/** The person's reviews, newest first: the cafe (photo, name, area) leads
 * each one, since on a profile the author is already known. */
export default function ProfileReviews({
  reviews,
  name,
}: {
  reviews: PublicReview[];
  name: string;
}) {
  if (reviews.length === 0) {
    return <p className="mt-3 text-sm text-muted">{name} hasn&apos;t reviewed a cafe yet.</p>;
  }
  return (
    <ul className="mt-2 divide-y divide-line">
      {reviews.map((review) => {
        const date = new Date(review.createdAt).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
        return (
          <li key={review.id} className="py-6">
            <article>
              <Link
                href={`/cafes/${review.cafeId}`}
                className="group flex items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                <span className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-paper">
                  {review.cafeImageUrl ? (
                    <Image src={review.cafeImageUrl} alt="" fill sizes="48px" className="object-cover" />
                  ) : (
                    <span className="flex h-full items-center justify-center text-muted">
                      <Coffee size={18} aria-hidden />
                    </span>
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[15px] font-semibold text-ink group-hover:underline group-hover:underline-offset-4">
                    {review.cafeName}
                  </span>
                  <span className="block truncate text-[13px] text-muted">
                    {[review.cafeArea, date].filter(Boolean).join(" · ")}
                  </span>
                </span>
              </Link>
              <div className="mt-3 flex items-center gap-2">
                <RatingStars rating={review.rating} size={13} />
                <span className="sr-only">{review.rating} out of 5</span>
              </div>
              {review.content ? (
                <p className="mt-2 max-w-[68ch] text-[15px] leading-relaxed text-body">{review.content}</p>
              ) : null}
              {review.imageUrls.length > 0 ? (
                <ul className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
                  {review.imageUrls.slice(0, 6).map((url) => (
                    <li key={url} className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-subtle">
                      <Image src={url} alt="" fill sizes="80px" className="object-cover" />
                    </li>
                  ))}
                </ul>
              ) : null}
            </article>
          </li>
        );
      })}
    </ul>
  );
}
