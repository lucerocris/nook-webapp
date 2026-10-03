"use client";

import Link from "next/link";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { GridFour, X } from "@phosphor-icons/react";

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
 * Below `lg`: a full-bleed, snap-scrolling carousel with back and share over
 * the photo and a counter that opens the full grid.
 * At `lg`: a mosaic, one large tile left and a 2x2 block right, with a
 * "Show all photos" button inside the last tile. Every tile opens the grid.
 *
 * `display: contents` on the wrapper holding the small tiles lets one DOM
 * serve both layouts, so each photo is downloaded exactly once.
 */
export default function CafeGallery({ cafeName, images }: Props) {
  const tiles = images.slice(0, MAX_TILES);
  const total = tiles.length;

  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [gridOpen, setGridOpen] = useState(false);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || total < 2) return;
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

  const trackGrid = total === 1 ? "lg:grid-cols-1" : "lg:grid-cols-2";

  const restGrid =
    total === 3
      ? "lg:grid lg:h-full lg:grid-rows-2 lg:gap-2"
      : total === 4
        ? "lg:grid lg:h-full lg:grid-rows-3 lg:gap-2"
        : total >= 5
        ? "lg:grid lg:h-full lg:grid-cols-2 lg:grid-rows-2 lg:gap-2"
        : "";

  const rest = tiles.slice(1);

  return (
    <section className="relative -mx-4 sm:-mx-8 lg:mx-0">
      <div
        ref={trackRef}
        className={cn(
          "no-scrollbar flex h-[320px] snap-x snap-mandatory overflow-x-auto sm:h-[420px]",
          "lg:grid lg:h-[440px] lg:snap-none lg:gap-2 lg:overflow-hidden lg:rounded-[var(--radius-card)]",
          trackGrid,
        )}
      >
        <GalleryTile
          src={tiles[0]}
          alt={cafeName}
          priority
          sizes={total === 1 ? "100vw" : "(min-width: 1024px) 50vw, 100vw"}
          onOpen={() => setGridOpen(true)}
        />

        {rest.length > 0 ? (
          <div className={cn("contents", restGrid)}>
            {rest.map((image, i) => (
              <GalleryTile
                key={image}
                src={image}
                alt={`${cafeName} photo ${i + 2}`}
                sizes="(min-width: 1024px) 25vw, 100vw"
                onOpen={() => setGridOpen(true)}
              />
            ))}
          </div>
        ) : null}
      </div>

      {images.length > 1 ? (
        <button
          type="button"
          onClick={() => setGridOpen(true)}
          className="absolute bottom-4 right-4 hidden h-9 items-center gap-2 rounded-full border border-ink bg-white px-3.5 text-sm font-semibold text-ink shadow-raise transition-colors hover:bg-paper lg:flex"
        >
          <GridFour size={16} weight="bold" />
          Show all {images.length} photos
        </button>
      ) : null}

      <BackButton className="absolute left-4 top-[calc(1rem+env(safe-area-inset-top))] z-10 lg:hidden" />
      {/* Phones have no navbar on this page; the wordmark keeps the brand and
          a way home in the first screen. */}
      <Link
        href="/"
        aria-label="Nook home"
        className="absolute left-1/2 top-[calc(1rem+env(safe-area-inset-top))] z-10 flex h-10 -translate-x-1/2 items-center rounded-full bg-white/90 px-4 shadow-sm backdrop-blur lg:hidden"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.svg" alt="" className="h-[18px] w-auto" />
      </Link>

      <div className="absolute right-4 top-[calc(1rem+env(safe-area-inset-top))] z-10 lg:hidden">
        <ShareButton
          title={cafeName}
          text={`${cafeName} on Nook — cafes in Cebu`}
          className="border-black/5 bg-white/90 text-ink shadow-sm backdrop-blur hover:bg-white"
        />
      </div>

      {total > 1 ? (
        <button
          type="button"
          onClick={() => setGridOpen(true)}
          aria-label={`Photo ${index + 1} of ${images.length}. Show all photos`}
          className="absolute bottom-3 right-4 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm sm:right-8 lg:hidden"
        >
          {index + 1} / {images.length}
        </button>
      ) : null}

      {gridOpen ? (
        <AllPhotos
          cafeName={cafeName}
          images={images}
          onClose={() => setGridOpen(false)}
        />
      ) : null}
    </section>
  );
}

function GalleryTile({
  src,
  alt,
  priority,
  sizes,
  onOpen,
}: {
  src: string;
  alt: string;
  priority?: boolean;
  sizes: string;
  onOpen: () => void;
}) {
  return (
    <div className="group relative h-full w-full flex-none snap-start bg-paper">
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes={sizes}
        className="object-cover"
      />
      {/* Desktop only: the mosaic opens the grid; on a phone the tile is the
          swipe surface. */}
      <button
        type="button"
        onClick={onOpen}
        aria-label="Show all photos"
        className="absolute inset-0 hidden bg-black/0 transition-colors group-hover:bg-black/10 lg:block"
      />
    </div>
  );
}

/** Full-screen grid of every photo under "All photos (N)". */
function AllPhotos({
  cafeName,
  images,
  onClose,
}: {
  cafeName: string;
  images: string[];
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`All photos of ${cafeName}`}
      className="fixed inset-0 z-[70] overflow-y-auto bg-white"
    >
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-white/95 px-4 py-3 backdrop-blur sm:px-8">
        <h2 className="text-base font-semibold text-ink">
          All photos <span className="font-normal text-muted">({images.length})</span>
        </h2>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close photos"
          className="flex size-10 items-center justify-center rounded-full border border-line text-ink transition-colors hover:bg-paper"
        >
          <X size={18} />
        </button>
      </div>
      <ul className="mx-auto grid max-w-5xl grid-cols-1 gap-2 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:grid-cols-2 sm:p-8 lg:grid-cols-3">
        {images.map((src, i) => (
          <li key={src} className="relative aspect-[4/3] overflow-hidden rounded-xl bg-paper">
            <Image
              src={src}
              alt={`${cafeName} photo ${i + 1}`}
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover"
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
