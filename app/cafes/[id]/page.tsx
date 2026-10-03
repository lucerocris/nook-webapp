import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import BackButton from "@/app/components/BackButton";
import CafeDetailSkeleton from "@/app/components/CafeDetailSkeleton";
import CafeGallery from "@/app/components/CafeGallery";
import CafeStickyBar from "@/app/components/CafeStickyBar";
import CafeAmenities from "@/app/components/cafe/CafeAmenities";
import CafeTitle from "@/app/components/cafe/CafeTitle";
import CafeInfoPanel from "@/app/components/cafe/CafeInfoPanel";
import CafeLocation from "@/app/components/cafe/CafeLocation";
import CafeReviews from "@/app/components/cafe/CafeReviews";
import SectionTabs from "@/app/components/cafe/SectionTabs";
import Footer from "@/app/components/Footer";
import MenuHighlightsRow from "@/app/components/MenuHighlightsRow";
import { getCafeById, getMenuItems } from "@/lib/data/cafes";
import { parseOperatingHours } from "@/lib/utils/hours";
import { parseSocialLinks } from "@/lib/utils/social";
import JsonLd from "@/app/components/JsonLd";
import { cafeJsonLd } from "@/lib/seo/cafe-json-ld";

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

  const operatingHours = parseOperatingHours(cafe.operatingHours);
  // `address` usually already carries the neighborhood and city ("1045 M. J.
  // Cuenco Ave, Mabolo, Cebu City, 6000 Cebu"), so appending them unconditionally
  // rendered "…6000 Cebu, Mabolo, Cebu City" — a repeat that costs two lines on
  // a phone. Only add a part the address doesn't already mention.
  // An address that already names the city ("…Soong Rd, Lapu-Lapu, Cebu")
  // is complete; adding the neighbourhood and city after it only repeats them
  // in the wrong order.
  const addressNamesCity =
    typeof cafe.city === "string" &&
    typeof cafe.address === "string" &&
    cafe.address.toLowerCase().includes(cafe.city.toLowerCase().replace(/\s+city$/, ""));
  const addressParts: string[] = [];
  for (const part of [cafe.address, cafe.neighborhood, cafe.city]) {
    if (typeof part !== "string" || part.length === 0) continue;
    // "Lapu-Lapu City" is already said by an address ending "Lapu-Lapu,
    // Cebu", so compare without a trailing "City".
    const bare = part.toLowerCase().replace(/\s+city$/, "");
    const alreadyPresent = addressParts.some((existing) =>
      existing.toLowerCase().includes(bare),
    );
    if (!alreadyPresent) addressParts.push(part);
  }
  const fullAddress = addressNamesCity ? cafe.address : addressParts.join(", ") || cafe.address;
  const area = [cafe.neighborhood, cafe.city].filter(Boolean).join(", ");
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${cafe.lat},${cafe.lng}`;
  const links = parseSocialLinks(cafe.socialLinks);
  const tabs = [
    { id: "offers", label: "What it offers" },
    { id: "menu", label: "Menu" },
    { id: "hours", label: "Hours & location" },
    { id: "reviews", label: "Reviews" },
  ];

  return (
    <>
      <JsonLd data={cafeJsonLd(cafe, operatingHours)} />
      {/* No global navbar below `lg` (see NavbarShell), so the gallery runs to
          the top edge of the viewport. With no photos the title needs its own
          breathing room instead. */}
      <main
        className={`flex-1 pb-[calc(6.5rem+env(safe-area-inset-bottom))] lg:pt-24 lg:pb-0 ${
          gallery.length > 0 ? "pt-0" : "pt-6"
        }`}
      >
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-8">
          {/* Photos lead on a phone, with the title block under them. On
              desktop the two sit side by side, so the first screen shows the
              place and whether to go together. */}
          <div className="flex flex-col gap-5 lg:grid lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:items-start lg:gap-10">
            <header className="order-2 lg:order-2 lg:pt-1">
              <CafeTitle
                name={cafe.name}
                area={area}
                hours={operatingHours}
                rating={cafe.rating}
                reviewCount={cafe.reviewCount}
                tags={cafe.tags}
                mapsUrl={mapsUrl}
                description={cafe.description}
              />
            </header>

            {gallery.length > 0 ? (
              <div className="order-1 lg:order-1">
                <CafeGallery cafeName={cafe.name} images={gallery} />
              </div>
            ) : (
              <BackButton className="order-1 lg:hidden" />
            )}
          </div>

          <SectionTabs tabs={tabs} />

          <div className="mt-8 grid gap-10 lg:mt-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-16">
            <div className="min-w-0 divide-y divide-line [&>section]:scroll-mt-32 [&>section]:py-10 [&>section:first-child]:pt-0 [&>section:last-child]:pb-0">

              <section id="offers">
                <SectionTitle>What this cafe offers</SectionTitle>
                <div className="mt-6">
                  <CafeAmenities
                    amenities={cafe.tags.filter((tag) => tag.category === "amenities")}
                    bestFor={cafe.tags.filter((tag) => tag.category === "best_for")}
                    payment={cafe.tags.filter((tag) => tag.category === "payment")}
                  />
                </div>
              </section>

              <section id="menu">
                {menuHighlights.length > 0 ? (
                  <>
                    <MenuHighlightsRow
                      items={menuHighlights}
                      header={
                        <>
                          <SectionTitle>Menu</SectionTitle>
                          <p className="mt-1 text-sm text-muted">The cafe&apos;s own picks</p>
                        </>
                      }
                      actions={<FullMenuLink id={id} />}
                    />
                    <Link
                      href={`/cafes/${id}/menu`}
                      className="mt-7 inline-flex h-11 items-center rounded-full border border-ink px-5 text-sm font-semibold text-ink transition-colors hover:bg-paper focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                    >
                      See the full menu{menu.length > 0 ? ` (${menu.length} items)` : ""}
                    </Link>
                  </>
                ) : (
                  <>
                    <div className="flex items-end justify-between gap-4">
                      <SectionTitle>Menu</SectionTitle>
                      {menu.length > 0 ? <FullMenuLink id={id} /> : null}
                    </div>
                    <p className="mt-3 text-sm text-muted">
                      {menu.length > 0
                        ? `No picks yet. The full menu has ${menu.length} ${menu.length === 1 ? "item" : "items"}.`
                        : "No menu listed yet. Cafes add their menu and prices on Nook for Business."}
                    </p>
                    {menu.length === 0 ? (
                      <a
                        href="https://business.nookph.app/claim"
                        className="mt-3 inline-block text-sm font-semibold text-brand underline-offset-4 hover:underline"
                      >
                        Own this cafe? Add your menu
                      </a>
                    ) : null}
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

              <section id="reviews">
                <CafeReviews
                  cafeId={id}
                  rating={cafe.rating}
                  reviewCount={cafe.reviewCount}
                  reviews={cafe.reviews}
                />
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

      <Footer />

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

function FullMenuLink({ id }: { id: string }) {
  return (
    <Link
      href={`/cafes/${id}/menu`}
      className="text-sm font-semibold text-ink underline-offset-4 hover:underline"
    >
      View full menu
    </Link>
  );
}
