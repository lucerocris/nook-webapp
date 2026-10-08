import "server-only";
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "@/lib/env";

import { cache } from "react";
import { cacheLife } from "next/cache";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import type { CafeRpcRow, Database, PublicProfileRpc } from "@/lib/supabase/types";

export type PublicPhoto = {
  id: string;
  cafeId: string;
  cafeName: string;
  cafeArea: string | null;
  imageUrl: string;
  drinkName: string | null;
  /** The owner's note on the photo. */
  note: string | null;
  takenAt: string | null;
  pinned: boolean;
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
 * their ranking (nook-supabase docs/PUBLIC_PROFILE.md). */
export type PublicProfile = {
  userId: string;
  username: string;
  /** Full name, or the username when they have not set one. */
  name: string;
  hasName: boolean;
  avatarUrl: string | null;
  bio: string | null;
  /** The owner's "Show my gallery on my profile" switch. */
  galleryPublic: boolean;
  counts: { reviews: number; ranked: number | null; cups: number | null };
  photos: PublicPhoto[];
  reviews: PublicReview[];
};

const USERNAME_RE = /^[A-Za-z0-9_.]{3,20}$/;

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

function text(value: string | null | undefined): string | null {
  const t = value?.trim();
  return t ? t : null;
}

export function mapPublicProfile(row: PublicProfileRpc): PublicProfile {
  const open = row.highlights_public !== false;
  const fullName = text(row.full_name);
  return {
    userId: row.user_id,
    username: row.username,
    name: fullName ?? row.username,
    hasName: fullName !== null,
    avatarUrl: text(row.avatar_url),
    bio: text(row.bio),
    galleryPublic: open,
    counts: {
      reviews: row.counts?.reviews ?? row.reviews?.length ?? 0,
      ranked: open ? (row.counts?.ranked ?? null) : null,
      cups: open ? (row.counts?.cups ?? null) : null,
    },
    // Belt and braces: the RPC already sends none when the switch is off.
    photos: open
      ? (row.photos ?? [])
          .filter((p) => text(p.image_url))
          .map((p) => ({
            id: p.id,
            cafeId: p.cafe_id,
            cafeName: p.cafe_name,
            cafeArea: text(p.cafe_area),
            imageUrl: p.image_url,
            drinkName: text(p.drink_name),
            note: text(p.caption),
            takenAt: p.taken_at ?? null,
            pinned: p.pin_order !== null && p.pin_order !== undefined,
          }))
      : [],
    reviews: (row.reviews ?? []).map((r) => ({
      id: r.id,
      cafeId: r.cafe_id,
      cafeName: r.cafe_name,
      cafeArea: text(r.cafe_area),
      cafeImageUrl: text(r.cafe_image_url),
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
 * Local preview only, for states production has no example of. With
 * `NOOK_FAKE_PUBLIC_PROFILE=1` in a development server, `fake_full`,
 * `fake_private` and `fake_long` render from real cafes and invented people.
 * Ignored in production builds.
 */
function fakeEnabled(): boolean {
  return (
    process.env.NODE_ENV === "development" &&
    process.env.NOOK_FAKE_PUBLIC_PROFILE === "1"
  );
}

const NOTES = [
  "Too sweet for me, but the foam held up the whole way down.",
  null,
  "Rainy Tuesday, stayed three hours. Not too sweet, the espresso still comes through.",
  null,
];

async function fakeProfile(username: string): Promise<PublicProfile | null> {
  const variants: Record<string, { open: boolean; name: string | null; bio: string | null; photos: number }> = {
    fake_full: { open: true, name: "Bea Santos", bio: "Flat whites and window seats. IT Park on weekdays.", photos: 14 },
    fake_private: { open: false, name: "Ana Reyes", bio: "Matcha first, coffee second.", photos: 0 },
    fake_long: {
      open: true,
      name: "Maria Concepcion Villanueva-Dela Cruz",
      bio: "Third-wave coffee nerd from Mandaue. I review every cafe I work from: Wi-Fi, outlets, chairs that don't wreck your back, and whether they let you stay past your second cup. Pour-over over everything.",
      photos: 1,
    },
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
    p_limit: 16,
    p_offset: 0,
  });
  if (error) console.warn("[profiles] fake cafes failed", error.message);
  const cafes = ((data ?? []) as unknown as CafeRpcRow[]).filter((c) => c.featured_image_url);
  const reviews: PublicReview[] = (v.open ? cafes.slice(0, 3) : cafes.slice(0, 2)).map((c, i) => ({
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
    imageUrls: i === 0 ? cafes.slice(4, 7).map((x) => x.featured_image_url as string) : [],
    createdAt: new Date(Date.UTC(2026, 8, 20 - i * 6)).toISOString(),
  }));
  const photos: PublicPhoto[] = v.open
    ? Array.from({ length: v.photos }, (_, i) => {
        const c = cafes[i % cafes.length];
        return {
          id: `p${i}`,
          cafeId: c.id,
          cafeName: c.name,
          cafeArea: area(c.neighborhood, c.city),
          imageUrl: c.featured_image_url as string,
          drinkName: i % 3 === 0 ? "Iced Spanish latte" : i % 3 === 1 ? "Cortado" : null,
          note: NOTES[i % NOTES.length],
          takenAt: new Date(Date.UTC(2026, 8, 28 - i)).toISOString(),
          pinned: i < 2,
        };
      })
    : [];
  return {
    userId: `fake-${username}`,
    username,
    name: v.name ?? username,
    hasName: v.name !== null,
    avatarUrl: null,
    bio: v.bio,
    galleryPublic: v.open,
    counts: { reviews: reviews.length, ranked: v.open ? 18 : null, cups: v.open ? photos.length : null },
    photos,
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
