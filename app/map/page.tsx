import { Suspense } from "react";

import MapExplorer from "@/app/components/MapExplorer";
import { searchCafes } from "@/lib/data/search";

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
    <main className="mt-20 h-[calc(100dvh-5rem)]">
      <Suspense fallback={<MapSkeleton />}>
        <MapContent searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

function MapSkeleton() {
  return (
    <div className="flex h-full w-full animate-pulse flex-col lg:flex-row">
      <div className="w-full lg:h-full lg:w-1/2 lg:overflow-y-auto">
        <div className="mx-6 mb-5 mt-8 h-6 w-56 rounded bg-zinc-100 sm:mx-8" />
        <div className="grid grid-cols-2 gap-5 px-6 pb-8 sm:px-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-[4/3] rounded-2xl bg-zinc-100" />
          ))}
        </div>
      </div>
      <div className="h-[45vh] w-full shrink-0 p-4 sm:p-6 lg:h-full lg:w-1/2">
        <div className="h-full w-full rounded-2xl bg-zinc-100" />
      </div>
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
