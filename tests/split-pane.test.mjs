import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SPLIT_KEY_STEP, splitClamp, splitFromRatio, splitDrag, splitKeyAction, splitKeyHeld, splitKeyTarget, splitLimits, splitPercent, splitResolve, splitShare, splitToRatio,
  splitCollapseAt, splitDoublePress, splitFoldedPx, splitKeyCollapse, splitReport, splitWanted, splitWantedPx,
} from '../shared/package-runtime/split-pane.ts';
import { tokens } from '@kjun-ui/tokens';

test('the first pane may take the room between both minimums and maximums', () => {
  // 700 wide with a 20 handle leaves 680 for the two panes.
  assert.deepEqual(splitLimits(700, 20), { low: 0, high: 680 });
  assert.deepEqual(splitLimits(700, 20, [200, 240]), { low: 200, high: 440 });
  assert.deepEqual(splitLimits(700, 20, [0, 0], [300, null]), { low: 0, high: 300 });
  // The second pane's maximum sets the first pane's floor.
  assert.deepEqual(splitLimits(700, 20, [100, 0], [null, 400]), { low: 280, high: 680 });
});

test('a container narrower than both minimums keeps the first minimum and never overlaps or goes negative', () => {
  assert.deepEqual(splitLimits(400, 20, [200, 240]), { low: 200, high: 200 });
  // Narrower than the first minimum alone: the first pane takes all the room.
  assert.deepEqual(splitLimits(150, 20, [200, 240]), { low: 130, high: 130 });
  assert.deepEqual(splitLimits(10, 20, [200, 240]), { low: 0, high: 0 });
  assert.deepEqual(splitLimits(0, 20), { low: 0, high: 0 });
  // A maximum below the minimum gives way to the minimum.
  assert.deepEqual(splitLimits(700, 20, [300, 0], [200, null]), { low: 300, high: 300 });
});

test('sizes clamp into the limits and ratios round-trip through pixels', () => {
  const limits = splitLimits(700, 20, [200, 240]);
  assert.equal(splitClamp(100, limits), 200);
  assert.equal(splitClamp(500, limits), 440);
  assert.equal(splitClamp(320, limits), 320);
  assert.equal(splitClamp(Number.NaN, limits), 200);
  assert.equal(splitFromRatio(0.5, 700, 20), 340);
  assert.equal(splitToRatio(340, 700, 20), 0.5);
  assert.equal(splitToRatio(splitFromRatio(0.3, 700, 20), 700, 20), 0.3);
  assert.equal(splitToRatio(10, 20, 20), 0);
  assert.equal(splitToRatio(226.6667, 700, 20), 0.3333);
  // A wanted ratio outside the limits resolves to the nearest allowed size.
  assert.equal(splitResolve(0.1, 700, 20, [200, 240]), 200);
  assert.equal(splitResolve(0.9, 700, 20, [200, 240]), 440);
  assert.equal(splitResolve(0.5, 700, 20, [200, 240]), 340);
  assert.equal(splitPercent(340, 700, 20), 50);
  assert.equal(splitPercent(0, 0, 20), 0);
});

test('a drag moves the first pane by the distance the pointer travels, so pressing the handle edge does not jump', () => {
  assert.equal(splitDrag(408, 500, 500, 1, false), 408);
  assert.equal(splitDrag(408, 500, 450, 1, false), 358);
  // Right to left the pane grows as the pointer moves left.
  assert.equal(splitDrag(408, 500, 450, 1, true), 458);
  // Inside a container drawn at half size, 50 viewport pixels are 100 layout pixels.
  assert.equal(splitDrag(408, 500, 550, 2, false), 508);
  assert.equal(splitDrag(408, 500, 550, Number.NaN, false), 458);
  assert.equal(splitDrag(408, 500, 550, 0, undefined), 458);
});

test('a missing or broken size falls back and stays inside 0–1', () => {
  assert.equal(splitShare(0.3), 0.3);
  assert.equal(splitShare(undefined, 0.6), 0.6);
  assert.equal(splitShare(Number.NaN, 0.6), 0.6);
  assert.equal(splitShare(Number.NaN, Number.NaN), 0.5);
  assert.equal(splitShare(1.4), 1);
  assert.equal(splitShare(-2), 0);
});

test('keys held with Alt, Ctrl or Meta are left to the browser', () => {
  assert.equal(splitKeyHeld({ altKey: true }), true);
  assert.equal(splitKeyHeld({ ctrlKey: true }), true);
  assert.equal(splitKeyHeld({ metaKey: true }), true);
  assert.equal(splitKeyHeld({ shiftKey: true }), false);
  assert.equal(splitKeyHeld({}), false);
});

test('arrow keys follow the split direction and reading direction; Home, End and Enter jump', () => {
  assert.equal(splitKeyAction('ArrowLeft', 'horizontal', false), 'decrease');
  assert.equal(splitKeyAction('ArrowRight', 'horizontal', false), 'increase');
  assert.equal(splitKeyAction('ArrowLeft', 'horizontal', true), 'increase');
  assert.equal(splitKeyAction('ArrowRight', 'horizontal', true), 'decrease');
  assert.equal(splitKeyAction('ArrowUp', 'horizontal', false), null);
  assert.equal(splitKeyAction('ArrowUp', 'vertical', false), 'decrease');
  assert.equal(splitKeyAction('ArrowDown', 'vertical', true), 'increase');
  assert.equal(splitKeyAction('ArrowLeft', 'vertical', false), null);
  assert.equal(splitKeyAction('Home', 'horizontal', false), 'min');
  assert.equal(splitKeyAction('End', 'vertical', false), 'max');
  assert.equal(splitKeyAction('Enter', 'horizontal', false), 'reset');
  // Native Web reports no reading direction at all; that is left to right.
  assert.equal(splitKeyAction('ArrowRight', 'horizontal', undefined), 'increase');
  assert.equal(splitKeyAction('ArrowLeft', 'horizontal', undefined), 'decrease');
  assert.equal(splitKeyAction('Tab', 'horizontal', false), null);
  assert.equal(splitKeyAction(' ', 'horizontal', false), null);
});

test('a key action names the next size inside the limits', () => {
  const limits = { low: 200, high: 440 };
  // The step is the extensions.splitPane.keyStep token.
  assert.equal(SPLIT_KEY_STEP, tokens.extensions.splitPane.keyStep);
  assert.equal(SPLIT_KEY_STEP, 16);
  assert.equal(splitKeyTarget('increase', 320, limits, 340), 336);
  assert.equal(splitKeyTarget('decrease', 320, limits, 340), 304);
  assert.equal(splitKeyTarget('decrease', 204, limits, 340), 200);
  assert.equal(splitKeyTarget('increase', 436, limits, 340), 440);
  assert.equal(splitKeyTarget('min', 320, limits, 340), 200);
  assert.equal(splitKeyTarget('max', 320, limits, 340), 440);
  assert.equal(splitKeyTarget('reset', 320, limits, 340), 340);
  // The default size is clamped too.
  assert.equal(splitKeyTarget('reset', 320, limits, 100), 200);
});

test('sizes are a share or pixels, and pixels without a default start at half the room', () => {
  assert.equal(splitWanted(undefined, undefined, 'ratio'), 0.5);
  assert.equal(splitWanted(2, undefined, 'ratio'), 1);
  assert.equal(splitWanted(undefined, 280, 'px'), 280);
  assert.equal(splitWanted(Number.NaN, 280, 'px'), 280);
  assert.equal(splitWanted(-10, undefined, 'px'), 0);
  assert.equal(splitWanted(undefined, undefined, 'px'), null);
  // 700 wide with a 20 handle leaves 680.
  assert.equal(splitWantedPx(0.25, 'ratio', 700, 20), 170);
  assert.equal(splitWantedPx(280, 'px', 700, 20), 280);
  assert.equal(splitWantedPx(null, 'px', 700, 20), 340);
  assert.equal(splitReport(280.4, 'px', 700, 20), 280);
  assert.equal(splitReport(170, 'ratio', 700, 20), 0.25);
});

test('a collapsed pane keeps collapsedSize inside the room and folds past the midpoint to its minimum', () => {
  assert.equal(splitFoldedPx(undefined, 700, 20), 0);
  assert.equal(splitFoldedPx(48, 700, 20), 48);
  assert.equal(splitFoldedPx(48, 40, 20), 20);
  // Minimum 160, rail 48: the midpoint is 104.
  assert.equal(splitCollapseAt(103, 160, 48), true);
  assert.equal(splitCollapseAt(104, 160, 48), false);
  // Collapsing to nothing with minimum 160: below 80.
  assert.equal(splitCollapseAt(79, 160, 0), true);
  assert.equal(splitCollapseAt(80, 160, 0), false);
  // No minimum: only a drag below the collapsed size folds it.
  assert.equal(splitCollapseAt(40, 0, 48), true);
  assert.equal(splitCollapseAt(-1, 0, 0), true);
  assert.equal(splitCollapseAt(0, 0, 0), false);
});

test('keys on a collapsible pane follow the window splitter: Enter toggles, Home collapses, increase restores', () => {
  assert.deepEqual(splitKeyCollapse('reset', false, false), { collapse: null, move: true });
  assert.deepEqual(splitKeyCollapse('min', false, false), { collapse: null, move: true });
  assert.deepEqual(splitKeyCollapse('reset', true, false), { collapse: true, move: false });
  assert.deepEqual(splitKeyCollapse('reset', true, true), { collapse: false, move: false });
  assert.deepEqual(splitKeyCollapse('min', true, false), { collapse: true, move: false });
  assert.deepEqual(splitKeyCollapse('decrease', true, false), { collapse: null, move: true });
  assert.deepEqual(splitKeyCollapse('increase', true, true), { collapse: false, move: false });
  assert.deepEqual(splitKeyCollapse('max', true, true), { collapse: false, move: true });
  assert.deepEqual(splitKeyCollapse('decrease', true, true), { collapse: null, move: false });
  assert.deepEqual(splitKeyCollapse('min', true, true), { collapse: null, move: false });
});

test('two presses close in time and place are a double press', () => {
  const first = { at: 1000, x: 100, y: 50 };
  assert.equal(splitDoublePress(null, first), false);
  assert.equal(splitDoublePress(first, { at: 1300, x: 104, y: 52 }), true);
  assert.equal(splitDoublePress(first, { at: 1301, x: 100, y: 50 }), false);
  assert.equal(splitDoublePress(first, { at: 1100, x: 111, y: 50 }), false);
});
