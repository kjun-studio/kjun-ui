import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = path => readFile(new URL("../" + path, import.meta.url), "utf8");

// A Tabs placed inside another Tabs' panel must keep its own look: rules keyed on the outer tabs' variant,
// density or fullWidth reach only that tabs' own header, never the tabs in its panel.
test("tabs variant rules stop at their own header", async () => {
  for (const file of ["packages/tokens/src/navigation.css", "packages/tokens/src/motion.css"]) {
    const css = await read(file);
    const leaks = [...css.matchAll(/\.kjun-tabs(?:\[[^\]]+\]|:not\(\[[^\]]+\]\))+ (\.kjun-[\w-]+)/g)]
      .filter(([, inner]) => inner !== ".kjun-tabs-header");
    assert.deepEqual(leaks.map(([rule]) => rule), [], file);
  }
  const nav = await read("packages/tokens/src/navigation.css");
  assert.match(nav, /\.kjun-tabs\[data-variant="underline"\]:not\(\[data-full-width\]\) > \.kjun-tabs-header \.kjun-tab:first-child \{ padding-inline-start:0; \}/);
});

test("React and Vue 3 render the tab list inside the header the rules scope to", async () => {
  for (const file of ["packages/react/src/tabs.tsx", "packages/vue3/src/tabs.tsx"]) {
    const source = await read(file);
    const header = source.indexOf("kjun-tabs-header"), list = source.indexOf("kjun-tabs-list"), content = source.indexOf("kjun-tab-content");
    assert.ok(header > 0 && header < list && list < content, file);
  }
});
