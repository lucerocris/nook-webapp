import { Suspense } from "react";
import type { Metadata } from "next";

import AppBand from "./components/AppBand";
import CafeRowSkeleton from "./components/CafeRowSkeleton";
import CafeShelf from "./components/CafeShelf";
import Footer from "./components/Footer";
import Hero from "./components/Hero";
import NearYou from "./components/NearYou";
import {
  getHomeFeed,
  LAPTOP_FRIENDLY_TAGS,
  LOCAL_BEANS_TAG,
  SPECIALTY_COFFEE_TAG,
} from "@/lib/data/cafes";
import { getCurrentUserId } from "@/lib/data/auth";
import JsonLd from "./components/JsonLd";
import { SITE_URL } from "@/lib/env";
import { BASE_OPEN_GRAPH, SITE_DESCRIPTION } from "@/lib/seo/metadata";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: { ...BASE_OPEN_GRAPH, url: "/" },
};

const siteJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: `${SITE_URL}/`,
      name: "Nook",
      description: SITE_DESCRIPTION,
      publisher: { "@id": `${SITE_URL}/#organization` },
      inLanguage: "en",
    },
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "Nook",
      url: `${SITE_URL}/`,
      logo: `${SITE_URL}/logo.svg`,
    },
  ],
};

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
      <JsonLd data={siteJsonLd} />
      <main className="flex-1">
        <Hero />
        <Suspense fallback={<CafeRowSkeleton title="House picks" />}>
          <HomeFeed searchParams={searchParams} />
        </Suspense>
        <AppBand />
      </main>
      <Footer flush />
    </>
  );
}

async function HomeFeed({ searchParams }: Props) {
  const { lat, lng } = await searchParams;
  const userId = await getCurrentUserId();
  const coords = { lat: parseCoord(lat), lng: parseCoord(lng) };
  const feed = await getHomeFeed({ userId, ...coords });
  const hasLocation = coords.lat !== undefined && coords.lng !== undefined;

  const allEmpty =
    feed.featuredCafes.length === 0 &&
    feed.newestCafes.length === 0 &&
    feed.trendingCafes.length === 0 &&
    feed.topRatedCafes.length === 0 &&
    feed.specialtyNearbyCafes.length === 0 &&
    feed.laptopFriendlyCafes.length === 0 &&
    feed.localBeansCafes.length === 0;

  if (allEmpty) {
    return (
      <section className="py-16">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-8">
          <p className="text-sm text-muted">No cafes on Nook yet. Check back soon.</p>
        </div>
      </section>
    );
  }

  // Where you are first, then the team's picks, coffee, what is new, and
  // the two rankings (hidden until enough cafes have enough reviews). Titles
  // stay plain; the coffee voice is in the subtitles (COFFEE_VOICE.md).
  // Every shelf is the same photo-card row (design.md, Rhythm).
  return (
    <>
      <NearYou cafes={feed.nearbyCafes} hasLocation={hasLocation} />
      <CafeShelf
        title="House picks"
        subtitle="Chosen by the Nook team"
        cafes={feed.featuredCafes}
        badge="House pick"
        href="/map"
        priority={!hasLocation}
      />
      <CafeShelf
        title="Specialty coffee near you"
        subtitle="Tagged by the Nook team, closest first"
        cafes={feed.specialtyNearbyCafes}
        href={`/map?tags=${encodeURIComponent(SPECIALTY_COFFEE_TAG)}`}
      />
      {/* Hidden by getHomeFeed until three cafes have the tag. */}
      <CafeShelf
        title="Local beans"
        subtitle="Brewing Philippine coffee"
        cafes={feed.localBeansCafes}
        href={`/map?tags=${encodeURIComponent(LOCAL_BEANS_TAG)}`}
      />
      <CafeShelf
        title="Fresh on Nook"
        subtitle="Just added"
        cafes={feed.newestCafes}
        href="/map"
      />
      <CafeShelf
        title="Laptop-friendly"
        subtitle="Wi-Fi and outlets"
        cafes={feed.laptopFriendlyCafes}
        href={`/map?tags=${LAPTOP_FRIENDLY_TAGS.map(encodeURIComponent).join(",")}`}
      />
      <CafeShelf
        title="Crowd favorites"
        subtitle="Well rated by lots of people"
        cafes={feed.trendingCafes}
        href="/map"
      />
      <CafeShelf
        title="Highest rated"
        subtitle="From people who've been"
        cafes={feed.topRatedCafes}
        href="/map"
      />
    </>
  );
}
