import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = path => readFile(new URL("../" + path, import.meta.url), "utf8");
const typography = JSON.parse(await read("packages/tokens/src/definitions/typography.json"));
const source = await read("shared/package-runtime/layout-primitives.ts");
const variants = source.match(/export type TextVariant = ([^;]+);/)[1].match(/"(\w+)"/g).map(name => name.slice(1, -1));

test("every KjunText variant is a typography role, except inherit", () => {
  assert.ok(variants.includes("inherit"));
  for (const name of variants.filter(name => name !== "inherit")) assert.ok(typography[name], name + " has a typography token");
});

test("bodyLg is the 16px reading step with body's weight", () => {
  assert.ok(variants.includes("bodyLg"));
  assert.deepEqual(typography.bodyLg, { fontSizePx: 16, lineHeightPx: 24, fontWeight: typography.body.fontWeight, letterSpacingEm: 0 });
});

test("numberLg tracks like the title of its size", () => {
  assert.equal(typography.numberLg.fontSizePx, typography.sectionTitle.fontSizePx);
  assert.equal(typography.numberLg.letterSpacingEm, typography.sectionTitle.letterSpacingEm);
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
