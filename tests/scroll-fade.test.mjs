import test from 'node:test';
import assert from 'node:assert/strict';
import { sameEdges, scrollEdges } from '../shared/package-runtime/scroll-fade.ts';

const box = (over) => ({ scrollLeft: 0, scrollTop: 0, clientWidth: 100, clientHeight: 100, scrollWidth: 100, scrollHeight: 100, ...over });

test('scrollEdges reads the scroll axis the fade follows', () => {
  assert.deepEqual(scrollEdges(box({ scrollWidth: 300 }), 'horizontal'), { start: false, end: true });
  assert.deepEqual(scrollEdges(box({ scrollWidth: 300, scrollLeft: 200 }), 'horizontal'), { start: true, end: false });
  // A tall box does not fade sideways, and a wide box does not fade up and down.
  assert.deepEqual(scrollEdges(box({ scrollHeight: 300 }), 'horizontal'), { start: false, end: false });
  assert.deepEqual(scrollEdges(box({ scrollWidth: 300 }), 'vertical'), { start: false, end: false });
  assert.deepEqual(scrollEdges(box({ scrollHeight: 300, scrollTop: 50 }), 'vertical'), { start: true, end: true });
});

test('a right-to-left scroller reads its negative scrollLeft from the start edge', () => {
  assert.deepEqual(scrollEdges(box({ scrollWidth: 300, scrollLeft: 0 }), 'horizontal', true), { start: false, end: true });
  assert.deepEqual(scrollEdges(box({ scrollWidth: 300, scrollLeft: -200 }), 'horizontal', true), { start: true, end: false });
});

test('the edge check allows a pixel of rounding and compares by value', () => {
  assert.deepEqual(scrollEdges(box({ scrollWidth: 300, scrollLeft: 1 }), 'horizontal'), { start: false, end: true });
  assert.deepEqual(scrollEdges(box({ scrollWidth: 300, scrollLeft: 199.5 }), 'horizontal'), { start: true, end: false });
  assert.equal(sameEdges({ start: true, end: false }, { start: true, end: false }), true);
  assert.equal(sameEdges({ start: true, end: false }, { start: false, end: false }), false);
});
