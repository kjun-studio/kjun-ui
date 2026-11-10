import test from 'node:test';
import assert from 'node:assert/strict';
import { reorderConfirmed, reorderDuplicates, reorderFocus, reorderMove, reorderPlace, reorderStep } from '../shared/package-runtime/reorder.ts';

const order = ['a', 'b', 'c', 'd'];

test('moving an item puts it at the new place and keeps the others in order', () => {
  assert.deepEqual(reorderMove(order, 0, 2), ['b', 'c', 'a', 'd']);
  assert.deepEqual(reorderMove(order, 3, 0), ['d', 'a', 'b', 'c']);
  assert.deepEqual(reorderMove(order, 1, 2), ['a', 'c', 'b', 'd']);
  // The original is never changed.
  assert.deepEqual(order, ['a', 'b', 'c', 'd']);
});

test('a move to the same place or outside the list returns the same list', () => {
  for (const [from, to] of [[1, 1], [-1, 2], [0, 4], [4, 0], [0, -1], [1.5, 2], [Number.NaN, 0]]) assert.equal(reorderMove(order, from, to), order);
  assert.equal(reorderMove([], 0, 0).length, 0);
});

test('a row knows its place and which way it can move', () => {
  assert.deepEqual(reorderPlace(order, 'a'), { index: 0, total: 4, up: false, down: true });
  assert.deepEqual(reorderPlace(order, 'c'), { index: 2, total: 4, up: true, down: true });
  assert.deepEqual(reorderPlace(order, 'd'), { index: 3, total: 4, up: true, down: false });
  // A row the order does not list cannot move; numbers and strings are different values.
  assert.equal(reorderPlace(order, 'x'), null);
  assert.equal(reorderPlace([1, 2], '1'), null);
  assert.equal(reorderPlace(undefined, 'a'), null);
  assert.deepEqual(reorderPlace(['only'], 'only'), { index: 0, total: 1, up: false, down: false });
});

test('one step up or down reports where the row went and the new order', () => {
  assert.deepEqual(reorderStep(order, 'b', -1), { value: 'b', from: 1, to: 0, order: ['b', 'a', 'c', 'd'] });
  assert.deepEqual(reorderStep(order, 'b', 1), { value: 'b', from: 1, to: 2, order: ['a', 'c', 'b', 'd'] });
  // The ends and unknown rows do not move.
  assert.equal(reorderStep(order, 'a', -1), null);
  assert.equal(reorderStep(order, 'd', 1), null);
  assert.equal(reorderStep(order, 'x', 1), null);
  assert.equal(reorderStep(undefined, 'a', 1), null);
});

test('focus stays on the button that moved the row, or its neighbour when that one is now off', () => {
  // Moved up into the middle: the up button is still usable.
  assert.equal(reorderFocus(['a', 'c', 'b', 'd'], 'c', -1), 'up');
  // Moved up to the top: up is off there, so focus goes to down.
  assert.equal(reorderFocus(['b', 'a', 'c', 'd'], 'b', -1), 'down');
  assert.equal(reorderFocus(['a', 'c', 'b', 'd'], 'b', 1), 'down');
  assert.equal(reorderFocus(['a', 'b', 'd', 'c'], 'c', 1), 'up');
  // A row that is no longer listed, or a single row, has nothing to focus.
  assert.equal(reorderFocus(order, 'x', 1), null);
  assert.equal(reorderFocus(['only'], 'only', 1), null);
});

test('a move is confirmed only by an order that shows the row at its new place, soon after the press', () => {
  const pending = { value: 'b', to: 2, at: 1000 };
  assert.equal(reorderConfirmed(['a', 'c', 'b', 'd'], pending, 1200), true);
  // The app drew again with the old order, or put the row somewhere else: not this move.
  assert.equal(reorderConfirmed(['a', 'b', 'c', 'd'], pending, 1200), false);
  assert.equal(reorderConfirmed(['b', 'a', 'c', 'd'], pending, 1200), false);
  assert.equal(reorderConfirmed(['a', 'c', 'd'], pending, 1200), false);
  assert.equal(reorderConfirmed(undefined, pending, 1200), false);
  // A move the app never applied does not claim an unrelated change long after.
  assert.equal(reorderConfirmed(['a', 'c', 'b', 'd'], pending, 1000 + 10001), false);
  assert.equal(reorderConfirmed(['a', 'c', 'b', 'd'], null, 1200), false);
});

test('an order that lists a value twice is reported', () => {
  assert.equal(reorderDuplicates(['a', 'b', 'a']), true);
  assert.equal(reorderDuplicates(['a', 'b', 1, '1']), false);
  assert.equal(reorderDuplicates([]), false);
  assert.equal(reorderDuplicates(undefined), false);
});
