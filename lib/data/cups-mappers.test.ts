import { test } from "node:test";
import assert from "node:assert/strict";

import {
  cupStatsLine,
  isMissingRpcError,
  jsonLdRating,
  jsonLdReviewCards,
  legacyStats,
  mapCafeCupsPayload,
  mapCupCard,
  parseCupsQuery,
  relativeVisitDate,
  reviewToCup,
  countCupsByKind,
  mapProfileCups,
  cupHasKind,
  mapCafeCupPhotosPayload,
  groupCupStories,
  storyLatest,
  cupPhotoEntries,
  mapCupPublic,
  cupLead,
  visitCount,
  type CafeCups,
} from "./cups-mappers.ts";

test("only a missing function is taken for 'not migrated yet'", () => {
  assert.equal(isMissingRpcError({ code: "PGRST202", message: "Could not find the function" }), true);
  assert.equal(isMissingRpcError({ code: "42883" }), true);
  assert.equal(isMissingRpcError({ code: "42501", message: "permission denied" }), false);
  assert.equal(isMissingRpcError({ code: "PGRST116" }), false);
  assert.equal(isMissingRpcError(null), false);
});

test("a cup without stars keeps a null rating, never 0", () => {
  const cup = mapCupCard({
    id: "c1",
    source: "photos",
    is_virtual: true,
    user_id: "u1",
    username: "sai",
    full_name: null,
    rating: null,
    note: null,
    visited_at: "2026-10-02",
    items: [
      {
        id: "i1",
        kind: "coffee",
        item_name: null,
        menu_item_name: "Spanish latte",
        photo: { id: "p1", image_url: "https://cdn/p1.jpg", taken_at: null },
      },
      { id: "i2", kind: "food", item_name: "Ensaymada", photo: null },
    ],
  });
  assert.equal(cup.rating, null);
  assert.equal(cup.source, "photos");
  assert.equal(cup.authorName, "sai");
  assert.equal(cup.items[0].label, "Spanish latte");
  assert.equal(cup.items[1].photo, null);
  // A legacy photo day: the server's kinds are placeholders, so none stick.
  assert.equal(cup.items[0].kind, null);
  assert.equal(cup.items[1].kind, null);
});

test("stats count cups (visits) and photos separately; rating only when rated", () => {
  const cups = mapCafeCupsPayload({
    stats: {
      cup_count: 4,
      people_count: 3,
      photo_count: 7,
      coffee_photo_count: 4,
      drink_photo_count: 1,
      food_photo_count: 1,
      space_photo_count: 1,
      rated_people_count: 0,
      rating: 4.5,
    },
    cards: [],
    total: 4,
    has_more: false,
  });
  assert.equal(cups.mode, "rpc");
  assert.equal(cups.stats.rating, null);
  assert.equal(cupStatsLine(cups.stats), "4 cups · 7 photos");
});

test("a legacy review is one cup with its stars and photos", () => {
  const cup = reviewToCup({
    id: "r1",
    user_id: "u1",
    rating: 5,
    content: " Great. ",
    image_urls: ["a.jpg", "b.jpg"],
    created_at: "2026-07-19T03:00:00Z",
    helpful_count: 3,
    profile: [{ username: "kuroba_kohii", full_name: "Jared", avatar_url: null }],
  });
  assert.equal(cup.rating, 5);
  assert.equal(cup.note, "Great.");
  assert.equal(cup.items.length, 2);
  assert.ok(cup.items.every((item) => item.kind === null));
  assert.equal(cup.username, "kuroba_kohii");
  const stats = legacyStats([{ user_id: "u1", image_urls: ["a.jpg", "b.jpg"] }], 5, 1);
  assert.equal(cupStatsLine(stats), "1 rating · 1 cup · 2 photos");
});

const rpcCups = (rating: number | null, rated: number): CafeCups => ({
  mode: "rpc",
  stats: {
    cupCount: 5,
    peopleCount: 3,
    photoCount: 2,
    kindPhotoCounts: { coffee: 2, drink: 0, food: 0, space: 0 },
    kindCupCounts: null,
    ratedPeopleCount: rated,
    rating,
  },
  cards: [],
  total: 5,
  hasMore: false,
});

test("JSON-LD aggregate counts each person once, from rated cups only", () => {
  assert.deepEqual(jsonLdRating(rpcCups(4.25, 2), { rating: 5, reviewCount: 9 }), {
    ratingValue: 4.3,
    countProperty: "ratingCount",
    count: 2,
  });
  // Nobody rated: no aggregate, whatever the legacy numbers say.
  assert.equal(jsonLdRating(rpcCups(null, 0), { rating: 5, reviewCount: 9 }), null);
  // Fallback: the legacy rating and review count, as before.
  const legacy: CafeCups = { ...rpcCups(5, 1), mode: "legacy" };
  assert.deepEqual(jsonLdRating(legacy, { rating: 5, reviewCount: 1 }), {
    ratingValue: 5,
    countProperty: "reviewCount",
    count: 1,
  });
});

test("JSON-LD reviews are rated cups with a note, one per person", () => {
  const base = mapCupCard({ id: "x", user_id: "u1", rating: 5, note: "Good", visited_at: "2026-10-01" });
  const cards = [
    base,
    { ...base, id: "y" },
    { ...base, id: "z", userId: "u2", rating: null },
    { ...base, id: "w", userId: "u3", note: null },
  ];
  assert.deepEqual(jsonLdReviewCards(cards).map((c) => c.id), ["x"]);
});

test("query params are checked", () => {
  assert.deepEqual(parseCupsQuery({ kind: "food", rating: "4", sort: "recent", page: "2" }), {
    kind: "food",
    rating: 4,
    sort: "recent",
    page: 2,
  });
  assert.deepEqual(parseCupsQuery({ kind: "tea", rating: "9", sort: "x" }), {
    kind: null,
    rating: null,
    sort: "recommended",
    page: 1,
  });
});

test("visit days read in words", () => {
  const now = new Date("2026-10-11T15:00:00+08:00");
  assert.equal(relativeVisitDate("2026-10-11", now), "Today");
  assert.equal(relativeVisitDate("2026-10-10", now), "Yesterday");
  assert.equal(relativeVisitDate("2026-09-27", now), "2 weeks ago");
  assert.equal(relativeVisitDate("not a date", now), "");
});

test("visit days count on the Philippine calendar, whatever the runtime zone", () => {
  // 03:00 on the 11th in Manila is still the 10th in UTC (a Vercel server):
  // both must call a visit on the 10th "Yesterday", or hydration disagrees.
  const now = new Date("2026-10-10T19:00:00Z");
  assert.equal(relativeVisitDate("2026-10-10", now), "Yesterday");
  assert.equal(relativeVisitDate("2026-10-11", now), "Today");
  // A legacy timestamp late on the 10th in UTC is the 11th in Manila.
  assert.equal(relativeVisitDate("2026-10-10T17:30:00Z", now), "Today");
});

const posted = (id: string, kinds: (string | null)[], source = "cup", isVirtual = false) =>
  mapCupCard({
    id,
    source,
    is_virtual: isVirtual,
    user_id: `u-${id}`,
    visited_at: "2026-10-05",
    items: kinds.map((kind, i) => ({
      id: `${id}-${i}`,
      kind,
      item_name: kind === "food" ? "Banana bread" : null,
      photo: i === 0 ? { id: `${id}-p`, image_url: "https://cdn/x.jpg" } : null,
    })),
  });

test("a posted cup keeps the kinds its poster chose, photo or not", () => {
  const cup = posted("a", ["coffee", "food"]);
  assert.equal(cup.items[0].kind, "coffee");
  assert.equal(cup.items[1].kind, "food");
  assert.equal(cup.items[1].photo, null);
  assert.equal(cupHasKind(cup, "food"), true);
  assert.equal(cupHasKind(cup, "space"), false);
});

test("legacy visits (reviews, photo days, virtual) are untyped", () => {
  assert.equal(posted("r", ["coffee"], "review", true).items[0].kind, null);
  assert.equal(posted("p", ["coffee"], "photos", true).items[0].kind, null);
  // A review copied into a cup row is still the review's photos.
  assert.equal(posted("c", ["coffee"], "review", false).items[0].kind, null);
});

test("kind chips count cups that contain the kind, not photos", () => {
  const counts = countCupsByKind([
    // Three coffee photos in one visit count once.
    posted("a", ["coffee", "coffee", "coffee"]),
    // Food without a photo still counts.
    posted("b", ["drink", "food"]),
    // Legacy photos count for nothing.
    posted("c", ["coffee", "coffee"], "review", true),
  ]);
  assert.deepEqual(counts, { coffee: 1, drink: 1, food: 1, space: 0 });
});

test("a profile's cups are visits grouped by cafe; private photos stay null", () => {
  const profile = mapProfileCups({
    counts: { cups: 3, cafes: 2, photos: null },
    cafes: [
      {
        cafe_id: "c1",
        cafe_name: "Brindle",
        cafe_area: "Lahug, Cebu City",
        cafe_image_url: null,
        visit_count: 2,
        last_visited_at: "2026-10-09",
        latest_rating: 4,
        cups: [
          { id: "v2", source: "cup", user_id: "u", rating: 4, note: "Again", visited_at: "2026-10-09", items: [] },
          { id: "v1", source: "review", is_virtual: true, user_id: "u", rating: 5, note: "Good", visited_at: "2026-08-03" },
        ],
      },
      { cafe_id: "c2", cafe_name: "Hom Cafe", visit_count: 1, cups: [] },
      { cafe_id: null, cafe_name: "dropped" },
    ],
  });
  assert.deepEqual(profile.counts, { cups: 3, cafes: 2, photos: null });
  assert.equal(profile.cafes.length, 2);
  assert.equal(profile.cafes[0].visitCount, 2);
  assert.equal(profile.cafes[0].cups[1].source, "review");
  assert.equal(profile.cafes[1].cafeArea, null);
});

test("kind cup counts come from the server's *_cup_count, or null before step 5", () => {
  const withCounts = mapCafeCupsPayload({
    stats: { cup_count: 3, coffee_cup_count: 2, drink_cup_count: 0, food_cup_count: 1, space_cup_count: 0 },
    cards: [],
  });
  assert.deepEqual(withCounts.stats.kindCupCounts, { coffee: 2, drink: 0, food: 1, space: 0 });
  const before = mapCafeCupsPayload({ stats: { cup_count: 3, coffee_photo_count: 3 }, cards: [] });
  assert.equal(before.stats.kindCupCounts, null);
  assert.deepEqual(legacyStats([], 0, 0).kindCupCounts, { coffee: 0, drink: 0, food: 0, space: 0 });
});

const photoRow = (over: Record<string, unknown>) => ({
  id: "p1",
  image_url: "https://cdn.example/p1.jpg",
  kind: "coffee",
  item_name: " Spanish latte ",
  taken_at: "2026-10-01T02:00:00+00:00",
  cup_id: "c1",
  source: "cup",
  visited_at: "2026-10-01",
  rating: 5,
  note: "Quiet upstairs.",
  user_id: "u1",
  username: "sai",
  full_name: "Sai",
  avatar_url: null,
  ...over,
});

test("cup photos carry their visit; legacy photos stay untyped; no url, no photo", () => {
  const { photos, total } = mapCafeCupPhotosPayload({
    photos: [
      photoRow({}),
      photoRow({ id: "p2", source: "review", kind: "coffee", cup_id: "r1", rating: 4 }),
      photoRow({ id: "p3", image_url: null }),
    ],
    total: 1,
  });
  assert.equal(photos.length, 2);
  assert.equal(total, 2);
  assert.equal(photos[0].label, "Spanish latte");
  assert.equal(photos[0].kind, "coffee");
  assert.equal(photos[0].note, "Quiet upstairs.");
  assert.equal(photos[1].kind, null);
  assert.equal(photos[1].rating, 4);
});

test("stories: one per person, newest person first, their photos oldest first", () => {
  const { photos } = mapCafeCupPhotosPayload({
    photos: [
      photoRow({ id: "a2", user_id: "a", cup_id: "ca2", visited_at: "2026-10-10" }),
      photoRow({ id: "b1", user_id: "b", cup_id: "cb1", visited_at: "2026-10-08" }),
      photoRow({ id: "a1", user_id: "a", cup_id: "ca1", visited_at: "2026-09-01" }),
    ],
  });
  const stories = groupCupStories(photos);
  assert.deepEqual(stories.map((s) => s.userId), ["a", "b"]);
  assert.deepEqual(stories[0].photos.map((p) => p.id), ["a1", "a2"]);
  assert.equal(storyLatest(stories[0]).id, "a2");
  assert.equal(visitCount(photos), 3);
  assert.deepEqual(groupCupStories([]), []);
});

test("a card's photos become entries with the card's stars and note", () => {
  const cup = mapCupCard({
    id: "c1",
    source: "cup",
    user_id: "u1",
    rating: 4,
    note: "Good",
    items: [
      { id: "i1", kind: "food", item_name: "Ensaymada", photo: null },
      { id: "i2", kind: "coffee", item_name: "Latte", photo: { id: "ph", image_url: "x.jpg" } },
    ],
  });
  const entries = cupPhotoEntries(cup);
  assert.equal(entries.length, 1);
  assert.equal(entries[0].cupId, "c1");
  assert.equal(entries[0].rating, 4);
  assert.equal(cupLead(cup), "Latte");
});

test("a public cup needs a cup and a named cafe; anything else is not public", () => {
  assert.equal(mapCupPublic(null), null);
  assert.equal(mapCupPublic({ cup: { id: "c1" } }), null);
  const pub = mapCupPublic({
    cup: { id: "c1", source: "review", review_id: "c1", user_id: "u", rating: 5, items: [] },
    cafe: { id: "k1", name: " Hom Cafe ", neighborhood: "Lahug", city: "Cebu City" },
  });
  assert.equal(pub?.cafe.name, "Hom Cafe");
  assert.equal(pub?.cafe.area, "Lahug, Cebu City");
  assert.equal(pub?.cup.reviewId, "c1");
  assert.equal(cupLead(pub!.cup), null);
});
