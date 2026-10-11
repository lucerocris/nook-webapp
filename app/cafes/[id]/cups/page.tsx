import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CaretLeft } from "@phosphor-icons/react/dist/ssr";

import CafeDetailSkeleton from "@/app/components/CafeDetailSkeleton";
import Footer from "@/app/components/Footer";
import CupCard from "@/app/components/cafe/CupCard";
import { AddCupPrompt, CupKindLinks, CupsSummary } from "@/app/components/cafe/CafeCups";
import { CUP_KIND_LABEL } from "@/app/components/cafe/CupKindIcon";
import { getCafeById } from "@/lib/data/cafes";
import { CUPS_PAGE_SIZE, getCafeCups } from "@/lib/data/cups";
import { parseCupsQuery, plural, type CupSort, type CupsQuery } from "@/lib/data/cups-mappers";
import { SITE_URL as siteUrl } from "@/lib/env";
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
  return {
    title: `${cafe.name} cups`,
    description: `What people had at ${cafe.name}: photos, notes and ratings from their visits, on Nook.`,
    alternates: { canonical: `${siteUrl}/cafes/${id}/cups` },
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

  const limit = Math.min(query.page * CUPS_PAGE_SIZE, 100);
  const cups = await getCafeCups(
    id,
    { rating: cafe.rating, reviewCount: cafe.reviewCount },
    { sort: query.sort, rating: query.rating, kind: query.kind, limit },
  );
  const filtered = query.kind !== null || query.rating !== null;
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
          {cups.stats.cupCount > 0 ? (
            <span className="ml-2 font-normal text-muted tabular-nums">{cups.stats.cupCount}</span>
          ) : null}
        </h1>

        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-16">
          <div className="order-2 min-w-0 lg:order-1">
            <CupKindLinks
              stats={cups.stats}
              active={query.kind}
              hrefFor={(kind) => hrefWith(id, query, { kind })}
            />
            <div className="no-scrollbar -mx-1 mt-3 flex items-center gap-2 overflow-x-auto px-1 py-1">
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
            </div>
            <div className="no-scrollbar -mx-1 mt-2 flex items-center gap-3 overflow-x-auto px-1">
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
            </div>

            {cups.cards.length > 0 ? (
              <>
                <ul className="mt-6 divide-y divide-line border-t border-line">
                  {cups.cards.map((cup) => (
                    <li key={cup.id} className="py-7">
                      <CupCard cup={cup} shownPhotos={4} />
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
                    ? `Nothing ${query.kind ? CUP_KIND_LABEL[query.kind].toLowerCase() : ""}${
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
              first={cups.stats.cupCount === 0}
              className={cn("mt-4", cups.cards.length > 0 && "hidden lg:block")}
            />
          </aside>
        </div>
      </main>
      <Footer />
    </>
  );
}
