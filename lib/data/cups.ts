import "server-only";
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "@/lib/env";

import { cache } from "react";
import { cacheLife } from "next/cache";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { isCafeId } from "./cafes";
import {
  isMissingRpcError,
  legacyStats,
  mapCafeCupsPayload,
  reviewToCup,
  type CafeCups,
  type CupKind,
  type CupSort,
  type LegacyReviewRow,
} from "./cups-mappers";

/** Cached fetchers can't read cookies, so this is the session-less client
 * (the same pattern as lib/data/cafes.ts). */
function createAnonClient() {
  return createSupabaseClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export const CUPS_SECTION_LIMIT = 4;
export const CUPS_PAGE_SIZE = 20;

export type CafeCupsArgs = {
  sort?: CupSort;
  rating?: number | null;
  kind?: CupKind | null;
  limit?: number;
  offset?: number;
};

/** Development only: `NOOK_CUPS_LEGACY=1` answers from the legacy reviews
 * path even when the Cups RPCs exist, to check the fallback by eye. */
function forceLegacy(): boolean {
  return process.env.NODE_ENV !== "production" && process.env.NOOK_CUPS_LEGACY === "1";
}

/** Development only: `NOOK_CUPS_FAIL=1` makes the read fail with a
 * non-"missing function" error, to check the cafe page's failed-section
 * state by eye. */
function forceFailure(): boolean {
  return process.env.NODE_ENV !== "production" && process.env.NOOK_CUPS_FAIL === "1";
}

/**
 * A cafe's cups (one per visit) through `get_cafe_cups`, or — where the
 * server doesn't have the Cups RPCs yet (PostgREST PGRST202) — its visible
 * reviews read as cups, so the page works before and after the migrations
 * (nook-supabase docs/CUPS_APPLY.md). Any other error is thrown.
 */
export const getCafeCups = cache(
  async (
    cafeId: string,
    legacy: { rating: number; reviewCount: number },
    {
      sort = "recommended",
      rating = null,
      kind = null,
      limit = CUPS_SECTION_LIMIT,
      offset = 0,
    }: CafeCupsArgs = {},
  ): Promise<CafeCups> => {
    "use cache";
    cacheLife("hours");

    const empty: CafeCups = {
      mode: "legacy",
      stats: legacyStats([], 0, 0),
      cards: [],
      total: 0,
      hasMore: false,
    };
    if (!isCafeId(cafeId)) return empty;

    if (forceFailure()) {
      throw { code: "57014", message: "NOOK_CUPS_FAIL: simulated statement timeout" };
    }

    const supabase = createAnonClient();

    if (!forceLegacy()) {
      const { data, error } = await supabase.rpc("get_cafe_cups", {
        p_cafe_id: cafeId,
        p_sort: sort,
        p_rating_filter: rating,
        p_kind_filter: kind,
        p_limit: Math.min(Math.max(limit, 1), 100),
        p_offset: Math.max(offset, 0),
        p_photo_limit: 0,
      });
      if (!error) {
        return data ? mapCafeCupsPayload(data as Record<string, unknown>) : empty;
      }
      if (!isMissingRpcError(error)) throw error;
    }

    return legacyCafeCups(supabase, cafeId, legacy, { sort, rating, kind, limit, offset });
  },
);

/** Reviews as cups. Legacy reviews have photos but no kinds or names; the
 * Cups backend reads their photos as coffee, and so does this. */
async function legacyCafeCups(
  supabase: ReturnType<typeof createAnonClient>,
  cafeId: string,
  cafe: { rating: number; reviewCount: number },
  {
    sort,
    rating,
    kind,
    limit,
    offset,
  }: Required<Pick<CafeCupsArgs, "sort" | "limit" | "offset">> &
    Pick<CafeCupsArgs, "rating" | "kind">,
): Promise<CafeCups> {
  const statsRows = await supabase
    .from("reviews")
    .select("user_id, image_urls")
    .eq("cafe_id", cafeId)
    .eq("moderation_status", "visible");
  if (statsRows.error) throw statsRows.error;
  const stats = legacyStats(statsRows.data ?? [], cafe.rating, cafe.reviewCount);

  // Only coffee (photos) or all: legacy reviews have nothing else.
  if (kind && kind !== "coffee") {
    return { mode: "legacy", stats, cards: [], total: 0, hasMore: false };
  }

  let query = supabase
    .from("reviews")
    .select(
      `id, user_id, rating, content, image_urls, created_at, helpful_count,
       profile:profiles!reviews_user_id_fkey ( username, full_name, avatar_url )`,
      { count: "exact" },
    )
    .eq("cafe_id", cafeId)
    .eq("moderation_status", "visible");
  if (rating) query = query.eq("rating", rating);
  if (kind === "coffee") query = query.not("image_urls", "eq", "{}");
  query =
    sort === "highest"
      ? query.order("rating", { ascending: false }).order("created_at", { ascending: false })
      : sort === "helpful"
        ? query
            .order("helpful_count", { ascending: false })
            .order("created_at", { ascending: false })
        : query.order("created_at", { ascending: false });

  const { data, error, count } = await query.range(offset, offset + limit - 1);
  if (error) throw error;
  const cards = ((data ?? []) as unknown as LegacyReviewRow[]).map(reviewToCup);
  const total = count ?? cards.length;
  return {
    mode: "legacy",
    stats,
    cards,
    total,
    hasMore: offset + cards.length < total,
  };
}
