import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  chartFramePath, chartFrameViewBox, chartSkeletonCount, chartMatrixMuted, chartDonutHole, chartDonutRatio, chartSkeletonKind,
} from '../shared/package-runtime/chart-skeleton.ts';

const read = (path) => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('chart skeleton counts normalize to positive integers', () => {
  assert.equal(chartSkeletonCount(8), 8);
  assert.equal(chartSkeletonCount(2.7), 2);
  for (const value of [0, -3, 0.4, NaN, Infinity, -Infinity]) assert.equal(chartSkeletonCount(value), 1);
  // Counts derived from data must not render an unbounded grid.
  assert.equal(chartSkeletonCount(100), 100);
  for (const value of [101, 1e4, 1e9]) assert.equal(chartSkeletonCount(value), 100);
});

test('chart skeleton frame, matrix pattern and donut hole', () => {
  assert.equal(chartFrameViewBox, '0 0 600 240');
  assert.equal(chartFramePath, 'M20 10V220H590 M20 65H590 M20 120H590 M20 175H590');
  assert.equal(chartMatrixMuted(0, 1), true);
  assert.equal(chartMatrixMuted(0, 0), false);
  assert.equal(chartDonutHole(180, 22), 100);
  assert.equal(chartDonutHole(40, 22), 0);
});

test('KjunSkeleton no longer offers a chart type on any platform', () => {
  for (const path of ['packages/react/src/display.tsx', 'packages/vue3/src/display.tsx', 'packages/native/src/skeleton-base.tsx']) {
    const source = read(path);
    assert.doesNotMatch(source, /"table" \| "chart" \| "stat"/, path);
    assert.doesNotMatch(source, /type === "chart"/, path);
  }
  assert.doesNotMatch(read('packages/tokens/src/display.css'), /kjun-skeleton-chart/);
  assert.doesNotMatch(read('packages/tokens/src/definitions/sizing.json'), /"chartHeight"|"chartBarMaxWidth"|"chartAxisHeight"/);
});

// Starts at the props definition (KjunChartSkeletonProps / kjunChartSkeletonProps), past the shared-helper import.
const chartSource = (path) => { const source = read(path); return source.slice(source.search(/[Kk]junChartSkeletonProps/)); };
const chartSources = { react: 'packages/react/src/skeletons.tsx', vue3: 'packages/vue3/src/skeletons.tsx', native: 'packages/native/src/skeletons.tsx' };

for (const [platform, path] of Object.entries(chartSources)) {
  test(`${platform} KjunChartSkeleton offers only frame, donut and matrix and draws the grid with chart-grid`, () => {
    const source = chartSource(path);
    assert.match(source, /"frame" \| "donut" \| "matrix"|KjunChartSkeletonKind/);
    assert.doesNotMatch(source, /"line"|"candle"|"bar"/);
    assert.doesNotMatch(source, /color-border|colors\.border/);
    assert.match(source, /chart-grid|colors\.chartGrid/);
    assert.match(source, /non-scaling-stroke/);
    assert.doesNotMatch(source, /donutLabel/);
  });
}

test('unknown chart skeleton kinds fall back to frame', () => {
  for (const kind of ['frame', 'donut', 'matrix']) assert.equal(chartSkeletonKind(kind), kind);
  for (const kind of ['line', 'bar', 'candle', 'grid', '', undefined, null]) assert.equal(chartSkeletonKind(kind), 'frame');
});

test('the donut ratio is shared by the helper, the web CSS and Native', () => {
  const css = read('packages/tokens/src/data-state.css'), percent = chartDonutRatio * 100;
  const donut = css.slice(css.indexOf('.kjun-chart-skeleton-donut {'), css.indexOf('}', css.indexOf('.kjun-chart-skeleton-donut {')));
  assert.match(donut, new RegExp(`height: ${percent}%;`));
  assert.match(css, new RegExp(`max-width:calc\\(${percent}cqh - 2 \\*`));
  assert.match(read('packages/native/src/skeletons.tsx'), /chartDonutRatio \* 100/);
  // The hole formula assumes border-box; it must not depend on the provider's reset.
  assert.match(donut, /box-sizing: border-box;/);
  assert.match(css, /data-kjun-chart-kind="donut"\] \.kjun-chart-skeleton-status>span \{[^}]*box-sizing:border-box/);
});
