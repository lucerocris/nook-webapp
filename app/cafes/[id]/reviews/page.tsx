import { Suspense } from "react";
import type { Metadata } from "next";
import { SITE_URL as siteUrl } from "@/lib/env";
import CafeDetailSkeleton from "@/app/components/CafeDetailSkeleton";
import { getCafeById, MAX_REVIEW_LIMIT } from "@/lib/data/cafes";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CaretLeft, PencilSimple } from "@phosphor-icons/react/dist/ssr";

import Footer from "@/app/components/Footer";
import RatingSummary from "@/app/components/cafe/RatingSummary";
import ReviewList from "@/app/components/cafe/ReviewList";


type Props = {
    params: Promise<{ id: string }>;
};

/** Without this the route inherited the generic site title — duplicate titles
 * across the highest-value URL set — and, more importantly, missing cafes
 * served indexable 200s. notFound() fires inside Suspense under
 * cacheComponents, after the shell has flushed, so the status cannot be
 * corrected here; noindex is the same mitigation the detail page uses. */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params;
    const cafe = await getCafeById(id, { includeReviews: false });

    if (!cafe) {
        return { title: "Reviews", robots: { index: false } };
    }

    return {
        title: `${cafe.name} reviews`,
        description: `Read ${cafe.reviewCount} reviews of ${cafe.name} on Nook.`,
        alternates: { canonical: `${siteUrl}/cafes/${id}/reviews` },
    };
}



export default async function CafeReviewsPage({params}: Props){
   return(
    <Suspense fallback={<CafeDetailSkeleton/>}>
        <CafeReviewRender params={params}/>
    </Suspense>
   )
}

async function CafeReviewRender({ params }: Props) {
  const { id } = await params;
  // This page lists reviews, so it needs more than the detail page's default
  // of 4 — but still bounded, not the whole table.
  const cafe = await getCafeById(id, { reviewLimit: MAX_REVIEW_LIMIT });

  if (!cafe) {
    notFound();
  }

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
          Reviews
        </h1>

        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-16">
          <div className="order-2 min-w-0 lg:order-1">
            {cafe.reviews.length > 0 ? (
              <ReviewList reviews={cafe.reviews} total={cafe.reviewCount} />
            ) : (
              <div className="rounded-2xl border border-dashed border-line-strong px-6 py-12 text-center">
                <p className="text-sm font-semibold text-ink">No reviews yet</p>
                <p className="mt-1 text-sm text-muted">
                  Been here? Leave the first review in the Nook app.
                </p>
              </div>
            )}
          </div>

          <aside className="order-1 lg:order-2 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-[var(--radius-card)] border border-line p-6">
              <RatingSummary
                rating={cafe.rating}
                reviewCount={cafe.reviewCount}
                reviews={cafe.reviews}
              />
              <div className="mt-6 border-t border-line pt-5">
                <p className="text-sm text-body">
                  Reviews are written by Nook members in the app.
                </p>
                <Link
                  href="/download-app"
                  className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-full bg-ink text-sm font-medium text-white transition-colors hover:bg-brand"
                >
                  <PencilSimple size={16} />
                  Write a review in the app
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </>
  );
}
