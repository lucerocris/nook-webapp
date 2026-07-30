"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

import BackButton from "@/app/components/BackButton";
import ShareButton from "@/app/components/ShareButton";
import { cn } from "@/lib/utils";

type Props = {
  cafeName: string;
  images: string[];
};

const MAX_TILES = 5;

/**
 * One set of images, two layouts.
 *
 * Below `lg` this is a full-bleed, snap-scrolling carousel — one photo per
 * screen, the way a phone actually wants to browse them. At `lg` it becomes the
 * mosaic: a large hero beside a block of thumbnails.
 *
 * The trick that makes a single DOM serve both is `display: contents` on the
 * wrapper holding the non-hero tiles. On mobile the wrapper vanishes from
 * layout and its children become direct flex items of the scroller; at `lg` it
 * turns back into a grid and re-nests them. Rendering two separate trees and
 * toggling `hidden` would work too, but browsers still fetch images inside a
 * `display: none` subtree — this way each photo is downloaded exactly once.
 */
export default function CafeGallery({ cafeName, images }: Props) {
  const tiles = images.slice(0, MAX_TILES);
  const total = tiles.length;

  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || total < 2) return;

    // Slides are exactly one container wide with no gap below `lg`, so
    // scrollLeft / clientWidth lands on the slide index without drift.
    const onScroll = () => {
      const width = track.clientWidth;
      if (width === 0) return;
      const next = Math.round(track.scrollLeft / width);
      setIndex(Math.min(Math.max(next, 0), total - 1));
    };

    track.addEventListener("scroll", onScroll, { passive: true });
    return () => track.removeEventListener("scroll", onScroll);
  }, [total]);

  if (total === 0) return null;

  // Desktop only: the hero keeps ~1.35 parts to the thumbnails' 1.
  const trackGrid =
    total === 1
      ? "lg:grid-cols-1"
      : total === 2
        ? "lg:grid-cols-2"
        : "lg:grid-cols-[1.35fr_1fr]";

  // Two photos need no wrapper grid — the single remaining tile is already the
  // second column. Three stack vertically; four or more form a 2x2.
  const restGrid =
    total === 3
      ? "lg:grid lg:h-full lg:grid-rows-2 lg:gap-2"
      : total >= 4
        ? "lg:grid lg:h-full lg:grid-cols-2 lg:grid-rows-2 lg:gap-2"
        : "";

  const restSizes =
    total === 2
      ? "(min-width: 1024px) 50vw, 100vw"
      : total === 3
        ? "(min-width: 1024px) 40vw, 100vw"
        : "(min-width: 1024px) 22vw, 100vw";

  const rest = tiles.slice(1);

  return (
    // The bleed lives on the section, not the track, so absolutely positioned
    // overlays measure from the photo's edge rather than the page gutter.
    <section className="relative -mx-6 sm:-mx-8 lg:mx-0">
      <div
        ref={trackRef}
        className={cn(
          // Mobile: one slide per screen. Phones draw overlay scrollbars, but
          // desktop-width browsers below `lg` would otherwise park a grey
          // track under the photo.
          "flex h-[300px] snap-x snap-mandatory overflow-x-auto sm:h-[380px]",
          "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          // Desktop: mosaic, no scrolling.
          "lg:grid lg:h-[420px] lg:snap-none lg:gap-2 lg:overflow-visible lg:rounded-sm",
          trackGrid,
        )}
      >
        <GalleryTile
          src={tiles[0]}
          alt={cafeName}
          priority
          sizes={total === 1 ? "100vw" : "(min-width: 1024px) 55vw, 100vw"}
        />

        {rest.length > 0 ? (
          <div className={cn("contents", restGrid)}>
            {rest.map((image, i) => (
              <GalleryTile
                key={image}
                src={image}
                alt={`${cafeName} gallery ${i + 2}`}
                sizes={restSizes}
              />
            ))}
          </div>
        ) : null}
      </div>

      {/* The global navbar is hidden below `lg` on this route, so the photo
          carries the only way back — the same place Fresha puts it, with share
          mirrored across the top edge. Both are desktop's job elsewhere. */}
      <BackButton className="absolute left-4 top-[calc(1rem+env(safe-area-inset-top))] z-10 lg:hidden" />

      <div className="absolute right-4 top-[calc(1rem+env(safe-area-inset-top))] z-10 lg:hidden">
        <ShareButton
          title={cafeName}
          text={`${cafeName} on Nook — cafes in Cebu`}
          className="border-black/5 bg-white/90 text-[#101514] shadow-sm backdrop-blur hover:bg-white"
        />
      </div>

      {total > 1 ? (
        <p
          aria-hidden="true"
          className="pointer-events-none absolute bottom-3 right-4 rounded-full bg-black/55 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm sm:right-6 lg:hidden"
        >
          {index + 1}/{total}
        </p>
      ) : null}
    </section>
  );
}

function GalleryTile({
  src,
  alt,
  priority,
  sizes,
}: {
  src: string;
  alt: string;
  priority?: boolean;
  sizes: string;
}) {
  return (
    <div className="relative h-full w-full flex-none snap-start bg-zinc-100">
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes={sizes}
        className="object-cover"
      />
    </div>
  );
}
