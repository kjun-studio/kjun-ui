import test from 'node:test';
import assert from 'node:assert/strict';
import { sparklineGeometry } from '../shared/package-runtime/sparkline.ts';

const base = { width: 72, height: 22, strokeWidth: 1.5, dotRadius: 2.5, barGap: 2 };

test('flat series sit in the middle and draw no area', () => {
  const g = sparklineGeometry([5, 5, 5], base);
  assert.ok(g.segments[0].every(p => p.y === 11));
  assert.deepEqual(g.areas, []);
  assert.equal(g.direction, 0);
});

test('missing values break the line and a lone value becomes its own run', () => {
  const g = sparklineGeometry([3, 4, NaN, 6, NaN, 7, 8], base);
  assert.deepEqual(g.segments.map(s => s.length), [2, 1, 2]);
  assert.equal(g.areas.length, 2);
  assert.equal(g.end.x, 72 - 3.5);
});

test('the inset keeps a thick stroke and the end dot inside the box', () => {
  const g = sparklineGeometry([1, 9], { ...base, strokeWidth: 4 });
  const ys = g.segments[0].map(p => p.y);
  assert.ok(Math.min(...ys) >= 3 && Math.max(...ys) <= 19);
});

test('a baseline joins the range, colors by it and anchors the area', () => {
  const g = sparklineGeometry([101, 99, 98], { ...base, baseline: 100 });
  assert.equal(g.direction, -1);
  assert.ok(g.baselineY > 3.5 && g.baselineY < 18.5);
  assert.ok(g.areas[0].startsWith(`3.5,${g.baselineY}`));
  // min and max keep a small move small.
  const fixed = sparklineGeometry([100, 100.4], { ...base, baseline: 100, min: 98, max: 102 });
  assert.ok(Math.abs(fixed.segments[0][0].y - fixed.segments[0][1].y) < 2);
});

test('bars grow from zero, skip gaps and mark the last one', () => {
  const g = sparklineGeometry([2, NaN, 4, 8], { ...base, variant: 'bar' });
  assert.equal(g.bars.length, 3);
  assert.equal(g.bars[2].height, 22);
  assert.equal(g.bars[0].height, 22 / 4);
  assert.deepEqual(g.bars.map(b => b.last), [false, false, true]);
  assert.equal(g.direction, 1);
});

test('empty data reports empty', () => {
  assert.equal(sparklineGeometry([], base).empty, true);
});
