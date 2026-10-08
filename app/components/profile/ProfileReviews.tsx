import Image from "next/image";
import Link from "next/link";
import { Coffee, NotePencil } from "@phosphor-icons/react/dist/ssr";

import RatingStars from "@/app/components/cafe/RatingStars";
import type { PublicReview } from "@/lib/data/profiles";

/**
 * The person's reviews, newest first. The cafe leads each one, since the
 * author is already known (Yelp's profile reviews: thumbnail beside the
 * place's name and area, then stars and date, then the text;
 * docs/references/public-profile). A rating with no words stays one compact
 * block, as in Record Club.
 */
export default function ProfileReviews({
  reviews,
  firstName,
}: {
  reviews: PublicReview[];
  firstName: string;
}) {
  if (reviews.length === 0) {
    return (
      <div className="flex flex-col items-center px-6 py-12 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-paper text-muted">
          <NotePencil size={22} aria-hidden />
        </span>
        <p className="mt-3 text-[15px] font-semibold text-ink">No reviews yet</p>
        <p className="mt-1 max-w-[36ch] text-sm text-muted">
          {firstName} hasn&apos;t reviewed a cafe yet.{" "}
          <Link href="/map" className="font-medium text-brand underline-offset-4 hover:underline">
            Browse cafes
          </Link>
        </p>
      </div>
    );
  }
  return (
    <ul className="divide-y divide-line">
      {reviews.map((review) => {
        const date = new Date(review.createdAt).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
          timeZone: "Asia/Manila",
        });
        return (
          <li key={review.id} className="py-5 first:pt-2">
            <article>
              <Link
                href={`/cafes/${review.cafeId}`}
                className="group flex w-fit max-w-full items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                <span className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-paper">
                  {review.cafeImageUrl ? (
                    <Image src={review.cafeImageUrl} alt="" fill sizes="56px" className="object-cover" />
                  ) : (
                    <span className="flex h-full items-center justify-center text-muted">
                      <Coffee size={20} aria-hidden />
                    </span>
                  )}
                </span>
                <span className="min-w-0">
                  <span className="line-clamp-2 text-[15px] leading-snug font-semibold text-ink group-hover:underline group-hover:underline-offset-4">
                    {review.cafeName}
                  </span>
                  {review.cafeArea ? (
                    <span className="block truncate text-[13px] text-muted">{review.cafeArea}</span>
                  ) : null}
                </span>
              </Link>
              <div className="mt-3 flex items-center gap-2">
                <RatingStars rating={review.rating} size={14} />
                <span className="sr-only">{review.rating} out of 5,</span>
                <time dateTime={review.createdAt} className="text-[13px] text-muted">
                  {date}
                </time>
              </div>
              {review.content ? (
                <p className="mt-2 max-w-[68ch] text-[15px] leading-relaxed break-words whitespace-pre-line text-body">
                  {review.content}
                </p>
              ) : null}
              {review.imageUrls.length > 0 ? (
                <ul className="no-scrollbar mt-3 flex gap-2 overflow-x-auto overscroll-x-contain">
                  {review.imageUrls.slice(0, 6).map((url) => (
                    <li key={url} className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-paper">
                      <Image src={url} alt={`Photo from the review of ${review.cafeName}`} fill sizes="80px" className="object-cover" />
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
