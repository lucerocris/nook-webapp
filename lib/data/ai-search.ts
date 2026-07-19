import "server-only";
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "@/lib/env";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/types";
import type { CafeSummary } from "./cafes-mappers";

type AnonClient = ReturnType<typeof createSupabaseClient<Database>>;

/** Bare client with no session. Deliberately NOT the cookie-based server client:
 * these calls are per-request and dynamic, so they never run inside `"use cache"`. */
function createAnonClient(): AnonClient {
  return createSupabaseClient<Database>(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
}

export type AiConversationMessage = {
  role: "user" | "assistant";
  content: string;
};

/** Shape returned by the `ask-ai` edge function. */
type AskAiEdgeResponse = {
  response?: string;
  recommendations?: { id: string; name: string; reason: string }[];
  error?: string;
};

/** A recommendation hydrated with the full cafe record for rendering. */
export type AiRecommendation = {
  reason: string;
  cafe: CafeSummary;
};

export type AskAiResult = {
  response: string;
  recommendations: AiRecommendation[];
};

export type AskAiArgs = {
  message: string;
  conversation?: AiConversationMessage[];
  /** Omit to search every city. Passing one narrows to an exact city match. */
  city?: string;
  /** How many cafes the model may consider. Defaults to the function's own. */
  limit?: number;
};

/** Only the columns needed for a CafeSummary — kept narrow so hydration stays cheap. */
const CAFE_SUMMARY_SELECT = `
  id, name, address, neighborhood, city, lat, lng,
  featured_image_url, photo_urls, rating, review_count, is_new, is_featured,
  cafe_tags ( tags!cafe_tags_tag_id_fkey ( name ) )
`;

/** Supabase nested relations come back as an object OR a one-element array
 * depending on the join — normalize, same as `asArray` in cafes-mappers. */
function asArray<T>(value: T | T[] | null | undefined): T[] {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

type RawCafeRow = {
  id: string;
  name: string;
  address: string;
  neighborhood: string | null;
  city: string | null;
  lat: number | null;
  lng: number | null;
  featured_image_url: string | null;
  photo_urls: string[] | null;
  rating: number | null;
  review_count: number | null;
  is_new: boolean | null;
  is_featured: boolean | null;
  cafe_tags: { tags: { name: string } | { name: string }[] | null }[] | null;
};

function mapRawCafe(row: RawCafeRow): CafeSummary {
  return {
    id: row.id,
    name: row.name,
    address: row.address,
    neighborhood: row.neighborhood,
    city: row.city,
    coverImage: row.featured_image_url,
    photoUrls: row.photo_urls ?? [],
    rating: row.rating ?? 0,
    reviewCount: row.review_count ?? 0,
    isNew: row.is_new ?? false,
    isFeatured: row.is_featured ?? false,
    isFavorited: false,
    tags: asArray(row.cafe_tags)
      .flatMap((join) => asArray(join.tags))
      .map((tag) => tag.name),
    lat: row.lat,
    lng: row.lng,
    distanceMeters: null,
  };
}

/**
 * Hydrate the `{ id, name, reason }` recommendations from `ask-ai` into full
 * cafe records so the UI can reuse the normal cafe row/card components.
 * One query for all ids, then re-ordered to preserve the AI's ranking.
 */
async function hydrateRecommendations(
  supabase: AnonClient,
  recommendations: { id: string; reason: string }[],
): Promise<AiRecommendation[]> {
  const ids = recommendations.map((rec) => rec.id).filter(Boolean);
  if (ids.length === 0) return [];

  const { data, error } = await supabase
    .from("cafes")
    .select(CAFE_SUMMARY_SELECT)
    .in("id", ids);

  // A hydration failure shouldn't blank the assistant's prose answer, but it
  // must not be invisible either — silently returning [] here is what made a
  // bad-id bug look like "the AI just didn't recommend anything".
  if (error) {
    console.error("[ask-ai] cafe hydration failed", error);
    return [];
  }

  const byId = new Map<string, CafeSummary>();
  for (const row of (data ?? []) as unknown as RawCafeRow[]) {
    byId.set(row.id, mapRawCafe(row));
  }

  // Preserve the model's ranking; drop ids that no longer resolve.
  const hydrated = recommendations.flatMap((rec) => {
    const cafe = byId.get(rec.id);
    return cafe ? [{ reason: rec.reason, cafe }] : [];
  });

  if (hydrated.length < recommendations.length) {
    console.warn(
      `[ask-ai] ${recommendations.length - hydrated.length} of ` +
        `${recommendations.length} recommendations did not resolve to a cafe`,
    );
  }

  return hydrated;
}

/** The `ask-ai` function returns HTTP 200 with this exact prose when its own
 * `parseGeminiResponse` falls through. That path fired on ~1 in 3 calls until
 * the function was switched to schema-constrained decoding (`responseJsonSchema`,
 * fn version 10), which measured 0/20 failures. Kept as a safety net: generation
 * is non-deterministic and the fallback branch still exists upstream. */
const EDGE_PARSE_FAILURE =
  "I encountered an error processing the recommendations. Please try again.";

async function invokeAskAi(
  supabase: AnonClient,
  body: Record<string, unknown>,
): Promise<AskAiEdgeResponse> {
  const { data, error } = await supabase.functions.invoke<AskAiEdgeResponse>(
    "ask-ai",
    { body },
  );

  if (error) throw error;
  if (!data) throw new Error("ask-ai returned no data");
  if (data.error) throw new Error(data.error);
  return data;
}

/**
 * Ask the AI cafe assistant. Wraps the `ask-ai` Supabase edge function, which
 * runs: Gemini embedding -> `hybrid_search_cafes` RPC -> Gemini generation, and
 * is constrained to only recommend cafes present in the retrieved context.
 */
export async function askAi({
  message,
  conversation = [],
  city,
  limit,
}: AskAiArgs): Promise<AskAiResult> {
  const supabase = createAnonClient();
  // `city`/`limit` are omitted unless explicitly set, so the edge function's
  // own defaults apply (all cities, its configured retrieval breadth) rather
  // than this layer silently pinning them.
  const body: Record<string, unknown> = { message, conversation };
  if (city) body.city = city;
  if (limit != null) body.limit = limit;

  let data = await invokeAskAi(supabase, body);

  // One retry on the known transient parse failure. Generation is
  // non-deterministic, so a second attempt usually succeeds.
  if (data.response?.trim() === EDGE_PARSE_FAILURE) {
    data = await invokeAskAi(supabase, body);
  }

  return {
    response: data.response ?? "",
    recommendations: await hydrateRecommendations(
      supabase,
      data.recommendations ?? [],
    ),
  };
}
