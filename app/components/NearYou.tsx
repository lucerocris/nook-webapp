import Link from "next/link";

import type { CafeSummary } from "@/lib/data/cafes-mappers";
import CafeShelf from "./CafeShelf";
import NearbyPrompt from "./NearbyPrompt";

/**
 * The first slot under the hero. Before location is shared: the prompt
 * banner. After: a Near you shelf, closest first, each card showing its
 * distance; or one line when nothing listed is close by.
 */
export default function NearYou({
  cafes,
  hasLocation,
}: {
  cafes: CafeSummary[];
  hasLocation: boolean;
}) {
  if (!hasLocation) return <NearbyPrompt />;

  if (cafes.length === 0) {
    return (
      <section className="pt-10 sm:pt-14">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-8">
          <h2 className="text-xl font-semibold tracking-[-0.02em] text-ink sm:text-[22px]">Near you</h2>
          <p className="mt-1 text-sm text-muted">
            No cafes on Nook close to you yet.{" "}
            <Link href="/map" className="font-medium text-brand underline-offset-4 hover:underline">
              Browse the map
            </Link>
          </p>
        </div>
      </section>
    );
  }

  return <CafeShelf title="Near you" subtitle="Closest first" cafes={cafes} href="/map" priority />;
}
