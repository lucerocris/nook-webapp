import { test } from "node:test";
import assert from "node:assert/strict";
import { CoffeeBean, Fire, HourglassMedium, WifiHigh } from "@phosphor-icons/react/dist/ssr";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";

import { COFFEE_TAG_NAMES } from "./coffee-tags.ts";
import {
  ColdBrewIcon,
  EspressoIcon,
  getTagIcon,
  KapengBarakoIcon,
  MatchaIcon,
  PhilippineBeansIcon,
  PourOverIcon,
} from "./tag-icon.ts";

test("every coffee tag resolves to its own icon, by name in any case", () => {
  assert.equal(getTagIcon("Espresso"), EspressoIcon);
  assert.equal(getTagIcon("pour-over"), PourOverIcon);
  assert.equal(getTagIcon(" Cold Brew "), ColdBrewIcon);
  assert.equal(getTagIcon("PHILIPPINE BEANS"), PhilippineBeansIcon);
  assert.equal(getTagIcon("Kapeng Barako"), KapengBarakoIcon);
  assert.equal(getTagIcon("Matcha"), MatchaIcon);
  assert.equal(getTagIcon("Slow Bar"), HourglassMedium);
  assert.equal(getTagIcon("Single Origin"), CoffeeBean);
  assert.equal(getTagIcon("Roasts In-House"), Fire);
  const icons = new Set(COFFEE_TAG_NAMES.map(getTagIcon));
  assert.equal(icons.size, 9);
});

test("other tags are unchanged", () => {
  assert.equal(getTagIcon("Free WiFi"), WifiHigh);
});

test("a custom icon is a regular-weight stroke svg, even when asked for fill", () => {
  const html = renderToStaticMarkup(
    createElement(MatchaIcon, { size: 16, weight: "fill", className: "x" }),
  );
  assert.match(html, /^<svg [^>]*width="16" height="16"/);
  assert.match(html, /viewBox="0 0 256 256"/);
  assert.match(html, /fill="none"/);
  assert.match(html, /stroke="currentColor"/);
  assert.match(html, /stroke-width="16"/);
  assert.match(html, /class="x"/);
});
