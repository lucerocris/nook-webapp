import Image from "next/image";
import { Heart, Star } from "@phosphor-icons/react/dist/ssr";
import { useState } from "react";

type Cafe = {
  id: string;
  name: string;
  description: string | null;
  address: string;
  neighborhood: string | null;
  city: string;
  featured_image_url: string | null;
  rating: number | null;
  review_count: number | null;
  is_new: boolean;
  is_featured: boolean;
  tag_names: string[];
};

export default function CafeCard({
  cafe,
}: {
  cafe?: Cafe;
}) {
  const [isFavorite, setIsFavorite] = useState(false);

  // Fallback for hardcoded display when no cafe prop is passed
  const displayCafe = cafe || {
    id: "default",
    name: "Coffee Madness",
    description: "A cozy spot for coffee lovers",
    address: "",
    neighborhood: "Tayud, Liloan",
    city: "Cebu City",
    featured_image_url: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1200&q=80",
    rating: 4.9,
    review_count: 32,
    is_new: false,
    is_featured: true,
    tag_names: ["Student Friendly", "Outlets"],
  };

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm hover:shadow-md transition-shadow duration-300">
      {/* Image Container */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-zinc-100">
        <Image
          src={displayCafe.featured_image_url || "https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1200&q=80"}
          alt={displayCafe.name}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* Overlay Badges */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Status Badge */}
        {(displayCafe.is_featured || displayCafe.is_new) && (
          <div className="absolute top-3 left-3 flex items-center gap-2">
            {displayCafe.is_featured && (
              <span className="inline-flex items-center rounded-full bg-yellow-500 text-white px-2.5 py-1 text-xs font-semibold">
                ⭐ Featured
              </span>
            )}
            {displayCafe.is_new && (
              <span className="inline-flex items-center rounded-full bg-blue-500 text-white px-2.5 py-1 text-xs font-semibold">
                ✨ New
              </span>
            )}
          </div>
        )}

        {/* Heart Button */}
        <button
          onClick={() => setIsFavorite(!isFavorite)}
          className="absolute top-3 right-3 flex items-center justify-center w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm shadow-md hover:bg-white transition-colors"
          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
        >
          <Heart
            size={20}
            weight={isFavorite ? "fill" : "regular"}
            className={isFavorite ? "text-red-500" : "text-zinc-400"}
          />
        </button>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-3 p-4 flex-1">
        {/* Name */}
        <div>
          <h3 className="text-sm font-semibold text-[#3b3b3b] line-clamp-2 group-hover:text-[#2f4833] transition-colors">
            {displayCafe.name}
          </h3>
          {displayCafe.description && (
            <p className="mt-1 text-xs text-zinc-500 line-clamp-2">
              {displayCafe.description}
            </p>
          )}
        </div>

        {/* Rating & Reviews */}
        <div className="flex items-center gap-2 text-xs">
          {displayCafe.rating ? (
            <>
              <div className="flex items-center gap-1">
                <Star size={14} weight="fill" className="text-amber-400" />
                <span className="font-semibold text-[#3b3b3b]">
                  {displayCafe.rating.toFixed(1)}
                </span>
              </div>
              <span className="text-zinc-500">
                ({displayCafe.review_count || 0})
              </span>
            </>
          ) : (
            <span className="text-zinc-500">No ratings yet</span>
          )}
        </div>

        {/* Location */}
        <div className="text-xs text-zinc-600 flex items-start gap-1">
          <span className="text-sm mt-0.5">📍</span>
          <span className="line-clamp-2">
            {displayCafe.neighborhood || displayCafe.address}
          </span>
        </div>

        {/* Tags */}
        {displayCafe.tag_names.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-2 border-t border-zinc-100">
            {displayCafe.tag_names.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-full border border-zinc-200 bg-zinc-50 px-2 py-1 text-[10px] font-medium text-zinc-600 hover:bg-zinc-100 transition-colors"
              >
                {tag}
              </span>
            ))}
            {displayCafe.tag_names.length > 3 && (
              <span className="inline-flex items-center text-[10px] font-medium text-zinc-500">
                +{displayCafe.tag_names.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer CTA */}
      <div className="border-t border-zinc-100 px-4 py-3">
        <button className="w-full rounded-lg bg-[#3A5A40] text-white text-xs font-medium py-2 hover:bg-[#2f4833] active:bg-[#264129] transition-colors">
          View Details
        </button>
      </div>
    </article>
  );
}