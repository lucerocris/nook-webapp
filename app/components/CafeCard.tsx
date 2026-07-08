import Image from "next/image";
import Link from "next/link";
import { Heart, Star } from "@phosphor-icons/react/dist/ssr";
import type { Cafe } from "@/lib/cafes";

export default function CafeCard({ cafe }: { cafe: Cafe }) {
  return (
    <Link href={`/cafes/${cafe.slug}`} className="group block">
      <article className="flex flex-col overflow-hidden rounded-2xl bg-white">
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-zinc-100">
          <Image
            src={cafe.image}
            alt={cafe.name}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>

        <div className="mt-3 flex items-center justify-between">
          <span className="text-sm font-semibold text-[#3b3b3b]">{cafe.name}</span>
          <Heart size={20} weight="fill" className="text-[#3A5A40]" />
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#3b3b3b]">
          <span>{cafe.rating}</span>
          <span className="flex items-center gap-0.5">
            <Star size={12} weight="fill" className="text-[#3A5A40]" />
            <Star size={12} weight="fill" className="text-[#3A5A40]" />
            <Star size={12} weight="fill" className="text-[#3A5A40]" />
            <Star size={12} weight="fill" className="text-[#3A5A40]" />
            <Star size={12} weight="fill" className="text-[#3A5A40]" />
          </span>
          <span>({cafe.reviewsCount})</span>
          <span>·</span>
          <span>{cafe.area}</span>
        </div>

        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {cafe.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-zinc-200 bg-white px-2.5 py-0.5 text-[11px] font-medium text-[#3b3b3b]"
              >
                {tag}
              </span>
            ))}
          </div>
          <span className="shrink-0 text-xs text-[#3b3b3b]">{cafe.distance}</span>
        </div>
      </article>
    </Link>
  );
}
