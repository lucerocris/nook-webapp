import Image from "next/image";
import Link from "next/link";
import { CaretRight, Coffee } from "@phosphor-icons/react/dist/ssr";

import type { CrawlStop } from "@/lib/data/crawls";
import { formatDistance } from "@/lib/utils/format";

/**
 * The stops in visiting order (PamPam's rows: a thumbnail with the step
 * number on its corner, then the name and a second line; Google Maps' leg
 * distance as its own small line between rows, nothing after the last;
 * docs/references/crawl-link). The numbers match the map's pins. Each row
 * opens the cafe's page.
 */
export default function CrawlStopList({ stops }: { stops: CrawlStop[] }) {
  return (
    <ol className="-mx-3">
      {stops.map((stop) => (
        <li key={`${stop.order}-${stop.cafeId}`}>
          <Link
            href={`/cafes/${stop.cafeId}`}
            className="group flex items-center gap-4 rounded-2xl px-3 py-2.5 transition-colors hover:bg-subtle focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand"
          >
            <span className="relative size-[72px] shrink-0 sm:size-20">
              <span className="absolute inset-0 overflow-hidden rounded-xl bg-paper">
                {stop.imageUrl ? (
                  <Image
                    src={stop.imageUrl}
                    alt=""
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                ) : (
                  <span className="flex h-full items-center justify-center text-muted">
                    <Coffee size={24} aria-hidden />
                  </span>
                )}
              </span>
              <span
                aria-hidden
                className="absolute -top-1.5 -left-1.5 flex size-6 items-center justify-center rounded-full bg-brand text-xs font-semibold text-white tabular-nums ring-2 ring-white"
              >
                {stop.order}
              </span>
            </span>
            <span className="min-w-0 flex-1">
              <span className="sr-only">Stop {stop.order}: </span>
              <span className="line-clamp-2 text-[15px] leading-snug font-semibold break-words text-ink sm:text-base">
                {stop.name}
              </span>
              {stop.area ? (
                <span className="mt-0.5 block truncate text-[13px] text-muted">{stop.area}</span>
              ) : null}
            </span>
            <CaretRight
              size={16}
              className="shrink-0 text-muted transition-transform group-hover:translate-x-0.5"
              aria-hidden
            />
          </Link>
          {stop.toNextMeters !== null ? (
            <div className="flex items-center gap-3 py-1 pr-3 pl-[100px] sm:pl-[108px]">
              <span className="shrink-0 text-[13px] text-muted tabular-nums">
                {formatDistance(stop.toNextMeters)} to stop {stop.order + 1}
              </span>
              <span className="h-px flex-1 bg-line" aria-hidden />
            </div>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
