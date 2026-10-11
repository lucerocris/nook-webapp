import Image from "next/image";
import Link from "next/link";
import { CaretRight, Coffee } from "@phosphor-icons/react/dist/ssr";

import CupCard from "@/app/components/cafe/CupCard";
import { plural, type ProfileCups as Cups } from "@/lib/data/cups-mappers";

/**
 * A person's cups, one group per cafe, most recent first (the app's
 * per-cafe sheet; Yelp's profile reviews): the cafe leads, as a link, with
 * how many times they've been, then each visit newest first with its stars,
 * day, note and what they had. The author is the page, so cards leave it out.
 */
export default function ProfileCups({ cups, firstName }: { cups: Cups; firstName: string }) {
  if (cups.cafes.length === 0) {
    return (
      <div className="flex flex-col items-center px-6 py-14 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-paper text-muted">
          <Coffee size={22} aria-hidden />
        </span>
        <p className="mt-3 text-[15px] font-semibold text-ink">No cups yet</p>
        <p className="mt-1 max-w-[36ch] text-sm text-muted">
          A cup is one visit: what {firstName} had, a note, stars. They&apos;re added in the app.
        </p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-line">
      {cups.cafes.map((cafe) => (
        <li key={cafe.cafeId} className="py-7 first:pt-2">
          <Link
            href={`/cafes/${cafe.cafeId}`}
            className="group flex max-w-full items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            <span className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-paper">
              {cafe.cafeImageUrl ? (
                <Image src={cafe.cafeImageUrl} alt="" fill sizes="56px" className="object-cover" />
              ) : (
                <span className="flex h-full items-center justify-center text-muted">
                  <Coffee size={20} aria-hidden />
                </span>
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="line-clamp-2 text-[15px] leading-snug font-semibold text-ink group-hover:underline group-hover:underline-offset-4">
                {cafe.cafeName}
              </span>
              <span className="block truncate text-[13px] text-muted">
                {[cafe.cafeArea, cafe.visitCount > 1 ? plural(cafe.visitCount, "visit") : null]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </span>
            <CaretRight size={16} className="shrink-0 text-muted" aria-hidden />
          </Link>

          <ul className="mt-4 space-y-6">
            {cafe.cups.map((cup) => (
              <li key={cup.id}>
                <CupCard cup={cup} showAuthor={false} />
              </li>
            ))}
          </ul>
          {cafe.visitCount > cafe.cups.length ? (
            <p className="mt-4 text-[13px] text-muted">
              {plural(cafe.visitCount - cafe.cups.length, "earlier visit")} not shown.
            </p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
