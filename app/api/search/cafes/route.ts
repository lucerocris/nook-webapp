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
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? Math.min(50, Math.max(1, Number(limitParam))) : 25;

  const cafes = await searchCafes({
    query,
    tagNames: tagNames && tagNames.length > 0 ? tagNames : undefined,
    limit,
  });
  return NextResponse.json({ cafes });
}
