import { NextResponse } from "next/server";

import { getCafesInViewport, getCafesNearPoint } from "@/lib/data/map";
import type { MapFetchFilters } from "@/lib/data/map";

const DEFAULT_RADIUS_METERS = 20000; // 20 km

function num(value: string | null): number | null {
  if (value == null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const query = searchParams.get("q") ?? undefined;
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
      const radius = num(searchParams.get("radius")) ?? DEFAULT_RADIUS_METERS;
      const cafes = await getCafesNearPoint(lat, lng, radius, filters);
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
      const cafes = await getCafesInViewport(
        { north, east, south, west },
        filters,
      );
      return NextResponse.json({ cafes });
    }

    return NextResponse.json({ error: "invalid mode" }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "map fetch failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
