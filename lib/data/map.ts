import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import type { CafeRpcRow, Database } from "@/lib/supabase/types";
import { mapCafeSummary, type CafeSummary } from "./cafes-mappers";
import type { MapBounds } from "@/lib/utils/maps";

type AnonClient = ReturnType<typeof createSupabaseClient<Database>>;

// A bare, session-less client. These map fetchers are viewport-driven and
// change on every pan/zoom, so they are intentionally NOT wrapped in
// `"use cache"` — caching by bounds would never hit.
function createAnonClient(): AnonClient {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
}

// Fetch everything within the area — the map wants all pins, not a ranked page.
const MAP_LIMIT = 1000;

export type MapFetchFilters = {
  query?: string;
  tagNames?: string[];
  /** Matches MapFilterModal's SortId. `nearby` is the RPC default (null). */
  sort?: "nearby" | "top_rated" | "trending" | "newest";
};

const SORTS = ["nearby", "top_rated", "trending", "newest"] as const;

function normalizeFilters(filters: MapFetchFilters) {
  const query = filters.query?.trim() ? filters.query.trim() : null;
  const tagNames =
    filters.tagNames && filters.tagNames.length > 0 ? filters.tagNames : null;
  // p_sort was hardcoded to null, so the modal's sort selection did nothing:
  // picking "Top Rated" closed the modal, refetched, and returned the same
  // order. "nearby" stays null because that is the RPC's own default ordering.
  const sort =
    filters.sort && filters.sort !== "nearby" && SORTS.includes(filters.sort)
      ? filters.sort
      : null;
  return { query, tagNames, sort };
}

/** Cafes within `radiusMeters` of a point — used when the map is zoomed in
 * enough that the whole viewport fits inside the radius. */
export async function getCafesNearPoint(
  lat: number,
  lng: number,
  radiusMeters: number,
  filters: MapFetchFilters = {},
): Promise<CafeSummary[]> {
  const supabase = createAnonClient();
  const { query, tagNames, sort } = normalizeFilters(filters);
  const { data, error } = await supabase.rpc("get_cafes_near_point", {
    p_lat: lat,
    p_lng: lng,
    p_radius_meters: radiusMeters,
    p_user_id: null,
    p_sort: sort,
    p_tag_names: tagNames,
    p_query: query,
    p_limit: MAP_LIMIT,
    p_offset: 0,
  });
  if (error) throw error;
  return ((data ?? []) as unknown as CafeRpcRow[]).map(mapCafeSummary);
}

/** Every cafe whose location falls inside the visible bounds — used when the
 * map is zoomed out beyond the fixed radius. */
export async function getCafesInViewport(
  bounds: MapBounds,
  filters: MapFetchFilters = {},
): Promise<CafeSummary[]> {
  const supabase = createAnonClient();
  const { query, tagNames, sort } = normalizeFilters(filters);
  const { data, error } = await supabase.rpc("get_cafes_in_viewport", {
    p_min_lat: bounds.south,
    p_min_lng: bounds.west,
    p_max_lat: bounds.north,
    p_max_lng: bounds.east,
    p_user_id: null,
    p_lat: null,
    p_lng: null,
    p_sort: sort,
    p_tag_names: tagNames,
    p_query: query,
    p_limit: MAP_LIMIT,
    p_offset: 0,
  });
  if (error) throw error;
  return ((data ?? []) as unknown as CafeRpcRow[]).map(mapCafeSummary);
}
