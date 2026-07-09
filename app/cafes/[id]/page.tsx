import { Suspense } from "react";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  CaretRight,
  GraduationCap,
  Heart,
  MapPin,
  NavigationArrow,
  ShareNetwork,
  Star,
  WifiHigh,
} from "@phosphor-icons/react/dist/ssr";

import CafeDetailSkeleton from "@/app/components/CafeDetailSkeleton";
import { formatPrice, getCafeById, getMenuItems } from "@/lib/data/cafes";
import { getCurrentUserId } from "@/lib/data/auth";
import type { CafeDetails, MenuItem, Review } from "@/lib/data/cafes-mappers";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function CafeDetailPage({ params }: Props) {
  return (
    <Suspense fallback={<CafeDetailSkeleton />}>
      <CafeDetailContent params={params} />
    </Suspense>
  );
}

async function CafeDetailContent({ params }: Props) {
  const { id } = await params;
  const userId = await getCurrentUserId();

  const [cafe, menu] = await Promise.all([
    getCafeById(id, { userId }),
    getMenuItems(id),
  ]);

  if (!cafe) {
    notFound();
  }

  const gallery = [cafe.featuredImageUrl, ...cafe.photoUrls].filter(
    (url): url is string => typeof url === "string" && url.length > 0,
  );
  const mainImage = gallery[0] ?? null;
  const gridImages = gallery.slice(1, 5);

  const menuHighlights = menu.slice(0, 4);
  const visibleReviews = cafe.reviews.slice(0, 4);
  const featuredTags = cafe.tags
    .filter((tag) => tag.isFeatured)
    .slice(0, 2);

  const distanceLabel = null;
  const hoursLabel = formatOperatingHours(cafe.operatingHours);
  const area = cafe.neighborhood ?? cafe.city;

  return (
    <main className="flex-1 pt-24 pb-16">
      <div className="mx-auto w-full max-w-7xl px-6 sm:px-8">
        <section className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[#2f2f2f]">
              {cafe.name}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-[#3b3b3b]">
              <span>{cafe.rating.toFixed(1)}</span>
              <RatingStars rating={cafe.rating} />
              <span>({cafe.reviewCount} reviews)</span>
            </div>
            <p className="mt-1 text-sm text-zinc-500">
              {[distanceLabel, cafe.address].filter(Boolean).join(" · ")}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              aria-label="Share cafe"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-white text-[#3b3b3b] transition-colors hover:bg-zinc-50"
            >
              <ShareNetwork size={18} />
            </button>
            <button
              type="button"
              aria-label="Save cafe"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-white text-[#3b3b3b] transition-colors hover:bg-zinc-50"
            >
              <Heart size={18} />
            </button>
          </div>
        </section>

        {mainImage ? (
          <section className="mt-6 grid h-[280px] gap-2 overflow-hidden rounded-sm sm:h-[420px] lg:grid-cols-[1.35fr_1fr]">
            <div className="relative hidden bg-zinc-100 lg:block">
              <Image
                src={mainImage}
                alt={cafe.name}
                fill
                priority
                sizes="(min-width: 1024px) 60vw, 100vw"
                className="object-cover"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              {gridImages.map((image, index) => (
                <div key={image} className="relative bg-zinc-100">
                  <Image
                    src={image}
                    alt={`${cafe.name} gallery ${index + 1}`}
                    fill
                    sizes="(min-width: 1024px) 25vw, 50vw"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <div className="mt-8 grid gap-9 lg:grid-cols-[minmax(0,1fr)_410px]">
          <div className="min-w-0">
            <section>
              <h2 className="text-lg font-semibold text-[#101514]">
                Menu Highlights
              </h2>

              {menuHighlights.length > 0 ? (
                <div className="relative mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                  {menuHighlights.map((item) => (
                    <article key={item.id}>
                      <MenuThumbnail item={item} />
                      <h3 className="mt-2 text-sm font-semibold text-[#101514]">
                        {item.name}
                      </h3>
                      <p className="mt-2 text-xs font-medium text-[#101514]">
                        {formatPrice(item.price)}
                      </p>
                    </article>
                  ))}

                  <button
                    type="button"
                    aria-label="Next menu items"
                    className="absolute right-[-16px] top-[42px] hidden h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-white text-[#101514] shadow-sm md:flex"
                  >
                    <CaretRight size={18} />
                  </button>
                </div>
              ) : (
                <p className="mt-4 text-sm text-zinc-500">
                  No menu items listed yet.
                </p>
              )}

              {menu.length > menuHighlights.length ? (
                <button
                  type="button"
                  className="mt-6 rounded-full border border-zinc-200 bg-white px-5 py-2.5 text-sm font-medium text-[#101514] transition-colors hover:bg-zinc-50"
                >
                  See all menu
                </button>
              ) : null}
            </section>

            <section className="mt-8">
              <h2 className="text-lg font-semibold text-[#101514]">About</h2>
              {cafe.description ? (
                <p className="mt-4 max-w-4xl text-sm leading-6 text-[#101514]">
                  {cafe.description}
                </p>
              ) : (
                <p className="mt-4 text-sm text-zinc-500">
                  No description provided yet.
                </p>
              )}

              <div className="mt-5 grid gap-7 text-sm text-[#101514] sm:grid-cols-3">
                <AmenityList
                  title="Amenities"
                  items={cafe.tags
                    .filter((tag) => tag.category === "amenity")
                    .map((tag) => tag.name)}
                />
                <AmenityList
                  title="Best For"
                  items={cafe.tags
                    .filter((tag) => tag.isFeatured)
                    .map((tag) => tag.name)}
                />
                <AmenityList title="Vibe" items={[]} />
              </div>
            </section>

            <section className="mt-10">
              <h2 className="text-lg font-semibold text-[#2f2f2f]">Location</h2>
              <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="relative h-48 w-full overflow-hidden rounded-xl bg-zinc-100 sm:w-80">
                  <Image
                    src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=900&q=80"
                    alt={`${cafe.name} map preview`}
                    fill
                    sizes="(min-width: 640px) 320px, 100vw"
                    className="object-cover"
                  />
                </div>
                <p className="flex items-center gap-2 text-sm text-[#3b3b3b]">
                  <MapPin size={16} className="text-[#3A5A40]" />
                  {area ?? cafe.address}
                </p>
              </div>
            </section>

            <section className="mt-10">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-lg font-semibold text-[#2f2f2f]">
                  Reviews
                </h2>
                {cafe.reviewCount > visibleReviews.length ? (
                  <button
                    type="button"
                    className="shrink-0 rounded-full border border-zinc-200 px-4 py-2 text-xs font-medium text-[#3b3b3b] transition-colors hover:bg-zinc-50"
                  >
                    See all reviews
                  </button>
                ) : null}
              </div>

              {visibleReviews.length > 0 ? (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {visibleReviews.map((review) => (
                    <ReviewCard key={review.id} review={review} />
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm text-zinc-500">
                  No reviews yet. Be the first to share your experience.
                </p>
              )}
            </section>
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-xl border border-zinc-200 bg-white p-7 shadow-[0_12px_28px_rgba(0,0,0,0.08)]">
              <h2 className="text-2xl font-semibold leading-tight tracking-[-0.02em] text-[#101514]">
                {cafe.name}
              </h2>

              <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs leading-none text-[#101514]">
                <span>{cafe.rating.toFixed(1)}</span>
                <RatingStars rating={cafe.rating} size={12} />
                <span className="text-[#858585]">
                  ({cafe.reviewCount} reviews)
                </span>
              </div>

              <p className="mt-3 text-xs leading-none text-[#858585]">
                {[distanceLabel, cafe.address].filter(Boolean).join(" • ")}
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                {featuredTags.map((tag) => {
                  const isStudent = /student/i.test(tag.name);
                  const Icon = isStudent ? GraduationCap : WifiHigh;
                  return (
                    <span
                      key={tag.id}
                      className="inline-flex h-7 items-center gap-2 rounded-full border border-[#8a8d8a] px-3 text-xs font-medium text-[#858585]"
                    >
                      <Icon size={14} className="text-[#858585]" />
                      {tag.name}
                    </span>
                  );
                })}
              </div>

              <div className="mt-6 border-t border-[#e5e5e5] pt-6">
                <button
                  type="button"
                  className="flex w-full items-center justify-between text-left"
                >
                  <span>
                    <span className="block text-sm font-medium leading-none text-[#557f55]">
                      Hours
                    </span>
                    <span className="mt-2 block text-xs leading-none text-[#858585]">
                      {hoursLabel}
                    </span>
                  </span>
                  <CaretRight size={20} className="text-[#858585]" />
                </button>
              </div>

              <div className="mt-6 flex items-center gap-4 text-xs leading-none text-[#353535]">
                <MapPin size={17} className="shrink-0 text-[#31533f]" />
                <span>{area ?? cafe.address}</span>
              </div>

              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${cafe.lat},${cafe.lng}`}
                target="_blank"
                rel="noreferrer"
                className="mt-6 flex h-10 w-full items-center justify-center gap-3 rounded-md bg-[#31533f] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#294635]"
              >
                <NavigationArrow size={18} />
                Get Directions
              </a>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

function RatingStars({ rating = 5, size = 13 }: { rating?: number; size?: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          size={size}
          weight={index < Math.round(rating) ? "fill" : "regular"}
          className="text-[#3A5A40]"
        />
      ))}
    </span>
  );
}

function AmenityList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="text-sm font-normal text-[#8b8b8b]">{title}</h3>
      <div className="mt-4 space-y-4">
        {items.length > 0 ? (
          items.map((item) => (
            <div key={item} className="flex items-center gap-3">
              <WifiHigh size={17} className="text-[#101514]" />
              <span>{item}</span>
            </div>
          ))
        ) : (
          <p className="text-sm text-zinc-400">—</p>
        )}
      </div>
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <article className="rounded-xl border border-zinc-200 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[#2f2f2f]">
            {review.authorName}
          </p>
          <p className="text-xs text-zinc-500">
            {new Date(review.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </p>
        </div>
        <RatingStars rating={review.rating} size={12} />
      </div>
      {review.content ? (
        <p className="mt-3 text-sm leading-5 text-[#3b3b3b]">
          {review.content}
        </p>
      ) : null}
    </article>
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

type OperatingHours = CafeDetails["operatingHours"];

function formatOperatingHours(hours: OperatingHours): string {
  if (!hours || typeof hours !== "object") return "Hours not available";
  const entries = Object.entries(hours as Record<string, unknown>).slice(0, 7);
  if (entries.length === 0) return "Hours not available";
  return entries
    .map(([day, value]) => {
      if (value == null) return `${day}: closed`;
      if (typeof value === "string") return `${day}: ${value}`;
      if (typeof value === "object" && value !== null) {
        const obj = value as { open?: string; close?: string; closed?: boolean };
        if (obj.closed) return `${day}: closed`;
        if (obj.open && obj.close) return `${day}: ${obj.open}–${obj.close}`;
      }
      return `${day}: ${JSON.stringify(value)}`;
    })
    .join(" · ");
}
