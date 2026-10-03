"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";

import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  /** Tailwind gap utility for the track (must match the child width math). */
  gapClass?: string;
  ariaLabel?: string;
  /** Left side of the header row. When given, the prev/next buttons sit at
   * the right end of that row as a pair, instead of floating on the track. */
  header?: React.ReactNode;
  /** Extra controls placed before the arrow pair, e.g. a "See all" link. */
  actions?: React.ReactNode;
  /** Let the track run to the viewport edge on phones so the next card peeks. */
  bleed?: boolean;
};

/**
 * A snap-scrolling horizontal track with a prev/next pair. Each button is
 * disabled (not hidden) at its end of the track, so the pair never jumps.
 * On touch screens the arrows are hidden and the row is swiped.
 */
export default function HorizontalScroller({
  children,
  gapClass = "gap-4",
  ariaLabel = "items",
  header,
  actions,
  bleed = false,
}: Props) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const update = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 8);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [update, children]);

  const scrollByPage = useCallback((direction: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.9, behavior: "smooth" });
  }, []);

  const scrollable = canScrollLeft || canScrollRight;

  return (
    <div>
      {header || actions ? (
        <div className="flex items-end justify-between gap-4">
          <div className="min-w-0">{header}</div>
          <div className="flex shrink-0 items-center gap-3">
            {actions}
            {scrollable ? (
              <div className="hidden items-center gap-2 md:flex">
                <ArrowButton
                  label={`Scroll ${ariaLabel} left`}
                  disabled={!canScrollLeft}
                  onClick={() => scrollByPage(-1)}
                >
                  <CaretLeft size={14} weight="bold" />
                </ArrowButton>
                <ArrowButton
                  label={`Scroll ${ariaLabel} right`}
                  disabled={!canScrollRight}
                  onClick={() => scrollByPage(1)}
                >
                  <CaretRight size={14} weight="bold" />
                </ArrowButton>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <div
        ref={trackRef}
        className={cn(
          "no-scrollbar flex snap-x snap-mandatory overflow-x-auto scroll-smooth pb-1",
          header || actions ? "mt-4 sm:mt-5" : "",
          bleed && "-mx-4 scroll-px-4 px-4 sm:mx-0 sm:scroll-px-0 sm:px-0",
          gapClass,
        )}
      >
        {children}
      </div>
    </div>
  );
}

function ArrowButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="flex size-8 items-center justify-center rounded-full border border-line bg-white text-ink transition hover:border-line-strong disabled:cursor-default disabled:text-line-strong disabled:hover:border-line"
    >
      {children}
    </button>
  );
}
