import "server-only";
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "@/lib/env";

import { cache } from "react";
import { cacheLife } from "next/cache";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import type { CafeRpcRow, Database, PublicProfileRpc } from "@/lib/supabase/types";

export type PublicTopCafe = {
  rank: number;
  cafeId: string;
  name: string;
  area: string | null;
  imageUrl: string | null;
};

export type PublicPhoto = {
  id: string;
  cafeId: string;
  cafeName: string;
  imageUrl: string;
  drinkName: string | null;
};

export type PublicReview = {
  id: string;
  cafeId: string;
  cafeName: string;
  cafeArea: string | null;
  cafeImageUrl: string | null;
  rating: number;
  content: string;
  imageUrls: string[];
  createdAt: string;
};

/** Another person's profile as anyone may see it. Never a score, a bucket or
 * anything below #3 (nook-supabase docs/PUBLIC_PROFILE.md). */
export type PublicProfile = {
  userId: string;
  username: string;
  name: string;
  avatarUrl: string | null;
  bio: string | null;
  /** The owner's "Show my top cafes and gallery" switch. */
  highlightsPublic: boolean;
  counts: { reviews: number; ranked: number | null; cups: number | null };
  topCafes: PublicTopCafe[];
  photos: PublicPhoto[];
  reviews: PublicReview[];
};

const USERNAME_RE = /^[A-Za-z0-9_]{3,20}$/;

export function isUsername(value: string): boolean {
  return USERNAME_RE.test(value);
}

function createAnonClient() {
  return createSupabaseClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function area(...parts: (string | null | undefined)[]): string | null {
  const shown = parts.filter((p): p is string => typeof p === "string" && p.trim().length > 0);
  return shown.length > 0 ? shown.join(", ") : null;
}

export function mapPublicProfile(row: PublicProfileRpc): PublicProfile {
  const open = row.highlights_public;
  return {
    userId: row.user_id,
    username: row.username,
    name: row.full_name?.trim() || row.username,
    avatarUrl: row.avatar_url,
    bio: row.bio?.trim() || null,
    highlightsPublic: open,
    counts: {
      reviews: row.counts?.reviews ?? row.reviews?.length ?? 0,
      ranked: open ? (row.counts?.ranked ?? null) : null,
      cups: open ? (row.counts?.cups ?? null) : null,
    },
    // Belt and braces: never more than three, never any when private.
    topCafes: open
      ? [...(row.top_cafes ?? [])]
          .sort((a, b) => a.rank - b.rank)
          .slice(0, 3)
          .map((c) => ({
            rank: c.rank,
            cafeId: c.cafe_id,
            name: c.name,
            area: area(c.neighborhood, c.city),
            imageUrl: c.image_url,
          }))
      : [],
    photos: open
      ? (row.photos ?? []).map((p) => ({
          id: p.id,
          cafeId: p.cafe_id,
          cafeName: p.cafe_name,
          imageUrl: p.image_url,
          drinkName: p.drink_name,
        }))
      : [],
    reviews: (row.reviews ?? []).map((r) => ({
      id: r.id,
      cafeId: r.cafe_id,
      cafeName: r.cafe_name,
      cafeArea: r.cafe_area,
      cafeImageUrl: r.cafe_image_url,
      rating: r.rating,
      content: r.content?.trim() ?? "",
      imageUrls: r.image_urls ?? [],
      createdAt: r.created_at,
    })),
  };
}

/** PostgREST's "no such function": the migration is not applied here. */
const MISSING_FUNCTION = "PGRST202";

/**
 * Local preview only. `get_public_profile` is not in production yet, so with
 * `NOOK_FAKE_PUBLIC_PROFILE=1` in a development server the usernames `demo`,
 * `demo_one` and `demo_private` render from real cafes and invented people.
 * Ignored in production builds.
 */
function fakeEnabled(): boolean {
  return (
    process.env.NODE_ENV === "development" &&
    process.env.NOOK_FAKE_PUBLIC_PROFILE === "1"
  );
}

async function fakeProfile(username: string): Promise<PublicProfile | null> {
  const variants: Record<string, { top: number; open: boolean; name: string; bio: string | null }> = {
    demo: { top: 3, open: true, name: "Bea Santos", bio: "Flat whites and window seats. IT Park on weekdays." },
    demo_one: { top: 1, open: true, name: "Migs Dela Cruz", bio: null },
    demo_private: { top: 0, open: false, name: "Ana Reyes", bio: "Matcha first, coffee second." },
  };
  const v = variants[username.toLowerCase()];
  if (!v) return null;
  const { data, error } = await createAnonClient().rpc("get_cafes", {
    p_query: null,
    p_user_id: null,
    p_sort: "top_rated",
    p_tag_names: null,
    p_lat: null,
    p_lng: null,
    p_limit: 12,
    p_offset: 0,
  });
  if (error) console.warn("[profiles] fake cafes failed", error.message);
  const cafes = ((data ?? []) as unknown as CafeRpcRow[]).filter((c) => c.featured_image_url);
  const reviews: PublicReview[] = cafes.slice(0, 3).map((c, i) => ({
    id: `r${i}`,
    cafeId: c.id,
    cafeName: c.name,
    cafeArea: area(c.neighborhood, c.city),
    cafeImageUrl: c.featured_image_url ?? null,
    rating: 5 - i,
    content: [
      "Quiet upstairs, strong Wi-Fi and plenty of outlets. Stayed four hours and nobody minded.",
      "Good pour-over, a little loud after five.",
      "",
    ][i],
    imageUrls: [],
    createdAt: new Date(Date.UTC(2026, 8, 20 - i * 6)).toISOString(),
  }));
  return {
    userId: `demo-${username}`,
    username,
    name: v.name,
    avatarUrl: null,
    bio: v.bio,
    highlightsPublic: v.open,
    counts: { reviews: reviews.length, ranked: v.open ? (v.top === 1 ? 1 : 18) : null, cups: v.open ? cafes.length : null },
    topCafes: v.open
      ? cafes.slice(0, v.top).map((c, i) => ({
          rank: i + 1,
          cafeId: c.id,
          name: c.name,
          area: area(c.neighborhood, c.city),
          imageUrl: c.featured_image_url ?? null,
        }))
      : [],
    photos: v.open
      ? cafes.map((c, i) => ({
          id: `p${i}`,
          cafeId: c.id,
          cafeName: c.name,
          imageUrl: c.featured_image_url as string,
          drinkName: i % 2 === 0 ? "Iced Spanish latte" : null,
        }))
      : [],
    reviews,
  };
}

/**
 * A public profile by username, or null for an unknown, suspended or
 * not-yet-active account. Read as anon, so nobody's blocks apply: the page is
 * the same for everyone. Cached for minutes, not hours, so turning the
 * privacy switch off takes effect soon.
 */
export const getPublicProfile = cache(
  async (username: string): Promise<PublicProfile | null> => {
    "use cache";
    cacheLife("minutes");

    if (!isUsername(username)) return null;
    if (fakeEnabled()) {
      const fake = await fakeProfile(username);
      if (fake) return fake;
    }

    const { data, error } = await createAnonClient().rpc("get_public_profile", {
      p_username: username,
    });
    if (error) {
      if (error.code === MISSING_FUNCTION) {
        // Not deployed to this database yet: every profile is "not found"
        // rather than an error page.
        console.warn("[profiles] get_public_profile is not deployed");
        return null;
      }
      throw error;
    }
    return data ? mapPublicProfile(data as PublicProfileRpc) : null;
  },
);
