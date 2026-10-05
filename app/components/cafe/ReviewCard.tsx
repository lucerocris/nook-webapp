"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";

import type { Review } from "@/lib/data/cafes-mappers";
import { cn } from "@/lib/utils";
import RatingStars from "./RatingStars";

/**
 * Avatar, name and date on one line, stars under them, then the text clamped
 * to four lines with an inline "more" that only appears when it actually
 * overflows, and a row of photo thumbnails when the review has any.
 */
export default function ReviewCard({
  review,
  bordered = false,
}: {
  review: Review;
  bordered?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = textRef.current;
    if (el) setOverflows(el.scrollHeight > el.clientHeight + 1);
  }, [review.content]);

  const date = new Date(review.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
  });

  return (
    <article className={cn(bordered && "rounded-2xl border border-line p-5")}>
      {review.authorUsername ? (
        // The author's public profile (/u/<username>), with their top cafes.
        <Link
          href={`/u/${review.authorUsername}`}
          className="group flex w-fit max-w-full items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          <Avatar name={review.authorName} url={review.authorAvatarUrl} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink group-hover:underline group-hover:underline-offset-4">
              {review.authorName}
            </p>
            <p className="text-xs text-muted">{date}</p>
          </div>
        </Link>
      ) : (
        <div className="flex items-center gap-3">
          <Avatar name={review.authorName} url={review.authorAvatarUrl} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">{review.authorName}</p>
            <p className="text-xs text-muted">{date}</p>
          </div>
        </div>
      )}
      <div className="mt-3 flex items-center gap-2">
        <RatingStars rating={review.rating} size={12} />
        <span className="sr-only">{review.rating} out of 5</span>
      </div>
      {review.content ? (
        <>
          <p
            ref={textRef}
            className={cn(
              "mt-2 text-sm leading-6 text-body",
              !expanded && "line-clamp-4",
            )}
          >
            {review.content}
          </p>
          {overflows || expanded ? (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="mt-1 text-sm font-semibold text-ink underline underline-offset-4"
            >
              {expanded ? "Show less" : "Show more"}
            </button>
          ) : null}
        </>
      ) : null}
      {review.imageUrls.length > 0 ? (
        <ul className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
          {review.imageUrls.slice(0, 6).map((url) => (
            <li key={url} className="relative size-20 shrink-0 overflow-hidden rounded-lg bg-subtle">
              <Image src={url} alt="" fill sizes="80px" className="object-cover" />
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}

function Avatar({ name, url }: { name: string; url: string | null }) {
  if (url) {
    return (
      <span className="relative size-10 shrink-0 overflow-hidden rounded-full bg-subtle">
        <Image src={url} alt="" fill sizes="40px" className="object-cover" />
      </span>
    );
  }
  return (
    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-soft text-sm font-semibold text-brand">
      {name.trim().charAt(0).toUpperCase() || "?"}
    </span>
  );
}
