import Link from "next/link";
import { CaretRight } from "@phosphor-icons/react/dist/ssr";

import type { CafeSummary } from "@/lib/data/cafes-mappers";
import CafeCard from "./CafeCard";
import HorizontalScroller from "./HorizontalScroller";

type Props = {
  title: string;
  subtitle?: string;
  cafes: CafeSummary[];
  /** Where the title and "See all" lead. */
  href?: string;
  /** Pill pinned to every card's photo in this shelf, e.g. "Featured". */
  badge?: string;
  /** For the first shelf on the page, so its first photo loads eagerly. */
  priority?: boolean;
};

/**
 * One home shelf (design.md, Photo shelves; Airbnb's home): the title links to
 * the full list with a caret, a short line under it, arrows on the right, and
 * a row of photo cards that runs off the edge. Five cards across at `xl`,
 * swiped on touch. A shelf with no cafes renders nothing.
 */
export default function CafeShelf({ title, subtitle, cafes, href, badge, priority }: Props) {
  if (cafes.length === 0) return null;

  return (
    <section className="pt-10 sm:pt-14">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-8">
        <HorizontalScroller
          ariaLabel={title}
          bleed
          gapClass="gap-4 lg:gap-5"
          header={
            <>
              <h2 className="text-xl font-semibold tracking-[-0.02em] text-ink sm:text-[22px]">
                {href ? (
                  <Link
                    href={href}
                    className="inline-flex items-center gap-1 rounded-sm outline-none hover:underline hover:underline-offset-4 focus-visible:ring-2 focus-visible:ring-brand"
                  >
                    {title}
                    <CaretRight size={16} weight="bold" aria-hidden />
                  </Link>
                ) : (
                  title
                )}
              </h2>
              {subtitle ? <p className="mt-1 text-sm text-muted">{subtitle}</p> : null}
            </>
          }
          actions={
            href ? (
              <Link
                href={href}
                className="hidden text-sm font-medium text-ink underline-offset-4 hover:underline sm:inline"
              >
                See all
              </Link>
            ) : null
          }
        >
          {cafes.map((cafe, index) => (
            <div
              key={cafe.id}
              className="w-[72%] flex-none snap-start sm:w-[calc((100%-2rem)/2.5)] md:w-[calc((100%-3rem)/3.5)] lg:w-[calc((100%-3.75rem)/4)] xl:w-[calc((100%-5rem)/5)]"
            >
              <CafeCard cafe={cafe} badge={badge} priority={priority && index === 0} />
            </div>
          ))}
        </HorizontalScroller>
      </div>
    </section>
  );
}
