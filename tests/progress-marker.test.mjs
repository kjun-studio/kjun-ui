import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = path => readFile(new URL("../" + path, import.meta.url), "utf8");
const tokens = JSON.parse(await read("packages/tokens/src/tokens.json"));
const helper = await read("shared/package-runtime/progress-marker.ts");
// The helper is plain arithmetic, so its body runs here without a TypeScript build.
const progressMarker = new Function("marker", "max", helper.match(/export function progressMarker\([^)]*\)[^{]*\{([\s\S]*?)\n\}/)[1]);

test("a marker is placed on the value's own scale and clamped to the rail", () => {
  assert.equal(progressMarker(53, 100), 53);
  assert.equal(progressMarker(106000, 200000), 53);
  assert.equal(progressMarker(-5, 100), 0);
  assert.equal(progressMarker(500, 100), 100);
});

test("nothing is drawn without a usable marker or scale", () => {
  for (const [marker, max] of [[undefined, 100], [null, 100], [NaN, 100], [Infinity, 100], [50, 0], [50, -1], [50, NaN]])
    assert.equal(progressMarker(marker, max), null, `${marker} of ${max}`);
});

test("the marker overhangs every bar size and reads on the thinnest one", () => {
  const { marker, heights } = tokens.extensions.progress;
  assert.deepEqual(marker, { width: 2, overhang: 3, gap: 1 });
  for (const height of [...Object.values(heights), tokens.extensions.financial.progressHeight]) assert.ok(height + 2 * marker.overhang >= 10, "at least 10 tall on a " + height + " bar");
});

test("the rail lets the marker out only when there is one, and the marker keeps the text colour", async () => {
  const css = await read("packages/tokens/src/display.css");
  assert.match(css, /\.kjun-progress-track\[data-marker\],\n\.kjun-progress-cell > div\[data-marker\] \{ position: relative; overflow: visible; \}/);
  const rule = css.match(/\.kjun-progress-marker,\n[^{]+\{([^}]+)\}/)[1];
  assert.match(rule, /background: var\(--_kjun-color-text\)/);
  assert.match(rule, /box-shadow: 0 0 0 var\(--_kjun-extension-progress-marker-gap\) var\(--_kjun-color-surface\)/);
  for (const platform of ["react", "vue3", "native"]) for (const file of [platform === "native" ? "progress" : "display", "financial-display"])
    assert.match(await read(`packages/${platform}/src/${file}.tsx`), /progressMarker\(/, `${platform} ${file}`);
});
