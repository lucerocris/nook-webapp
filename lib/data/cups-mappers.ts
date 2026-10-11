/**
 * Cups: one visit by one person to a cafe — photos and items (coffee, drink,
 * food, space), an optional note and optional stars. Legacy reviews are cups
 * (one review = one visit) and loose gallery photos group into visits by
 * person, cafe and day; the `get_cafe_cups` RPC does that grouping.
 *
 * This file is the snake_case → camelCase boundary for the RPC payload and the
 * legacy fallback. It is pure (no server-only, no path aliases) so
 * `node --test` can load it directly.
 */

export const CUP_KINDS = ["coffee", "drink", "food", "space"] as const;
export type CupKind = (typeof CUP_KINDS)[number];

export const CUP_SORTS = ["recommended", "recent", "highest", "helpful"] as const;
export type CupSort = (typeof CUP_SORTS)[number];

export type CupPhoto = { id: string; imageUrl: string; takenAt: string | null };

export type CupItem = {
  id: string;
  kind: CupKind;
  /** item_name, else the linked menu item's name, else null. */
  label: string | null;
  photo: CupPhoto | null;
};

export type CupCard = {
  id: string;
  source: "cup" | "review" | "photos";
  userId: string;
  username: string | null;
  authorName: string;
  avatarUrl: string | null;
  /** YYYY-MM-DD (or an ISO timestamp from the legacy fallback). */
  visitedAt: string;
  /** null when the visit has no stars. Never defaulted to 0. */
  rating: number | null;
  note: string | null;
  helpfulCount: number;
  items: CupItem[];
  visitsByAuthor: number;
};

export type CupStats = {
  cupCount: number;
  peopleCount: number;
  photoCount: number;
  kindPhotoCounts: Record<CupKind, number>;
  ratedPeopleCount: number;
  /** Average of each person's latest rated visit; null with no ratings. */
  rating: number | null;
};

export type CafeCups = {
  /** "rpc": the cups backend answered. "legacy": reviews-only fallback. */
  mode: "rpc" | "legacy";
  stats: CupStats;
  cards: CupCard[];
  total: number;
  hasMore: boolean;
};

// ── Missing-RPC detection ────────────────────────────────────────────────

type MaybePgError = { code?: unknown; message?: unknown } | null | undefined;

/**
 * True only when the function does not exist yet: PostgREST's PGRST202
 * ("Could not find the function … in the schema cache") or Postgres 42883
 * (undefined_function). Every other error is a real failure and must not be
 * mistaken for "not migrated yet".
 */
export function isMissingRpcError(error: MaybePgError): boolean {
  if (!error || typeof error !== "object") return false;
  return error.code === "PGRST202" || error.code === "42883";
}

// ── RPC payload → domain ─────────────────────────────────────────────────

type Raw = Record<string, unknown>;

function str(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function num(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return null;
}

function isKind(value: unknown): value is CupKind {
  return typeof value === "string" && (CUP_KINDS as readonly string[]).includes(value);
}

export function mapCupItem(raw: Raw): CupItem {
  const photo = raw.photo && typeof raw.photo === "object" ? (raw.photo as Raw) : null;
  const imageUrl = photo ? str(photo.image_url) : null;
  return {
    id: String(raw.id),
    kind: isKind(raw.kind) ? raw.kind : "coffee",
    label: str(raw.item_name)?.trim() || str(raw.menu_item_name)?.trim() || null,
    photo:
      photo && imageUrl
        ? { id: String(photo.id), imageUrl, takenAt: str(photo.taken_at) }
        : null,
  };
}

export function mapCupCard(raw: Raw): CupCard {
  const items = Array.isArray(raw.items) ? (raw.items as Raw[]).map(mapCupItem) : [];
  const source = raw.source === "review" || raw.source === "photos" ? raw.source : "cup";
  return {
    id: String(raw.id),
    source,
    userId: String(raw.user_id ?? ""),
    username: str(raw.username),
    authorName: str(raw.full_name) ?? str(raw.username) ?? "Nook member",
    avatarUrl: str(raw.avatar_url),
    visitedAt: str(raw.visited_at) ?? str(raw.created_at) ?? "",
    rating: num(raw.rating),
    note: str(raw.note)?.trim() || null,
    helpfulCount: num(raw.helpful_count) ?? 0,
    items,
    visitsByAuthor: Math.max(1, num(raw.visits_by_author) ?? 1),
  };
}

export function mapCupStats(raw: Raw | null | undefined): CupStats {
  const r = raw ?? {};
  const ratedPeopleCount = num(r.rated_people_count) ?? 0;
  return {
    cupCount: num(r.cup_count) ?? 0,
    peopleCount: num(r.people_count) ?? 0,
    photoCount: num(r.photo_count) ?? 0,
    kindPhotoCounts: {
      coffee: num(r.coffee_photo_count) ?? 0,
      drink: num(r.drink_photo_count) ?? 0,
      food: num(r.food_photo_count) ?? 0,
      space: num(r.space_photo_count) ?? 0,
    },
    ratedPeopleCount,
    rating: ratedPeopleCount > 0 ? num(r.rating) : null,
  };
}

export function mapCafeCupsPayload(raw: Raw): CafeCups {
  const cards = Array.isArray(raw.cards) ? (raw.cards as Raw[]).map(mapCupCard) : [];
  return {
    mode: "rpc",
    stats: mapCupStats(raw.stats as Raw | null),
    cards,
    total: num(raw.total) ?? cards.length,
    hasMore: raw.has_more === true,
  };
}

// ── Legacy fallback: a review is one visit ───────────────────────────────

export type LegacyReviewRow = {
  id: string;
  user_id: string;
  rating: number;
  content: string | null;
  image_urls: string[] | null;
  created_at: string;
  helpful_count: number | null;
  profile?:
    | { username: string | null; full_name: string | null; avatar_url: string | null }
    | { username: string | null; full_name: string | null; avatar_url: string | null }[]
    | null;
};

/** A legacy review as a cup. Its photos become coffee items, matching how the
 * cups backend reads review photos (kind 'coffee', no name). */
export function reviewToCup(row: LegacyReviewRow): CupCard {
  const profile = Array.isArray(row.profile) ? row.profile[0] : row.profile;
  return {
    id: row.id,
    source: "review",
    userId: row.user_id,
    username: profile?.username ?? null,
    authorName: profile?.full_name || profile?.username || "Nook member",
    avatarUrl: profile?.avatar_url ?? null,
    visitedAt: row.created_at,
    rating: num(row.rating),
    note: row.content?.trim() || null,
    helpfulCount: row.helpful_count ?? 0,
    items: (row.image_urls ?? []).filter(Boolean).map((url, index) => ({
      id: `${row.id}:${index}`,
      kind: "coffee" as const,
      label: null,
      photo: { id: `${row.id}:${index}`, imageUrl: url, takenAt: row.created_at },
    })),
    visitsByAuthor: 1,
  };
}

export type LegacyStatsRow = { user_id: string; image_urls: string[] | null };

/** Stats for the fallback, from every visible review of the cafe. The rating
 * is the cafe's own legacy average — reviews always carry stars, and each
 * person has one review per cafe. */
export function legacyStats(
  rows: LegacyStatsRow[],
  cafeRating: number,
  reviewCount: number,
): CupStats {
  const people = new Set(rows.map((r) => r.user_id)).size;
  const photos = rows.reduce((sum, r) => sum + (r.image_urls?.filter(Boolean).length ?? 0), 0);
  const count = Math.max(reviewCount, rows.length);
  return {
    cupCount: count,
    peopleCount: Math.max(people, count > 0 ? 1 : 0),
    photoCount: photos,
    kindPhotoCounts: { coffee: photos, drink: 0, food: 0, space: 0 },
    ratedPeopleCount: count,
    rating: count > 0 ? cafeRating : null,
  };
}

// ── Display helpers ──────────────────────────────────────────────────────

/** The calendar day (YYYY-MM-DD) of an instant in the Philippines. */
const manilaDay = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Manila",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function dayNumber(isoDay: string): number {
  const [y, m, d] = isoDay.split("-").map(Number);
  return Date.UTC(y, m - 1, d) / 86_400_000;
}

/** "Today", "Yesterday", "3 days ago", "2 weeks ago", "5 months ago",
 * "a year ago". `visitedAt` may be a bare date (the visit day as posted) or
 * an ISO timestamp. Days are counted on the Philippine calendar, not the
 * runtime's, so the server (UTC on Vercel) and a visitor's browser render the
 * same words and hydration never disagrees around midnight. */
export function relativeVisitDate(visitedAt: string, now: Date = new Date()): string {
  let day: string;
  if (/^\d{4}-\d{2}-\d{2}$/.test(visitedAt)) {
    day = visitedAt;
  } else {
    const then = new Date(visitedAt);
    if (Number.isNaN(then.getTime())) return "";
    day = manilaDay.format(then);
  }
  if (Number.isNaN(now.getTime())) return "";
  const days = Math.round(dayNumber(manilaDay.format(now)) - dayNumber(day));
  if (!Number.isFinite(days)) return "";
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) {
    const weeks = Math.floor(days / 7);
    return weeks === 1 ? "a week ago" : `${weeks} weeks ago`;
  }
  if (days < 365) {
    const months = Math.max(1, Math.floor(days / 30));
    return months === 1 ? "a month ago" : `${months} months ago`;
  }
  const years = Math.floor(days / 365);
  return years === 1 ? "a year ago" : `${years} years ago`;
}

export function plural(n: number, one: string, many = `${one}s`): string {
  return `${n.toLocaleString("en-US")} ${n === 1 ? one : many}`;
}

/** "4 ratings · 12 cups · 30 photos", leaving out what is zero (but always
 * the cups). */
export function cupStatsLine(stats: CupStats): string {
  const parts: string[] = [];
  if (stats.ratedPeopleCount > 0) parts.push(plural(stats.ratedPeopleCount, "rating"));
  parts.push(plural(stats.cupCount, "cup"));
  if (stats.photoCount > 0) parts.push(plural(stats.photoCount, "photo"));
  return parts.join(" · ");
}

// ── JSON-LD ──────────────────────────────────────────────────────────────

export type JsonLdRating = {
  ratingValue: number;
  /** schema.org property: ratingCount for cups (people), reviewCount legacy. */
  countProperty: "ratingCount" | "reviewCount";
  count: number;
};

/**
 * The aggregate rating for structured data, or null to omit it. With the
 * cups backend: stats.rating over stats.ratedPeopleCount (each person's
 * latest rated visit, so each person counts once). In the legacy fallback:
 * the cafe's rating and review_count, as before.
 */
export function jsonLdRating(
  cups: CafeCups,
  legacy: { rating: number; reviewCount: number },
): JsonLdRating | null {
  if (cups.mode === "rpc") {
    const { rating, ratedPeopleCount } = cups.stats;
    if (rating === null || ratedPeopleCount <= 0) return null;
    return {
      ratingValue: Number(rating.toFixed(1)),
      countProperty: "ratingCount",
      count: ratedPeopleCount,
    };
  }
  if (legacy.reviewCount <= 0) return null;
  return {
    ratingValue: Number(legacy.rating.toFixed(1)),
    countProperty: "reviewCount",
    count: legacy.reviewCount,
  };
}

/** Cards fit to be schema.org Reviews: rated, with a note, one per person
 * (the first card seen for each person — pass newest first). */
export function jsonLdReviewCards(cards: CupCard[], limit = 5): CupCard[] {
  const seen = new Set<string>();
  const out: CupCard[] = [];
  for (const card of cards) {
    if (card.rating === null || !card.note) continue;
    if (seen.has(card.userId)) continue;
    seen.add(card.userId);
    out.push(card);
    if (out.length >= limit) break;
  }
  return out;
}

// ── Search params ────────────────────────────────────────────────────────

export type CupsQuery = {
  sort: CupSort;
  rating: number | null;
  kind: CupKind | null;
  page: number;
};

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function parseCupsQuery(params: Record<string, string | string[] | undefined>): CupsQuery {
  const sort = first(params.sort);
  const rating = Number(first(params.rating));
  const kind = first(params.kind);
  const page = Number(first(params.page));
  return {
    sort: (CUP_SORTS as readonly string[]).includes(sort ?? "") ? (sort as CupSort) : "recommended",
    rating: Number.isInteger(rating) && rating >= 1 && rating <= 5 ? rating : null,
    kind: isKind(kind) ? kind : null,
    page: Number.isInteger(page) && page >= 1 ? page : 1,
  };
}
