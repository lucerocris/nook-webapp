"use client";

import { useState } from "react";
import Image from "next/image";

import type { CupPhotoEntry } from "@/lib/data/cups-mappers";
import { cn } from "@/lib/utils";
import CupPhotoViewer, { cupPhotoAlt } from "./CupPhotoViewer";

/**
 * A shared cup's photos (SHARE_CUP_STORY §6.2): the first one large at 4:5,
 * the rest as a row of thumbnails under it; any of them opens the viewer.
 */
export default function CupShowcase({
  photos,
  cafeName,
}: {
  photos: CupPhotoEntry[];
  cafeName: string;
}) {
  const [viewing, setViewing] = useState<number | null>(null);
  const [lead, ...rest] = photos;
  if (!lead) return null;

  return (
    <div>
      <button
        type="button"
        onClick={() => setViewing(0)}
        className="group relative block aspect-[4/5] w-full overflow-hidden rounded-card bg-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        <Image
          src={lead.imageUrl}
          alt={cupPhotoAlt(lead, cafeName)}
          fill
          priority
          sizes="(min-width: 1024px) 520px, 100vw"
          className="object-cover transition-opacity duration-150 group-hover:opacity-95"
        />
      </button>
      {rest.length > 0 ? (
        <ul className={cn("mt-2 grid gap-2", rest.length >= 4 ? "grid-cols-5" : "grid-cols-4")}>
          {rest.map((photo, i) => (
            <li key={photo.id}>
              <button
                type="button"
                onClick={() => setViewing(i + 1)}
                className="group relative block aspect-square w-full overflow-hidden rounded-xl bg-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                <Image
                  src={photo.imageUrl}
                  alt={cupPhotoAlt(photo, cafeName)}
                  fill
                  sizes="120px"
                  className="object-cover transition-opacity duration-150 group-hover:opacity-90"
                />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <CupPhotoViewer
        photos={photos}
        index={viewing}
        onIndexChange={setViewing}
        cafeName={cafeName}
      />
    </div>
  );
}
