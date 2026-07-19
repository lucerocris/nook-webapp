import { Suspense } from "react";
import type { Metadata } from "next";
import { SITE_URL as siteUrl } from "@/lib/env";
import CafeDetailSkeleton from "@/app/components/CafeDetailSkeleton";
import { getCafeById, MAX_REVIEW_LIMIT } from "@/lib/data/cafes";
import { notFound } from "next/navigation";
import type { CafeDetails, Review } from "@/lib/data/cafes-mappers";
import {
  Star,
  ThumbsUp,
  DotsThree,
  PencilSimple,
} from "@phosphor-icons/react/dist/ssr";


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

type RatingProps = {
    label: string;
    percentage: number;
};


export default async function CafeReviewsPage({params}: Props){
   return(
    <Suspense fallback={<CafeDetailSkeleton/>}>
        <CafeReviewRender params={params}/>
    </Suspense>
   )
}

async function CafeReviewRender({ params }: Props){
    const {id} = await params;
    // This page lists reviews, so it needs more than the detail page's default
    // of 4 — but still bounded, not the whole table.
    const cafe = await getCafeById(id, { reviewLimit: MAX_REVIEW_LIMIT })

    if (!cafe) {
        notFound();
    }


    return(
        <main className="grid grid-cols-5 mt-25 mb-16 mx-57">
            <section className="col-span-3 pr-10">
                <div className="flex items-center justify-between gap-4">
                    <h2 className="text-4xl font-semibold text-[#2f2f2f]">
                    Reviews
                    </h2>
                </div>
                <div className="flex items-center mt-3 mb-3 justify-between gap-4">
                    <h2 className="text-lg font-semibold text-zinc-500">
                       {cafe.reviewCount} reviews
                    </h2>
                </div>
                <hr className="my-5 border-black/15"/>
                <div className="mt-4 grid gap-4 sm:grid-cols-1">
                    {cafe.reviews.length > 0 ? (
                        cafe.reviews.map((review) => (
                            <ReviewCard key={review.id} review={review} />
                        ))
                    ) : (
                        <p className="text-sm text-zinc-500">
                            No reviews yet — be the first to share what this cafe
                            is like.
                        </p>
                    )}
                </div>
            </section>

            <section className="col-span-2 pl-7 pr-7 pt-7 pb-10 h-120 rounded-xl outline outline-black/10">
                <div className="flex items-center justify-between gap-4">
                    <span className="flex items-center gap-0.5">
                        <Star
                            size={20}
                            weight={"fill"}
                            className="text-[#3A5A40]"
                        />
                        <span className="pl-1 text-4xl font-semibold text-[#2f2f2f]">
                            {cafe.rating.toFixed(1)}
                        </span>
                    </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                    <span className="text-lg font-semibold text-zinc-500">{cafe.reviewCount} reviews</span>
                </div>
                {/* The histogram below is computed over the reviews actually
                    fetched (capped at MAX_REVIEW_LIMIT), not the full
                    reviewCount above, so say so rather than presenting a
                    sample as the population. */}
                {cafe.reviewCount > cafe.reviews.length ? (
                    <span className="text-xs text-[#6b6b6b]">
                        Breakdown of the {cafe.reviews.length} most recent
                    </span>
                ) : null}
                <CalcRatings cafe={cafe}/>
                <hr className="mt-5 border-black/15"/>
                <button type="button" className="text-white justify-center my-10 flex items-center w-full bg-[#557c55] p-5 rounded-xl">
                    <PencilSimple size={25} className="mr-2"/>Write A Review
                </button>
            </section>


        </main>
    )
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <article className="p-4">
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
        <p className="mt-3 mb-3 text-sm leading-5 text-[#3b3b3b]">
          {review.content}
        </p>
      ) : null}
      <div className="flex items-center justify-between">
        <span className="inline-flex items=center">
            <ThumbsUp size={20}/> 
            <span className="mx-2 text-sm">helpful</span>
        </span>
        <DotsThree size={25} weight="bold"/>
      </div>
      
    </article>
  );
}



function CalcRatings({cafe}: {cafe: CafeDetails}){
    const reviews = cafe.reviews  || [];
    const ratings = [0, 0, 0, 0, 0];// ratings 1, 2, 3, 4, 5
    reviews.forEach(rev => {
        if(rev.rating >= 1 && rev.rating <= 5){
            ratings[rev.rating - 1]++;
        }
    });
    // Divide by the reviews actually counted, not cafe.reviewCount — that DB
    // aggregate includes moderated-away rows and any beyond the fetch limit, so
    // using it made the bars systematically under-fill and never total 100%.
    const totalCount = reviews.length || 1;

    return(
        <div className="flex flex-col gap-y-4 pt-5 mb-10">
            <RatingRow label="5" percentage={ratings[4]/totalCount * 100} />
            <RatingRow label="4" percentage={ratings[3]/totalCount * 100} />
            <RatingRow label="3" percentage={ratings[2]/totalCount * 100} />
            <RatingRow label="2" percentage={ratings[1]/totalCount * 100} />
            <RatingRow label="1" percentage={ratings[0]/totalCount * 100} />
        </div>
    );
}

function RatingRow({ label, percentage }: RatingProps) {
  return (
    <div className="flex items-center gap-x-4 mt-1 w-full">
      <span className="text-sm font-medium text-gray-400 w-3">{label}</span>
      <div className="h-2 flex-1 bg-gray-300 rounded-full overflow-hidden">
        <div 
          className="h-full bg-[#557c55] rounded-full" 
          style={{ width: `${percentage}%` }}
        />
      </div>
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