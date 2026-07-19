import { NextResponse } from "next/server";

import { getCafesInViewport, getCafesNearPoint } from "@/lib/data/map";
import type { MapFetchFilters } from "@/lib/data/map";
import { clientKey, rateLimit } from "@/lib/rate-limit";

const DEFAULT_RADIUS_METERS = 20000; // 20 km
const MAX_RADIUS_METERS = 50000; // 50 km
const MAX_QUERY_LENGTH = 200;

/** Each call is an uncached PostGIS scan, so this route is the cheapest way to
 * load the database. Panning the map debounces to well under this. */
const PER_IP = { limit: 120, windowMs: 60_000 };

function num(value: string | null): number | null {
  if (value == null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export async function GET(request: Request) {
  const perIp = rateLimit(clientKey(request, "map"), PER_IP);
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
  const sortParam = searchParams.get("sort");
  const sort = (["nearby", "top_rated", "trending", "newest"] as const).find(
    (s) => s === sortParam,
  );
  const filters: MapFetchFilters = { query, tagNames, sort };

  const mode = searchParams.get("mode");

  try {
    if (mode === "radius") {
      const lat = num(searchParams.get("lat"));
      const lng = num(searchParams.get("lng"));
      if (lat == null || lng == null) {
        return NextResponse.json(
          { error: "lat and lng are required" },
          { status: 400 },
        );
      }
      // Unclamped, `radius=99999999` returns the whole table (up to MAP_LIMIT)
      // from an uncached PostGIS scan — a cheap scrape and load primitive.
      const radius = clamp(
        num(searchParams.get("radius")) ?? DEFAULT_RADIUS_METERS,
        1,
        MAX_RADIUS_METERS,
      );
      const cafes = await getCafesNearPoint(
        clamp(lat, -90, 90),
        clamp(lng, -180, 180),
        radius,
        filters,
      );
      return NextResponse.json({ cafes });
    }

    if (mode === "viewport") {
      const south = num(searchParams.get("minLat"));
      const west = num(searchParams.get("minLng"));
      const north = num(searchParams.get("maxLat"));
      const east = num(searchParams.get("maxLng"));
      if (south == null || west == null || north == null || east == null) {
        return NextResponse.json(
          { error: "viewport bounds are required" },
          { status: 400 },
        );
      }
      if (south >= north || west >= east) {
        return NextResponse.json(
          { error: "viewport bounds are inverted" },
          { status: 400 },
        );
      }
      const cafes = await getCafesInViewport(
        {
          north: clamp(north, -90, 90),
          east: clamp(east, -180, 180),
          south: clamp(south, -90, 90),
          west: clamp(west, -180, 180),
        },
        filters,
      );
      return NextResponse.json({ cafes });
    }

    return NextResponse.json({ error: "invalid mode" }, { status: 400 });
  } catch (err) {
    // Supabase/PostgREST errors carry function signatures, column names and
    // constraint text. Echoing them to an anonymous caller is free schema
    // reconnaissance — log the detail, return something generic.
    console.error("[map/cafes] fetch failed", err);
    return NextResponse.json(
      { error: "Map data is unavailable right now." },
      { status: 503 },
    );
  }
}
