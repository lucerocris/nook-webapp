"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import SearchResultRow from "./SearchResultRow";
import LoadingDots from "./LoadingDots";
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
        "shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
        active
          ? "border-zinc-900 bg-zinc-900 text-white"
          : "border-zinc-300 bg-transparent text-[#3b3b3b] hover:bg-zinc-50",
      ].join(" ")}
      aria-pressed={active}
    >
      {label}
      {typeof count === "number" ? (
        <span
          className={[
            "ml-1.5 text-xs",
            active ? "text-zinc-300" : "text-zinc-500",
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
    <h3 className="text-left text-base font-semibold text-[#101514] px-2">
      {title}
      <span className="ml-1.5 text-sm font-medium text-zinc-400">
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
        className="text-left text-sm font-medium text-[#3A5A40] transition-colors hover:text-[#2f4833] hover:underline"
      >
        {label}
      </button>
    </div>
  );
}

function EmptyHint({ children }: { children: React.ReactNode }) {
  return (
    <p className="py-2 text-sm text-zinc-500">{children}</p>
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
    <div className="overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-zinc-200/70">
      <div
        className={[
          "sticky top-0 z-10 flex gap-2 overflow-x-auto border-b border-zinc-100 bg-white px-6 py-6 transition-shadow",
          scrolled ? "shadow-[0_6px_8px_-6px_rgba(0,0,0,0.12)]" : "",
        ].join(" ")}
      >
        <TabPill
          label="All"
          active={activeTab === "all"}
          onClick={() => onTabChange("all")}
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
        <TabPill
          label="Cafes"
          count={counts.cafes}
          active={activeTab === "cafes"}
          onClick={() => onTabChange("cafes")}
        />
      </div>

      <div
        ref={scrollRef}
        className="max-h-[60vh] space-y-4 overflow-y-auto px-6 py-6 pt-3"
      >
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

        {showCafes ? (
          <section>
            <SectionHeader title="Cafes" count={cafes.length} />
            {cafesLoading && cafes.length === 0 ? (
              <div className="flex items-center gap-2 py-2 text-sm text-zinc-500">
                <LoadingDots className="text-[#3A5A40]" label="Searching cafes" />
                <span>Searching cafes</span>
              </div>
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
      </div>
    </div>
  );
}
