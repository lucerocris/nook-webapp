import { Suspense } from "react";

import HeroSearch from "./HeroSearch";
import { getSearchTags, searchCafes } from "@/lib/data/search";

function HeroShell({ children }: { children: React.ReactNode }) {
  return (
    <section className="relative overflow-hidden pt-48 pb-16 sm:pt-64 sm:pb-24">
      {/* Decorative only — green glow behind the hero (page-wide dots come from
          the body background). */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="hero-glow absolute inset-x-0 top-0 h-[640px]" />
      </div>

      <div className="mx-auto w-full max-w-5xl px-6 sm:px-8">
        <div className="relative z-10 flex flex-col items-center text-center">
          <h1 className="text-4xl font-semibold tracking-tight text-[#3b3b3b] sm:text-5xl">
            Philippine cafes, community curated.
          </h1>

          <p className="mt-4 text-lg text-[#3b3b3b]">
            Find the perfect spot to work, study, or chill. Filter by Wi-Fi,
            outlets, and vibe, or ask our AI to find your match.
          </p>

          <div className="w-full">{children}</div>

          <p className="mt-6 text-sm text-[#3b3b3b]">
            <span className="font-semibold">50+ cafes,</span> vetted by the
            local community.
          </p>
        </div>
      </div>
    </section>
  );
}

function HeroSearchFallback() {
  return (
    <div
      aria-hidden="true"
      className="mt-6 h-[52px] w-full animate-pulse rounded-full bg-zinc-100"
    />
  );
}

async function HeroSearchContent() {
  const [tags, topCafes] = await Promise.all([
    getSearchTags(),
    searchCafes({ limit: 5 }),
  ]);
  return <HeroSearch tags={tags} initialCafes={topCafes} />;
}

export default function Hero() {
  return (
    <HeroShell>
      <Suspense fallback={<HeroSearchFallback />}>
        <HeroSearchContent />
      </Suspense>
    </HeroShell>
  );
}
