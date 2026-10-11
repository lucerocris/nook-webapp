import { createElement } from "react";
import Link from "next/link";

import type { CafeTagGroups } from "@/lib/utils/coffee-tags";
import { previewTags, tagTotal } from "@/lib/utils/coffee-tags";
import { getTagIcon } from "@/lib/utils/tag-icon";

/**
 * What this cafe offers: a short preview of the cafe's tags as an icon +
 * label grid, then "See all N" to the full page (`/cafes/[id]/offers`) when
 * there are more. The preview is `previewTags`: two each from Coffee, Best for
 * and Amenities, Coffee first, so a cafe with twenty tags reads as calmly as
 * one with six. Same rule and wording as the app.
 */
export default function CafeAmenities({
  cafeId,
  groups,
}: {
  cafeId: string;
  groups: CafeTagGroups;
}) {
  const preview = previewTags(groups);
  const total = tagTotal(groups);

  if (total === 0) {
    return <p className="text-sm text-muted">Nothing listed for this cafe yet.</p>;
  }

  return (
    <div>
      <ul className="grid grid-cols-1 gap-x-8 gap-y-4 min-[420px]:grid-cols-2">
        {preview.map((tag) => (
          <li key={tag.id} className="flex min-w-0 items-center gap-3 text-[15px] text-body">
            {createElement(getTagIcon(tag.name), {
              size: 22,
              className: "shrink-0 text-ink",
              "aria-hidden": true,
            })}
            <span className="min-w-0">{tag.name}</span>
          </li>
        ))}
      </ul>

      {total > preview.length ? (
        <Link
          href={`/cafes/${cafeId}/offers`}
          className="mt-7 inline-flex h-11 items-center rounded-full border border-ink px-5 text-sm font-semibold text-ink transition-colors hover:bg-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          See all {total}
        </Link>
      ) : null}
    </div>
  );
}
