import "server-only";

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
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
}

const DEFAULT_LIMIT = 12;

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

export type GetCafeByIdArgs = {
  userId?: string;
  includeReviews?: boolean;
};

export const getCafeById = cache(
  async (
    id: string,
    { includeReviews = true }: GetCafeByIdArgs = {},
  ): Promise<CafeDetails | null> => {
    "use cache";
    cacheLife("hours");

    const supabase = createAnonClient();
    const select = includeReviews
      ? CAFE_DETAIL_WITH_REVIEWS_SELECT
      : CAFE_DETAIL_SELECT;
    const { data, error } = await supabase
      .from("cafes")
      .select(select)
      .eq("id", id)
      .single();
    if (error) return null;
    return mapCafeDetails(data as never);
  },
);

export const getMenuItems = cache(
  async (cafeId: string): Promise<MenuItem[]> => {
    "use cache";
    cacheLife("hours");

    const supabase = createAnonClient();
    const { data, error } = await supabase.rpc("get_menu_items", {
      p_cafe_id: cafeId,
    });
    if (error) throw error;
    return (data ?? []).map((row: MenuItemRpcRow) => mapMenuItem(row));
  },
);

export function formatDistance(meters: number | null): string | null {
  if (meters == null) return null;
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

export function formatPrice(price: number): string {
  return `P${price.toFixed(2)}`;
}
