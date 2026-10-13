import { createElement, type ReactNode } from "react";
import { Star } from "@phosphor-icons/react/dist/ssr";

import type { Tag } from "@/lib/data/cafes-mappers";
import { getTagIcon } from "@/lib/utils/tag-icon";

const KEY_FACTS = 5;

/**
 * The facts block under the photos (Trip.com's order, Google Maps' rating
 * line): what and where, the rating line, then a row of the few facts people
 * check first as icon chips, then the cafe's own description.
 * The chips are the cafe's featured tags, topped up with amenities.
 */
export default function CafeHeading({
  area,
  rating,
  cupCount,
  tags,
  description,
  createdAt,
  stories,
}: {
  area: string;
  /** From rated cups only (each person once); null when nobody rated. */
  rating: number | null;
  /** Cups are visits, not photos. null when the cups couldn't be read: the
   * line is left out rather than claiming there are none. */
  cupCount: number | null;
  tags: Tag[];
  description: string | null;
  /** When the cafe was listed: "Fresh on Nook" only in its first 30 days. */
  createdAt: string;
  /** The Latest cups tray, right under the rating line: the proof sits
   * under the name (UX review 1.2). */
  stories?: ReactNode;
}) {
  const featured = tags.filter((t) => t.isFeatured);
  const rest = tags.filter((t) => !t.isFeatured && t.category === "amenities");
  const facts = [...featured, ...rest].slice(0, KEY_FACTS);

  return (
    <div>
      <p className="text-[15px] font-medium text-ink">Cafe{area ? ` in ${area}` : ""}</p>
      {cupCount === null ? null : (
        <p className="mt-1 flex flex-wrap items-center gap-x-1.5 text-sm text-body">
          {cupCount > 0 ? (
            // The whole rating is the way to the words behind it (UX review
            // 1.2): Google Maps' and Apple Maps' rating line jumps to reviews.
            <a
              href="#cups"
              className="-my-2.5 inline-flex min-h-11 items-center gap-x-1.5 rounded-md underline-offset-4 hover:text-ink hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              {rating !== null ? (
                <>
                  <Star size={14} weight="fill" className="text-fern" aria-hidden />
                  <span className="font-semibold tabular-nums text-ink">{rating.toFixed(1)}</span>
                  <span className="sr-only"> out of 5 from </span>
                  <span aria-hidden>·</span>
                </>
              ) : null}
              <span className="underline">
                {cupCount} {cupCount === 1 ? "cup" : "cups"}
              </span>
            </a>
          ) : (
            <span>{isFresh(createdAt) ? "Fresh on Nook · no cups yet" : "No cups yet"}</span>
          )}
        </p>
      )}

      {stories ? <div className="mt-6">{stories}</div> : null}

      {facts.length > 0 ? (
        <ul aria-label="Key facts" className="mt-5 flex flex-wrap gap-2">
          {facts.map((tag) => (
            <li
              key={tag.id}
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line px-3.5 text-[13px] font-medium text-ink"
            >
              {createElement(getTagIcon(tag.name), {
                size: 16,
                className: "text-fern",
                "aria-hidden": true,
              })}
              {tag.name}
            </li>
          ))}
        </ul>
      ) : null}

      {description ? (
        <div className="mt-6 border-t border-line pt-6">
          <p className="max-w-2xl text-[15px] leading-7 text-body">{description}</p>
        </div>
      ) : null}
    </div>
  );
}

const FRESH_DAYS = 30;

/** Listed in the last 30 days (COFFEE_VOICE rule 2: a coffee word only when
 * it is literally true; UX review 6.3). */
function isFresh(createdAt: string): boolean {
  const at = new Date(createdAt).getTime();
  if (Number.isNaN(at)) return false;
  return Date.now() - at < FRESH_DAYS * 86_400_000;
}
