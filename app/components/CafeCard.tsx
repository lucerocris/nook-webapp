import Image from "next/image";
import Link from "next/link";
import { Coffee, Heart, Star } from "@phosphor-icons/react/dist/ssr";

import { formatDistance } from "@/lib/utils/format";
import type { CafeSummary } from "@/lib/data/cafes-mappers";

type Props = {
  cafe: CafeSummary;
  priority?: boolean;
  /** "map" trims the card for the map page: photo squared at the bottom,
   * rating shown as a badge in the top-right, no heart, no distance. */
  variant?: "default" | "map";
};

function PlaceholderImage({ alt }: { alt: string }) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-zinc-100 text-xs text-zinc-400">
      {alt}
    </div>
  );
}

function CardImage({
  cafe,
  priority,
  rounded,
}: {
  cafe: CafeSummary;
  priority?: boolean;
  rounded: string;
}) {
  return (
    <div
      className={`relative aspect-[4/3] w-full overflow-hidden ${rounded} bg-zinc-100`}
    >
      {cafe.coverImage ? (
        <Image
          src={cafe.coverImage}
          alt={cafe.name}
          fill
          priority={priority}
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <PlaceholderImage alt={cafe.name} />
      )}
      {cafe.isNew ? (
        <span className="absolute left-3 top-3 rounded-full bg-[#3A5A40] px-2.5 py-0.5 text-[11px] font-semibold text-white">
          New
        </span>
      ) : null}
    </div>
  );
}

export default function CafeCard({ cafe, priority, variant = "default" }: Props) {
  const area = cafe.neighborhood ?? cafe.city;
  const visibleTags = cafe.tags.slice(0, 2);

  if (variant === "map") {
    return (
      <Link href={`/cafes/${cafe.id}`} className="group block">
        {/* No overflow-hidden here — it was clipping the bottom tag pills. */}
        <article className="flex flex-col rounded-2xl bg-white">
          <CardImage cafe={cafe} priority={priority} rounded="rounded-xl" />

          <div className="mt-3 flex items-center justify-between gap-2">
            <span className="truncate text-sm font-semibold text-[#3b3b3b]">
              {cafe.name}
            </span>
            <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-[#3b3b3b]">
              {cafe.rating > 0 ? (
                <>
                  <Star size={13} weight="fill" className="text-[#3A5A40]" />
                  {cafe.rating.toFixed(1)}
                  <span className="text-zinc-400">({cafe.reviewCount})</span>
                </>
              ) : (
                <Coffee size={15} weight="regular" className="text-zinc-400" />
              )}
            </span>
          </div>

          {area ? (
            <p className="mt-1 truncate text-xs text-zinc-500">{area}</p>
          ) : null}

          {visibleTags.length > 0 ? (
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              {visibleTags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-zinc-200 bg-white px-2.5 py-0.5 text-[11px] font-medium text-[#3b3b3b]"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
        </article>
      </Link>
    );
  }

  const distance = formatDistance(cafe.distanceMeters);

  return (
    <Link href={`/cafes/${cafe.id}`} className="group block">
      {/* No overflow-hidden — it was clipping the bottom tag pills. */}
      <article className="flex flex-col rounded-2xl bg-white">
        <CardImage cafe={cafe} priority={priority} rounded="rounded-xl" />

        <div className="mt-3 flex items-center justify-between">
          <span className="text-sm font-semibold text-[#3b3b3b]">{cafe.name}</span>
          <Heart
            size={20}
            weight={cafe.isFavorited ? "fill" : "regular"}
            className={cafe.isFavorited ? "text-[#3A5A40]" : "text-zinc-300"}
          />
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#3b3b3b]">
          {cafe.rating > 0 ? (
            <>
              <span className="transition-[font-size] duration-200 group-hover:text-base group-hover:font-semibold">
                {cafe.rating.toFixed(1)}
              </span>
              <span className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star
                    key={index}
                    size={12}
                    weight={index < Math.round(cafe.rating) ? "fill" : "regular"}
                    className="text-[#3A5A40]"
                  />
                ))}
              </span>
              <span>({cafe.reviewCount})</span>
            </>
          ) : (
            <span className="flex items-center gap-1 text-zinc-400">
              <Coffee size={14} weight="regular" />
              No ratings yet
            </span>
          )}
          {area ? (
            <>
              <span>·</span>
              <span>{area}</span>
            </>
          ) : null}
        </div>

        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {visibleTags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-zinc-200 bg-white px-2.5 py-0.5 text-[11px] font-medium text-[#3b3b3b]"
              >
                {tag}
              </span>
            ))}
          </div>
          {distance ? (
            <span className="shrink-0 text-xs text-[#3b3b3b]">{distance}</span>
          ) : null}
        </div>
      </article>
    </Link>
  );
}
