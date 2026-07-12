"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FunnelSimple } from "@phosphor-icons/react/dist/ssr";

import CafeCard from "./CafeCard";
import CafeMap from "./CafeMap";
import LoadingDots from "./LoadingDots";
import MapFilterModal, { type SortId } from "./MapFilterModal";
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
  const [cafes, setCafes] = useState<CafeSummary[]>(initialCafes);
  const [selectedCafeId, setSelectedCafeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [focusPoint, setFocusPoint] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const [filterOpen, setFilterOpen] = useState(false);
  const [activeSort, setActiveSort] = useState<SortId>("nearby");
  const [activeTags, setActiveTags] = useState<string[]>(tags ?? []);

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
  const filtersRef = useRef({ query, tagsKey });
  useEffect(() => {
    filtersRef.current = { query, tagsKey };
  }, [query, tagsKey]);

  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // The most recent viewport reported by the map, so applying filters can
  // immediately re-fetch the area the user is currently looking at.
  const lastViewportRef = useRef<MapViewport | null>(null);

  const fetchForViewport = useCallback((viewport: MapViewport) => {
    const params = new URLSearchParams();
    const { query: q, tagsKey: tk } = filtersRef.current;
    if (q) params.set("q", q);
    if (tk) params.set("tags", tk);

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
      })
      .catch((err) => {
        // On abort we keep the previous list; other errors leave it untouched.
        if (err?.name === "AbortError") return;
      })
      .finally(() => {
        if (abortRef.current === controller) setLoading(false);
      });
  }, []);

  const handleViewportChange = useCallback(
    (viewport: MapViewport) => {
      lastViewportRef.current = viewport;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(
        () => fetchForViewport(viewport),
        MOVE_DEBOUNCE_MS,
      );
    },
    [fetchForViewport],
  );

  const applyFilters = useCallback(
    (sort: SortId, nextTags: string[]) => {
      setActiveSort(sort);
      setActiveTags(nextTags);
      // Update the ref synchronously so the immediate re-fetch below picks up
      // the new tags without waiting for the syncing effect to run.
      filtersRef.current = { query, tagsKey: nextTags.join(",") };
      setFilterOpen(false);
      if (lastViewportRef.current) fetchForViewport(lastViewportRef.current);
    },
    [query, fetchForViewport],
  );

  const clearFilters = useCallback(() => {
    setActiveSort("nearby");
    setActiveTags([]);
    filtersRef.current = { query, tagsKey: "" };
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

  // Derive the heading from the live filter state so applying/clearing tags in
  // the modal keeps it in sync. Same formats as the server-rendered heading.
  const displayHeading = query
    ? `Cafes matching "${query}"`
    : activeTags.length > 0
      ? `Cafes tagged ${activeTags.map((t) => `"${t}"`).join(", ")}`
      : "Explore cafes on the map";

  return (
    <div className="flex h-full w-full flex-col lg:flex-row">
      <div className="flex w-full flex-col overflow-y-auto lg:h-full lg:w-1/2">
        <div className="flex shrink-0 items-start justify-between gap-3 px-6 pb-3 pt-8 sm:px-8">
          <div>
            <h1 className="text-lg font-semibold text-[#101514]">
              {displayHeading}
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              {mappable.length} {mappable.length === 1 ? "cafe" : "cafes"} in
              view
            </p>
          </div>
          <button
            type="button"
            onClick={() => setFilterOpen(true)}
            className="flex shrink-0 items-center gap-2 rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-[#3b3b3b] transition-colors hover:bg-zinc-50"
          >
            <FunnelSimple size={18} weight="bold" />
            Filters
            {activeFilterCount > 0 ? (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#3A5A40] px-1.5 text-xs font-semibold text-white">
                {activeFilterCount}
              </span>
            ) : null}
          </button>
        </div>

        {mappable.length === 0 ? (
          <p className="px-6 py-8 text-sm text-zinc-500 sm:px-8">
            No cafes in this area. Try zooming out or moving the map.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-5 px-6 pb-8 sm:px-8">
            {mappable.map((cafe, index) => (
              <div
                key={cafe.id}
                className={[
                  "rounded-2xl transition-shadow",
                  selectedCafeId === cafe.id
                    ? "ring-2 ring-[#3A5A40] ring-offset-2"
                    : "",
                ].join(" ")}
              >
                <CafeCard cafe={cafe} priority={index < 2} variant="map" />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="h-[45vh] w-full shrink-0 p-4 sm:p-6 lg:h-full lg:w-1/2">
        <div className="relative h-full w-full overflow-hidden rounded-2xl border border-zinc-200 shadow-sm">
          {loading ? (
            <div className="pointer-events-none absolute inset-x-0 top-3 z-10 flex justify-center">
              <div className="flex items-center gap-2 rounded-full bg-white/95 px-3.5 py-2 text-xs font-medium text-zinc-500 shadow-md ring-1 ring-zinc-200/70 backdrop-blur">
                <LoadingDots className="text-[#3A5A40]" label="Updating results" />
                <span>Updating</span>
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
      </div>

      {filterOpen ? (
        <MapFilterModal
          onClose={() => setFilterOpen(false)}
          initialSort={activeSort}
          initialTags={activeTags}
          onApply={applyFilters}
          onClearAll={clearFilters}
        />
      ) : null}
    </div>
  );
}
