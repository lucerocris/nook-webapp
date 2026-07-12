"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";

type Props = {
  children: React.ReactNode;
  /** Tailwind gap utility for the track (must match the child width math). */
  gapClass?: string;
  ariaLabel?: string;
};

// A horizontal, snap-scrolling track with left/right arrow buttons. The buttons
// are always visible (no hover needed): the left one only appears once you have
// scrolled away from the start, the right one only while more content remains.
// Each button's center is aligned to the edge of the first/last visible card
// and vertically centered on the card's image.
export default function HorizontalScroller({
  children,
  gapClass = "gap-4",
  ariaLabel = "items",
}: Props) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  // Vertical center of the first card's image, relative to the track top.
  const [mediaCenter, setMediaCenter] = useState<number | null>(null);

  const update = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 8);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);

    // Align the buttons with the vertical middle of the card's image.
    const media = el.querySelector("img");
    if (media) {
      const trackRect = el.getBoundingClientRect();
      const mediaRect = media.getBoundingClientRect();
      setMediaCenter(mediaRect.top - trackRect.top + mediaRect.height / 2);
    }
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
    el.scrollBy({ left: direction * el.clientWidth, behavior: "smooth" });
  }, []);

  // Fall back to the vertical middle of the track until the image is measured.
  const topStyle =
    mediaCenter != null
      ? { top: `${mediaCenter}px` }
      : { top: "50%" as const };

  return (
    <div className="relative">
      <div
        ref={trackRef}
        className={[
          "flex snap-x snap-mandatory overflow-x-auto scroll-smooth pb-2",
          "[-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          gapClass,
        ].join(" ")}
      >
        {children}
      </div>

      {canScrollLeft ? (
        <ScrollButton
          direction="left"
          style={topStyle}
          onClick={() => scrollByPage(-1)}
          aria-label={`Scroll ${ariaLabel} left`}
        />
      ) : null}
      {canScrollRight ? (
        <ScrollButton
          direction="right"
          style={topStyle}
          onClick={() => scrollByPage(1)}
          aria-label={`Scroll ${ariaLabel} right`}
        />
      ) : null}
    </div>
  );
}

function ScrollButton({
  direction,
  style,
  onClick,
  "aria-label": ariaLabel,
}: {
  direction: "left" | "right";
  style: React.CSSProperties;
  onClick: () => void;
  "aria-label": string;
}) {
  const isLeft = direction === "left";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      style={style}
      className={[
        "absolute z-10 flex h-10 w-10 items-center justify-center",
        "rounded-full border border-zinc-200 bg-white text-[#3b3b3b] shadow-md transition",
        "hover:bg-zinc-50",
        // Center the button on the first/last card edge and on the image.
        isLeft
          ? "left-0 -translate-x-1/2 -translate-y-1/2"
          : "right-0 translate-x-1/2 -translate-y-1/2",
      ].join(" ")}
    >
      {isLeft ? (
        <CaretLeft size={18} weight="bold" />
      ) : (
        <CaretRight size={18} weight="bold" />
      )}
    </button>
  );
}
