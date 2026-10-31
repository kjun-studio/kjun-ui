import test from 'node:test';
import assert from 'node:assert/strict';
import { scrollEdges, scrollFadeMask } from '../shared/package-runtime/scroll-fade.ts';

const box = (over) => ({ scrollLeft: 0, scrollTop: 0, clientWidth: 100, clientHeight: 100, scrollWidth: 100, scrollHeight: 100, ...over });

test('scrollEdges reads the scroll axis the fade follows', () => {
  assert.deepEqual(scrollEdges(box({ scrollWidth: 300 }), 'horizontal'), { start: false, end: true });
  assert.deepEqual(scrollEdges(box({ scrollWidth: 300, scrollLeft: 200 }), 'horizontal'), { start: true, end: false });
  // A tall box does not fade sideways, and a wide box does not fade up and down.
  assert.deepEqual(scrollEdges(box({ scrollHeight: 300 }), 'horizontal'), { start: false, end: false });
  assert.deepEqual(scrollEdges(box({ scrollWidth: 300 }), 'vertical'), { start: false, end: false });
  assert.deepEqual(scrollEdges(box({ scrollHeight: 300, scrollTop: 50 }), 'vertical'), { start: true, end: true });
});

test('scrollFadeMask fades only the edges that still have content', () => {
  assert.equal(scrollFadeMask({ start: false, end: false }, 24, 'vertical'), undefined);
  assert.equal(scrollFadeMask({ start: false, end: true }, 24, 'horizontal'),
    'linear-gradient(to right, currentColor, currentColor calc(100% - 24px), transparent)');
  assert.equal(scrollFadeMask({ start: true, end: true }, 24, 'vertical'),
    'linear-gradient(to bottom, transparent, currentColor 24px, currentColor calc(100% - 24px), transparent)');
});
