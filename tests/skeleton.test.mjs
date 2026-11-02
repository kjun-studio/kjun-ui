import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { skeletonLineBox, skeletonPhase, skeletonTextWidths } from '../shared/package-runtime/skeleton-text.ts';
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

test('the web pulse waits for the shared phase and the matrix pulses as one', () => {
  const display = read('packages/tokens/src/display.css'), state = read('packages/tokens/src/data-state.css');
  assert.match(display, /animation-delay: var\(--_kjun-skeleton-delay, 0ms\)/);
  assert.match(state, /\.kjun-chart-skeleton-matrix \{\n  animation: kjun-chart-pulse/);
  // Cells keep their own light/dark opacity; only the matrix around them animates.
  assert.doesNotMatch(state, /\.kjun-chart-skeleton-cell \{\n  animation/);
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
