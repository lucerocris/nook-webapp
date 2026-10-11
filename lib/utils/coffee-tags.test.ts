import { test } from "node:test";
import assert from "node:assert/strict";

import type { Tag } from "../data/cafes-mappers";
import {
  COFFEE_TAG_NAMES,
  coffeeFilterLabels,
  coffeeTagHint,
  groupCafeTags,
  localBeansShelf,
  previewTags,
  tagSections,
  tagTotal,
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

const many = groupCafeTags([
  tag("Free WiFi", "amenities"),
  tag("Parking Available", "amenities"),
  tag("Smoking Area", "amenities"),
  tag("Power Outlets", "amenities"),
  tag("Air Conditioned", "amenities"),
  tag("Date Spot", "best_for"),
  tag("Group Hangout", "best_for", true),
  tag("Specialty Coffee", "best_for", true),
  tag("Late Night", "best_for"),
  tag("Matcha", "coffee"),
  tag("Pour-over", "coffee"),
  tag("Espresso", "coffee"),
  tag("Cash", "payment"),
  tag("Card", "payment"),
]);

test("preview: two each from Coffee, Best for and Amenities, in that order", () => {
  assert.deepEqual(names(previewTags(many)), [
    "Specialty Coffee",
    "Espresso",
    "Group Hangout",
    "Date Spot",
    "Free WiFi",
    "Power Outlets",
  ]);
  assert.equal(tagTotal(many), 14);
});

test("preview: a short group gives its places to the others", () => {
  const groups = groupCafeTags([
    tag("Free WiFi", "amenities"),
    tag("Power Outlets", "amenities"),
    tag("Air Conditioned", "amenities"),
    tag("Outdoor Seating", "amenities"),
    tag("Pet Friendly", "amenities"),
    tag("Solo Work / Study", "best_for"),
    tag("Cash", "payment"),
  ]);
  assert.deepEqual(names(previewTags(groups)), [
    "Solo Work / Study",
    "Free WiFi",
    "Power Outlets",
    "Air Conditioned",
    "Outdoor Seating",
    "Pet Friendly",
  ]);
});

test("preview: before the coffee tags it is Best for and Amenities", () => {
  const groups = groupCafeTags([
    tag("Specialty Coffee", "best_for", true),
    tag("Quick Coffee", "best_for"),
    tag("Date Spot", "best_for"),
    tag("Free WiFi", "amenities"),
    tag("Parking Available", "amenities"),
    tag("Air Conditioned", "amenities"),
    tag("Cash", "payment"),
  ]);
  assert.deepEqual(names(previewTags(groups)), [
    "Specialty Coffee",
    "Quick Coffee",
    "Date Spot",
    "Free WiFi",
    "Air Conditioned",
    "Parking Available",
  ]);
});

test("preview: payments only fill what nothing else can; few tags show all", () => {
  const groups = groupCafeTags([
    tag("Free WiFi", "amenities"),
    tag("Cash", "payment"),
    tag("Card", "payment"),
  ]);
  assert.deepEqual(names(previewTags(groups)), ["Free WiFi", "Cash", "Card"]);
  assert.deepEqual(previewTags(groupCafeTags([])), []);
});

test("sections: Coffee, Best for, Amenities, Payment; empty ones left out", () => {
  assert.deepEqual(
    tagSections(many).map((s) => s.title),
    ["Coffee", "Best for", "Amenities", "Payment"],
  );
  const noCoffee = groupCafeTags([tag("Free WiFi", "amenities"), tag("Cash", "payment")]);
  assert.deepEqual(
    tagSections(noCoffee).map((s) => s.title),
    ["Amenities", "Payment"],
  );
});

test("every coffee tag has a customer line; other tags do not", () => {
  for (const name of [...COFFEE_TAG_NAMES, "Specialty Coffee"]) {
    assert.ok(coffeeTagHint(name), name);
  }
  assert.equal(coffeeTagHint("free wifi"), null);
});
