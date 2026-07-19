import { NextResponse } from "next/server";

import { searchCafes } from "@/lib/data/search";
import { clientKey, rateLimit } from "@/lib/rate-limit";

/** searchCafes is `"use cache"` keyed on the query text, so an unthrottled
 * caller can mint a cache entry per distinct string and evict real ones. The
 * dropdown fires roughly one request per keystroke, so the ceiling is
 * deliberately generous — this is anti-abuse, not a usage quota. */
const PER_IP = { limit: 60, windowMs: 60_000 };

/** Bound on the length of text that reaches the cache key and Postgres FTS. */
const MAX_QUERY_LENGTH = 200;

export async function GET(request: Request) {
  const perIp = rateLimit(clientKey(request, "search"), PER_IP);
  if (!perIp.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment and try again." },
      {
        status: 429,
        headers: { "Retry-After": String(perIp.retryAfterSeconds) },
      },
    );
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.slice(0, MAX_QUERY_LENGTH) || undefined;
  const tagsParam = searchParams.get("tags");
  const tagNames = tagsParam
    ? tagsParam
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    : undefined;
  // Number("abc") is NaN, and Math.min/max propagate it — an unparseable limit
  // used to silently produce a NaN limit and an empty result set.
  const parsedLimit = Number(searchParams.get("limit"));
  const limit = Number.isFinite(parsedLimit)
    ? Math.min(50, Math.max(1, Math.trunc(parsedLimit)))
    : 25;

  try {
    const cafes = await searchCafes({
      query,
      tagNames: tagNames && tagNames.length > 0 ? tagNames : undefined,
      limit,
    });
    return NextResponse.json({ cafes });
  } catch (error) {
    // Without this the thrown Supabase error became an unhandled 500, which the
    // client rendered as "no cafes match your search" — telling users the
    // product is empty during an outage.
    console.error("[search/cafes] query failed", error);
    return NextResponse.json(
      { error: "Search is unavailable right now." },
      { status: 503 },
    );
  }
}
