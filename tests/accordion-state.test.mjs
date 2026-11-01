import test from 'node:test';
import assert from 'node:assert/strict';
import { accordionKeyTarget, registerOpened, toggleOpened, trimToSingle, unregisterOpened } from '../shared/package-runtime/accordion-state.ts';

test('toggling opens one item at a time unless multiple', () => {
  assert.deepEqual([...toggleOpened(new Set(['a']), 'b', false)], ['b']);
  assert.deepEqual([...toggleOpened(new Set(['a']), 'b', true)], ['a', 'b']);
  assert.deepEqual([...toggleOpened(new Set(['a', 'b']), 'a', true)], ['b']);
});

test('registration respects single-open and unmounting leaves the set', () => {
  assert.deepEqual([...registerOpened(new Set(['a']), 'b', true, false)], ['a']);
  assert.deepEqual([...registerOpened(new Set(['a']), 'b', true, true)], ['a', 'b']);
  assert.deepEqual([...unregisterOpened(new Set(['a', 'b']), 'a')], ['b']);
  const same = new Set(['a']);
  assert.equal(unregisterOpened(same, 'z'), same);
  assert.deepEqual([...trimToSingle(new Set(['a', 'b', 'c']))], ['c']);
});

test('arrow keys wrap between headers and Home/End jump to the ends', () => {
  assert.equal(accordionKeyTarget('ArrowDown', 2, 3), 0);
  assert.equal(accordionKeyTarget('ArrowUp', 0, 3), 2);
  assert.equal(accordionKeyTarget('Home', 2, 3), 0);
  assert.equal(accordionKeyTarget('End', 0, 3), 2);
  assert.equal(accordionKeyTarget('Tab', 0, 3), null);
});
