import test from 'node:test';
import assert from 'node:assert/strict';
import { createReorderMoves, reorderPlaceAmong, reorderWarning, reorderConfirmed, reorderDragStep, reorderDuplicates, reorderFocus, reorderKeyAction, reorderMove, reorderPlace, reorderStep } from '../shared/package-runtime/reorder.ts';

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

test('a dragged row steps when the pointer passes the middle of its neighbour', () => {
  // Three 56px rows from 100: middles at 128, 184 and 240.
  const rows = [{ top: 100, height: 56 }, { top: 156, height: 56 }, { top: 212, height: 56 }];
  assert.equal(reorderDragStep(180, rows, 1), 0);
  assert.equal(reorderDragStep(127, rows, 1), -1);
  assert.equal(reorderDragStep(128, rows, 1), 0);
  assert.equal(reorderDragStep(241, rows, 1), 1);
  // The ends have nowhere further to go, however far the pointer is.
  assert.equal(reorderDragStep(-500, rows, 0), 0);
  assert.equal(reorderDragStep(900, rows, 2), 0);
  assert.equal(reorderDragStep(900, rows, 0), 1);
  // A tall neighbour needs the pointer past its own middle, so rows of different heights do not flip back and forth.
  assert.equal(reorderDragStep(250, [{ top: 100, height: 56 }, { top: 156, height: 200 }], 0), 0);
  assert.equal(reorderDragStep(257, [{ top: 100, height: 56 }, { top: 156, height: 200 }], 0), 1);
  assert.equal(reorderDragStep(180, rows, 7), 0);
  assert.equal(reorderDragStep(Number.NaN, rows, 1), 0);
});

test('the handle grabs with Enter or Space, moves with the arrows, drops with Enter and cancels with Escape', () => {
  assert.equal(reorderKeyAction('Enter', false), 'grab');
  assert.equal(reorderKeyAction(' ', false), 'grab');
  assert.equal(reorderKeyAction('ArrowDown', false), null);
  assert.equal(reorderKeyAction('Escape', false), null);
  assert.equal(reorderKeyAction('ArrowUp', true), 'up');
  assert.equal(reorderKeyAction('ArrowDown', true), 'down');
  assert.equal(reorderKeyAction('Enter', true), 'drop');
  assert.equal(reorderKeyAction(' ', true), 'drop');
  assert.equal(reorderKeyAction('Escape', true), 'cancel');
  // Leaving with Tab drops the row where it is; the key keeps its own meaning.
  assert.equal(reorderKeyAction('Tab', true), 'leave');
  assert.equal(reorderKeyAction('a', true), null);
});

test('a step past a row that is not on screen is off', () => {
  // Page 2 of the order shows c and d: c cannot go up to the hidden b, and d is the last row anyway.
  const shown = new Set(['c', 'd']);
  assert.deepEqual(reorderPlaceAmong(order, 'c', shown), { index: 2, total: 4, up: false, down: true });
  assert.deepEqual(reorderPlaceAmong(order, 'd', shown), { index: 3, total: 4, up: true, down: false });
  assert.deepEqual(reorderPlaceAmong(order, 'c'), reorderPlace(order, 'c'));
  assert.equal(reorderPlaceAmong(order, 'x', shown), null);
});

test('order problems are named once for every platform', () => {
  assert.match(reorderWarning(undefined, 'v-model:order'), /needs `order`.*v-model:order/);
  assert.match(reorderWarning(['a', 'a'], 'onOrderChange'), /twice/);
  assert.equal(reorderWarning(order, 'onOrderChange'), null);
});

test('a move is a request: it is announced only when an order shows it', () => {
  let current = order.slice(), off = false;
  const said = [], asked = [];
  const moves = createReorderMoves({ order: () => current, disabled: () => off, say: text => said.push(text), change: next => asked.push(next),
    moved: (name, position, total) => `${name} ${position}/${total}` });
  const result = moves.step('a', 1, 'A');
  assert.deepEqual(result.order, ['b', 'a', 'c', 'd']);
  assert.deepEqual(asked, [['b', 'a', 'c', 'd']]);
  // Drawn again unchanged: nothing is confirmed or said beyond the clearing.
  assert.equal(moves.confirm(current), null);
  assert.deepEqual(said, ['']);
  current = result.order;
  assert.equal(moves.confirm(current).value, 'a');
  assert.deepEqual(said, ['', 'A 2/4']);
  // Confirmed once; a quiet request and an unannounced confirm say nothing; a disabled section asks for nothing.
  assert.equal(moves.confirm(current), null);
  moves.expect({ value: 'a', name: 'A', to: 1, at: Date.now(), focus: 'handle', quiet: true });
  assert.equal(moves.confirm(current).quiet, true);
  moves.step('a', 1, 'A');
  current = asked.at(-1);
  assert.equal(moves.confirm(current, false).value, 'a');
  assert.equal(said.filter(Boolean).length, 1);
  off = true;
  assert.equal(moves.step('a', 1, 'A'), null);
  // A request that was dropped confirms nothing.
  off = false;
  moves.step('b', 1, 'B');
  moves.expect(null);
  assert.equal(moves.confirm(asked.at(-1)), null);
});
