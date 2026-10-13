import "server-only";
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "@/lib/env";

import { cache } from "react";
import { cacheLife } from "next/cache";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { isCafeId } from "./cafes";
import {
  countCupsByKind,
  cupHasKind,
  cupPhotoEntries,
  isMissingRpcError,
  legacyStats,
  mapCafeCupPhotosPayload,
  mapCafeCupsPayload,
  mapCupPublic,
  reviewToCup,
  type CafeCupPhotos,
  type CafeCups,
  type PublicCup,
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
      const read = (kindFilter: CupKind | null, readLimit: number, readOffset: number) =>
        supabase.rpc("get_cafe_cups", {
          p_cafe_id: cafeId,
          p_sort: sort,
          p_rating_filter: rating,
          p_kind_filter: kindFilter,
          p_limit: Math.min(Math.max(readLimit, 1), 100),
          p_offset: Math.max(readOffset, 0),
          p_photo_limit: 0,
        });
      const { data, error } = await read(kind, limit, offset);
      if (!error) {
        if (!data) return empty;
        const cups = mapCafeCupsPayload(data as Record<string, unknown>);
        // Since Cups step 5 (the stats carry *_cup_count) the server's kind
        // filter matches typed items only, so its answer stands. Before it,
        // the server counted a legacy photo as coffee, which nobody said it
        // was: read its matches (up to 100) and keep the cups where someone
        // actually put that kind, then page through those.
        if (!kind || cups.stats.kindCupCounts !== null) return cups;
        const all = await read(kind, 100, 0);
        if (all.error) throw all.error;
        const wide = mapCafeCupsPayload((all.data ?? {}) as Record<string, unknown>);
        const matching = wide.cards.filter((card) => cupHasKind(card, kind));
        const start = Math.max(offset, 0);
        const cards = matching.slice(start, start + limit);
        return {
          ...wide,
          cards,
          total: matching.length,
          hasMore: start + cards.length < matching.length,
        };
      }
      if (!isMissingRpcError(error)) throw error;
    }

    return legacyCafeCups(supabase, cafeId, legacy, { sort, rating, kind, limit, offset });
  },
);

/** Reviews as cups. Legacy reviews have photos but no kinds or names, so
 * their photos stay untyped. */
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

  // Legacy reviews have photos but no kinds, so no kind matches.
  if (kind) {
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

/**
 * For the kind chips: how many of a cafe's cups (visits) contain each kind,
 * counting only what posters typed (legacy photos are untyped). The server
 * counts them since Cups step 5 (`*_cup_count`); before it they're counted
 * from the newest 100 cups, which is every cup on every cafe today. All zero
 * in the legacy fallback, so no chips show.
 */
export const getCafeCupKindCounts = cache(
  async (
    cafeId: string,
    legacy: { rating: number; reviewCount: number },
  ): Promise<Record<CupKind, number>> => {
    "use cache";
    cacheLife("hours");
    const head = await getCafeCups(cafeId, legacy);
    if (head.stats.kindCupCounts) return head.stats.kindCupCounts;
    const cups = await getCafeCups(cafeId, legacy, { sort: "recent", limit: 100 });
    return countCupsByKind(cups.cards);
  },
);

export const CUP_PHOTOS_TRAY_LIMIT = 30;
export const CUP_PHOTOS_PAGE_SIZE = 24;

/**
 * Every public photo of a cafe's cups, newest first, each with its visit's
 * stars and note (`get_cafe_cup_photos`; a moderated cup or hidden photo is
 * left out by the server). Without the Cups RPCs: the photos of the visible
 * reviews, untyped. A kind filter matches typed photos only.
 */
export const getCafeCupPhotos = cache(
  async (
    cafeId: string,
    legacy: { rating: number; reviewCount: number },
    { kind = null, limit = CUP_PHOTOS_TRAY_LIMIT, offset = 0 }: {
      kind?: CupKind | null;
      limit?: number;
      offset?: number;
    } = {},
  ): Promise<CafeCupPhotos> => {
    "use cache";
    cacheLife("hours");
    const none: CafeCupPhotos = { photos: [], total: 0, hasMore: false };
    if (!isCafeId(cafeId)) return none;
    if (forceFailure()) {
      throw { code: "57014", message: "NOOK_CUPS_FAIL: simulated statement timeout" };
    }

    if (!forceLegacy()) {
      const supabase = createAnonClient();
      const { data, error } = await supabase.rpc("get_cafe_cup_photos", {
        p_cafe_id: cafeId,
        p_kind_filter: kind,
        p_limit: Math.min(Math.max(limit, 1), 100),
        p_offset: Math.max(offset, 0),
      });
      if (!error) {
        if (!data) return none;
        const page = mapCafeCupPhotosPayload(data as Record<string, unknown>);
        // Before Cups step 5 a legacy photo matched "coffee"; its kind is
        // dropped by the mapper, so drop it from a filtered page too.
        return kind ? { ...page, photos: page.photos.filter((p) => p.kind === kind) } : page;
      }
      if (!isMissingRpcError(error)) throw error;
    }

    if (kind) return none;
    const cups = await getCafeCups(cafeId, legacy, { sort: "recent", limit: 100 });
    const all = cups.cards.flatMap(cupPhotoEntries);
    const start = Math.max(offset, 0);
    const photos = all.slice(start, start + limit);
    return { photos, total: all.length, hasMore: start + photos.length < all.length };
  },
);

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * One public cup for its share page, `/cups/<id>` (nook-supabase
 * docs/SHARE_CUP_STORY.md §6). Reads `get_cup_public`, which accepts a cup
 * id, a legacy review id, a photo-day id or an old id since copied, and
 * answers null for anything not public. Short-cached: a cup hidden by
 * moderation must leave the page within minutes.
 *
 * Until that RPC exists, the cup is found through what anon can already
 * read: a visible `cups` row (by id or by the review it was copied from) or
 * a visible review gives the cafe, and the cafe's `get_cafe_cups` — which
 * applies every visibility rule — must list it. Photo-day ids can't be
 * resolved that way and 404.
 */
export const getCupPublic = cache(async (id: string): Promise<PublicCup | null> => {
  "use cache";
  cacheLife({ stale: 60, revalidate: 300, expire: 3600 });
  if (!UUID.test(id)) return null;
  const supabase = createAnonClient();

  if (!forceLegacy()) {
    const { data, error } = await supabase.rpc("get_cup_public", { p_cup_id: id });
    if (!error) return mapCupPublic(data as Record<string, unknown> | null);
    if (!isMissingRpcError(error)) throw error;
  }

  // Fallback. Which cafe, and which ids can this visit appear under?
  const ids = new Set([id]);
  let cafeId: string | null = null;
  const cupRow = await supabase
    .from("cups")
    .select("id, cafe_id, legacy_review_id")
    .or(`id.eq.${id},legacy_review_id.eq.${id}`)
    .limit(1)
    .maybeSingle();
  // The cups table itself is missing too: only reviews can be found.
  if (cupRow.error && cupRow.error.code !== "42P01" && cupRow.error.code !== "PGRST205") {
    throw cupRow.error;
  }
  if (cupRow.data) {
    cafeId = cupRow.data.cafe_id as string;
    ids.add(cupRow.data.id as string);
    if (cupRow.data.legacy_review_id) ids.add(cupRow.data.legacy_review_id as string);
  } else {
    const review = await supabase
      .from("reviews")
      .select("id, cafe_id")
      .eq("id", id)
      .eq("moderation_status", "visible")
      .maybeSingle();
    if (review.error) throw review.error;
    if (review.data) cafeId = review.data.cafe_id as string;
  }
  if (!cafeId) return null;

  const cafe = await supabase
    .from("cafes")
    .select("id, name, neighborhood, city, featured_image_url, rating, review_count")
    .eq("id", cafeId)
    .eq("status", "active")
    .maybeSingle();
  if (cafe.error) throw cafe.error;
  if (!cafe.data) return null;

  const cups = await getCafeCups(
    cafeId,
    { rating: Number(cafe.data.rating ?? 0), reviewCount: Number(cafe.data.review_count ?? 0) },
    { sort: "recent", limit: 100 },
  );
  const card = cups.cards.find(
    (c) => ids.has(c.id) || (c.reviewId !== null && ids.has(c.reviewId)),
  );
  if (!card) return null;
  return {
    cup: card,
    cafe: {
      id: cafe.data.id as string,
      name: String(cafe.data.name).trim(),
      area:
        [cafe.data.neighborhood, cafe.data.city].filter(Boolean).join(", ") || null,
      featuredImageUrl: (cafe.data.featured_image_url as string | null) ?? null,
    },
  };
});
