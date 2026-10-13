import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CaretLeft } from "@phosphor-icons/react/dist/ssr";

import CafeDetailSkeleton from "@/app/components/CafeDetailSkeleton";
import Footer from "@/app/components/Footer";
import CupCard from "@/app/components/cafe/CupCard";
import CupPhotoGrid from "@/app/components/cafe/CupPhotoGrid";
import { AddCupPrompt, CupKindLinks, CupsSummary } from "@/app/components/cafe/CafeCups";
import ScrollToActive from "@/app/components/cafe/ScrollToActive";
import { CUP_KIND_LABEL } from "@/app/components/cafe/CupKindIcon";
import { getCafeById } from "@/lib/data/cafes";
import {
  CUP_PHOTOS_PAGE_SIZE,
  CUPS_PAGE_SIZE,
  getCafeCupKindCounts,
  getCafeCupPhotos,
  getCafeCups,
} from "@/lib/data/cups";
import { parseCupsQuery, plural, type CupSort, type CupsQuery } from "@/lib/data/cups-mappers";
import { SITE_URL as siteUrl } from "@/lib/env";
import { cafeShareMetadata } from "@/lib/seo/metadata";
import { cleanText } from "@/lib/seo/text";
import { cn } from "@/lib/utils";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const SORT_LABEL: Record<CupSort, string> = {
  recommended: "Recommended",
  recent: "Newest",
  highest: "Highest rated",
  helpful: "Most helpful",
};

/** noindex for a missing cafe, as the detail page does: notFound() fires
 * after the shell flushes under cacheComponents. Filtered views canonicalise
 * to the plain list. */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const cafe = await getCafeById(id, { includeReviews: false });
  if (!cafe) return { title: "Cups", robots: { index: false } };
  // "Cups" is the H1; the title says what people search for (UX review 6.6).
  const name = cleanText(cafe.name);
  const title = `${name} photos & reviews`;
  const description = `What people had at ${name}: photos, notes and ratings from their visits, on Nook.`;
  return {
    title,
    description,
    alternates: { canonical: `${siteUrl}/cafes/${id}/cups` },
    ...cafeShareMetadata({ title, description, path: `/cafes/${id}/cups`, cafe }),
  };
}

export default async function CafeCupsPage(props: Props) {
  return (
    <Suspense fallback={<CafeDetailSkeleton />}>
      <CafeCupsContent {...props} />
    </Suspense>
  );
}

function hrefWith(id: string, query: CupsQuery, change: Partial<CupsQuery>): string {
  const next = { ...query, page: 1, ...change };
  const params = new URLSearchParams();
  if (next.view === "photos") params.set("view", "photos");
  if (next.kind) params.set("kind", next.kind);
  if (next.rating) params.set("rating", String(next.rating));
  if (next.sort !== "recommended") params.set("sort", next.sort);
  if (next.page > 1) params.set("page", String(next.page));
  const qs = params.toString();
  return `/cafes/${id}/cups${qs ? `?${qs}` : ""}`;
}

async function CafeCupsContent({ params, searchParams }: Props) {
  const { id } = await params;
  const query = parseCupsQuery(await searchParams);
  const cafe = await getCafeById(id, { includeReviews: false });
  if (!cafe) notFound();

  const photosView = query.view === "photos";
  const limit = Math.min(query.page * (photosView ? CUP_PHOTOS_PAGE_SIZE : CUPS_PAGE_SIZE), 100);
  const legacy = { rating: cafe.rating, reviewCount: cafe.reviewCount };
  const [cups, kindCounts, photos, allPhotos] = await Promise.all([
    getCafeCups(id, legacy, {
      sort: query.sort,
      rating: photosView ? null : query.rating,
      kind: query.kind,
      limit: photosView ? 1 : limit,
    }),
    getCafeCupKindCounts(id, legacy),
    photosView ? getCafeCupPhotos(id, legacy, { kind: query.kind, limit }) : null,
    // For the Photos count in the switch.
    getCafeCupPhotos(id, legacy, { limit: 1 }),
  ]);
  // The cafe's own numbers, unfiltered, for the switch and the summary.
  const cupTotal = cups.stats.cupCount;
  const photoTotal = allPhotos.total;
  const filtered = query.kind !== null || (!photosView && query.rating !== null);
  // Stars and Sort only earn their rows once there is something to sort
  // (UX review 6.4); a filter in the URL keeps its row so it can be undone.
  const showListControls = !photosView && (cupTotal >= 5 || query.rating !== null || query.sort !== "recommended");
  const pill =
    "inline-flex h-9 shrink-0 items-center rounded-full border px-3.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

  return (
    <>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-24 pb-16 sm:px-8 lg:pt-28">
        <Link
          href={`/cafes/${id}`}
          className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-body transition-colors hover:text-ink"
        >
          <CaretLeft size={16} weight="bold" />
          {cafe.name}
        </Link>
        <h1 className="mt-2 text-[1.75rem] font-semibold tracking-[-0.02em] text-ink sm:text-[2rem]">
          Cups
          {cupTotal > 0 ? (
            <span className="ml-2 font-normal text-muted tabular-nums">{cupTotal}</span>
          ) : null}
        </h1>

        {photoTotal > 0 ? (
          <nav aria-label="Show" className="mt-5 inline-flex rounded-full border border-line p-1">
            {(
              [
                ["cups", "Cups", cupTotal],
                ["photos", "Photos", photoTotal],
              ] as const
            ).map(([view, label, count]) => (
              <Link
                key={view}
                href={hrefWith(id, query, { view, rating: null, sort: "recommended" })}
                aria-current={query.view === view ? "page" : undefined}
                className={cn(
                  "inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
                  query.view === view ? "bg-ink text-white" : "text-ink hover:bg-paper",
                )}
              >
                {label}
                <span className={cn("tabular-nums", query.view === view ? "text-white/75" : "text-muted")}>
                  {count}
                </span>
              </Link>
            ))}
          </nav>
        ) : null}

        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-16">
          <div className="order-2 min-w-0 lg:order-1">
            <CupKindLinks
              counts={kindCounts}
              active={query.kind}
              hrefFor={(kind) => hrefWith(id, query, { kind })}
            />
            {showListControls ? (
            <>
            <ScrollToActive className="no-scrollbar -mx-1 mt-3 flex items-center gap-2 overflow-x-auto px-1 py-1">
              <span className="shrink-0 text-sm text-muted">Stars:</span>
              {[null, 5, 4, 3, 2, 1].map((stars) => (
                <Link
                  key={stars ?? "any"}
                  href={hrefWith(id, query, { rating: stars })}
                  aria-current={query.rating === stars ? "page" : undefined}
                  className={cn(
                    pill,
                    query.rating === stars
                      ? "border-ink bg-ink text-white"
                      : "border-line text-ink hover:bg-paper",
                  )}
                >
                  {stars === null ? "Any" : `${stars}★`}
                </Link>
              ))}
            </ScrollToActive>
            <ScrollToActive className="no-scrollbar -mx-1 mt-2 flex items-center gap-3 overflow-x-auto px-1">
              <span className="shrink-0 text-sm text-muted">Sort:</span>
              {(Object.keys(SORT_LABEL) as CupSort[]).map((sort) => (
                <Link
                  key={sort}
                  href={hrefWith(id, query, { sort })}
                  aria-current={query.sort === sort ? "page" : undefined}
                  className={cn(
                    "inline-flex min-h-11 shrink-0 items-center rounded-md px-1 text-sm font-semibold underline-offset-4",
                    query.sort === sort ? "text-ink underline" : "text-muted hover:text-ink",
                  )}
                >
                  {SORT_LABEL[sort]}
                </Link>
              ))}
            </ScrollToActive>
            </>
            ) : null}

            {photos ? (
              photos.photos.length > 0 ? (
                <>
                  <h2 className="mt-6 mb-4 text-base font-semibold text-ink tabular-nums">
                    {plural(photos.total, "photo")}
                    {query.kind ? ` of ${CUP_KIND_LABEL[query.kind].toLowerCase()}` : ""}
                  </h2>
                  <CupPhotoGrid photos={photos.photos} cafeName={cafe.name} />
                  {photos.hasMore && limit < 100 ? (
                    <Link
                      href={hrefWith(id, query, { page: query.page + 1 })}
                      scroll={false}
                      className="mt-8 inline-flex h-11 items-center rounded-full border border-ink px-5 text-sm font-semibold text-ink transition-colors hover:bg-paper"
                    >
                      Show more photos
                    </Link>
                  ) : null}
                </>
              ) : (
                <div className="mt-6 rounded-2xl border border-dashed border-line-strong px-6 py-12 text-center">
                  <p className="text-sm font-semibold text-ink">No photos match</p>
                  <p className="mt-1 text-sm text-muted">
                    {query.kind
                      ? `No photos of ${CUP_KIND_LABEL[query.kind].toLowerCase()} yet.`
                      : "No photos yet."}
                  </p>
                  <Link
                    href={hrefWith(id, query, { kind: null })}
                    className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-ink underline underline-offset-4"
                  >
                    Show all photos
                  </Link>
                </div>
              )
            ) : cups.cards.length > 0 ? (
              <>
                {/* The list's own heading: what is showing, filters included. */}
                <h2 className="mt-6 text-base font-semibold text-ink tabular-nums">
                  {plural(cups.total, "cup")}
                  {query.kind ? ` with ${CUP_KIND_LABEL[query.kind].toLowerCase()}` : ""}
                  {query.rating ? ` rated ${plural(query.rating, "star")}` : ""}
                </h2>
                <ul className="mt-3 divide-y divide-line border-t border-line">
                  {cups.cards.map((cup) => (
                    <li key={cup.id} className="py-7">
                      <CupCard cup={cup} cafeName={cafe.name} shownPhotos={4} />
                    </li>
                  ))}
                </ul>
                <AddCupPrompt first={false} className="mb-6 lg:hidden" />
                {cups.hasMore && limit < 100 ? (
                  <Link
                    href={hrefWith(id, query, { page: query.page + 1 })}
                    scroll={false}
                    className="inline-flex h-11 items-center rounded-full border border-ink px-5 text-sm font-semibold text-ink transition-colors hover:bg-paper"
                  >
                    Show more cups
                  </Link>
                ) : null}
              </>
            ) : (
              <div className="mt-6 rounded-2xl border border-dashed border-line-strong px-6 py-12 text-center">
                <p className="text-sm font-semibold text-ink">
                  {filtered ? "No cups match" : "No cups yet"}
                </p>
                <p className="mt-1 text-sm text-muted">
                  {filtered
                    ? `No cups${query.kind ? ` with ${CUP_KIND_LABEL[query.kind].toLowerCase()}` : ""}${
                        query.rating ? ` rated ${plural(query.rating, "star")}` : ""
                      } yet.`
                    : "Been here? Add the first one in the Nook app."}
                </p>
                {filtered ? (
                  <Link
                    href={`/cafes/${id}/cups`}
                    className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-ink underline underline-offset-4"
                  >
                    Show all cups
                  </Link>
                ) : null}
              </div>
            )}
          </div>

          <aside className="order-1 lg:order-2 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-[var(--radius-card)] border border-line p-6">
              <CupsSummary stats={cups.stats} />
            </div>
            <AddCupPrompt
              first={cupTotal === 0}
              className={cn(
                "mt-4",
                (photosView ? photoTotal > 0 : cups.cards.length > 0) && "hidden lg:block",
              )}
            />
          </aside>
        </div>
      </main>
      <Footer />
    </>
  );
}
