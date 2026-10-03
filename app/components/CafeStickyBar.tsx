"use client";

import { useEffect, useState } from "react";
import { NavigationArrow } from "@phosphor-icons/react";

import {
  formatTimeRange,
  getCurrentDayKey,
  isOpenNow,
  type OperatingHours,
} from "@/lib/utils/hours";

type Props = {
  cafeName: string;
  hours: OperatingHours;
  mapsUrl: string;
};

/**
 * Mobile-only action bar pinned to the bottom of the viewport.
 *
 * Below `lg` the sidebar card is hidden, which would otherwise leave "Get
 * Directions" stranded at the very end of a ~2800px scroll. This keeps the one
 * action the page exists for inside the thumb zone the whole way down.
 *
 * The status line only renders after mount: `new Date()`
 * during render disagrees between the server pass and hydration, so nothing
 * time-dependent is emitted until after mount, then refreshed each minute.
 */
export default function CafeStickyBar({ cafeName, hours, mapsUrl }: Props) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);

  const today = now ? (hours[getCurrentDayKey(now)] ?? null) : null;
  const openNow = now ? isOpenNow(hours, now) : null;
  const todayRange = formatTimeRange(today);

  const statusText =
    openNow === null ? cafeName : openNow ? "Open now" : "Closed";
  const statusClass =
    openNow === null
      ? "text-ink"
      : openNow
        ? "text-open"
        : "text-closed";
  // A non-breaking space holds the second line's height before mount so the
  // bar doesn't change height when the status resolves.
  // Branches mirror OpenStatus so the bar and the sidebar card
  // never disagree about the same cafe.
  const subtitle =
    now === null
      ? " "
      : today
        ? today.closed
          ? "Closed today"
          : todayRange || "Hours not available"
        : "Hours not available";

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white lg:hidden">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:px-8">
        <div className="min-w-0">
          <p className={`truncate text-sm font-semibold leading-tight ${statusClass}`}>
            {statusText}
          </p>
          <p className="mt-1 truncate text-xs leading-tight text-muted">
            {subtitle}
          </p>
        </div>

        <a
          href={mapsUrl}
          target="_blank"
          rel="noreferrer"
          aria-label={`Open ${cafeName} in Google Maps`}
          className="flex h-12 shrink-0 items-center gap-2 rounded-full bg-brand px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-hover"
        >
          <NavigationArrow size={18} />
          Get directions
        </a>
      </div>
    </div>
  );
}
