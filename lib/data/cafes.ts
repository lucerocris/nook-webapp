import "server-only";
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "@/lib/env";

import { cache } from "react";
import { cacheLife } from "next/cache";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import type { CafeRpcRow, Database, MenuItemRpcRow } from "@/lib/supabase/types";
import {
  mapCafeDetails,
  mapCafeSummary,
  mapMenuItem,
  type CafeDetails,
  type CafeSummary,
  type MenuItem,
} from "./cafes-mappers";

type AnonClient = ReturnType<typeof createSupabaseClient<Database>>;

function createAnonClient(): AnonClient {
  return createSupabaseClient<Database>(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
}

const DEFAULT_LIMIT = 12;

/** Postgres rejects a malformed uuid with SQLSTATE 22P02 rather than returning
 * no rows, so `/cafes/not-a-uuid` used to throw out of the cached scope and
 * render the error boundary instead of a 404 — and it threw from
 * generateMetadata too, which runs outside Suspense and takes the whole route
 * down. Screen ids here so a bad URL is simply "not found". */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isCafeId(id: string): boolean {
  return UUID_RE.test(id);
}

const CAFE_DETAIL_SELECT = `
  id, created_at, name, description, address, neighborhood, city,
  lat, lng, featured_image_url, logo_url, photo_urls, rating, review_count,
  is_new, operating_hours, social_links, status, is_claimed,
  cafe_tags ( is_featured,
    tags!cafe_tags_tag_id_fkey ( id, name, category, created_at )
  )
`;

const CAFE_DETAIL_WITH_REVIEWS_SELECT = `${CAFE_DETAIL_SELECT},
  reviews ( id, cafe_id, user_id, rating, content, image_urls,
            created_at, updated_at, helpful_count, moderation_status,
            profile:profiles!reviews_user_id_fkey ( username, full_name, avatar_url ) )
`;

export type HomeFeed = {
  featuredCafes: CafeSummary[];
  newestCafes: CafeSummary[];
  trendingCafes: CafeSummary[];
  topRatedCafes: CafeSummary[];
  nearbyCafes: CafeSummary[];
};

export type GetHomeFeedArgs = {
  userId?: string;
  lat?: number;
  lng?: number;
  limit?: number;
};

async function fetchCafesBySort(
  supabase: AnonClient,
  sort: string,
  args: GetHomeFeedArgs,
): Promise<CafeRpcRow[]> {
  const { data, error } = await supabase.rpc("get_cafes", {
    p_query: null,
    p_user_id: args.userId ?? null,
    p_sort: sort,
    p_tag_names: null,
    p_lat: args.lat ?? null,
    p_lng: args.lng ?? null,
    p_limit: args.limit ?? DEFAULT_LIMIT,
    p_offset: 0,
  });
  if (error) throw error;
  return (data ?? []) as unknown as CafeRpcRow[];
}

export const getHomeFeed = cache(
  async (args: GetHomeFeedArgs = {}): Promise<HomeFeed> => {
    "use cache";
    cacheLife("hours");

    const supabase = createAnonClient();
    const includeNearby =
      typeof args.lat === "number" && typeof args.lng === "number";

    const [topRated, trending, newest, nearby] = await Promise.all([
      fetchCafesBySort(supabase, "top_rated", args),
      fetchCafesBySort(supabase, "trending", args),
      fetchCafesBySort(supabase, "newest", args),
      includeNearby
        ? fetchCafesBySort(supabase, "nearby", args)
        : Promise.resolve([] as CafeRpcRow[]),
    ]);

    const topRatedCafes = topRated.map(mapCafeSummary);
    const trendingCafes = trending.map(mapCafeSummary);
    const newestCafes = newest.map(mapCafeSummary);
    const nearbyCafes = nearby.map(mapCafeSummary);

    const seen = new Set<string>();
    const featuredCafes = [
      ...topRatedCafes,
      ...trendingCafes,
      ...newestCafes,
      ...nearbyCafes,
    ]
      .filter((cafe) => {
        if (!cafe.isFeatured) return false;
        if (seen.has(cafe.id)) return false;
        seen.add(cafe.id);
        return true;
      })
      .slice(0, DEFAULT_LIMIT);

    return {
      featuredCafes,
      newestCafes,
      trendingCafes,
      topRatedCafes,
      nearbyCafes,
    };
  },
);

/** Upper bound on reviews fetched with a cafe. The embed was previously
 * unordered and unlimited, so a popular cafe pulled every review row (with
 * content, images and a joined profile) into an hours-long cache entry, only
 * for the page to display the first four in arbitrary order. */
export const DEFAULT_REVIEW_LIMIT = 4;
export const MAX_REVIEW_LIMIT = 50;

export type GetCafeByIdArgs = {
  includeReviews?: boolean;
  /** How many of the newest reviews to embed. Clamped to MAX_REVIEW_LIMIT. */
  reviewLimit?: number;
};

export const getCafeById = cache(
  async (
    id: string,
    {
      includeReviews = true,
      reviewLimit = DEFAULT_REVIEW_LIMIT,
    }: GetCafeByIdArgs = {},
  ): Promise<CafeDetails | null> => {
    "use cache";
    cacheLife("hours");

    if (!isCafeId(id)) return null;

    const supabase = createAnonClient();
    const select = includeReviews
      ? CAFE_DETAIL_WITH_REVIEWS_SELECT
      : CAFE_DETAIL_SELECT;

    let query = supabase.from("cafes").select(select).eq("id", id);

    // Moderated reviews must never reach the client. `moderation_status` was
    // being selected and mapped but never filtered, so reviews a moderator had
    // hidden or removed kept rendering — and stayed cached for hours.
    if (includeReviews) {
      const limit = Math.min(Math.max(reviewLimit, 1), MAX_REVIEW_LIMIT);
      query = query
        .eq("reviews.moderation_status", "visible")
        // Newest first and bounded — otherwise the embed is both unordered
        // (the 4 shown were arbitrary) and unbounded.
        .order("created_at", { referencedTable: "reviews", ascending: false })
        .limit(limit, { referencedTable: "reviews" });
    }

    const { data, error } = await query.single();

    // Distinguish "no such cafe" from a real failure. PGRST116 is PostgREST's
    // no-rows-returned code; everything else (outage, rotated key, bad select)
    // must surface as an error rather than masquerading as a 404.
    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }
    return mapCafeDetails(data as never);
  },
);

export type SitemapCafe = { id: string; lastModified: string | null };

/** Minimal id/created_at list for app/sitemap.ts — deliberately narrow so the
 * sitemap never pulls full cafe payloads. Note `cafes` has no `updated_at`
 * column, so created_at is the best available lastModified signal. */
export const getSitemapCafes = cache(async (): Promise<SitemapCafe[]> => {
  "use cache";
  cacheLife("hours");

  const supabase = createAnonClient();
  const { data, error } = await supabase
    .from("cafes")
    .select("id, created_at")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(5000);

  if (error) throw error;
  return ((data ?? []) as { id: string; created_at: string | null }[]).map(
    (row) => ({ id: row.id, lastModified: row.created_at }),
  );
});

export const getMenuItems = cache(
  async (cafeId: string): Promise<MenuItem[]> => {
    "use cache";
    cacheLife("hours");

    if (!isCafeId(cafeId)) return [];

    const supabase = createAnonClient();
    const { data, error } = await supabase.rpc("get_menu_items", {
      p_cafe_id: cafeId,
    });
    if (error) throw error;
    return (data ?? []).map((row: MenuItemRpcRow) => mapMenuItem(row));
  },
);

export { formatDistance, formatPrice } from "@/lib/utils/format";
