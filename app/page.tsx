import { Suspense } from "react";

import CafeRow from "./components/CafeRow";
import CafeRowSkeleton from "./components/CafeRowSkeleton";
import Footer from "./components/Footer";
import Hero from "./components/Hero";
import NearbyOptIn from "./components/NearbyOptIn";
import { getHomeFeed } from "@/lib/data/cafes";
import { getCurrentUserId } from "@/lib/data/auth";

type Props = {
  searchParams: Promise<{ lat?: string; lng?: string }>;
};

/** Coordinates are part of getHomeFeed's cache key, so precision here is
 * precision in the number of distinct cache entries. The client sends 6
 * decimals (~0.1 m), which makes every user at every position mint a private
 * hours-long copy of the whole feed and effectively disables the cache.
 * 3 decimals is ~110 m — well inside the nearby-radius granularity, and it
 * caps entries at the number of distinct neighbourhoods. Rounded server-side
 * so a hand-crafted ?lat= can't reintroduce the explosion. */
const COORD_PRECISION = 3;

function parseCoord(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return undefined;
  return Number(parsed.toFixed(COORD_PRECISION));
}

export default function Home({ searchParams }: Props) {
  return (
    <>
      <main className="flex-1">
        <Hero />
        <Suspense fallback={null}>
          <NearbyOptIn />
        </Suspense>
        <Suspense fallback={<CafeRowSkeleton title="Featured" />}>
          <HomeFeed searchParams={searchParams} />
        </Suspense>
      </main>
      <Footer />
    </>
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
