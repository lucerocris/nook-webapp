"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowClockwise,
  Coffee,
  FunnelSimple,
  ListBullets,
  MapTrifold,
  Star,
} from "@phosphor-icons/react/dist/ssr";

import { cn } from "@/lib/utils";
import CafeMap from "./CafeMap";
import LoadingDots from "./LoadingDots";
import MapFilterModal, { SORT_OPTIONS, type SortId } from "./MapFilterModal";
import { getOpenStatus } from "@/lib/utils/hours";
import type { CafeSummary } from "@/lib/data/cafes-mappers";
import {
  hasValidCoordinates,
  viewportRadiusMeters,
  type MapViewport,
} from "@/lib/utils/maps";

type Props = {
  initialCafes: CafeSummary[];
  query?: string;
  tags?: string[];
};

// When the whole visible area fits inside this radius we fetch a fixed circle
// around the map center; once the view is larger we fetch the exact bounds.
const RADIUS_METERS = 20000; // 20 km
const MOVE_DEBOUNCE_MS = 300;

export default function MapExplorer({ initialCafes, query, tags }: Props) {
  // Which surface is showing below `lg`. Held in the URL rather than component
  // state, the way Fresha does it (`?mode=map`): the browser Back button
  // returns from the map to the list, and a map view can be linked. At `lg`
  // and up both panes are on screen and this is ignored.
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isMapView = searchParams.get("view") === "map";

  const setView = useCallback(
    (view: "list" | "map") => {
      const next = new URLSearchParams(searchParams.toString());
      if (view === "map") next.set("view", "map");
      else next.delete("view");
      const qs = next.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const [cafes, setCafes] = useState<CafeSummary[]>(initialCafes);
  const [selectedCafeId, setSelectedCafeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchFailed, setFetchFailed] = useState(false);
  const [focusPoint, setFocusPoint] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const [filterOpen, setFilterOpen] = useState(false);
  const [activeSort, setActiveSort] = useState<SortId>("nearby");
  const [activeTags, setActiveTags] = useState<string[]>(tags ?? []);
  // "Search as I move the map". Off: panning only marks the area stale and
  // offers a "Search this area" button instead of refetching.
  const [searchOnMove, setSearchOnMove] = useState(true);
  const searchOnMoveRef = useRef(true);
  const [areaStale, setAreaStale] = useState(false);

  // Plain "Search" (no text, no tags) means "cafes near me" — recenter the
  // map on the user's location once resolved; the pan/zoom-driven fetch
  // below then takes over (20km radius once close enough, else viewport).
  useEffect(() => {
    if (query || (tags && tags.length > 0)) return;
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFocusPoint({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => {
        // Denied or unavailable — keep the default city-wide view.
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
    // Only ever attempt this once, for the initial proximity-based view.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the latest filters in a ref so the (stable) viewport handler passed
  // to the map never captures stale values.
  const tagsKey = activeTags.join(",");
  const filtersRef = useRef<{ query?: string; tagsKey: string; sort: SortId }>({
    query,
    tagsKey,
    sort: "nearby",
  });
  useEffect(() => {
    filtersRef.current = { ...filtersRef.current, query, tagsKey };
  }, [query, tagsKey]);

  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // The most recent viewport reported by the map, so applying filters can
  // immediately re-fetch the area the user is currently looking at.
  const lastViewportRef = useRef<MapViewport | null>(null);

  const fetchForViewport = useCallback((viewport: MapViewport) => {
    const params = new URLSearchParams();
    const { query: q, tagsKey: tk, sort } = filtersRef.current;
    if (q) params.set("q", q);
    if (tk) params.set("tags", tk);
    // Previously the chosen sort never left the modal's local state.
    if (sort && sort !== "nearby") params.set("sort", sort);

    if (viewportRadiusMeters(viewport) <= RADIUS_METERS) {
      // Zoomed in: fetch a fixed 20 km radius around the map center.
      params.set("mode", "radius");
      params.set("lat", String(viewport.center.lat));
      params.set("lng", String(viewport.center.lng));
      params.set("radius", String(RADIUS_METERS));
    } else {
      // Zoomed out: fetch everything inside the visible bounds.
      params.set("mode", "viewport");
      params.set("minLat", String(viewport.bounds.south));
      params.set("minLng", String(viewport.bounds.west));
      params.set("maxLat", String(viewport.bounds.north));
      params.set("maxLng", String(viewport.bounds.east));
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);

    fetch(`/api/map/cafes?${params.toString()}`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data: { cafes: CafeSummary[] }) => {
        setCafes(data.cafes);
        setFetchFailed(false);
      })
      .catch((err) => {
        // On abort we keep the previous list — a newer request is in flight.
        if (err?.name === "AbortError") return;
        // Any other failure previously fell off the end of this handler: the
        // spinner cleared, the stale pin set stayed on screen, and the header
        // kept claiming "N cafes in view" for an area that was never queried.
        console.error("[map] viewport fetch failed", err);
        setFetchFailed(true);
      })
      .finally(() => {
        if (abortRef.current === controller) setLoading(false);
      });
  }, []);

  const handleViewportChange = useCallback(
    (viewport: MapViewport) => {
      lastViewportRef.current = viewport;
      if (!searchOnMoveRef.current) {
        setAreaStale(true);
        return;
      }
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(
        () => fetchForViewport(viewport),
        MOVE_DEBOUNCE_MS,
      );
    },
    [fetchForViewport],
  );

  const applyFilters = useCallback(
    (nextTags: string[]) => {
      setActiveTags(nextTags);
      // Update the ref synchronously so the immediate re-fetch below picks up
      // the new tags without waiting for the syncing effect to run.
      filtersRef.current = { ...filtersRef.current, query, tagsKey: nextTags.join(",") };
      setFilterOpen(false);
      if (lastViewportRef.current) fetchForViewport(lastViewportRef.current);
    },
    [query, fetchForViewport],
  );

  const applySort = useCallback(
    (sort: SortId) => {
      setActiveSort(sort);
      filtersRef.current = { ...filtersRef.current, sort };
      if (lastViewportRef.current) fetchForViewport(lastViewportRef.current);
    },
    [fetchForViewport],
  );

  const searchThisArea = useCallback(() => {
    setAreaStale(false);
    if (lastViewportRef.current) fetchForViewport(lastViewportRef.current);
  }, [fetchForViewport]);

  const clearFilters = useCallback(() => {
    setActiveTags([]);
    filtersRef.current = { ...filtersRef.current, query, tagsKey: "" };
    setFilterOpen(false);
    if (lastViewportRef.current) fetchForViewport(lastViewportRef.current);
  }, [query, fetchForViewport]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      abortRef.current?.abort();
    };
  }, []);

  const mappable = cafes.filter((c) => hasValidCoordinates(c.lat, c.lng));
  const activeFilterCount = activeTags.length;

  // Scroll the list to the card whose pin was clicked.
  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!selectedCafeId) return;
    listRef.current
      ?.querySelector(`[data-cafe-id="${selectedCafeId}"]`)
      ?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selectedCafeId]);

  const previewCount = useCallback(
    (draft: string[]) => {
      // The loaded set is already narrowed by the applied tags, so it can only
      // preview a draft that keeps all of them.
      if (!activeTags.every((t) => draft.includes(t))) return null;
      return mappable.filter((c) => draft.every((t) => c.tags.includes(t))).length;
    },
    [activeTags, mappable],
  );

  const displayHeading = query
    ? `“${query}”`
    : activeTags.length > 0
      ? activeTags.join(", ")
      : null;

  const countLine = `${mappable.length} ${mappable.length === 1 ? "cafe" : "cafes"} in this area`;

  const filterButton = (
    <button
      type="button"
      onClick={() => setFilterOpen(true)}
      className="flex h-10 shrink-0 items-center gap-2 rounded-full border border-line-strong bg-white px-4 text-sm font-medium text-ink transition-colors hover:border-ink"
    >
      <FunnelSimple size={16} weight="bold" />
      Filters
      {activeFilterCount > 0 ? (
        <span className="flex size-5 items-center justify-center rounded-full bg-ink text-[11px] font-semibold text-white">
          {activeFilterCount}
        </span>
      ) : null}
    </button>
  );

  return (
    <div className="relative flex h-full w-full flex-col lg:flex-row">
      <div
        className={cn(
          "w-full flex-col lg:flex lg:h-full lg:w-[520px] lg:shrink-0 lg:border-r lg:border-line xl:w-[600px]",
          isMapView ? "hidden" : "flex h-full",
        )}
      >
        <div className="shrink-0 border-b border-line px-4 pt-5 sm:px-6">
          {displayHeading ? (
            <h1 className="mb-3 truncate text-lg font-semibold text-ink">
              {displayHeading}
            </h1>
          ) : (
            <h1 className="sr-only">Cafe map</h1>
          )}
          <div className="flex items-center gap-3">
            {filterButton}
            <p className="min-w-0 truncate text-sm text-muted" aria-live="polite">
              {loading ? "Updating…" : countLine}
            </p>
          </div>
          <div role="tablist" aria-label="Sort" className="no-scrollbar -mb-px mt-4 flex gap-5 overflow-x-auto">
            {SORT_OPTIONS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={activeSort === id}
                onClick={() => applySort(id)}
                className={cn(
                  "shrink-0 border-b-2 pb-3 text-sm font-medium transition-colors",
                  activeSort === id
                    ? "border-ink text-ink"
                    : "border-transparent text-muted hover:text-ink",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-4 pb-24 sm:px-6 lg:pb-6">
          {fetchFailed ? (
            <div role="status" className="mb-4 flex items-center justify-between gap-3 rounded-xl bg-subtle px-4 py-3 text-sm text-body">
              Couldn&apos;t update results for this area.
              <button type="button" onClick={searchThisArea} className="font-semibold text-ink underline underline-offset-4">
                Retry
              </button>
            </div>
          ) : null}
          {mappable.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-16 text-center">
              <MapTrifold size={32} className="text-line-strong" />
              <p className="mt-4 text-sm font-semibold text-ink">No cafes in this area</p>
              <p className="mt-1 max-w-xs text-sm text-muted">
                Zoom out or move the map{activeFilterCount > 0 ? ", or clear your filters" : ""}.
              </p>
              {activeFilterCount > 0 ? (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-4 h-10 rounded-full border border-ink px-4 text-sm font-semibold text-ink hover:bg-subtle"
                >
                  Clear filters
                </button>
              ) : null}
            </div>
          ) : (
            <ul className="flex flex-col gap-3">
              {mappable.map((cafe, index) => (
                <li key={cafe.id} data-cafe-id={cafe.id}>
                  <MapListCard
                    cafe={cafe}
                    priority={index < 3}
                    selected={selectedCafeId === cafe.id}
                    onHover={() => setSelectedCafeId(cafe.id)}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div
        className={cn(
          "relative w-full min-w-0 flex-1 lg:block lg:h-full",
          isMapView ? "block h-full" : "hidden",
        )}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-2 p-3">
          <label className="pointer-events-auto flex h-10 cursor-pointer items-center gap-2 rounded-full bg-white px-3.5 text-sm font-medium text-ink shadow-raise">
            <input
              type="checkbox"
              checked={searchOnMove}
              onChange={(e) => {
                setSearchOnMove(e.target.checked);
                searchOnMoveRef.current = e.target.checked;
                if (e.target.checked && areaStale) searchThisArea();
              }}
              className="size-4 accent-[var(--color-brand)]"
            />
            Search as I move the map
          </label>
          <div className="pointer-events-auto lg:hidden">{filterButton}</div>
        </div>

        {areaStale && !searchOnMove ? (
          <div className="absolute inset-x-0 top-16 z-10 flex justify-center">
            <button
              type="button"
              onClick={searchThisArea}
              className="flex h-10 items-center gap-2 rounded-full bg-ink px-4 text-sm font-semibold text-white shadow-float"
            >
              <ArrowClockwise size={16} weight="bold" />
              Search this area
            </button>
          </div>
        ) : loading ? (
          <div className="pointer-events-none absolute inset-x-0 top-16 z-10 flex justify-center">
            <div className="flex items-center gap-2 rounded-full bg-white px-3.5 py-2 text-xs font-medium text-muted shadow-raise">
              <LoadingDots className="text-brand" label="Updating results" />
              Updating
            </div>
          </div>
        ) : null}

        <CafeMap
          cafes={mappable}
          selectedCafeId={selectedCafeId}
          onSelectCafe={setSelectedCafeId}
          onViewportChange={handleViewportChange}
          flyToPoint={focusPoint}
        />
      </div>

      {/* One surface at a time below `lg`; this pill swaps them. The view
          lives in the URL so Back returns from the map to the list. */}
      <button
        type="button"
        onClick={() => setView(isMapView ? "list" : "map")}
        className="fixed bottom-[calc(1.25rem+env(safe-area-inset-bottom))] left-1/2 z-30 flex h-12 -translate-x-1/2 items-center gap-2 rounded-full bg-ink px-5 text-sm font-semibold text-white shadow-float lg:hidden"
      >
        {isMapView ? <ListBullets size={18} weight="bold" /> : <MapTrifold size={18} weight="bold" />}
        {isMapView ? "Show list" : "Show map"}
      </button>

      {filterOpen ? (
        <MapFilterModal
          onClose={() => setFilterOpen(false)}
          initialTags={activeTags}
          onApply={applyFilters}
          onClearAll={clearFilters}
          previewCount={previewCount}
        />
      ) : null}
    </div>
  );
}

/** List row: photo left, text right. The active card (hovered, or whose pin
 * was clicked) is outlined. */
function MapListCard({
  cafe,
  priority,
  selected,
  onHover,
}: {
  cafe: CafeSummary;
  priority?: boolean;
  selected: boolean;
  onHover: () => void;
}) {
  const area = cafe.neighborhood ?? cafe.city;
  const status = getOpenStatus(cafe.operatingHours);
  return (
    <Link
      href={`/cafes/${cafe.id}`}
      onMouseEnter={onHover}
      onFocus={onHover}
      className={cn(
        "group flex gap-4 rounded-2xl border bg-white p-2.5 transition-colors",
        selected ? "border-ink ring-1 ring-ink" : "border-line hover:border-line-strong",
      )}
    >
      <div className="relative aspect-[4/3] w-32 shrink-0 overflow-hidden rounded-xl bg-subtle sm:w-40">
        {cafe.coverImage ? (
          <Image
            src={cafe.coverImage}
            alt=""
            fill
            priority={priority}
            sizes="160px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-line-strong">
            <Coffee size={28} />
          </div>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col py-1 pr-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate text-[15px] font-semibold text-ink">{cafe.name}</h3>
          {cafe.reviewCount > 0 ? (
            <span className="flex shrink-0 items-center gap-1 text-sm text-ink">
              <Star size={13} weight="fill" aria-hidden />
              {cafe.rating.toFixed(1)}
              <span className="text-muted">({cafe.reviewCount})</span>
            </span>
          ) : (
            <span className="shrink-0 text-sm text-muted">New</span>
          )}
        </div>
        {area ? <p className="mt-0.5 truncate text-sm text-muted">{area}</p> : null}
        {status ? (
          <p className="mt-0.5 truncate text-sm text-muted">
            <span className={cn("font-medium", status.isOpen ? "text-open" : "text-closed")}>
              {status.isOpen ? "Open" : "Closed"}
            </span>
            {status.detail ? ` · ${status.detail}` : null}
          </p>
        ) : null}
        {cafe.tags.length > 0 ? (
          <p className="mt-auto truncate pt-2 text-xs text-muted">
            {cafe.tags.slice(0, 3).join(" · ")}
          </p>
        ) : null}
      </div>
    </Link>
  );
}
