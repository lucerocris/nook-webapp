"use client";

import { useState } from "react";
import Image from "next/image";

import type { CupPhotoEntry } from "@/lib/data/cups-mappers";
import CupAvatar from "./CupAvatar";
import CupKindIcon, { CUP_KIND_LABEL } from "./CupKindIcon";
import CupPhotoViewer, { cupPhotoAlt } from "./CupPhotoViewer";

/**
 * Every photo of a cafe's cups: tall tiles, each captioned with what it is
 * (its name, else its kind, else nothing — never a month, UX review 4.5)
 * and who posted it (the app's Photos grid; references: Luma's captioned
 * tiles). A tile opens the viewer with its cup's stars and note.
 */
export default function CupPhotoGrid({
  photos,
  cafeName,
}: {
  photos: CupPhotoEntry[];
  cafeName: string;
}) {
  const [viewing, setViewing] = useState<number | null>(null);

  return (
    <>
      <ul className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3">
        {photos.map((photo, index) => {
          const what = photo.label ?? (photo.kind ? CUP_KIND_LABEL[photo.kind] : null);
          return (
            <li key={photo.id} className="min-w-0">
              <button
                type="button"
                onClick={() => setViewing(index)}
                className="group block w-full text-left focus-visible:outline-none"
              >
                <span className="relative block aspect-[4/5] overflow-hidden rounded-xl bg-subtle group-focus-visible:outline-2 group-focus-visible:outline-offset-2 group-focus-visible:outline-brand">
                  <Image
                    src={photo.imageUrl}
                    alt={cupPhotoAlt(photo, cafeName)}
                    fill
                    sizes="(min-width: 1024px) 260px, (min-width: 640px) 30vw, 50vw"
                    className="object-cover transition-opacity duration-150 group-hover:opacity-90"
                  />
                </span>
                {what ? (
                  <span className="mt-2 flex items-center gap-1 text-[13px] font-medium text-ink">
                    {photo.kind ? (
                      <CupKindIcon kind={photo.kind} size={13} className="shrink-0 text-fern" />
                    ) : null}
                    <span className="truncate">{what}</span>
                  </span>
                ) : null}
                <span className={what ? "mt-1 flex items-center gap-1.5" : "mt-2 flex items-center gap-1.5"}>
                  <CupAvatar name={photo.authorName} url={photo.avatarUrl} size={18} />
                  <span className="truncate text-xs text-muted">
                    {photo.username ? `@${photo.username}` : photo.authorName}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <CupPhotoViewer
        photos={photos}
        index={viewing}
        onIndexChange={setViewing}
        cafeName={cafeName}
      />
    </>
  );
}
