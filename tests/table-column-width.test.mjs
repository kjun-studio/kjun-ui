import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = path => readFile(new URL("../" + path, import.meta.url), "utf8");
const source = await read("shared/package-runtime/table-columns.ts");
// Both helpers are plain arithmetic, so their bodies run here without a TypeScript build.
const body = name => source.match(new RegExp(`export function ${name}\\([^)]*\\)[^{]*\\{([\\s\\S]*?)\\n\\}`))[1];
const tablePercentWidth = new Function("width", body("tablePercentWidth"));
const tableColumnWidth = new Function("tablePercentWidth", "width", "viewport", "fallback", body("tableColumnWidth")).bind(null, tablePercentWidth);

test("only a plain percent string is a share of the table", () => {
  assert.equal(tablePercentWidth("30%"), 0.3);
  assert.equal(tablePercentWidth(" 12.5% "), 0.125);
  for (const width of [30, "30", "30px", "30 %", "-30%", "auto", "10rem", "", null, undefined]) assert.equal(tablePercentWidth(width), null, String(width));
});

test("a percent column takes its share of the measured table, so three such columns fit a narrow sheet", () => {
  // 0.21.0 gave every percent column the default 160 and overflowed a 320 sheet with 480 of columns.
  const widths = ["40%", "30%", "30%"].map(width => tableColumnWidth(width, 320, 160));
  assert.deepEqual(widths, [128, 96, 96]);
  assert.equal(widths.reduce((sum, width) => sum + width, 0), 320);
});

test("fixed widths are as given and other units keep the default width", () => {
  assert.equal(tableColumnWidth(120, 320, 160), 120);
  assert.equal(tableColumnWidth("120", 320, 160), 120);
  assert.equal(tableColumnWidth("120px", 320, 160), 120);
  for (const width of ["auto", "10rem", undefined, null]) assert.equal(tableColumnWidth(width, 320, 160), 160, String(width));
});

test("before the table is measured a percent column takes the default width, and the grid hides for that frame", async () => {
  assert.equal(tableColumnWidth("30%", 0, 160), 160);
  const native = await read("packages/native/src/table-grid.tsx");
  assert.match(native, /tableColumnWidth\(col\.width, scroll\.viewport, geometry\.columnWidth\)/);
  assert.match(native, /const unmeasured = !scroll\.viewport && visible\.some\(\(col\) => tablePercentWidth\(col\.width\) != null\);/);
  assert.match(native, /opacity: skeletonHidden \|\| unmeasured \? 0 : undefined/);
});
