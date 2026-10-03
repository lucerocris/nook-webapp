import Image from "next/image";
import { Coffee } from "@phosphor-icons/react/dist/ssr";

import HorizontalScroller from "./HorizontalScroller";
import { formatPrice } from "@/lib/utils/format";
import type { MenuItem } from "@/lib/data/cafes-mappers";

type Props = {
  items: MenuItem[];
  header?: React.ReactNode;
  actions?: React.ReactNode;
};

/** The cafe's flagged highlights: photo cards with the price on the photo's
 * bottom-left and the name underneath. Items without a photo get a quiet
 * placeholder of the same size so the row stays even. */
export default function MenuHighlightsRow({ items, header, actions }: Props) {
  return (
    <HorizontalScroller
      gapClass="gap-3"
      ariaLabel="menu highlights"
      header={header}
      actions={actions}
      bleed
    >
      {items.map((item) => (
        <article
          key={item.id}
          className="w-[42%] flex-none snap-start sm:w-[calc((100%-1.5rem)/3)] md:w-[calc((100%-2.25rem)/4)]"
        >
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-subtle">
            {item.imageUrl ? (
              <Image
                src={item.imageUrl}
                alt={item.name}
                fill
                sizes="(min-width: 768px) 18vw, 42vw"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-line-strong">
                <Coffee size={36} />
              </div>
            )}
            <span className="absolute bottom-2 left-2 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-ink shadow-raise">
              {formatPrice(item.price)}
            </span>
          </div>
          <h3 className="mt-2 line-clamp-2 text-sm font-medium text-ink">{item.name}</h3>
        </article>
      ))}
    </HorizontalScroller>
  );
}
