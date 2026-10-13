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
  /** What the poster said it is. null for legacy photos (a review's photos,
   * a loose gallery photo day): nobody typed them, and the server's 'coffee'
   * for them is a placeholder, not a fact (UX review 2.2 / 6.1). */
  kind: CupKind | null;
  /** item_name, else the linked menu item's name, else null. */
  label: string | null;
  photo: CupPhoto | null;
};

export type CupCard = {
  id: string;
  source: "cup" | "review" | "photos";
  /** The legacy review this visit is (or was copied from), else null. */
  reviewId: string | null;
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
  /** Typed photos per kind (since Cups step 5; before it the server also
   * counted legacy photos as coffee). Not for display. */
  kindPhotoCounts: Record<CupKind, number>;
  /** Visits with at least one item of each kind, typed items only, as the
   * server counts them (`*_cup_count`, Cups step 5). null from a server
   * without step 5: the chips then count the cards (`countCupsByKind`). */
  kindCupCounts: Record<CupKind, number> | null;
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

/** Area names come with stray spaces from the data ("Talamban , Cebu City"). */
function area(value: string | null): string | null {
  const text = value?.replace(/\s+/g, " ").replace(/\s+,/g, ",").trim();
  return text || null;
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

/** A visit read from legacy rows (a review, or a day of gallery photos)
 * rather than posted with the composer. Its items' kinds were filled in by
 * the server, not chosen by anyone. */
export function isLegacyCup(raw: Raw): boolean {
  return raw.is_virtual === true || raw.source === "review" || raw.source === "photos";
}

export function mapCupItem(raw: Raw, { untyped = false }: { untyped?: boolean } = {}): CupItem {
  const photo = raw.photo && typeof raw.photo === "object" ? (raw.photo as Raw) : null;
  const imageUrl = photo ? str(photo.image_url) : null;
  return {
    id: String(raw.id),
    kind: !untyped && isKind(raw.kind) ? raw.kind : null,
    label: str(raw.item_name)?.trim() || str(raw.menu_item_name)?.trim() || null,
    photo:
      photo && imageUrl
        ? { id: String(photo.id), imageUrl, takenAt: str(photo.taken_at) }
        : null,
  };
}

export function mapCupCard(raw: Raw): CupCard {
  const untyped = isLegacyCup(raw);
  const items = Array.isArray(raw.items)
    ? (raw.items as Raw[]).map((item) => mapCupItem(item, { untyped }))
    : [];
  const source = raw.source === "review" || raw.source === "photos" ? raw.source : "cup";
  return {
    id: String(raw.id),
    source,
    reviewId: str(raw.review_id),
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
    kindCupCounts:
      "coffee_cup_count" in r
        ? {
            coffee: num(r.coffee_cup_count) ?? 0,
            drink: num(r.drink_cup_count) ?? 0,
            food: num(r.food_cup_count) ?? 0,
            space: num(r.space_cup_count) ?? 0,
          }
        : null,
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

// ── Profile: a person's cups, by cafe ────────────────────────────────────

export type ProfileCupsCafe = {
  cafeId: string;
  cafeName: string;
  cafeArea: string | null;
  cafeImageUrl: string | null;
  visitCount: number;
  lastVisitedAt: string | null;
  latestRating: number | null;
  /** Newest first, at most 10 (the RPC's cap). */
  cups: CupCard[];
};

export type ProfileCups = {
  counts: {
    cups: number;
    cafes: number;
    /** null when their photos are private. */
    photos: number | null;
  };
  /** Most recently visited first. */
  cafes: ProfileCupsCafe[];
};

/** `get_profile_cups` → domain. With the photos switch off the server sends
 * only rated or noted visits, without photos, and a null photo count. */
export function mapProfileCups(raw: Raw): ProfileCups {
  const counts = (raw.counts && typeof raw.counts === "object" ? raw.counts : {}) as Raw;
  const cafes = Array.isArray(raw.cafes) ? (raw.cafes as Raw[]) : [];
  return {
    counts: {
      cups: num(counts.cups) ?? 0,
      cafes: num(counts.cafes) ?? 0,
      photos: num(counts.photos),
    },
    cafes: cafes
      .filter((c) => str(c.cafe_id) && str(c.cafe_name))
      .map((c) => {
        const cups = Array.isArray(c.cups) ? (c.cups as Raw[]).map(mapCupCard) : [];
        return {
          cafeId: String(c.cafe_id),
          cafeName: String(c.cafe_name),
          cafeArea: area(str(c.cafe_area)),
          cafeImageUrl: str(c.cafe_image_url),
          visitCount: Math.max(num(c.visit_count) ?? cups.length, cups.length),
          lastVisitedAt: str(c.last_visited_at),
          latestRating: num(c.latest_rating),
          cups,
        };
      }),
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

/** A legacy review as a cup. Its photos are untyped items: the cups backend
 * calls them 'coffee', but nobody said so. */
export function reviewToCup(row: LegacyReviewRow): CupCard {
  const profile = Array.isArray(row.profile) ? row.profile[0] : row.profile;
  return {
    id: row.id,
    source: "review",
    reviewId: row.id,
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
      kind: null,
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
    kindPhotoCounts: { coffee: 0, drink: 0, food: 0, space: 0 },
    // Reviews carry no kinds, so no kind chips.
    kindCupCounts: { coffee: 0, drink: 0, food: 0, space: 0 },
    ratedPeopleCount: count,
    rating: count > 0 ? cafeRating : null,
  };
}

// ── Kinds ────────────────────────────────────────────────────────────────

/** True when the poster put something of this kind in the cup, with a photo
 * or without. Untyped (legacy) items never match. */
export function cupHasKind(cup: CupCard, kind: CupKind): boolean {
  return cup.items.some((item) => item.kind === kind);
}

/** Cups (visits) that contain each kind, for the kind chips: "Food 2" is two
 * visits where someone had food, not two food photos (UX review 4.2). */
export function countCupsByKind(cups: CupCard[]): Record<CupKind, number> {
  const counts: Record<CupKind, number> = { coffee: 0, drink: 0, food: 0, space: 0 };
  for (const cup of cups) {
    for (const kind of CUP_KINDS) if (cupHasKind(cup, kind)) counts[kind] += 1;
  }
  return counts;
}

// ── Photos: every photo of a cafe's cups, each with its visit ────────────

/** One photo with the cup (visit) it belongs to, as `get_cafe_cup_photos`
 * returns it: enough to caption it and to show the cup's stars and note
 * under it, with no second read. */
export type CupPhotoEntry = {
  id: string;
  imageUrl: string;
  /** null for a legacy photo nobody typed. */
  kind: CupKind | null;
  label: string | null;
  takenAt: string | null;
  cupId: string;
  source: CupCard["source"];
  /** YYYY-MM-DD, or a timestamp from the legacy fallback. */
  visitedAt: string;
  rating: number | null;
  note: string | null;
  userId: string;
  username: string | null;
  authorName: string;
  avatarUrl: string | null;
};

export type CafeCupPhotos = {
  photos: CupPhotoEntry[];
  total: number;
  hasMore: boolean;
};

export function mapCupPhoto(raw: Raw): CupPhotoEntry | null {
  const imageUrl = str(raw.image_url);
  if (!imageUrl || !str(raw.id)) return null;
  const source = raw.source === "review" || raw.source === "photos" ? raw.source : "cup";
  return {
    id: String(raw.id),
    imageUrl,
    // Defensive, as for cards: a legacy photo's kind is never a fact.
    kind: source === "cup" && isKind(raw.kind) ? raw.kind : null,
    label: str(raw.item_name)?.trim() || null,
    takenAt: str(raw.taken_at),
    cupId: String(raw.cup_id ?? raw.id),
    source,
    visitedAt: str(raw.visited_at) ?? str(raw.taken_at) ?? "",
    rating: num(raw.rating),
    note: str(raw.note)?.trim() || null,
    userId: String(raw.user_id ?? ""),
    username: str(raw.username),
    authorName: str(raw.full_name) ?? str(raw.username) ?? "Nook member",
    avatarUrl: str(raw.avatar_url),
  };
}

export function mapCafeCupPhotosPayload(raw: Raw): CafeCupPhotos {
  const photos = (Array.isArray(raw.photos) ? (raw.photos as Raw[]) : [])
    .map(mapCupPhoto)
    .filter((p): p is CupPhotoEntry => p !== null);
  return {
    photos,
    total: Math.max(num(raw.total) ?? photos.length, photos.length),
    hasMore: raw.has_more === true,
  };
}

/** A cup's photos as photo entries, each carrying the cup's stars and note:
 * the legacy fallback's photos (reviews' photos) and a card's own viewer. */
export function cupPhotoEntries(cup: CupCard): CupPhotoEntry[] {
  return cup.items
    .filter((item) => item.photo)
    .map((item) => ({
      id: item.photo!.id,
      imageUrl: item.photo!.imageUrl,
      kind: item.kind,
      label: item.label,
      takenAt: item.photo!.takenAt,
      cupId: cup.id,
      source: cup.source,
      visitedAt: cup.visitedAt,
      rating: cup.rating,
      note: cup.note,
      userId: cup.userId,
      username: cup.username,
      authorName: cup.authorName,
      avatarUrl: cup.avatarUrl,
    }));
}

// ── Latest cups: the photos as stories, one per person ───────────────────

export type CupStory = {
  userId: string;
  username: string | null;
  authorName: string;
  avatarUrl: string | null;
  /** Oldest first, as a person's stories play; never empty. */
  photos: CupPhotoEntry[];
};

/** When a photo counts as posted for the tray: the visit day, else when it
 * was taken. */
function photoMoment(photo: CupPhotoEntry): number {
  const day = /^\d{4}-\d{2}-\d{2}$/.test(photo.visitedAt)
    ? `${photo.visitedAt}T12:00:00+08:00`
    : photo.visitedAt;
  const at = new Date(day || photo.takenAt || "").getTime();
  return Number.isNaN(at) ? 0 : at;
}

/** The newest photo of a story: the one its ring shows. */
export function storyLatest(story: CupStory): CupPhotoEntry {
  return story.photos[story.photos.length - 1];
}

/**
 * A cafe's photos grouped per person, the person with the newest visit
 * first, each person's photos oldest first (the app's `groupCafeStories`).
 * Ties keep the order the server gave (newest first), so it is stable.
 */
export function groupCupStories(photos: CupPhotoEntry[]): CupStory[] {
  const byUser = new Map<string, CupPhotoEntry[]>();
  for (const photo of photos) {
    const key = photo.userId || photo.username || photo.cupId;
    const list = byUser.get(key);
    if (list) list.push(photo);
    else byUser.set(key, [photo]);
  }
  const stories: CupStory[] = [...byUser.values()].map((list) => {
    const oldestFirst = list
      .map((photo, index) => ({ photo, index }))
      .sort((a, b) => photoMoment(a.photo) - photoMoment(b.photo) || b.index - a.index)
      .map((entry) => entry.photo);
    const first = list[0];
    return {
      userId: first.userId,
      username: first.username,
      authorName: first.authorName,
      avatarUrl: first.avatarUrl,
      photos: oldestFirst,
    };
  });
  return stories
    .map((story, order) => ({ story, order }))
    .sort(
      (a, b) =>
        photoMoment(storyLatest(b.story)) - photoMoment(storyLatest(a.story)) ||
        a.order - b.order,
    )
    .map((entry) => entry.story);
}

/** Distinct visits among photos: the tray's count when the cafe's cup count
 * is unknown. */
export function visitCount(photos: CupPhotoEntry[]): number {
  return new Set(photos.map((p) => p.cupId)).size;
}

// ── One public cup (the /cups/<id> share page) ───────────────────────────

export type PublicCup = {
  cup: CupCard;
  cafe: {
    id: string;
    name: string;
    area: string | null;
    featuredImageUrl: string | null;
  };
};

/** `get_cup_public` → domain; null when it isn't public (or isn't there). */
export function mapCupPublic(raw: Raw | null | undefined): PublicCup | null {
  if (!raw || typeof raw !== "object") return null;
  const cupRaw = raw.cup && typeof raw.cup === "object" ? (raw.cup as Raw) : null;
  const cafeRaw = raw.cafe && typeof raw.cafe === "object" ? (raw.cafe as Raw) : null;
  if (!cupRaw || !cafeRaw || !str(cupRaw.id) || !str(cafeRaw.id) || !str(cafeRaw.name)) {
    return null;
  }
  return {
    cup: mapCupCard(cupRaw),
    cafe: {
      id: String(cafeRaw.id),
      name: String(cafeRaw.name).trim(),
      area: area([str(cafeRaw.neighborhood), str(cafeRaw.city)].filter(Boolean).join(", ")),
      featuredImageUrl: str(cafeRaw.featured_image_url),
    },
  };
}

/** What a cup is called in a title: its first named item ("Spanish latte"),
 * else null (callers say "A cup"). */
export function cupLead(cup: CupCard): string | null {
  const photoFirst = [...cup.items].sort((a, b) => Number(!a.photo) - Number(!b.photo));
  return photoFirst.find((item) => item.label)?.label ?? null;
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

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Short age of a visit for the tray and the story header: "Today",
 * "Yesterday", "3d", "2w", then "Jul 2026" (the app's `storyAgeLabel`, in
 * days on the Philippine calendar, since a visit is a day). */
export function shortVisitAge(visitedAt: string, now: Date = new Date()): string {
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
  if (days < 7) return `${days}d`;
  if (days < 35) return `${Math.floor(days / 7)}w`;
  const [y, m] = day.split("-").map(Number);
  return `${MONTHS[m - 1]} ${y}`;
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
  /** The list of cups, or every photo of them as a grid. */
  view: "cups" | "photos";
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
    view: first(params.view) === "photos" ? "photos" : "cups",
    sort: (CUP_SORTS as readonly string[]).includes(sort ?? "") ? (sort as CupSort) : "recommended",
    rating: Number.isInteger(rating) && rating >= 1 && rating <= 5 ? rating : null,
    kind: isKind(kind) ? kind : null,
    page: Number.isInteger(page) && page >= 1 ? page : 1,
  };
}
