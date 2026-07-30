import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, NavigationArrow, Star } from "@phosphor-icons/react/dist/ssr";

import BackButton from "@/app/components/BackButton";
import BusinessHoursDropdown from "@/app/components/BusinessHoursDropdown";
import ShareButton from "@/app/components/ShareButton";
import CafeDetailSkeleton from "@/app/components/CafeDetailSkeleton";
import CafeGallery from "@/app/components/CafeGallery";
import CafeLocationMap from "@/app/components/CafeLocationMap";
import CafeStickyBar from "@/app/components/CafeStickyBar";
import CafeTagsOverview from "@/app/components/CafeTagsOverview";
import MenuHighlightsRow from "@/app/components/MenuHighlightsRow";
import { getCafeById, getMenuItems } from "@/lib/data/cafes";
import type { Review } from "@/lib/data/cafes-mappers";
import { getTagIcon } from "@/lib/utils/tag-icon";
import { parseOperatingHours } from "@/lib/utils/hours";

type Props = {
  params: Promise<{ id: string }>;
};


export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const cafe = await getCafeById(id);

  if (!cafe) {
    // `absolute` bypasses the root layout's "%s · Nook" template, which would
    // otherwise render "Cafe not found · Nook · Nook".
    return {
      title: { absolute: "Cafe not found · Nook" },
      robots: { index: false },
    };
  }

  const location = [cafe.neighborhood, cafe.city].filter(Boolean).join(", ");
  const title = location ? `${cafe.name} — ${location}` : cafe.name;
  const description =
    cafe.description?.trim().slice(0, 160) ||
    `${cafe.name}${location ? ` in ${location}` : ""} — hours, photos, menu and reviews on Nook.`;
  const images = cafe.featuredImageUrl
    ? [{ url: cafe.featuredImageUrl, alt: cafe.name }]
    : undefined;

  return {
    title,
    description,
    alternates: { canonical: `/cafes/${cafe.id}` },
    openGraph: {
      type: "article",
      title,
      description,
      url: `/cafes/${cafe.id}`,
      siteName: "Nook",
      images,
    },
    twitter: {
      card: images ? "summary_large_image" : "summary",
      title,
      description,
      images,
    },
  };
}

/**
 * KNOWN LIMITATION — soft 404 on missing cafes.
 *
 * `notFound()` fires inside the Suspense child below, by which point the static
 * shell has already flushed with HTTP 200. A missing cafe therefore renders the
 * 404 body under a 200 status.
 *
 * This is architectural under `cacheComponents`, not an oversight. Resolving the
 * cafe in the page body (so notFound() precedes the flush) fails the build with
 * "Uncached data was accessed outside of <Suspense>"; `export const dynamic` is
 * rejected outright; and `await connection()` does not lift the restriction.
 *
 * The commercial harm — Google indexing dead cafe URLs as live pages — is
 * handled instead in generateMetadata above, which returns
 * `robots: { index: false }` when the cafe is missing. Crawlers are told not to
 * index; only the status code remains cosmetically wrong.
 */
export default async function CafeDetailPage({ params }: Props) {
  return (
    <Suspense fallback={<CafeDetailSkeleton />}>
      <CafeDetailContent params={params} />
    </Suspense>
  );
}

async function CafeDetailContent({ params }: Props) {
  const { id } = await params;

  const [cafe, menu] = await Promise.all([
    getCafeById(id),
    getMenuItems(id),
  ]);

  if (!cafe) {
    notFound();
  }

  const gallery = [cafe.featuredImageUrl, ...cafe.photoUrls].filter(
    (url): url is string => typeof url === "string" && url.length > 0,
  );

  // The row is "Menu Highlights", not the menu — `menu_items.is_highlight`
  // is what the cafe flagged as worth leading with. Passing the unfiltered
  // list put all 15 of Pulso's items in a row meant for its 5.
  const menuHighlights = menu.filter((item) => item.isHighlight);

  const visibleReviews = cafe.reviews.slice(0, 4);
  const featuredTags = cafe.tags
    .filter((tag) => tag.isFeatured)
    .slice(0, 2);

  const distanceLabel = null;
  const operatingHours = parseOperatingHours(cafe.operatingHours);
  // `address` usually already carries the neighborhood and city ("1045 M. J.
  // Cuenco Ave, Mabolo, Cebu City, 6000 Cebu"), so appending them unconditionally
  // rendered "…6000 Cebu, Mabolo, Cebu City" — a repeat that costs two lines on
  // a phone. Only add a part the address doesn't already mention.
  const addressParts: string[] = [];
  for (const part of [cafe.address, cafe.neighborhood, cafe.city]) {
    if (typeof part !== "string" || part.length === 0) continue;
    const alreadyPresent = addressParts.some((existing) =>
      existing.toLowerCase().includes(part.toLowerCase()),
    );
    if (!alreadyPresent) addressParts.push(part);
  }
  const fullAddress = addressParts.join(", ");
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${cafe.lat},${cafe.lng}`;

  return (
    <>
      {/* No global navbar below `lg` (see NavbarShell), so the gallery runs to
          the top edge of the viewport. With no photos there is nothing to bleed
          and the title needs its own breathing room instead. */}
      <main
        className={`flex-1 pb-[calc(6.5rem+env(safe-area-inset-bottom))] lg:pt-24 lg:pb-16 ${
          gallery.length > 0 ? "pt-0" : "pt-6"
        }`}
      >
      <div className="mx-auto w-full max-w-7xl px-6 sm:px-8">
        {/* Photos lead on a phone — the fastest read of whether a cafe is worth
            the trip. On desktop the name comes first with the mosaic under it.
            Same markup, reordered by flex rather than rendered twice. */}
        <div className="flex flex-col gap-6">
          <section className="order-2 flex items-start justify-between gap-4 lg:order-1">
            <div className="min-w-0">
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

            {/* Below `lg` share rides on the photo alongside the back button,
                so this copy is desktop's. */}
            <div className="hidden shrink-0 lg:block">
              <ShareButton
                title={cafe.name}
                text={`${cafe.name} on Nook — cafes in Cebu`}
              />
            </div>
          </section>

          {gallery.length > 0 ? (
            // The back button rides on the photo, so CafeGallery owns it.
            <div className="order-1 lg:order-2">
              <CafeGallery cafeName={cafe.name} images={gallery} />
            </div>
          ) : (
            <BackButton className="order-1 lg:hidden" />
          )}
        </div>

        <div className="mt-8 grid gap-9 lg:grid-cols-[minmax(0,1fr)_410px]">
          <div className="min-w-0">
            <section>
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-lg font-semibold text-[#101514]">
                  Menu Highlights
                </h2>
                {menu.length > 0 ? (
                  <Link
                    href={`/cafes/${id}/menu`}
                    className="inline-flex h-11 shrink-0 items-center rounded-full border border-zinc-200 px-4 text-xs font-medium text-[#3b3b3b] transition-colors hover:bg-zinc-50"
                  >
                    See full menu
                  </Link>
                ) : null}
              </div>

              {menuHighlights.length > 0 ? (
                <div className="mt-4">
                  <MenuHighlightsRow items={menuHighlights} />
                </div>
              ) : menu.length > 0 ? (
                // A menu exists but nothing is flagged. Better to say so and
                // point at the full menu than to quietly show everything here.
                <p className="mt-4 text-sm text-zinc-500">
                  No highlights picked yet — see the full menu.
                </p>
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

              <CafeTagsOverview
                amenities={cafe.tags.filter(
                  (tag) => tag.category === "amenities",
                )}
                bestFor={cafe.tags.filter(
                  (tag) => tag.category === "best_for",
                )}
                payment={cafe.tags.filter(
                  (tag) => tag.category === "payment",
                )}
              />
            </section>

            <section className="mt-10">
              <h2 className="text-lg font-semibold text-[#2f2f2f]">Location</h2>
              <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="h-48 w-full overflow-hidden rounded-xl bg-zinc-100 sm:w-80">
                  <CafeLocationMap
                    name={cafe.name}
                    address={fullAddress || cafe.address}
                    lat={cafe.lat}
                    lng={cafe.lng}
                  />
                </div>
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
                  <Link
                    href={`/cafes/${id}/reviews`}
                    className="inline-flex h-11 shrink-0 items-center rounded-full border border-zinc-200 px-4 text-xs font-medium text-[#3b3b3b] transition-colors hover:bg-zinc-50"
                  >
                    See all reviews
                  </Link>
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

            {/* The sidebar card is desktop-only, so opening times get their own
                section in the flow on smaller screens rather than disappearing. */}
            <section className="mt-10 lg:hidden">
              <h2 className="text-lg font-semibold text-[#2f2f2f]">
                Opening times
              </h2>
              <BusinessHoursDropdown hours={operatingHours} />
            </section>
          </div>

          <aside className="hidden lg:block lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-xl border border-zinc-200 bg-white p-7 shadow-[0_12px_28px_rgba(0,0,0,0.08)]">
              <h2 className="text-2xl font-semibold leading-tight tracking-[-0.02em] text-[#101514]">
                {cafe.name}
              </h2>

              <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs leading-none text-[#101514]">
                <span>{cafe.rating.toFixed(1)}</span>
                <RatingStars rating={cafe.rating} size={12} />
                <span className="text-[#6b6b6b]">
                  ({cafe.reviewCount} reviews)
                </span>
              </div>

              <p className="mt-3 text-xs leading-none text-[#6b6b6b]">
                {[distanceLabel, cafe.address].filter(Boolean).join(" • ")}
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                {featuredTags.map((tag) => {
                  const Icon = getTagIcon(tag.name);
                  return (
                    <span
                      key={tag.id}
                      className="inline-flex h-7 items-center gap-2 rounded-full border border-[#8a8d8a] px-3 text-xs font-medium text-[#6b6b6b]"
                    >
                      <Icon size={14} className="text-[#6b6b6b]" />
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

      <CafeStickyBar
        cafeName={cafe.name}
        hours={operatingHours}
        mapsUrl={mapsUrl}
      />
    </>
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
