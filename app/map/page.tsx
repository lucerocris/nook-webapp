import { Suspense } from "react";
import type { Metadata } from "next";

import MapExplorer from "@/app/components/MapExplorer";
import { searchCafes } from "@/lib/data/search";
import { BASE_OPEN_GRAPH } from "@/lib/seo/metadata";

// Filtered views (?q=, ?tag=) are the same page with different pins; they all
// canonicalize to the bare /map.
export const metadata: Metadata = {
  title: "Cafe map",
  description:
    "Every cafe on Nook on one map. Filter by Wi-Fi, outlets, and vibe to find a spot near you.",
  alternates: { canonical: "/map" },
  openGraph: {
    ...BASE_OPEN_GRAPH,
    url: "/map",
    title: "Cafe map · Nook",
    description:
      "Every cafe on Nook on one map. Filter by Wi-Fi, outlets, and vibe.",
  },
};

type Props = {
  searchParams: Promise<{ q?: string; tag?: string; tags?: string }>;
};

function parseTags(
  tag: string | undefined,
  tags: string | undefined,
): string[] | undefined {
  const names = [
    ...(tags ? tags.split(",") : []),
    ...(tag ? [tag] : []),
  ]
    .map((t) => t.trim())
    .filter(Boolean);
  return names.length > 0 ? Array.from(new Set(names)) : undefined;
}

export default function MapPage({ searchParams }: Props) {
  return (
    <main className="mt-16 h-[calc(100dvh-4rem)]">
      <Suspense fallback={<MapSkeleton />}>
        <MapContent searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

function MapSkeleton() {
  return (
    <div className="flex h-full w-full animate-pulse flex-col lg:flex-row">
      <div className="w-full px-4 pt-5 sm:px-6 lg:h-full lg:w-[520px] lg:shrink-0 lg:border-r lg:border-line xl:w-[600px]">
        <div className="h-10 w-48 rounded-full bg-subtle" />
        <div className="mt-6 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-subtle" />
          ))}
        </div>
      </div>
      {/* The map pane only exists at `lg`; below that the list is the whole
          surface until the user asks for the map. */}
      <div className="hidden flex-1 bg-subtle lg:block" />
    </div>
  );
}

async function MapContent({ searchParams }: Props) {
  const { q, tag, tags } = await searchParams;
  const query = q?.trim() ? q.trim() : undefined;
  const tagNames = parseTags(tag, tags);

  // Initial paint uses the standard search fetch; once the map mounts it
  // re-fetches by viewport (radius when zoomed in, bounds when zoomed out).
  const cafes = await searchCafes({ query, tagNames, limit: 100 });

  return <MapExplorer initialCafes={cafes} query={query} tags={tagNames} />;
}
