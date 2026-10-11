/**
 * The coffee tags (nook-supabase docs/COFFEE_TAGS.md): category `coffee`,
 * `tags.name` is the key everywhere. Until that migration is applied no tag
 * or cafe has them, and everything here degrades to "nothing to show".
 *
 * Kept free of `@/` imports so `node --test` can load it directly.
 */
import type { Tag } from "../data/cafes-mappers";

/** In the contract's sort order. */
export const COFFEE_TAG_NAMES = [
  "Espresso",
  "Pour-over",
  "Cold Brew",
  "Slow Bar",
  "Single Origin",
  "Philippine Beans",
  "Kapeng Barako",
  "Roasts In-House",
  "Matcha",
];

/** Stays a `best_for` tag (admin-only); only *shown* in the Coffee group. */
export const SPECIALTY_COFFEE_TAG = "Specialty Coffee";

/** The tag behind the "Local beans" home shelf. */
export const LOCAL_BEANS_TAG = "Philippine Beans";

/** "Local beans" stays hidden below this many cafes (COFFEE_TAGS.md §5). */
export const MIN_LOCAL_BEANS = 3;

export function localBeansShelf<T>(cafes: T[]): T[] {
  return cafes.length >= MIN_LOCAL_BEANS ? cafes : [];
}

const key = (name: string) => name.trim().toLowerCase();

/** The coffee chips to offer, given the coffee tag names that exist: the
 * contract's tags that are present, in its order. */
export function coffeeFilterLabels(namesInDatabase: string[]): string[] {
  const present = new Set(namesInDatabase.map(key));
  return COFFEE_TAG_NAMES.filter((name) => present.has(key(name)));
}

export type CafeTagGroups = {
  coffee: Tag[];
  amenities: Tag[];
  bestFor: Tag[];
  payment: Tag[];
};

/**
 * A cafe's tags in the groups the cafe page shows. Coffee tags come in the
 * contract's order; when there is any, Specialty Coffee leads them instead of
 * sitting in Best for. Without coffee tags the result is what the page showed
 * before they existed.
 */
export function groupCafeTags(tags: Tag[]): CafeTagGroups {
  const rank = (t: Tag) => {
    const i = COFFEE_TAG_NAMES.findIndex((name) => key(name) === key(t.name));
    return i < 0 ? COFFEE_TAG_NAMES.length : i;
  };
  // Array.prototype.sort is stable, so unknown coffee tags keep their order.
  const coffee = tags
    .filter((t) => t.category === "coffee")
    .sort((a, b) => rank(a) - rank(b));
  let bestFor = tags.filter((t) => t.category === "best_for");

  if (coffee.length > 0) {
    const isSpecialty = (t: Tag) => key(t.name) === key(SPECIALTY_COFFEE_TAG);
    const specialty = bestFor.find(isSpecialty);
    if (specialty) {
      coffee.unshift(specialty);
      bestFor = bestFor.filter((t) => !isSpecialty(t));
    }
  }

  return {
    coffee,
    amenities: tags.filter((t) => t.category === "amenities"),
    bestFor,
    payment: tags.filter((t) => t.category === "payment"),
  };
}

/** Amenities a cafe-goer checks first, most important first. Anything else
 * keeps its listing order after these. */
export const AMENITY_PRIORITY = [
  "Free WiFi",
  "Power Outlets",
  "Air Conditioned",
  "Outdoor Seating",
  "Pet Friendly",
  "Parking Available",
];

export type TagSection = { title: string; tags: Tag[] };

/**
 * The groups as the "What this cafe offers" page titles and orders them:
 * Coffee, Best for (the cafe's featured ones first), Amenities (the ones
 * people check first), Payment. Empty groups are left out unless asked for.
 */
export function tagSections(
  groups: CafeTagGroups,
  { includeEmpty = false } = {},
): TagSection[] {
  const rank = (t: Tag) => {
    const i = AMENITY_PRIORITY.findIndex((name) => key(name) === key(t.name));
    return i < 0 ? AMENITY_PRIORITY.length : i;
  };
  const sections: TagSection[] = [
    { title: "Coffee", tags: groups.coffee },
    {
      title: "Best for",
      tags: [
        ...groups.bestFor.filter((t) => t.isFeatured),
        ...groups.bestFor.filter((t) => !t.isFeatured),
      ],
    },
    // Stable sort: amenities outside the list keep their order.
    { title: "Amenities", tags: [...groups.amenities].sort((a, b) => rank(a) - rank(b)) },
    { title: "Payment", tags: groups.payment },
  ];
  return includeEmpty ? sections : sections.filter((s) => s.tags.length > 0);
}

export function tagTotal(groups: CafeTagGroups): number {
  return (
    groups.coffee.length +
    groups.bestFor.length +
    groups.amenities.length +
    groups.payment.length
  );
}

/**
 * How many tags the cafe page previews before "See all". Cafes carry a
 * median of 10 tags and up to 23 (before the coffee tags add up to 10 more);
 * six is one row of two per group, and leaves most cafes a short "See all".
 */
export const TAG_PREVIEW_CAP = 6;

/**
 * The tags the cafe page shows before "See all": up to two each from Coffee,
 * Best for and Amenities, in that order. A group with fewer gives its places
 * to the others (Coffee, then Best for, then Amenities, then Payment). A cafe
 * with `cap` tags or fewer gets all of them. Same rule as nook-mobile's
 * `CafeTagGroups.preview`.
 */
export function previewTags(groups: CafeTagGroups, cap = TAG_PREVIEW_CAP): Tag[] {
  const ranked = tagSections(groups, { includeEmpty: true }).map((s) => s.tags);
  const perGroup = 2;
  const quota = ranked.map((tags, i) => (i < 3 ? Math.min(perGroup, tags.length) : 0));
  let left = cap - quota.reduce((a, b) => a + b, 0);
  for (let i = 0; i < ranked.length && left > 0; i++) {
    const more = Math.min(left, ranked[i].length - quota[i]);
    quota[i] += more;
    left -= more;
  }
  return ranked.flatMap((tags, i) => tags.slice(0, quota[i])).slice(0, cap);
}

/** One line a customer can read under a coffee tag on the full list, from the
 * tick-it-when criteria in COFFEE_TAGS.md. Other tags say what they mean. */
const COFFEE_TAG_HINTS: Record<string, string> = {
  [SPECIALTY_COFFEE_TAG]: "Named beans, roast dates and trained baristas",
  Espresso: "Shots pulled on an espresso machine",
  "Pour-over": "Filter coffee hand-brewed to order",
  "Cold Brew": "Coffee steeped cold for hours",
  "Slow Bar": "A bar just for made-to-order manual brews",
  "Single Origin": "Coffee from one named farm or region",
  "Philippine Beans": "Coffee grown in the Philippines",
  "Kapeng Barako": "Philippine Liberica, the strong local bean",
  "Roasts In-House": "Roasts its own beans",
  Matcha: "Matcha drinks on the menu",
};

export function coffeeTagHint(name: string): string | null {
  const hit = Object.entries(COFFEE_TAG_HINTS).find(([n]) => key(n) === key(name));
  return hit ? hit[1] : null;
}
