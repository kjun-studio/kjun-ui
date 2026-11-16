import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = path => readFile(new URL("../" + path, import.meta.url), "utf8");
const css = await read("packages/tokens/src/table.css");

test("edgeInset=\"none\" clears only the outer side of the first and last cell", () => {
  assert.match(css, /\.kjun-table\[data-edge-inset="none"\] tr > :is\(th, td\):first-child \{ padding-inline-start: 0; \}/);
  assert.match(css, /\.kjun-table\[data-edge-inset="none"\] tr > :is\(th, td\):last-child \{ padding-inline-end: 0; \}/);
  // The empty cell sets its padding with !important, so its reset has to as well.
  assert.match(css, /\.kjun-table\[data-edge-inset="none"\] \.kjun-table-empty \{ padding-inline: 0 !important; \}/);
  // Nothing about the inset touches the space between columns or the rows' height.
  const rules = css.split("}").filter(rule => rule.includes('data-edge-inset="none"'));
  assert.equal(rules.length, 4);
  for (const rule of rules) assert.doesNotMatch(rule.split("{")[1], /padding(-block[^:]*)?:/, rule);
});

test("every platform reads edgeInset from the shared table props", async () => {
  assert.match(await read("shared/package-runtime/table.ts"), /edgeInset\?: "default" \| "none";/);
  assert.match(await read("packages/react/src/table-grid.tsx"), /data-edge-inset=\{edgeInset === "none" \? "none" : undefined\}/);
  assert.match(await read("packages/vue3/src/table-parts.tsx"), /data-edge-inset=\{c\.edgeInset === "none" \? "none" : undefined\}/);
  const native = await read("packages/native/src/table-grid.tsx");
  assert.match(native, /const flush = edgeInset === "none";/);
  // Native pads cells in style objects; none of them may keep a fixed horizontal padding that ignores the inset.
  assert.doesNotMatch(native, /paddingHorizontal: (cellPadding|geometry\.(headerPadding|groupPadding|expandedPadding|emptyPadding))\.x/);
});
