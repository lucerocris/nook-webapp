import { Suspense } from "react";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  Heart,
  MapPin,
  NavigationArrow,
  ShareNetwork,
  Star,
} from "@phosphor-icons/react/dist/ssr";

import BusinessHoursDropdown from "@/app/components/BusinessHoursDropdown";
import CafeDetailSkeleton from "@/app/components/CafeDetailSkeleton";
import MenuHighlightsRow from "@/app/components/MenuHighlightsRow";
import { getCafeById, getMenuItems } from "@/lib/data/cafes";
import { getCurrentUserId } from "@/lib/data/auth";
import type { Review, Tag } from "@/lib/data/cafes-mappers";
import { getTagIcon } from "@/lib/utils/tag-icon";
import { parseOperatingHours } from "@/lib/utils/hours";

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

  const visibleReviews = cafe.reviews.slice(0, 4);
  const featuredTags = cafe.tags
    .filter((tag) => tag.isFeatured)
    .slice(0, 2);

  const distanceLabel = null;
  const operatingHours = parseOperatingHours(cafe.operatingHours);
  const fullAddress = [cafe.address, cafe.neighborhood, cafe.city]
    .filter((part): part is string => typeof part === "string" && part.length > 0)
    .join(", ");
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${cafe.lat},${cafe.lng}`;

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

        {gallery.length > 0 ? (
          <CafeGallery cafeName={cafe.name} images={gallery} />
        ) : null}

        <div className="mt-8 grid gap-9 lg:grid-cols-[minmax(0,1fr)_410px]">
          <div className="min-w-0">
            <section>
              <h2 className="text-lg font-semibold text-[#101514]">
                Menu Highlights
              </h2>

              {menu.length > 0 ? (
                <div className="mt-4">
                  <MenuHighlightsRow items={menu} />
                </div>
              ) : (
                <p className="mt-4 text-sm text-zinc-500">
                  No menu items listed yet.
                </p>
              )}
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
                  items={cafe.tags.filter(
                    (tag) => tag.category === "amenities",
                  )}
                />
                <AmenityList
                  title="Best For"
                  items={cafe.tags.filter((tag) => tag.category === "best_for")}
                />
                <AmenityList
                  title="Payment"
                  items={cafe.tags.filter((tag) => tag.category === "payment")}
                />
              </div>
            </section>

            <section className="mt-10">
              <h2 className="text-lg font-semibold text-[#2f2f2f]">Location</h2>
              <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Open ${cafe.name} in Google Maps`}
                  className="relative block h-48 w-full overflow-hidden rounded-xl bg-zinc-100 sm:w-80"
                >
                  <Image
                    src="https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=900&q=80"
                    alt={`${cafe.name} map preview`}
                    fill
                    sizes="(min-width: 640px) 320px, 100vw"
                    className="object-cover transition-transform duration-300 hover:scale-105"
                  />
                </a>
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-sm text-[#3b3b3b] underline-offset-2 transition-colors hover:text-[#31533f] hover:underline"
                >
                  <MapPin size={16} className="shrink-0 text-[#3A5A40]" />
                  {fullAddress || cafe.address}
                </a>
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
                  const Icon = getTagIcon(tag.name);
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

              <BusinessHoursDropdown hours={operatingHours} />

              <a
                href={mapsUrl}
                target="_blank"
                rel="noreferrer"
                aria-label={`Open ${cafe.name} in Google Maps`}
                className="mt-6 flex items-start gap-4 text-xs leading-snug text-[#353535] underline-offset-2 transition-colors hover:text-[#31533f] hover:underline"
              >
                <MapPin size={17} className="mt-0.5 shrink-0 text-[#31533f]" />
                <span className="block min-w-0 break-words">
                  {fullAddress || cafe.address}
                </span>
              </a>

              <a
                href={mapsUrl}
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

function CafeGallery({ cafeName, images }: { cafeName: string; images: string[] }) {
  const total = images.length;
  const visible = images.slice(0, 5);

  const desktopGridClass =
    total === 1
      ? "grid-cols-1"
      : total === 2
        ? "grid-cols-2"
        : "lg:grid-cols-[1.35fr_1fr]";

  const mobileGridClass = total === 1 ? "grid-cols-1" : "grid-cols-2";

  return (
    <section
      className={[
        "mt-6 grid h-[280px] gap-2 overflow-hidden rounded-sm sm:h-[420px]",
        mobileGridClass,
        desktopGridClass,
      ].join(" ")}
    >
      {total === 3 ? (
        <>
          <GalleryTile src={images[0]} alt={cafeName} priority sizes="(min-width: 1024px) 60vw, 100vw" />
          <div className="grid h-full grid-rows-2 gap-2">
            <GalleryTile src={images[1]} alt={`${cafeName} gallery 2`} sizes="(min-width: 1024px) 40vw, 50vw" />
            <GalleryTile src={images[2]} alt={`${cafeName} gallery 3`} sizes="(min-width: 1024px) 40vw, 50vw" />
          </div>
        </>
      ) : total >= 4 ? (
        <>
          <GalleryTile src={images[0]} alt={cafeName} priority sizes="(min-width: 1024px) 60vw, 100vw" />
          <div className="grid h-full gap-2 grid-cols-2 grid-rows-2">
            {visible.slice(1).map((image, index) => (
              <GalleryTile
                key={image}
                src={image}
                alt={`${cafeName} gallery ${index + 2}`}
                sizes="(min-width: 1024px) 25vw, 50vw"
              />
            ))}
          </div>
        </>
      ) : (
        visible.map((image, index) => (
          <GalleryTile
            key={image}
            src={image}
            alt={index === 0 ? cafeName : `${cafeName} gallery ${index + 1}`}
            priority={index === 0}
            sizes={index === 0 ? "100vw" : "50vw"}
          />
        ))
      )}
    </section>
  );
}

function GalleryTile({
  src,
  alt,
  priority,
  sizes,
}: {
  src: string;
  alt: string;
  priority?: boolean;
  sizes: string;
}) {
  return (
    <div className="relative h-full w-full bg-zinc-100">
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes={sizes}
        className="object-cover"
      />
    </div>
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

function AmenityList({ title, items }: { title: string; items: Tag[] }) {
  return (
    <div>
      <h3 className="text-sm font-normal text-[#8b8b8b]">{title}</h3>
      <div className="mt-4 space-y-4">
        {items.length > 0 ? (
          items.map((tag) => {
            const Icon = getTagIcon(tag.name);
            return (
              <div key={tag.id} className="flex items-center gap-3">
                <Icon size={17} className="text-[#101514]" />
                <span>{tag.name}</span>
              </div>
            );
          })
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

