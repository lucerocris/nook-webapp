import { NextResponse } from "next/server";

import { searchCafes } from "@/lib/data/search";

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
