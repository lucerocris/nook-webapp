import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import BackButton from "@/app/components/BackButton";
import ShareButton from "@/app/components/ShareButton";
import CafeDetailSkeleton from "@/app/components/CafeDetailSkeleton";
import CafeGallery from "@/app/components/CafeGallery";
import CafeStickyBar from "@/app/components/CafeStickyBar";
import CafeAmenities from "@/app/components/cafe/CafeAmenities";
import { groupCafeTags } from "@/lib/utils/coffee-tags";
import CafeHeading, { keyFactTags } from "@/app/components/cafe/CafeHeading";
import CafeInfoPanel from "@/app/components/cafe/CafeInfoPanel";
import CafeLocation from "@/app/components/cafe/CafeLocation";
import CafeCups from "@/app/components/cafe/CafeCups";
import CupStories from "@/app/components/cafe/CupStories";
import SectionTabs from "@/app/components/cafe/SectionTabs";
import Footer from "@/app/components/Footer";
import MenuHighlightsRow from "@/app/components/MenuHighlightsRow";
import { getCafeById, getMenuItems } from "@/lib/data/cafes";
import { getCafeCupKindCounts, getCafeCupPhotos, getCafeCups } from "@/lib/data/cups";
import { parseOperatingHours } from "@/lib/utils/hours";
import { parseSocialLinks } from "@/lib/utils/social";
import JsonLd from "@/app/components/JsonLd";
import { cafeJsonLd } from "@/lib/seo/cafe-json-ld";
import { settle } from "@/lib/utils/settle";
import { cleanText, snippet } from "@/lib/seo/text";

type Props = {
  params: Promise<{ id: string }>;
};


export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const cafe = await getCafeById(id, { includeReviews: false });

  if (!cafe) {
    // `absolute` bypasses the root layout's "%s · Nook" template, which would
    // otherwise render "Cafe not found · Nook · Nook".
    return {
      title: { absolute: "Cafe not found · Nook" },
      robots: { index: false },
    };
  }

  // Data carries stray spaces ("Talamban , Cebu City"); search results show
  // them, and cut descriptions mid-word (UX review 6.6).
  const name = cleanText(cafe.name);
  const location = cleanText([cafe.neighborhood, cafe.city].filter(Boolean).join(", "));
  const title = location ? `${name} — ${location}` : name;
  const description = snippet(
    cafe.description?.trim() ||
      `${name}${location ? ` in ${location}` : ""} — hours, photos, menu and cups on Nook.`,
  );
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

  // The menu and the cups are sections, not the page: if either read fails,
  // that section says so and the rest of the cafe still renders. Only the
  // cafe itself is allowed to fail the page.
  const [cafe, menu] = await Promise.all([
    getCafeById(id, { includeReviews: false }),
    settle(() => getMenuItems(id), "cafe menu"),
  ]);

  if (!cafe) {
    notFound();
  }

  // Cups (one per visit) through the Cups RPCs, or the reviews as cups where
  // the server doesn't have them yet. Any other error leaves `cups` null.
  const legacy = { rating: cafe.rating, reviewCount: cafe.reviewCount };
  const [cups, kindCounts, cupPhotos] = await Promise.all([
    settle(() => getCafeCups(id, legacy), "cafe cups"),
    settle(() => getCafeCupKindCounts(id, legacy), "cafe cup kinds"),
    // The tray is a bonus: a failed read leaves it out, quietly.
    settle(() => getCafeCupPhotos(id, legacy), "cafe cup photos"),
  ]);

  const gallery = [cafe.featuredImageUrl, ...cafe.photoUrls].filter(
    (url): url is string => typeof url === "string" && url.length > 0,
  );

  // The row is "Menu Highlights", not the menu — `menu_items.is_highlight`
  // is what the cafe flagged as worth leading with. Passing the unfiltered
  // list put all 15 of Pulso's items in a row meant for its 5.
  const menuHighlights = (menu ?? []).filter((item) => item.isHighlight);

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
  const fullAddress = addressParts.join(", ") || cafe.address;
  const area = [cafe.neighborhood, cafe.city].filter(Boolean).join(", ");
  // Directions to the named place, not a dropped pin at bare coordinates
  // (UX review 6.7): Google resolves "name, address" to the listing.
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    cleanText(`${cafe.name}, ${fullAddress}`),
  )}`;
  const links = parseSocialLinks(cafe.socialLinks);
  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "offers", label: "What it offers" },
    { id: "menu", label: "Menu" },
    { id: "cups", label: "Cups" },
    { id: "hours", label: "Hours & location" },
  ];

  return (
    <>
      <JsonLd data={cafeJsonLd(cafe, operatingHours, cups ?? undefined)} />
      {/* No global navbar below `lg` (see NavbarShell), so the gallery runs to
          the top edge of the viewport. With no photos the title needs its own
          breathing room instead. */}
      <main
        className={`flex-1 pb-[calc(6.5rem+env(safe-area-inset-bottom))] lg:pt-24 lg:pb-0 ${
          gallery.length > 0 ? "pt-0" : "pt-6"
        }`}
      >
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-8">
          {/* Photos lead on a phone; on desktop the title row comes first with
              the mosaic under it. Same markup, reordered by flex. */}
          <div className="flex flex-col gap-5 lg:gap-6">
            <header className="order-2 flex items-end justify-between gap-4 lg:order-1">
              <div className="min-w-0">
                <h1 className="text-[1.75rem] font-semibold leading-tight tracking-[-0.02em] text-ink sm:text-[2rem]">
                  {cafe.name}
                </h1>
              </div>
              {/* Below `lg` share rides on the photo alongside the back button. */}
              <div className="hidden shrink-0 lg:block">
                <ShareButton
                  title={cafe.name}
                  text={`Coffee at ${cafe.name}? It's on Nook:`}
                  label="Share"
                />
              </div>
            </header>

            {gallery.length > 0 ? (
              <div className="order-1 lg:order-2">
                <CafeGallery cafeName={cafe.name} images={gallery} />
              </div>
            ) : (
              <BackButton className="order-1 lg:hidden" />
            )}
          </div>

          <SectionTabs tabs={tabs} />

          <div className="mt-8 grid gap-10 lg:mt-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-16">
            <div className="min-w-0 divide-y divide-line [&>section]:scroll-mt-32 [&>section]:py-10 [&>section:first-child]:pt-0">
              <section id="overview">
                <h2 className="sr-only">Overview</h2>
                <CafeHeading
                  area={area}
                  rating={cups ? cups.stats.rating : null}
                  cupCount={cups ? cups.stats.cupCount : null}
                  tags={cafe.tags}
                  description={cafe.description}
                  createdAt={cafe.createdAt}
                  stories={
                    cupPhotos && cupPhotos.photos.length > 0 ? (
                      <CupStories
                        photos={cupPhotos.photos}
                        cupCount={cups?.stats.cupCount ?? 0}
                        cafeName={cafe.name}
                        photosHref={`/cafes/${id}/cups?view=photos`}
                      />
                    ) : null
                  }
                />
              </section>

              <section id="offers">
                <SectionTitle>What this cafe offers</SectionTitle>
                <div className="mt-6">
                  <CafeAmenities
                    cafeId={id}
                    groups={groupCafeTags(cafe.tags)}
                    shownAbove={keyFactTags(cafe.tags).map((t) => t.id)}
                  />
                </div>
              </section>

              <section id="menu">
                {menu === null ? (
                  <>
                    <SectionTitle>Menu</SectionTitle>
                    <SectionUnavailable>Couldn&apos;t load the menu right now.</SectionUnavailable>
                  </>
                ) : menuHighlights.length > 0 ? (
                  <>
                    <MenuHighlightsRow
                      items={menuHighlights}
                      header={
                        <>
                          <SectionTitle>Menu</SectionTitle>
                          <p className="mt-1 text-sm text-muted">The cafe&apos;s own picks</p>
                        </>
                      }
                      actions={<FullMenuLink id={id} count={menu.length} />}
                    />
                  </>
                ) : (
                  <>
                    <div className="flex items-end justify-between gap-4">
                      <SectionTitle>Menu</SectionTitle>
                      {menu.length > 0 ? <FullMenuLink id={id} count={menu.length} /> : null}
                    </div>
                    <p className="mt-3 text-sm text-muted">
                      {menu.length > 0
                        ? `No picks yet. The full menu has ${menu.length} ${menu.length === 1 ? "item" : "items"}.`
                        : "No menu listed yet."}
                    </p>
                  </>
                )}
              </section>


              <section id="cups">
                {/* The old #reviews links still land here. */}
                <span id="reviews" aria-hidden />
                {cups ? (
                  <CafeCups cafeId={id} cafeName={cafe.name} cups={cups} kindCounts={kindCounts} />
                ) : (
                  <>
                    <SectionTitle>Cups</SectionTitle>
                    <SectionUnavailable>Couldn&apos;t load cups right now.</SectionUnavailable>
                  </>
                )}
              </section>
              <section id="hours">
                <SectionTitle>Hours &amp; location</SectionTitle>
                <div className="mt-6">
                  <CafeLocation
                    name={cafe.name}
                    address={fullAddress}
                    lat={cafe.lat}
                    lng={cafe.lng}
                    hours={operatingHours}
                    mapsUrl={mapsUrl}
                  />
                </div>
              </section>
            </div>

            <aside className="hidden lg:block lg:sticky lg:top-32 lg:self-start">
              <CafeInfoPanel
                name={cafe.name}
                hours={operatingHours}
                address={fullAddress}
                mapsUrl={mapsUrl}
                links={links}
              />
            </aside>
          </div>
        </div>
      </main>

      <div className="hidden lg:block">
        <Footer />
      </div>

      <CafeStickyBar
        cafeName={cafe.name}
        hours={operatingHours}
        mapsUrl={mapsUrl}
      />
    </>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xl font-semibold tracking-[-0.02em] text-ink">{children}</h2>
  );
}

/** A section whose read failed: one quiet line, so the rest of the page
 * carries on. Reloading later is the only fix a visitor has. */
function SectionUnavailable({ children }: { children: React.ReactNode }) {
  return (
    <p role="status" className="mt-3 text-sm text-muted">
      {children} Try again in a bit.
    </p>
  );
}

/** The section's one way to the full menu (UX review 1.3: one "See all" per
 * section), with the item count the old footer button carried. */
function FullMenuLink({ id, count }: { id: string; count: number }) {
  return (
    <Link
      href={`/cafes/${id}/menu`}
      className="inline-flex min-h-11 items-center text-sm font-semibold text-ink underline-offset-4 hover:underline"
    >
      See all {count}
      <span className="sr-only"> menu items</span>
    </Link>
  );
}
