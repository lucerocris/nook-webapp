import "server-only";

import { cache } from "react";
import { cacheLife } from "next/cache";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import type { CafeRpcRow, Database } from "@/lib/supabase/types";
import { mapCafeSummary, type CafeSummary } from "./cafes-mappers";

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

export type SearchTag = {
  id: string;
  name: string;
  category: "best_for" | "amenities";
};

export type SearchTags = {
  bestFor: SearchTag[];
  amenities: SearchTag[];
};

export const getSearchTags = cache(async (): Promise<SearchTags> => {
  "use cache";
  cacheLife("hours");

  const supabase = createAnonClient();
  const { data, error } = await supabase
    .from("tags")
    .select("id, name, category, sort_order")
    .eq("is_active", true)
    .in("category", ["best_for", "amenities"])
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw error;

  const bestFor: SearchTag[] = [];
  const amenities: SearchTag[] = [];

  for (const row of data ?? []) {
    if (row.category === "best_for") {
      bestFor.push({ id: row.id, name: row.name, category: "best_for" });
    } else if (row.category === "amenities") {
      amenities.push({ id: row.id, name: row.name, category: "amenities" });
    }
  }

  return { bestFor, amenities };
});

export type SearchCafesArgs = {
  query?: string;
  tagNames?: string[];
  limit?: number;
};

export const searchCafes = cache(
  async (args: SearchCafesArgs = {}): Promise<CafeSummary[]> => {
    "use cache";
    cacheLife("hours");

    const supabase = createAnonClient();
    const { data, error } = await supabase.rpc("get_cafes", {
      p_query: args.query?.trim() ? args.query.trim() : null,
      p_user_id: null,
      p_sort: "top_rated",
      p_tag_names: args.tagNames && args.tagNames.length > 0 ? args.tagNames : null,
      p_lat: null,
      p_lng: null,
      p_limit: args.limit ?? 25,
      p_offset: 0,
    });
    if (error) throw error;
    return ((data ?? []) as unknown as CafeRpcRow[]).map(mapCafeSummary);
  },
);
