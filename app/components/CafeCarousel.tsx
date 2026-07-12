import CafeCard from "./CafeCard";
import HorizontalScroller from "./HorizontalScroller";
import type { CafeSummary } from "@/lib/data/cafes-mappers";

type Props = {
  cafes: CafeSummary[];
};

// A horizontal row of cafe cards. Four cards are visible at the large
// breakpoint; the rest scroll along the x-axis via the always-visible arrows.
export default function CafeCarousel({ cafes }: Props) {
  return (
    <HorizontalScroller ariaLabel="cafes">
      {cafes.map((cafe, index) => (
        <div
          key={cafe.id}
          className="w-[82%] flex-none snap-start sm:w-[calc((100%-1rem)/2)] lg:w-[calc((100%-3rem)/4)]"
        >
          <CafeCard cafe={cafe} priority={index === 0} />
        </div>
      ))}
    </HorizontalScroller>
  );
}
