import { test } from "node:test";
import assert from "node:assert/strict";

import { settle } from "./settle.ts";

test("a section that loads passes its value through", async () => {
  assert.deepEqual(await settle(async () => [1, 2], "menu", () => {}), [1, 2]);
});

test("a failing section comes back as null and is logged, not thrown", async () => {
  const logged: string[] = [];
  // A get_cafe_cups error that is not PGRST202 / 42883: getCafeCups rethrows it.
  const rpcError = { code: "57014", message: "canceling statement due to statement timeout" };
  const value = await settle(
    async () => {
      throw rpcError;
    },
    "cafe cups",
    (message, error) => {
      logged.push(message);
      assert.equal(error, rpcError);
    },
  );
  assert.equal(value, null);
  assert.deepEqual(logged, ["[cafe cups] failed to load"]);
});

test("one failing section does not take the others down", async () => {
  const [cafe, cups, menu] = await Promise.all([
    settle(async () => ({ name: "Hom Cafe" }), "cafe", () => {}),
    settle(async () => Promise.reject(new Error("boom")), "cafe cups", () => {}),
    settle(async () => Promise.reject(new Error("menu down")), "menu", () => {}),
  ]);
  assert.deepEqual(cafe, { name: "Hom Cafe" });
  assert.equal(cups, null);
  assert.equal(menu, null);
});

test("a synchronous throw inside the loader is caught too", async () => {
  const value = await settle(
    () => {
      throw new Error("sync");
    },
    "menu",
    () => {},
  );
  assert.equal(value, null);
});
