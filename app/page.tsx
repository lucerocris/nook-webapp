import { Suspense } from "react";

import CafeRow from "./components/CafeRow";
import CafeRowSkeleton from "./components/CafeRowSkeleton";
import Hero from "./components/Hero";
import NearbyOptIn from "./components/NearbyOptIn";
import { getHomeFeed } from "@/lib/data/cafes";
import { getCurrentUserId } from "@/lib/data/auth";

type Props = {
  searchParams: Promise<{ lat?: string; lng?: string }>;
};

function parseCoord(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export default function Home({ searchParams }: Props) {
  return (
    <main className="flex-1">
      <Hero />
      <Suspense fallback={null}>
        <NearbyOptIn />
      </Suspense>
      <Suspense fallback={<CafeRowSkeleton title="Featured" />}>
        <HomeFeed searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function HomeFeed({ searchParams }: Props) {
  const { lat, lng } = await searchParams;
  const userId = await getCurrentUserId();
  const feed = await getHomeFeed({
    userId,
    lat: parseCoord(lat),
    lng: parseCoord(lng),
  });

  const allEmpty =
    feed.featuredCafes.length === 0 &&
    feed.newestCafes.length === 0 &&
    feed.trendingCafes.length === 0 &&
    feed.topRatedCafes.length === 0;

  if (allEmpty) {
    return (
      <section className="py-16">
        <div className="mx-auto w-full max-w-7xl px-6 sm:px-8">
          <p className="mt-4 text-sm text-zinc-500">
            No cafes available yet. Check back soon.
          </p>
        </div>
      </section>
    );
  }

  return (
    <>
      <CafeRow
        title="Featured"
        cafes={feed.featuredCafes}
        emptyHint="No featured cafes right now."
      />
      <CafeRow
        title="New"
        cafes={feed.newestCafes}
        emptyHint="No new cafes this week."
      />
      <CafeRow
        title="Trending"
        cafes={feed.trendingCafes}
        emptyHint="Nothing trending yet."
      />
      <CafeRow
        title="Top Rated"
        cafes={feed.topRatedCafes}
        emptyHint="No rated cafes yet."
      />
      <CafeRow
        title="Nearby"
        cafes={feed.nearbyCafes}
        emptyHint="Use your location to see cafes near you."
      />
    </>
  );
}
