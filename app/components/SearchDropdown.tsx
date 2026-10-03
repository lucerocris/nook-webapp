"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import SearchResultRow from "./SearchResultRow";
import type { CafeSummary } from "@/lib/data/cafes-mappers";
import type { SearchTags } from "@/lib/data/search";

export type SearchTab = "all" | "best_for" | "amenities" | "cafes";

type Props = {
  q: string;
  tags: SearchTags;
  cafes: CafeSummary[];
  cafesLoading: boolean;
  /** True when the last search request failed, so the UI can say "couldn't
   * load" instead of the misleading "no cafes match your search". */
  cafesFailed?: boolean;
  activeTab: SearchTab;
  selectedTags: string[];
  onToggleTag: (name: string) => void;
  onTabChange: (tab: SearchTab) => void;
  onSelect: () => void;
};

const PER_SECTION = 5;

function matches(text: string, q: string) {
  if (!q) return true;
  return text.toLowerCase().includes(q.toLowerCase());
}

function TabPill({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count?: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "shrink-0 rounded-full border px-3 py-1 text-[13px] font-medium transition-colors",
        active
          ? "border-ink bg-ink text-white"
          : "border-line bg-white text-body hover:border-line-strong",
      ].join(" ")}
      aria-pressed={active}
    >
      {label}
      {typeof count === "number" ? (
        <span
          className={[
            "ml-1.5 text-xs",
            active ? "text-white/60" : "text-muted",
          ].join(" ")}
        >
          {count}
        </span>
      ) : null}
    </button>
  );
}

function SectionHeader({
  title,
  count,
}: {
  title: string;
  count: number;
}) {
  return (
    <h3 className="px-2 pb-1 text-left text-xs font-semibold uppercase tracking-[0.06em] text-muted">
      {title}
      <span className="ml-1.5 font-medium text-muted/70">
        {count}
      </span>
    </h3>
  );
}

function SeeMoreButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <div className="mt-1 text-left px-2">
      <button
        type="button"
        onClick={onClick}
        className="text-left text-sm font-medium text-brand transition-colors hover:text-brand-hover hover:underline"
      >
        {label}
      </button>
    </div>
  );
}

function EmptyHint({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-2 py-2 text-sm text-muted">{children}</p>
  );
}

export default function SearchDropdown({
  q,
  tags,
  cafes,
  cafesLoading,
  cafesFailed = false,
  activeTab,
  selectedTags,
  onToggleTag,
  onTabChange,
  onSelect,
}: Props) {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      setScrolled(el.scrollTop > 0);
    };
    onScroll();
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const filteredBestFor = useMemo(
    () => tags.bestFor.filter((t) => matches(t.name, q)),
    [tags.bestFor, q],
  );
  const filteredAmenities = useMemo(
    () => tags.amenities.filter((t) => matches(t.name, q)),
    [tags.amenities, q],
  );

  const goCafe = (id: string) => {
    router.push(`/cafes/${id}`);
    onSelect();
  };

  const visibleBestFor =
    activeTab === "all" ? filteredBestFor.slice(0, PER_SECTION) : filteredBestFor;
  const visibleAmenities =
    activeTab === "all" ? filteredAmenities.slice(0, PER_SECTION) : filteredAmenities;
  const visibleCafes =
    activeTab === "all" ? cafes.slice(0, PER_SECTION) : cafes;

  const showBestFor = activeTab === "all" || activeTab === "best_for";
  const showAmenities = activeTab === "all" || activeTab === "amenities";
  const showCafes = activeTab === "all" || activeTab === "cafes";

  const bestForOverflow = filteredBestFor.length > PER_SECTION;
  const amenitiesOverflow = filteredAmenities.length > PER_SECTION;
  const cafesOverflow = cafes.length > PER_SECTION;

  const counts: Record<SearchTab, number | undefined> = {
    all: undefined,
    best_for: filteredBestFor.length,
    amenities: filteredAmenities.length,
    cafes: cafes.length,
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white text-left shadow-float">
      <div
        className={[
          "no-scrollbar sticky top-0 z-10 flex gap-1.5 overflow-x-auto border-b border-line bg-white px-4 py-3 transition-shadow",
          scrolled ? "shadow-[0_6px_8px_-6px_rgba(0,0,0,0.12)]" : "",
        ].join(" ")}
      >
        <TabPill
          label="All"
          active={activeTab === "all"}
          onClick={() => onTabChange("all")}
        />
        <TabPill
          label="Cafes"
          count={counts.cafes}
          active={activeTab === "cafes"}
          onClick={() => onTabChange("cafes")}
        />
        <TabPill
          label="Best For"
          count={counts.best_for}
          active={activeTab === "best_for"}
          onClick={() => onTabChange("best_for")}
        />
        <TabPill
          label="Amenities"
          count={counts.amenities}
          active={activeTab === "amenities"}
          onClick={() => onTabChange("amenities")}
        />
      </div>

      <div
        ref={scrollRef}
        className="max-h-[min(60vh,520px)] space-y-5 overflow-y-auto px-2 py-4 sm:px-3"
      >
        {showCafes ? (
          <section>
            <SectionHeader title="Cafes" count={cafes.length} />
            {cafesLoading && cafes.length === 0 ? (
              <ul aria-label="Searching cafes" className="flex flex-col gap-1 px-2 py-1">
                {[0, 1, 2].map((i) => (
                  <li key={i} className="flex items-center gap-3 py-1.5">
                    <span className="size-10 shrink-0 animate-pulse rounded-lg bg-subtle" />
                    <span className="flex-1 space-y-1.5">
                      <span className="block h-3 w-2/5 animate-pulse rounded bg-subtle" />
                      <span className="block h-2.5 w-1/4 animate-pulse rounded bg-subtle" />
                    </span>
                  </li>
                ))}
              </ul>
            ) : cafesFailed ? (
              <EmptyHint>
                Couldn&apos;t load results — check your connection and try
                again.
              </EmptyHint>
            ) : visibleCafes.length === 0 ? (
              <EmptyHint>
                {q ? "No cafes match your search yet." : "No cafes available."}
              </EmptyHint>
            ) : (
              <>
                <ul className="flex flex-col">
                  {visibleCafes.map((cafe) => (
                    <li key={cafe.id}>
                      <SearchResultRow
                        kind="cafe"
                        cafe={cafe}
                        as="button"
                        onClick={() => goCafe(cafe.id)}
                      />
                    </li>
                  ))}
                </ul>
                {activeTab === "all" && cafesOverflow ? (
                  <SeeMoreButton
                    label={`See all ${cafes.length} cafes`}
                    onClick={() => onTabChange("cafes")}
                  />
                ) : null}
              </>
            )}
          </section>
        ) : null}
        {showBestFor ? (
          <section>
            <SectionHeader title="Best For" count={filteredBestFor.length} />
            {visibleBestFor.length === 0 ? (
              <EmptyHint>No best-for tags match.</EmptyHint>
            ) : (
              <>
                <ul className="flex flex-col">
                  {visibleBestFor.map((tag) => (
                    <li key={tag.id}>
                      <SearchResultRow
                        kind="tag"
                        name={tag.name}
                        as="button"
                        selected={selectedTags.includes(tag.name)}
                        onClick={() => onToggleTag(tag.name)}
                      />
                    </li>
                  ))}
                </ul>
                {activeTab === "all" && bestForOverflow ? (
                  <SeeMoreButton
                    label={`See all ${filteredBestFor.length} best-for tags`}
                    onClick={() => onTabChange("best_for")}
                  />
                ) : null}
              </>
            )}
          </section>
        ) : null}

        {showAmenities ? (
          <section>
            <SectionHeader title="Amenities" count={filteredAmenities.length} />
            {visibleAmenities.length === 0 ? (
              <EmptyHint>No amenities match.</EmptyHint>
            ) : (
              <>
                <ul className="flex flex-col">
                  {visibleAmenities.map((tag) => (
                    <li key={tag.id}>
                      <SearchResultRow
                        kind="tag"
                        name={tag.name}
                        as="button"
                        selected={selectedTags.includes(tag.name)}
                        onClick={() => onToggleTag(tag.name)}
                      />
                    </li>
                  ))}
                </ul>
                {activeTab === "all" && amenitiesOverflow ? (
                  <SeeMoreButton
                    label={`See all ${filteredAmenities.length} amenities`}
                    onClick={() => onTabChange("amenities")}
                  />
                ) : null}
              </>
            )}
          </section>
        ) : null}

      </div>
    </div>
  );
}
