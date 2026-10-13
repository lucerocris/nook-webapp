import { test } from "node:test";
import assert from "node:assert/strict";

import { cleanText, snippet } from "./text.ts";

test("titles lose stray spaces", () => {
  assert.equal(cleanText("Talamban , Cebu City"), "Talamban, Cebu City");
  assert.equal(cleanText("Volté Specialty Café  — Luz "), "Volté Specialty Café — Luz");
});

test("snippets cut at a word with an ellipsis", () => {
  const long = "A quiet cafe with outlets on every table and a slow bar that brews single origin beans, ".repeat(3);
  const out = snippet(long);
  assert.ok(out.length <= 155, String(out.length));
  assert.ok(out.endsWith("…"));
  assert.ok(!/\s…$/.test(out));
  assert.ok(long.startsWith(out.slice(0, -1)));
  assert.equal(snippet("Short one."), "Short one.");
});
