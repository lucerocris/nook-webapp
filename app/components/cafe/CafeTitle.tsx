import Link from "next/link";
import { BookmarkSimple, MapPin, NavigationArrow, Star } from "@phosphor-icons/react/dist/ssr";

import ShareButton from "@/app/components/ShareButton";
import StatusLine from "@/app/components/cafe/StatusLine";
import AtAGlance from "@/app/components/cafe/AtAGlance";
import type { Tag } from "@/lib/data/cafes-mappers";
import type { OperatingHours } from "@/lib/utils/hours";

/**
 * The block that answers "should I go now", kept together under the name
 * (District's order): one meta line with the open status first, then the
 * rating or "new on Nook", then where it is; then one filled action and two
 * outlined ones in a single row (Yelp's row). Saving happens in the mobile
 * app, so that button says so and leads there instead of pretending to save.
 * Get directions is the primary action and stays here; the pinned phone bar
 * only appears once this row has scrolled away. The signature follows: an
 * at-a-glance row of the facts people choose a cafe by (AtAGlance).
 * References: docs/references/cafe-details/.
 */
export default function CafeTitle({
  name,
  area,
  hours,
  rating,
  reviewCount,
  tags,
  mapsUrl,
  description,
}: {
  name: string;
  area: string;
  hours: OperatingHours;
  rating: number;
  reviewCount: number;
  tags: Tag[];
  mapsUrl: string;
  description: string | null;
}) {
  return (
    <div className="min-w-0">
      <h1 className="text-[1.75rem] font-semibold leading-tight tracking-[-0.02em] text-ink sm:text-[2rem]">
        {name}
      </h1>

      {/* No separator dot between the two: on a phone they wrap, and a dot
          left hanging at the end of a line reads as a typo. */}
      <p className="mt-2 text-[15px]">
        <StatusLine hours={hours} />
      </p>
      <p className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        {reviewCount > 0 ? (
          <a href="#reviews" className="inline-flex items-center gap-1 text-body underline-offset-4 hover:underline">
            <Star size={14} weight="fill" className="text-fern" aria-hidden />
            <span className="font-semibold tabular-nums text-ink">{rating.toFixed(1)}</span>
            <span>
              ({reviewCount} {reviewCount === 1 ? "review" : "reviews"})
            </span>
          </a>
        ) : (
          <span className="text-body">New on Nook · no reviews yet</span>
        )}
      </p>

      {area ? (
        <p className="mt-1.5 flex items-center gap-1.5 text-sm text-muted">
          <MapPin size={15} className="shrink-0 text-fern" aria-hidden />
          Cafe in {area}
        </p>
      ) : null}

      <div id="title-actions" className="mt-5 flex flex-wrap items-center gap-2">
        <a
          href={mapsUrl}
          target="_blank"
          rel="noreferrer"
          aria-label={`Get directions to ${name} in Google Maps`}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-brand px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          <NavigationArrow size={17} weight="fill" aria-hidden />
          Get directions
        </a>
        <ShareButton
          title={name}
          text={`${name} on Nook — cafes in Cebu`}
          label="Share"
          className="hidden h-11 border border-brand px-4 text-brand hover:bg-brand-soft hover:no-underline lg:flex"
        />
        <Link
          href="/download-app"
          className="inline-flex h-11 items-center gap-2 rounded-full border border-brand px-4 text-sm font-semibold text-brand transition-colors hover:bg-brand-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          <BookmarkSimple size={17} aria-hidden />
          Save in the app
        </Link>
      </div>

      <div className="mt-5">
        <AtAGlance tags={tags} hours={hours} />
      </div>
      {description ? (
        <p className="mt-5 max-w-2xl text-[15px] leading-7 text-body">{description}</p>
      ) : null}
    </div>
  );
}
