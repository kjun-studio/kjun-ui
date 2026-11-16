import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = path => readFile(new URL("../" + path, import.meta.url), "utf8");
const typography = JSON.parse(await read("packages/tokens/src/definitions/typography.json"));
const source = await read("shared/package-runtime/layout-primitives.ts");
const variants = source.match(/export type TextVariant = ([^;]+);/)[1].match(/"(\w+)"/g).map(name => name.slice(1, -1));

test("every KjunText variant is a typography role", () => {
  for (const name of variants) assert.ok(typography[name], name + " has a typography token");
});

test("the strong steps keep their base step's size and raise only the weight", () => {
  for (const [strong, base] of [["labelStrong", "label"], ["captionStrong", "caption"]]) {
    assert.ok(variants.includes(strong));
    assert.deepEqual({ ...typography[strong], fontWeight: 0 }, { ...typography[base], fontWeight: 0 });
    assert.equal(typography[strong].fontWeight, 600);
  }
  // Small text stays at or below the card title's weight, so a card's title still leads.
  assert.ok(typography.labelStrong.fontWeight <= typography.cardTitle.fontWeight);
});

test("bodyLong is body with a roomier line on the 4px rhythm", () => {
  assert.ok(variants.includes("bodyLong"));
  assert.deepEqual({ ...typography.bodyLong, lineHeightPx: 0 }, { ...typography.body, lineHeightPx: 0 });
  assert.equal(typography.bodyLong.lineHeightPx, 24);
  assert.equal(typography.bodyLong.lineHeightPx % 4, 0);
});
