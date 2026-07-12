import Image from "next/image";

import HorizontalScroller from "./HorizontalScroller";
import { formatPrice } from "@/lib/utils/format";
import type { MenuItem } from "@/lib/data/cafes-mappers";

type Props = {
  items: MenuItem[];
};

// Horizontal, snap-scrolling row of menu items — four visible on desktop, the
// rest reachable via the always-visible arrow buttons.
export default function MenuHighlightsRow({ items }: Props) {
  return (
    <HorizontalScroller gapClass="gap-3" ariaLabel="menu items">
      {items.map((item) => (
        <article
          key={item.id}
          className="w-[calc((100%-0.75rem)/2)] flex-none snap-start md:w-[calc((100%-2.25rem)/4)]"
        >
          <MenuThumbnail item={item} />
          <h3 className="mt-2 text-sm font-semibold text-[#101514]">
            {item.name}
          </h3>
          <p className="mt-2 text-xs font-medium text-[#101514]">
            {formatPrice(item.price)}
          </p>
        </article>
      ))}
    </HorizontalScroller>
  );
}

function MenuThumbnail({ item }: { item: MenuItem }) {
  if (!item.imageUrl) {
    return (
      <div className="flex aspect-[1.55/1] items-center justify-center rounded-xl bg-zinc-100 text-xs text-zinc-400">
        {item.name}
      </div>
    );
  }
  return (
    <div className="relative aspect-[1.55/1] overflow-hidden rounded-xl bg-zinc-100">
      <Image
        src={item.imageUrl}
        alt={item.name}
        fill
        sizes="(min-width: 768px) 20vw, 50vw"
        className="object-cover"
      />
    </div>
  );
}
