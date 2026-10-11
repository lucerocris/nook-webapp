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
