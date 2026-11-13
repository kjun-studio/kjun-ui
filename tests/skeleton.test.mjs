import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { skeletonCount, skeletonLineBox, skeletonPhase, skeletonRowWidths, skeletonTableWidth, skeletonTextWidths, skeletonWidthScale } from '../shared/package-runtime/skeleton-text.ts';
import { tokens } from '../packages/tokens/dist/index.js';

const read = (path) => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('text skeletons vary their widths and end on a short line', () => {
  assert.deepEqual(skeletonTextWidths(1), ['60%']);
  assert.deepEqual(skeletonTextWidths(3), ['100%', '96%', '55%']);
  assert.deepEqual(skeletonTextWidths(0), []);
  assert.deepEqual(skeletonTextWidths(NaN), []);
});

test('a line skeleton takes its role line box, or the surrounding line height without one', () => {
  assert.equal(skeletonLineBox('caption'), 'var(--_kjun-type-caption-line)');
  assert.equal(skeletonLineBox('displaySm'), 'var(--_kjun-type-display-sm-line)');
  assert.equal(skeletonLineBox(), '1lh');
});

test('every skeleton shares one pulse clock', () => {
  const period = tokens.motion.shimmer;
  assert.equal(skeletonPhase(0), '0ms');
  assert.equal(skeletonPhase(period + 250), '-250ms');
  // Two skeletons mounted a whole period apart land on the same phase.
  assert.equal(skeletonPhase(400), skeletonPhase(400 + 3 * period));
});

test('the web pulse waits for the shared phase and every part pulses towards the shine colour', () => {
  const display = read('packages/tokens/src/display.css'), state = read('packages/tokens/src/data-state.css');
  assert.match(display, /animation-delay: var\(--_kjun-skeleton-delay, 0ms\)/);
  // Chart parts change colour like the bars do; an opacity pulse would fade a faint base colour out at the peak.
  assert.match(state, /@keyframes kjun-chart-pulse \{\n  50% \{\n    background-color: var\(--_kjun-color-skeleton-shine\);/);
  assert.match(state, /@keyframes kjun-chart-ring-pulse \{\n  50% \{\n    border-color: var\(--_kjun-color-skeleton-shine\);/);
  const keyframes = state.slice(state.indexOf('@keyframes kjun-chart-pulse'), state.indexOf('@media (prefers-reduced-motion', state.indexOf('@keyframes kjun-chart-pulse')));
  assert.doesNotMatch(keyframes, /opacity/);
  // Cells share the chart's delay, so the matrix still pulses as one.
  assert.match(state, /\.kjun-chart-skeleton-label,\n\.kjun-chart-skeleton-cell \{\n  animation: kjun-chart-pulse[^\n]*\n  animation-delay: var\(--_kjun-skeleton-delay, 0ms\)/);
  const native = read('packages/native/src/skeletons.tsx');
  assert.match(native, /skeletonFill\(/);
  assert.doesNotMatch(native, /outputRange: \[tokens\.states\.opacity\.pending/);
});

test('rows of a list or table skeleton differ from their neighbours', () => {
  const titles = [0, 1, 2, 3, 4].map((i) => skeletonRowWidths(i).title);
  assert.equal(new Set(titles).size, 5);
  assert.deepEqual(skeletonRowWidths(5), skeletonRowWidths(0));
  assert.notEqual(skeletonRowWidths(0, true).title, skeletonRowWidths(0).title);
  for (const i of [0, 1, 2, 3]) assert.notEqual(skeletonWidthScale(i), skeletonWidthScale(i + 1));
  assert.equal(skeletonWidthScale(0), 1);
  // Table: one header width per kind of column, then no two neighbouring rows alike in a column.
  assert.equal(skeletonTableWidth(0, 1), skeletonTableWidth(0, 3));
  for (const column of [0, 1, 2, 3]) for (const row of [1, 2, 3, 4]) assert.notEqual(skeletonTableWidth(row, column), skeletonTableWidth(row + 1, column));
  for (const path of ['packages/react/src/skeletons.tsx', 'packages/vue3/src/skeletons.tsx', 'packages/native/src/skeletons.tsx', 'packages/react/src/market-skeleton.tsx', 'packages/vue3/src/market-parts.tsx', 'packages/native/src/market-skeleton.tsx'])
    assert.match(read(path), /skeletonRowWidths\(/, path);
});

test('row counts from data are floored and bounded', () => {
  assert.equal(skeletonCount(3.9), 3);
  for (const value of [0, -2, NaN, -Infinity]) assert.equal(skeletonCount(value), 0);
  for (const value of [101, Infinity]) assert.equal(skeletonCount(value), value === Infinity ? 0 : 100);
});

test('a width is applied once and an avatar is never clipped in a row', () => {
  const display = read('packages/tokens/src/display.css');
  assert.match(display, /\.kjun-skeleton\[data-type="avatar"\] \{\n  flex: none;\n  width: auto;/);
  // The root carries the width; the block and avatar inside fill it, so "50%" is not 25%.
  assert.match(read('packages/react/src/display.tsx'), /style=\{\{ width: "100%", height: height \?\? tokens\.extensions\.skeleton\.blockHeight \}\}/);
  assert.match(read('packages/vue3/src/display.tsx'), /css\(\{ width: "100%", height: height \?\? sizes\.blockHeight \}\)/);
  assert.match(read('packages/native/src/skeleton-base.tsx'), /block\("100%", height \?\? tokens\.extensions\.skeleton\.blockHeight/);
  for (const path of ['packages/react/src/display.tsx', 'packages/vue3/src/display.tsx', 'packages/native/src/skeleton-base.tsx'])
    assert.match(read(path), /width \? "100%" : tokens\.extensions\.skeleton\.avatarSize/, path);
});

test('the table skeleton has no frame or header fill and the stat value stands as tall as its digits', () => {
  const display = read('packages/tokens/src/display.css');
  const table = display.slice(display.indexOf('/* Table'), display.indexOf('/* Stat'));
  assert.doesNotMatch(table, /border-radius|background|\.kjun-skeleton-table \{/);
  assert.match(table, /\[data-align="end"\] > \.kjun-skeleton-slot \{\n  justify-content: flex-end;/);
  assert.match(display, /\.kjun-skeleton-stat > \.kjun-skeleton-slot:nth-child\(2\) > \.kjun-skeleton-line \{\n  height: min\(100%, max\(50%, 1cap\)\);/);
  assert.match(read('packages/native/src/skeleton-base.tsx'), /KPI_NUMERAL_HEIGHT/);
});

test('the chart skeleton announces its loading text without drawing it', () => {
  assert.doesNotMatch(read('packages/tokens/src/data-state.css'), /\.kjun-chart-skeleton-status/);
  for (const path of ['packages/react/src/skeletons.tsx', 'packages/vue3/src/skeletons.tsx'])
    assert.match(read(path), /(className|class)="kjun-sr-only" data-kjun-chart-part="status"/, path);
});

test('Native skeletons share one animation and scale their line boxes with the font size', () => {
  const base = read('packages/native/src/skeleton-base.tsx');
  assert.match(base, /useSkeletonPulse\(/);
  assert.doesNotMatch(base, /Animated\.loop/);
  assert.match(base, /fontScale/);
  assert.match(read('packages/native/src/skeletons.tsx'), /useSkeletonPulse\(/);
});

test('table loading states never nest a card skeleton inside a table card', () => {
  for (const path of ['packages/react/src/table-cards.tsx', 'packages/vue3/src/table-narrow.tsx', 'packages/native/src/table-cards.tsx'])
    assert.doesNotMatch(read(path), /type="card"/, path);
});
