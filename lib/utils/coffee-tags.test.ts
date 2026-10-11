import { test } from "node:test";
import assert from "node:assert/strict";

import type { Tag } from "../data/cafes-mappers";
import {
  COFFEE_TAG_NAMES,
  coffeeFilterLabels,
  groupCafeTags,
  localBeansShelf,
} from "./coffee-tags.ts";

const tag = (name: string, category: string, isFeatured = false): Tag => ({
  id: name,
  name,
  category,
  createdAt: "",
  isFeatured,
});
const names = (tags: Tag[]) => tags.map((t) => t.name);

test("Local beans is hidden below three cafes", () => {
  assert.deepEqual(localBeansShelf([]), []);
  assert.deepEqual(localBeansShelf(["a", "b"]), []);
  assert.deepEqual(localBeansShelf(["a", "b", "c"]), ["a", "b", "c"]);
});

test("coffee filter chips: none before the migration, contract order after", () => {
  assert.deepEqual(coffeeFilterLabels([]), []);
  assert.deepEqual(
    coffeeFilterLabels(["Matcha", "kapeng barako", "Espresso", "Philippine Beans", "Later"]),
    ["Espresso", "Philippine Beans", "Kapeng Barako", "Matcha"],
  );
  assert.equal(COFFEE_TAG_NAMES.length, 9);
});

test("coffee tags get their own group, in the contract order", () => {
  const groups = groupCafeTags([
    tag("Matcha", "coffee"),
    tag("Free WiFi", "amenities"),
    tag("Espresso", "coffee"),
    tag("Date Spot", "best_for"),
    tag("Cash", "payment"),
  ]);
  assert.deepEqual(names(groups.coffee), ["Espresso", "Matcha"]);
  assert.deepEqual(names(groups.amenities), ["Free WiFi"]);
  assert.deepEqual(names(groups.bestFor), ["Date Spot"]);
  assert.deepEqual(names(groups.payment), ["Cash"]);
});

test("Specialty Coffee leads the coffee group when there is one", () => {
  const groups = groupCafeTags([
    tag("Specialty Coffee", "best_for"),
    tag("Date Spot", "best_for"),
    tag("Slow Bar", "coffee"),
  ]);
  assert.deepEqual(names(groups.coffee), ["Specialty Coffee", "Slow Bar"]);
  assert.deepEqual(names(groups.bestFor), ["Date Spot"]);
});

test("without coffee tags the groups are what they were", () => {
  const groups = groupCafeTags([tag("Specialty Coffee", "best_for"), tag("Free WiFi", "amenities")]);
  assert.deepEqual(groups.coffee, []);
  assert.deepEqual(names(groups.bestFor), ["Specialty Coffee"]);
});
