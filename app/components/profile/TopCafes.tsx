import Image from "next/image";
import Link from "next/link";
import { Coffee } from "@phosphor-icons/react/dist/ssr";

import type { PublicTopCafe } from "@/lib/data/profiles";

/**
 * "Top cafes": the person's three best-liked cafes as three equal photo
 * cards in rank order, the rank on a white disc in the photo's corner, name
 * and area under it (Airbuds' three tiles, Showcase's corner marker;
 * docs/references/public-profile in nook-mobile). No scores: only the order
 * is shared. With one or two, the cards keep their width and sit left.
 */
export default function TopCafes({ cafes }: { cafes: PublicTopCafe[] }) {
  if (cafes.length === 0) return null;
  return (
    <section aria-labelledby="top-cafes" className="mt-8 sm:mt-10">
      <h2 id="top-cafes" className="text-xl font-semibold tracking-[-0.01em] text-ink sm:text-[22px]">
        Top cafes
      </h2>
      <ol className="mt-4 grid grid-cols-3 gap-3 sm:gap-5">
        {cafes.slice(0, 3).map((cafe) => (
          <li key={cafe.cafeId} className="min-w-0">
            <Link
              href={`/cafes/${cafe.cafeId}`}
              className="group block rounded-card focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
            >
              <div className="relative aspect-square overflow-hidden rounded-[14px] bg-paper sm:aspect-[4/3] sm:rounded-card">
                {cafe.imageUrl ? (
                  <Image
                    src={cafe.imageUrl}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 300px, 33vw"
                    className="object-cover transition-opacity duration-200 group-hover:opacity-90"
                  />
                ) : (
                  <span className="flex h-full items-center justify-center text-muted">
                    <Coffee size={24} aria-hidden />
                  </span>
                )}
                <span
                  className="absolute top-2 left-2 flex size-7 items-center justify-center rounded-full bg-white text-[13px] font-semibold text-brand tabular-nums sm:top-3 sm:left-3"
                  aria-label={`Number ${cafe.rank}`}
                >
                  {cafe.rank}
                </span>
              </div>
              <p className="mt-2 line-clamp-2 text-sm leading-snug font-semibold text-ink sm:text-[15px]">{cafe.name}</p>
              {cafe.area ? <p className="truncate text-xs text-muted sm:text-[13px]">{cafe.area}</p> : null}
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
