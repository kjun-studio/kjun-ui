import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { clampCurrent, stepStatus, stepsCurrent, stepsStatuses, stepsRootStatus, stepLineReached, stepsLayout, stepSelectable, stepDetail, stepSpoken, stepsHead, STEPS_MIN_COLUMN } from '../shared/package-runtime/steps.ts';
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
  const root = (at, status) => stepsRootStatus(stepsStatuses([{ label: 'a' }, { label: 'b' }, { label: 'c' }], at, status));
  assert.equal(root(3, 'error'), 'complete');
  assert.equal(root(1, 'error'), 'error');
  assert.equal(root(1, 'active'), 'current');
});
test('a step status wins over current, and current falls back to the marked step', () => {
  const items = [{ label: '모션', status: 'complete' }, { label: '장면' }, { label: '자막', status: 'complete' }, { label: '최종' }];
  assert.equal(stepsCurrent(items), 1);
  assert.deepEqual(stepsStatuses(items, stepsCurrent(items), 'active'), ['complete', 'current', 'complete', 'upcoming']);
  assert.equal(stepsCurrent([{ label: 'a', status: 'complete' }, { label: 'b', status: 'error' }, { label: 'c', status: 'current' }]), 1);
  assert.equal(stepsCurrent([{ label: 'a', status: 'complete' }, { label: 'b', status: 'complete' }]), 2);
  assert.equal(stepsCurrent([{ label: 'a' }, { label: 'b' }]), 0);
  assert.equal(stepsCurrent(items, 3.5), 3, 'a given current is clamped and wins');
  assert.equal(stepStatus(3, 1, 'active', { label: 'x', status: 'error' }), 'error');
  assert.equal(stepsRootStatus(['complete', 'upcoming', 'complete']), 'current');
  assert.equal(stepsRootStatus(['complete', 'error', 'upcoming']), 'error');
});
test('a connector is reached only when both of its steps are', () => {
  assert.equal(stepLineReached('complete', 'current'), true);
  assert.equal(stepLineReached('upcoming', 'complete'), false);
  assert.equal(stepLineReached('complete', 'upcoming'), false);
  assert.equal(stepLineReached('complete', undefined), false);
});
test('a disabled step is never a button', () => {
  assert.equal(stepSelectable('complete', 'complete', true), false);
  assert.equal(stepSelectable('upcoming', 'all', true), false);
  assert.equal(stepSelectable('complete', 'complete', false), true);
});
test('React, Vue 3 and Native read per-step status and disabled through the shared helpers', () => {
  for (const file of ['packages/react/src/steps.tsx', 'packages/vue3/src/steps.tsx', 'packages/native/src/steps.tsx']) {
    const source = readFileSync(new URL('../' + file, import.meta.url), 'utf8');
    assert.match(source, /stepsCurrent\(items, (props\.)?current\), statuses = stepsStatuses\(items, at, currentStatus\)/, file);
    assert.match(source, /stepsRootStatus\(statuses\)/, file);
    assert.match(source, /stepSelectable\(status, [\w.]+, item\.disabled\)/, file);
    assert.doesNotMatch(source, /clampCurrent/, file);
  }
  const css = readFileSync(new URL('../packages/tokens/src/steps.css', import.meta.url), 'utf8');
  const reached = ':is([data-status="complete"], [data-status="current"], [data-status="error"])';
  assert.ok(css.includes(`.kjun-steps-item${reached}\n  + .kjun-steps-item${reached} {\n  --_kjun-steps-line: var(--_kjun-color-brand);`));
  assert.ok(css.includes(`.kjun-steps[data-orientation="vertical"] .kjun-steps-item${reached}:has(+ .kjun-steps-item${reached})::after`));
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
  const keys = ['steps','stepComplete','stepCurrent','stepError','stepUpcoming','stepNext'];
  assert.deepEqual(keys.map(k => ko[k]), ['진행 단계','완료','현재 단계','오류','예정','다음']);
  assert.deepEqual(keys.map(k => en[k]), ['Progress steps','Complete','Current step','Error','Upcoming','Next']);
});

// --- web stylesheet (Task 2) ---
import postcss from 'postcss';
import { STEPS_AUTO_MAX } from '../shared/package-runtime/steps.ts';
const stepsCss = () => readFileSync(new URL('../packages/tokens/src/steps.css', import.meta.url), 'utf8');
const containerRules = () => { const rules = []; postcss.parse(stepsCss()).walkAtRules('container', at => rules.push(at)); return rules; };

test('steps.css is registered for the web packages', () => {
  const sources = JSON.parse(readFileSync(new URL('../shared/web-style-sources.json', import.meta.url), 'utf8'));
  assert.ok(sources.includes('steps.css'));
});
test('steps.css has one container query per count 2..10 at count x min column minus 0.02px', () => {
  for (let n = 2; n <= STEPS_AUTO_MAX; n++) {
    const matches = containerRules().filter(at => at.nodes.some(rule => rule.selector.includes(`[data-count="${n}"]`)));
    assert.equal(matches.length, 1, `count ${n}`);
    assert.equal(matches[0].params, `(max-width: ${(n * STEPS_MIN_COLUMN - 0.02).toFixed(2)}px)`);
  }
  assert.equal(containerRules().length, STEPS_AUTO_MAX - 1);
});
test('steps.css minimum column variable matches the runtime constant', () => {
  const bindings = readFileSync(new URL('../packages/tokens/src/bindings.css', import.meta.url), 'utf8');
  assert.equal(bindings.match(/--_kjun-extension-steps-min-column:\s*(\d+)px/)[1], String(STEPS_MIN_COLUMN));
});
test('steps.css forced layouts and more than ten steps', () => {
  const css = stepsCss();
  assert.match(css, /\.kjun-steps\[data-layout="compact"\]/);
  assert.match(css, /\.kjun-steps\[data-layout="full"\]/);
  assert.match(css, /\[data-layout="auto"\][^{,]*:not\(:is\(\[data-count="1"\](?:, \[data-count="\d+"\])*, \[data-count="10"\]\)\)/);
  // Container queries only ever touch auto, so forced layouts always win.
  for (const at of containerRules()) for (const rule of at.nodes) assert.match(rule.selector, /\[data-layout="auto"\]/);
  // Vertical ignores layout: every rule that switches to the narrow layout excludes it.
  const narrow = [];
  postcss.parse(css).walkRules(rule => { if (/--_kjun-steps-hit-display:\s*none/.test(rule.toString())) narrow.push(rule.selector); });
  assert.equal(narrow.length, 1 + (STEPS_AUTO_MAX - 1)); // forced compact + 11+, and one per count 2..10 inside @container
  for (const selector of narrow) for (const part of selector.split(/,\s*(?=\.kjun-steps\[)/)) assert.match(part, /:not\(\[data-orientation="vertical"\]\)/);
});
test('steps.css draws no borders or outlines but the focus ring', () => {
  postcss.parse(stepsCss()).walkDecls(decl => {
    if (/^border(?!-radius)/.test(decl.prop)) assert.match(decl.value, /^(0|none)$/, `${decl.parent.selector} ${decl.prop}`);
    if (/^outline/.test(decl.prop)) assert.match(decl.parent.selector, /focus-visible/, decl.parent.selector);
  });
});
test('steps.css consumes every web steps token and stays short', () => {
  const css = stepsCss();
  for (const name of ['marker-large','marker-small','marker-icon','halo','halo-small','connector','label-gap','column-gap','row-gap','min-column'])
    assert.ok(css.includes(`--_kjun-extension-steps-${name}`), name);
  assert.ok(css.split('\n').length < 500);
});
test('exclamation-mark is registered next to minus', () => {
  const source = readFileSync(new URL('../shared/package-runtime/component-icons.ts', import.meta.url), 'utf8');
  assert.match(source, /import exclamationMark from '@kjun-ui\/icons\/icons\/exclamation-mark'/);
  assert.match(source, /componentIcons[^=]*=\s*\{[^}]*\bminus\b[^}]*'exclamation-mark': exclamationMark/);
});
test('vertical connector runs from under this dot to the top of the next dot', () => {
  let rule;
  postcss.parse(stepsCss()).walkRules(r => { if (r.selector.endsWith('.kjun-steps-item:not(:last-child)::after')) rule = r; });
  const decl = prop => rule.nodes.find(n => n.prop === prop).value;
  const line = 'var(--_kjun-steps-title-line)', dot = 'var(--_kjun-extension-steps-marker-small)', gap = 'var(--_kjun-extension-steps-row-gap)';
  assert.equal(decl('top'), `calc((${line} + ${dot}) / 2)`);
  assert.equal(decl('bottom'), `calc(-1 * (${gap} + (${line} - ${dot}) / 2))`);
});

test('selectable picks which steps onStepSelect makes buttons', () => {
  const statuses = ['complete', 'current', 'error', 'upcoming'];
  assert.deepEqual(statuses.map(s => stepSelectable(s)), [true, false, false, false]);
  assert.deepEqual(statuses.map(s => stepSelectable(s, 'complete')), [true, false, false, false]);
  assert.deepEqual(statuses.map(s => stepSelectable(s, 'all')), [true, false, false, true]);
});
test('stepSpoken names position, label, status and the vertical detail', () => {
  const item = { label: '배송 시작', meta: '14:05', description: '허브 출발' };
  assert.equal(stepDetail(item, false), '');
  assert.equal(stepDetail(item, true), '14:05 · 허브 출발');
  assert.equal(stepSpoken(ko, 2, item, 'complete', stepDetail(item, true)), '3단계, 배송 시작, 완료, 14:05 · 허브 출발');
  assert.equal(stepSpoken(en, 0, { label: 'Cart' }, 'upcoming', ''), 'Step 1, Cart, ' + en.stepUpcoming);
});
test('stepsHead names the current step, the next one and splits n / N', () => {
  const items = ['a', 'b', 'c'].map(label => ({ label }));
  assert.deepEqual(stepsHead(ko, items, 1), { item: items[1], next: items[2], lead: '2', rest: ' / 3' });
  // Everything complete: the heading stays on the last step and there is no next one.
  assert.deepEqual(stepsHead(ko, items, 3), { item: items[2], next: undefined, lead: '3', rest: ' / 3' });
  // A locale whose count does not start with the position keeps the text whole.
  assert.deepEqual(stepsHead({ ...ko, stepCount: (i, n) => `${n}개 중 ${i}` }, items, 0), { item: items[0], next: items[1], lead: '', rest: '3개 중 1' });
});
test('every platform takes the steps phrases and dev check from the shared runtime', () => {
  for (const platform of ['react', 'vue3', 'native']) {
    const source = readFileSync(new URL(`../packages/${platform}/src/steps.tsx`, import.meta.url), 'utf8');
    assert.doesNotMatch(source, /function developmentMode/, platform);
    assert.match(source, /stepSpoken\(/, platform); assert.match(source, /stepsHead\(/, platform); assert.match(source, /stepSelectable\(/, platform);
  }
});
