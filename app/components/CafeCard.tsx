import Image from "next/image";
import { Heart, Star } from "@phosphor-icons/react/dist/ssr";

const CAFE_IMAGE =
  "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1200&q=80";

export default function CafeCard() {
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl bg-white">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-zinc-100">
        <Image
          src={CAFE_IMAGE}
          alt="Coffee Madness — hillside cafe"
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover"
        />
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className="text-sm font-semibold text-[#3b3b3b]">Coffee Madness</span>
        <Heart size={20} weight="fill" className="text-[#3A5A40]" />
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#3b3b3b]">
        <span>4.9</span>
        <span className="flex items-center gap-0.5">
          <Star size={12} weight="fill" className="text-[#3A5A40]" />
          <Star size={12} weight="fill" className="text-[#3A5A40]" />
          <Star size={12} weight="fill" className="text-[#3A5A40]" />
          <Star size={12} weight="fill" className="text-[#3A5A40]" />
          <Star size={12} weight="fill" className="text-[#3A5A40]" />
        </span>
        <span>(32)</span>
        <span>·</span>
        <span>Tayud, Liloan</span>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="rounded-full border border-zinc-200 bg-white px-2.5 py-0.5 text-[11px] font-medium text-[#3b3b3b]">
            Student Friendly
          </span>
          <span className="rounded-full border border-zinc-200 bg-white px-2.5 py-0.5 text-[11px] font-medium text-[#3b3b3b]">
            Outlets
          </span>
          <span className="rounded-full border border-zinc-200 bg-white px-2.5 py-0.5 text-[11px] font-medium text-[#3b3b3b]">
            ...
          </span>
        </div>
        <span className="shrink-0 text-xs text-[#3b3b3b]">2.1 km</span>
      </div>
    </article>
  );
}
