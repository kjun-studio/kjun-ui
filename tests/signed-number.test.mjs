import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { deviationText, finiteNumber, signedValueText } from "../shared/package-runtime/signed-number.ts";
import { progressPercent } from "../shared/package-runtime/progress-circle.ts";

const options = { decimals: 2, percent: true, prefix: "", suffix: "", showSign: true };

test("a value that rounds to zero shows as zero, without a sign or a direction", () => {
  for (const value of [0.001, -0.001, 0.004, -0.004, 0, -0])
    assert.deepEqual(signedValueText(value, options), { text: "0.00%", direction: 0, missing: false }, String(value));
  assert.deepEqual(signedValueText(0.005, options), { text: "+0.01%", direction: 1, missing: false });
  assert.deepEqual(signedValueText(-1.25, options), { text: "-1.25%", direction: -1, missing: false });
  assert.equal(signedValueText(-0.4, { ...options, decimals: 0 }).text, "0%");
});

test("a formatter keeps the raw value and its sign", () => {
  const out = signedValueText(0.001, { ...options, formatter: v => v.toFixed(4) });
  assert.deepEqual(out, { text: "0.0010", direction: 1, missing: false });
});

test("missing input is a dash, never zero", () => {
  for (const value of [null, undefined, "", " ", "abc", NaN, Infinity, true])
    assert.deepEqual(signedValueText(value, options), { text: "—", direction: 0, missing: true }, String(value));
  assert.equal(finiteNumber("-0"), 0);
  assert.equal(Object.is(finiteNumber(-0), 0), true);
});

test("deviation labels, directions and steps follow the shown value", () => {
  assert.equal(deviationText(null, 2), null);
  assert.deepEqual(deviationText(-0.001, 2), { label: "0.00%", direction: 0, level: "neutral", abs: 0 });
  assert.deepEqual(deviationText(2.345, 2), { label: "+2.35%", direction: 1, level: "strong", abs: 2.35 });
  assert.equal(deviationText(-0.5, 2).level, "medium");
});

test("unfinished progress never reads 100%", () => {
  assert.equal(progressPercent(99.6, 100), 99);
  assert.equal(progressPercent(99.4, 100), 99);
  assert.equal(progressPercent(100, 100), 100);
  assert.equal(progressPercent(150, 100), 100);
  assert.equal(progressPercent(-5, 100), 0);
  assert.equal(progressPercent(1, 3), 33);
});

test("Web spinners announce their loading words as content, and named progress links its label", async () => {
  for (const file of ["packages/react/src/display.tsx", "packages/vue3/src/display.tsx"]) {
    const source = await readFile(file, "utf8");
    const spinner = source.slice(source.indexOf("KjunSpinner"), source.indexOf("KjunAlert"));
    assert.doesNotMatch(spinner, /aria-label=/, file);
    assert.match(spinner, /kjun-sr-only/, file);
    assert.match(source, /"aria-labelledby": labelId/, file);
  }
});

test("reduced motion lets unknown circle progress breathe instead of freezing at a quarter", async () => {
  const css = await readFile("packages/tokens/src/web.css", "utf8");
  assert.match(css, /\.kjun-progress-circle > svg\.kjun-spin \{\s*animation: kjun-spinner-pulse/);
});
