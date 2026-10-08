"use client";

import { useState } from "react";
import Image from "next/image";
import { Coffee, PushPin } from "@phosphor-icons/react";

import PhotoViewer from "@/app/components/profile/PhotoViewer";
import type { PublicPhoto } from "@/lib/data/profiles";

/**
 * The coffee gallery: three columns of 4:5 photos in a hairline gutter
 * (Instagram's profile grid; docs/references/public-profile), edge to edge on
 * phones. Each tile names the cafe it was taken at, so the grid reads as
 * where this person drinks coffee. Pinned photos come first with a badge.
 *
 * A tile is a link to its cafe, which is what it does without JavaScript; with
 * it, a tap opens the photo with its drink and note instead.
 */
export default function ProfileGallery({
  photos,
  firstName,
}: {
  photos: PublicPhoto[];
  firstName: string;
}) {
  const [open, setOpen] = useState<number | null>(null);

  if (photos.length === 0) {
    return (
      <div className="flex flex-col items-center px-6 py-14 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-paper text-muted">
          <Coffee size={22} aria-hidden />
        </span>
        <p className="mt-3 text-[15px] font-semibold text-ink">No cups yet</p>
        <p className="mt-1 max-w-[36ch] text-sm text-muted">
          When {firstName} snaps a coffee at a cafe in the app, it shows up here.
        </p>
      </div>
    );
  }

  return (
    <>
      <ul className="-mx-4 grid grid-cols-3 gap-0.5 sm:mx-0 sm:gap-1 sm:overflow-hidden sm:rounded-[14px]">
        {photos.map((photo, i) => {
          const label = [photo.drinkName, `at ${photo.cafeName}`].filter(Boolean).join(" ");
          return (
            <li key={photo.id} className="relative aspect-[4/5] bg-paper">
              <a
                href={`/cafes/${photo.cafeId}`}
                onClick={(e) => {
                  if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
                  e.preventDefault();
                  setOpen(i);
                }}
                aria-label={label}
                className="group relative block size-full overflow-hidden focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand"
              >
                <Image
                  src={photo.imageUrl}
                  alt=""
                  fill
                  sizes="(min-width: 960px) 310px, 33vw"
                  // The first row is usually the largest thing on a phone's
                  // first screen.
                  priority={i < 3}
                  className="object-cover transition-opacity duration-200 group-hover:opacity-90"
                />
                {photo.pinned ? (
                  <span className="absolute top-1.5 left-1.5 flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-medium text-ink sm:top-2.5 sm:left-2.5">
                    <PushPin size={11} weight="fill" aria-hidden />
                    Pinned
                  </span>
                ) : null}
                <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-2 pt-6 pb-1.5 sm:px-3 sm:pt-10 sm:pb-2.5">
                  <span className="block truncate text-left text-[11px] leading-tight font-medium text-white sm:text-[13px]">
                    {photo.cafeName}
                  </span>
                </span>
              </a>
            </li>
          );
        })}
      </ul>
      <PhotoViewer photos={photos} index={open} onIndexChange={setOpen} />
    </>
  );
}
