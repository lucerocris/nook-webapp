import Link from "next/link";
import { DeviceMobile, Star } from "@phosphor-icons/react/dist/ssr";

import {
  CUP_KINDS,
  cupStatsLine,
  type CafeCups as Cups,
  type CupKind,
  type CupStats,
} from "@/lib/data/cups-mappers";
import { cn } from "@/lib/utils";
import CupCard from "./CupCard";
import CupKindIcon, { CUP_KIND_LABEL } from "./CupKindIcon";
import RatingStars from "./RatingStars";

/** Cups are added in the app; the web says where. */
export function AddCupPrompt({ first, className }: { first: boolean; className?: string }) {
  return (
    <div className={cn("rounded-[var(--radius-card)] border border-line p-5", className)}>
      <DeviceMobile size={22} className="text-fern" aria-hidden />
      <p className="mt-3 text-sm font-semibold text-ink">
        {first ? "Be the first to add a cup" : "Been here?"}
      </p>
      <p className="mt-1 text-sm text-body">
        A cup is one visit: photos of what you had, a note, stars if you like.
      </p>
      <Link
        href="/download-app"
        className="mt-4 inline-flex h-11 items-center rounded-full bg-ink px-5 text-sm font-semibold text-white transition-colors hover:bg-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        Add your cup in the app
      </Link>
    </div>
  );
}

/** The big number (each person's latest rated visit, so each person once),
 * its stars and the counts; with nobody rating, the counts alone. */
export function CupsSummary({ stats }: { stats: CupStats }) {
  const line = cupStatsLine(stats);
  if (stats.rating === null) {
    return <p className="text-sm text-muted tabular-nums">{line}</p>;
  }
  return (
    <div className="flex items-end gap-3">
      <span className="text-5xl font-semibold leading-none tracking-[-0.03em] text-ink tabular-nums">
        {stats.rating.toFixed(1)}
      </span>
      <div className="pb-1">
        <RatingStars rating={stats.rating} size={14} />
        <p className="mt-1 text-sm text-muted tabular-nums">
          <span className="sr-only">Rated {stats.rating.toFixed(1)} out of 5 from </span>
          {line}
        </p>
      </div>
    </div>
  );
}

/** All · Coffee · Drink · Food · Space as links (the kind lives in the URL),
 * each kind only when some cup has it, counted in cups: "Food 2" is two
 * visits where someone had food (`countCupsByKind`). Legacy photos have no
 * kind, so a cafe with only those shows no chips. */
export function CupKindLinks({
  counts,
  active,
  hrefFor,
}: {
  counts: Record<CupKind, number>;
  active: CupKind | null;
  hrefFor: (kind: CupKind | null) => string;
}) {
  const kinds = CUP_KINDS.filter((kind) => counts[kind] > 0 || kind === active);
  if (kinds.length === 0) return null;
  const chip =
    "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";
  return (
    <nav aria-label="Show cups with" className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 py-1">
      <Link
        href={hrefFor(null)}
        aria-current={active === null ? "page" : undefined}
        className={cn(chip, active === null ? "border-ink bg-ink text-white" : "border-line text-ink hover:bg-paper")}
      >
        All
      </Link>
      {kinds.map((kind) => (
        <Link
          key={kind}
          href={hrefFor(kind)}
          aria-current={active === kind ? "page" : undefined}
          className={cn(chip, active === kind ? "border-ink bg-ink text-white" : "border-line text-ink hover:bg-paper")}
        >
          <CupKindIcon kind={kind} size={15} />
          {CUP_KIND_LABEL[kind]}
          <span className={cn("tabular-nums", active === kind ? "text-white/75" : "text-muted")}>
            {counts[kind]}
          </span>
        </Link>
      ))}
    </nav>
  );
}

/**
 * Cups on a cafe page, where Reviews was (docs/references/cups): the heading
 * with the count of cups (visits) and Fresha's two columns on desktop — the
 * cups on the left, the summary and the app prompt on the right — and
 * Google Maps' order on a phone, summary first. With no cups yet, the prompt
 * is the whole section.
 */
export default function CafeCups({
  cafeId,
  cups,
  kindCounts,
}: {
  cafeId: string;
  cups: Cups;
  /** null when they couldn't be read: no chips, the rest of the section stays. */
  kindCounts: Record<CupKind, number> | null;
}) {
  const { stats, cards } = cups;
  const pageHref = `/cafes/${cafeId}/cups`;

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <h2 className="flex items-center gap-2 text-xl font-semibold tracking-[-0.02em] text-ink">
          {stats.rating !== null ? (
            <Star size={18} weight="fill" className="text-fern" aria-hidden />
          ) : null}
          Cups
          {stats.cupCount > 0 ? (
            <span className="font-normal text-muted tabular-nums">{stats.cupCount}</span>
          ) : null}
        </h2>
        {/* The section's only "See all" (UX review 1.3): the footer keeps just
            the app prompt. */}
        {cards.length > 0 ? (
          <Link
            href={pageHref}
            className="inline-flex min-h-11 items-center text-sm font-semibold text-ink underline-offset-4 hover:underline"
          >
            See all {stats.cupCount > cards.length ? stats.cupCount : ""}
            <span className="sr-only"> cups</span>
          </Link>
        ) : null}
      </div>

      {cards.length === 0 ? (
        <div className="mt-5 max-w-sm">
          <p className="mb-4 text-sm text-muted">No cups yet.</p>
          <AddCupPrompt first />
        </div>
      ) : (
        <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_260px] lg:gap-10">
          <div className="min-w-0 lg:order-2">
            <CupsSummary stats={stats} />
            <div className="mt-5">
              {kindCounts ? (
                <CupKindLinks
                  counts={kindCounts}
                  active={null}
                  hrefFor={(kind) => (kind ? `${pageHref}?kind=${kind}` : pageHref)}
                />
              ) : null}
            </div>
            <AddCupPrompt first={false} className="mt-6 hidden lg:block" />
          </div>
          <div className="min-w-0 lg:order-1">
            <ul className="divide-y divide-line">
              {cards.map((cup) => (
                <li key={cup.id} className="py-6 first:pt-0">
                  <CupCard cup={cup} />
                </li>
              ))}
            </ul>
            <AddCupPrompt first={false} className="mt-6 lg:hidden" />
          </div>
        </div>
      )}
    </div>
  );
}
