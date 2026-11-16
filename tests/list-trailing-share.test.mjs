import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { tokenCssUnit, tokenKind } from "../scripts/token-validation.mjs";

const read = path => readFile(new URL("../packages/" + path, import.meta.url), "utf8");
const definitions = { extensions: JSON.parse(await read("tokens/src/definitions/geometry-extensions.json")).extensions };

test("a row's end column takes its width limit from one percent token", async () => {
  const share = definitions.extensions.list.trailingMaxPercent;
  assert.equal(share, 35);
  assert.equal(tokenKind("extensions.list.trailingMaxPercent"), "percent");
  assert.equal(tokenCssUnit(definitions, "extensions.list.trailingMaxPercent"), "%");
  assert.match(await read("tokens/src/bindings.css"), /--_kjun-extension-list-trailing-max-percent: 35%;/);
  // Web and Native read the token, so an app that measures against it stays in step with both.
  const css = await read("tokens/src/list.css"), native = await read("native/src/list.tsx");
  assert.match(css, /\.kjun-list-trailing\{max-width:var\(--_kjun-extension-list-trailing-max-percent\);/);
  assert.match(native, /maxWidth: `\$\{list\.trailingMaxPercent\}%`/);
  assert.doesNotMatch(css + native, /35%/);
});
