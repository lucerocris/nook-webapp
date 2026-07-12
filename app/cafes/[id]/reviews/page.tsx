import { Suspense } from "react";
import CafeDetailSkeleton from "@/app/components/CafeDetailSkeleton";
import { getCafeById } from "@/lib/data/cafes";
import { notFound } from "next/navigation";
import type { CafeDetails, MenuItem, Review, Tag } from "@/lib/data/cafes-mappers";
import {
  CaretRight,
  Heart,
  MapPin,
  NavigationArrow,
  ShareNetwork,
  Star,
  ThumbsUp,
  DotsThree,
  PencilSimple,
} from "@phosphor-icons/react/dist/ssr";


type Props = {
    params: Promise<{ id: string }>;
};

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
    //console.log("ID: " + id)
    const cafe = await getCafeById(id)

    if (!cafe) {
        notFound();
    }

    console.log(cafe.reviews)

    return(
        <main className="grid grid-cols-5 mt-25 mb-16 mx-57">
            <section className="col-span-3 pr-10">
                <div className="flex items-center justify-between gap-4">
                    <h2 className="text-4xl font-semibold text-[#2f2f2f]">
                    Reviews
                    </h2>
                </div>
                <div className="flex items-center mt-3 mb-3 justify-between gap-4">
                    <h2 className="text-lg font-semibold text-black/17">
                       {cafe.reviewCount} reviews
                    </h2>
                </div>
                <hr className="my-5 border-black/15"/>
                <div className="mt-4 grid gap-4 sm:grid-cols-1">
                    {cafe.reviews.map((review) => (
                        <ReviewCard key={review.id} review={review} />
                    ))}
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
                            {cafe.rating}
                        </span>
                    </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                    <span className="text-lg font-semibold text-black/17">{cafe.reviewCount} reviews</span>
                </div>
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
    let reviews = cafe.reviews  || [];
    let ratings = [0, 0, 0, 0, 0];// ratings 1, 2, 3, 4, 5
    let totalCount = cafe.reviewCount || 1;
    reviews.forEach(rev => {
        if(rev.rating >= 1 && rev.rating <= 5){
            ratings[rev.rating - 1]++;
        }
    });

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