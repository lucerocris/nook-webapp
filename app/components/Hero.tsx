import { Suspense } from "react";
import Link from "next/link";

import HeroSearch from "./HeroSearch";
import { getSearchTags, searchCafes } from "@/lib/data/search";
import { getTagIcon } from "@/lib/utils/tag-icon";

/** Quick filters under the search field. Each one opens the map already
 * filtered; only tags that exist in the live tag list are shown. */
const QUICK_TAGS = ["Wi-Fi", "Power Outlets", "Quiet", "Open Late", "Study", "Pet Friendly"];

function HeroSearchFallback() {
  return <div aria-hidden="true" className="h-14 w-full animate-pulse rounded-full bg-paper sm:h-16" />;
}

async function HeroSearchContent() {
  const [tags, topCafes] = await Promise.all([getSearchTags(), searchCafes({ limit: 5 })]);
  return <HeroSearch tags={tags} initialCafes={topCafes} />;
}

async function QuickChips() {
  const tags = await getSearchTags();
  const known = new Map(
    [...tags.amenities, ...tags.bestFor].map((t) => [t.name.toLowerCase(), t.name]),
  );
  const chips = QUICK_TAGS.map((name) => known.get(name.toLowerCase())).filter(
    (name): name is string => Boolean(name),
  );
  // Fall back to the first few live tags if none of the preferred names exist.
  const shown =
    chips.length >= 3 ? chips : [...tags.amenities, ...tags.bestFor].slice(0, 6).map((t) => t.name);

  if (shown.length === 0) return null;

  return (
    <ul
      aria-label="Quick filters"
      className="no-scrollbar -mx-4 mt-4 flex w-[calc(100%+2rem)] gap-2 overflow-x-auto px-4 [overscroll-behavior-x:contain] sm:mx-0 sm:w-full sm:flex-wrap sm:justify-center sm:overflow-visible sm:px-0"
    >
      {shown.map((name) => {
        const Icon = getTagIcon(name);
        return (
          <li key={name} className="shrink-0">
            <Link
              href={`/map?tags=${encodeURIComponent(name)}`}
              className="inline-flex h-10 items-center gap-1.5 rounded-full border border-line bg-white px-4 text-[13px] font-medium text-body transition-colors hover:border-line-strong hover:bg-paper hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              <Icon size={16} className="text-fern" aria-hidden />
              {name}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Short hero (design.md, Photo shelves): one headline, the pill search as the
 * page's loud moment, and quick filter chips, so the first shelf of photos
 * starts within the first screen (structure after Airbnb and Tripadvisor).
 */
export default function Hero() {
  return (
    <section className="pb-2 pt-24 sm:pt-32">
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center px-4 text-center sm:px-8">
        <h1 className="text-balance text-[2rem] font-semibold leading-[1.1] tracking-[-0.03em] text-ink sm:text-[2.75rem] lg:text-5xl">
          Find a cafe to work, study or slow down
        </h1>
        <p className="mt-3 text-[15px] text-muted sm:text-base">
          Cebu cafes with their Wi-Fi, outlets, hours and menus, kept by the community.
        </p>
        <div className="mt-8 w-full">
          <Suspense fallback={<HeroSearchFallback />}>
            <HeroSearchContent />
          </Suspense>
        </div>
        <Suspense fallback={<div className="mt-4 h-10" />}>
          <QuickChips />
        </Suspense>
      </div>
    </section>
  );
}
