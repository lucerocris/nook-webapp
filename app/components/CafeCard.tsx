import Image from "next/image";
import Link from "next/link";
import { Coffee, Star } from "@phosphor-icons/react/dist/ssr";

import { cn } from "@/lib/utils";
import { formatDistance } from "@/lib/utils/format";
import { getOpenStatus } from "@/lib/utils/hours";
import type { CafeSummary } from "@/lib/data/cafes-mappers";

type Props = {
  cafe: CafeSummary;
  priority?: boolean;
  /** Small pill pinned to the photo, e.g. "Featured". */
  badge?: string;
};

/** Stand-in for a cafe with no photos yet, so the card keeps its shape. */
function NoPhoto() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-paper text-sage">
      <Coffee size={32} aria-hidden />
    </div>
  );
}

/**
 * Photo-first listing card (design.md, Photo shelves): rounded photo with an
 * optional badge, then name and rating, area and distance, and the open state
 * as a dot plus text (two tags when hours are unknown).
 */
export default function CafeCard({ cafe, priority, badge }: Props) {
  const area = cafe.neighborhood ?? cafe.city;
  const distance = formatDistance(cafe.distanceMeters);
  const status = getOpenStatus(cafe.operatingHours);
  const place = [area, distance].filter(Boolean).join(" · ");
  const visibleTags = cafe.tags.slice(0, 2);

  return (
    <Link
      href={`/cafes/${cafe.id}`}
      className="group block rounded-[20px] outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-4"
    >
      <article className="flex flex-col">
        <div className="relative aspect-[5/4] w-full overflow-hidden rounded-[20px] bg-paper">
          {cafe.coverImage ? (
            <Image
              src={cafe.coverImage}
              alt=""
              fill
              priority={priority}
              sizes="(min-width: 1280px) 240px, (min-width: 1024px) 25vw, (min-width: 640px) 40vw, 72vw"
              className="object-cover transition-opacity duration-200 group-hover:opacity-90"
            />
          ) : (
            <NoPhoto />
          )}
          {badge ? (
            <span className="absolute left-3 top-3 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-ink shadow-raise">
              {badge}
            </span>
          ) : null}
        </div>

        <div className="mt-3 flex items-start justify-between gap-2">
          <h3 className="min-w-0 truncate text-[15px] font-semibold text-ink">{cafe.name}</h3>
          {/* "New" replaces the score when there are no reviews, rather than an
              empty rating that reads as a bad one. */}
          {cafe.reviewCount > 0 ? (
            <span className="flex shrink-0 items-center gap-1 text-sm tabular-nums text-ink">
              <Star size={13} weight="fill" className="text-fern" aria-hidden />
              {cafe.rating.toFixed(1)}
              <span className="text-muted">({cafe.reviewCount})</span>
            </span>
          ) : (
            <span className="shrink-0 text-sm text-muted">New</span>
          )}
        </div>

        {place ? <p className="mt-0.5 truncate text-sm text-muted">{place}</p> : null}

        {status ? (
          <p className="mt-0.5 flex items-center gap-1.5 truncate text-sm text-muted">
            <span
              aria-hidden
              className={cn("size-1.5 shrink-0 rounded-full", status.isOpen ? "bg-open" : "bg-closed")}
            />
            <span className={cn("font-medium", status.isOpen ? "text-open" : "text-closed")}>
              {status.isOpen ? "Open" : "Closed"}
            </span>
            {status.detail ? <span className="truncate">{status.detail}</span> : null}
          </p>
        ) : visibleTags.length > 0 ? (
          <p className="mt-0.5 truncate text-sm text-muted">{visibleTags.join(" · ")}</p>
        ) : null}
      </article>
    </Link>
  );
}
