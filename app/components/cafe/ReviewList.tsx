"use client";

import { useMemo, useState } from "react";

import type { Review } from "@/lib/data/cafes-mappers";
import ReviewCard from "./ReviewCard";

type Sort = "newest" | "highest" | "lowest";

/** Count on the left, "Sort by" on the right, then the cards. */
export default function ReviewList({
  reviews,
  total,
}: {
  reviews: Review[];
  total: number;
}) {
  const [sort, setSort] = useState<Sort>("newest");

  const sorted = useMemo(() => {
    const list = [...reviews];
    if (sort === "newest") {
      list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    } else {
      list.sort((a, b) =>
        sort === "highest" ? b.rating - a.rating : a.rating - b.rating,
      );
    }
    return list;
  }, [reviews, sort]);

  return (
    <div>
      <div className="flex items-center justify-between gap-4 border-b border-line pb-4">
        <p className="text-sm text-muted">
          {total} {total === 1 ? "review" : "reviews"}
          {total > reviews.length ? ` · showing the ${reviews.length} newest` : ""}
        </p>
        <label className="flex items-center gap-2 text-sm text-muted">
          Sort by
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            className="h-9 rounded-full border border-line-strong bg-white px-3 text-sm font-medium text-ink outline-none focus:border-brand"
          >
            <option value="newest">Newest</option>
            <option value="highest">Highest rated</option>
            <option value="lowest">Lowest rated</option>
          </select>
        </label>
      </div>
      <ul className="divide-y divide-line">
        {sorted.map((review) => (
          <li key={review.id} className="py-6">
            <ReviewCard review={review} />
          </li>
        ))}
      </ul>
    </div>
  );
}
