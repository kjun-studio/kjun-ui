import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { clampCurrent, stepStatus, stepsRootStatus, stepsLayout, STEPS_MIN_COLUMN } from '../shared/package-runtime/steps.ts';
import { kjunMessagesKo as ko } from '../shared/package-runtime/messages/ko.ts';
import { kjunMessagesEn as en } from '../shared/package-runtime/messages/en.ts';

test('clampCurrent floors and keeps 0..count', () => {
  assert.equal(clampCurrent(-1, 4), 0); assert.equal(clampCurrent(2.7, 4), 2);
  assert.equal(clampCurrent(7, 4), 4); assert.equal(clampCurrent(Number.NaN, 4), 0);
});
test('stepStatus derives each step from current', () => {
  assert.deepEqual([0,1,2,3].map(i => stepStatus(i, 2, 'active')), ['complete','complete','current','upcoming']);
  assert.equal(stepStatus(2, 2, 'error'), 'error');
});
test('all complete ignores error', () => {
  assert.deepEqual([0,1,2].map(i => stepStatus(i, 3, 'error')), ['complete','complete','complete']);
  assert.equal(stepsRootStatus(3, 3, 'error'), 'complete');
  assert.equal(stepsRootStatus(1, 3, 'error'), 'error');
  assert.equal(stepsRootStatus(1, 3, 'active'), 'current');
});
test('stepsLayout switches at count × 80 and above 10 steps', () => {
  assert.equal(stepsLayout(400, 5), 'full'); assert.equal(stepsLayout(399, 5), 'compact');
  assert.equal(stepsLayout(2000, 11), 'compact');
});
test('steps tokens reference the shared scale', () => {
  const tokens = JSON.parse(readFileSync(new URL('../packages/tokens/src/tokens.json', import.meta.url), 'utf8'));
  const steps = tokens.extensions.steps;
  const names = ['markerLarge','markerSmall','markerIcon','halo','haloSmall','connector','labelGap','columnGap','rowGap','minColumn'];
  assert.deepEqual(names.map(n => steps[n]), [24,12,12,6,4,2,8,12,16,80]);
  assert.equal(steps.minColumn, STEPS_MIN_COLUMN);
});
test('ko and en carry every steps message', () => {
  assert.equal(ko.stepPosition(3), '3단계'); assert.equal(en.stepPosition(3), 'Step 3');
  assert.equal(ko.stepCount(2, 5), '2 / 5'); assert.equal(en.stepCount(2, 5), '2 / 5');
  for (const m of [ko, en]) for (const k of ['steps','stepComplete','stepCurrent','stepError','stepUpcoming','stepNext']) assert.equal(typeof m[k], 'string');
});
