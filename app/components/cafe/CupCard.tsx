"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";


import { ThumbsUp } from "@phosphor-icons/react";

import {
  cupPhotoEntries,
  plural,
  relativeVisitDate,
  type CupCard as Cup,
} from "@/lib/data/cups-mappers";
import { cn } from "@/lib/utils";
import CupAvatar from "./CupAvatar";
import CupKindIcon from "./CupKindIcon";
import CupPhotoViewer, { cupPhotoAlt } from "./CupPhotoViewer";
import RatingStars from "./RatingStars";
import { visitDay } from "./visit-day";

/**
 * One cup — one person's visit (docs/references/cups, Google Maps' card):
 * the author row, stars only when given with the day beside them, the note
 * clamped with "Show more", then the photos edge to edge with what each one
 * is, and anything had without a photo as small chips. Every photo opens
 * the viewer, "+N" included, so none is out of reach (UX review 6.5). The
 * helpful count is shown, read only: voting is in the app.
 */
export default function CupCard({
  cup,
  cafeName,
  shownPhotos = 3,
  showAuthor = true,
  absoluteDate = false,
}: {
  cup: Cup;
  /** For the photos' alt text. */
  cafeName: string;
  shownPhotos?: number;
  /** Off on a profile, where the author is the page. */
  showAuthor?: boolean;
  /** "Oct 9, 2026" instead of "2 days ago": a profile is a history, and it
   * renders outside Suspense, where reading the clock isn't allowed. */
  absoluteDate?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [viewing, setViewing] = useState<number | null>(null);
  const [overflows, setOverflows] = useState(false);
  const noteRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = noteRef.current;
    if (el) setOverflows(el.scrollHeight > el.clientHeight + 1);
  }, [cup.note]);

  const photos = cup.items.filter((item) => item.photo);
  const entries = cupPhotoEntries(cup);
  const named = cup.items.filter((item) => !item.photo && item.label);
  const shown = photos.slice(0, shownPhotos);
  const extra = photos.length - shown.length;
  const when = absoluteDate ? visitDay(cup.visitedAt) : relativeVisitDate(cup.visitedAt);
  const visits = cup.visitsByAuthor > 1 ? plural(cup.visitsByAuthor, "visit") + " here" : null;

  const author = (
    <>
      <CupAvatar name={cup.authorName} url={cup.avatarUrl} />
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-ink group-hover:underline group-hover:underline-offset-4">
          {cup.authorName}
        </p>
        {visits ? <p className="text-xs text-muted">{visits}</p> : null}
      </div>
    </>
  );

  return (
    <article className="min-w-0">
      {!showAuthor ? null : cup.username ? (
        <Link
          href={`/u/${cup.username}`}
          className="group flex w-fit max-w-full items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          {author}
        </Link>
      ) : (
        <div className="flex items-center gap-3">{author}</div>
      )}

      <div className={cn("flex items-center gap-2 text-xs text-muted", showAuthor && "mt-3")}>
        {cup.rating !== null ? (
          <>
            <RatingStars rating={cup.rating} size={12} />
            <span className="sr-only">{cup.rating} out of 5.</span>
          </>
        ) : null}
        {when ? <span>{when}</span> : null}
      </div>

      {cup.note ? (
        <>
          <p
            ref={noteRef}
            className={cn("mt-2 text-sm leading-6 text-body", !expanded && "line-clamp-4")}
          >
            {cup.note}
          </p>
          {overflows || expanded ? (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="mt-1 min-h-11 text-sm font-semibold text-ink underline underline-offset-4 sm:min-h-0"
            >
              {expanded ? "Show less" : "Show more"}
            </button>
          ) : null}
        </>
      ) : null}

      {shown.length > 0 ? (
        <ul
          className={cn(
            "mt-3 grid gap-2",
            shown.length === 1 ? "grid-cols-2" : shown.length === 2 ? "grid-cols-2" : "grid-cols-3",
          )}
        >
          {shown.map((item, index) => (
            <li key={item.id} className="min-w-0">
              <button
                type="button"
                onClick={() => setViewing(index)}
                className="group relative block aspect-[4/5] w-full overflow-hidden rounded-xl bg-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                <Image
                  src={item.photo!.imageUrl}
                  alt={cupPhotoAlt(entries[index], cafeName)}
                  fill
                  sizes="(min-width: 1024px) 200px, 33vw"
                  className="object-cover transition-opacity duration-150 group-hover:opacity-90"
                />
                {index === shown.length - 1 && extra > 0 ? (
                  <span className="absolute inset-0 flex items-center justify-center bg-ink/55 text-lg font-semibold text-white">
                    +{extra}
                    <span className="sr-only"> more photos, open the photos</span>
                  </span>
                ) : null}
              </button>
              {item.label ? (
                <p className="mt-1.5 flex items-center gap-1 truncate text-xs font-medium text-ink">
                  {item.kind ? (
                    <CupKindIcon kind={item.kind} size={12} className="shrink-0 text-fern" />
                  ) : null}
                  <span className="truncate">{item.label}</span>
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      {named.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {named.map((item) => (
            <li
              key={item.id}
              className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-paper px-3 py-1.5 text-xs font-medium text-ink"
            >
              {item.kind ? (
                    <CupKindIcon kind={item.kind} size={13} className="shrink-0 text-fern" />
                  ) : null}
              <span className="truncate">{item.label}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {cup.helpfulCount > 0 ? (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-muted tabular-nums">
          <ThumbsUp size={14} aria-hidden />
          Helpful · {cup.helpfulCount.toLocaleString("en-US")}
          <span className="sr-only">
            {" "}
            ({plural(cup.helpfulCount, "person", "people")} found this helpful)
          </span>
        </p>
      ) : null}

      {entries.length > 0 ? (
        <CupPhotoViewer
          photos={entries}
          index={viewing}
          onIndexChange={setViewing}
          cafeName={cafeName}
        />
      ) : null}
    </article>
  );
}
