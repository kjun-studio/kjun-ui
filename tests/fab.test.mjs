import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createBottomBarStore, fabOffset } from '../shared/package-runtime/bottom-bar.ts';
import { tokens } from '../packages/tokens/dist/index.js';

const read = (path) => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('docked bottom bars add up and notify only when the total changes', () => {
  const store = createBottomBarStore(), navigation = {}, actions = {};
  let calls = 0;
  const stop = store.subscribe(() => calls++);
  store.set(navigation, 60);
  store.set(navigation, 60);
  assert.equal(store.total(), 60);
  assert.equal(calls, 1);
  store.set(actions, 72);
  assert.equal(store.total(), 132);
  // A hidden bar measures 0; anything that is not a height counts as 0 too.
  store.set(navigation, 0);
  store.set(actions, NaN);
  assert.equal(store.total(), 0);
  store.set(actions, 72);
  store.remove(actions);
  store.remove(actions);
  assert.equal(store.total(), 0);
  stop();
  store.set(navigation, 60);
  assert.equal(calls, 6);
});

test('a FAB offset is a positive number of px or nothing', () => {
  assert.equal(fabOffset(60), 60);
  for (const value of [0, -8, NaN, Infinity, undefined, null, '60']) assert.equal(fabOffset(value), 0);
});

test('both FAB sizes share one contract: only the diameter, icon and label insets differ', () => {
  const fab = tokens.extensions.fab;
  assert.deepEqual([fab.size, fab.iconSize, fab.smallSize, fab.smallIconSize], [56, 24, 48, 20]);
  assert.ok(fab.smallSize >= tokens.native.minimumTouchTarget);
  for (const size of ['sm', 'md']) assert.ok(fab.paddingStart[size] < fab.paddingEnd[size], 'the icon side takes the tighter inset');
  const css = read('packages/tokens/src/extensions.css');
  // The safe area and docked bars are one clearance: a bar that keeps its own safe area already covers it.
  assert.match(css, /\.kjun-fab\{[^}]*bottom:calc\(var\(--_kjun-extension-fab-inset\) \+ var\(--_kjun-fab-offset,0px\) \+ max\(var\(--_kjun-fab-bar\),var\(--_kjun-fab-safe\)\)\)/);
  assert.match(css, /\.kjun-fab\{[^}]*inset-inline-end:var\(--_kjun-extension-fab-inset\)/);
  // Hover is for pointers that hover; disabled stays opaque instead of going translucent.
  assert.match(css, /@media \(hover:hover\)\{\.kjun-fab:hover/);
  assert.doesNotMatch(css, /\.kjun-fab:disabled\{[^}]*[{;]opacity:/);
  for (const platform of ['react', 'vue3', 'native']) {
    const source = read(`packages/${platform}/src/fab.tsx`);
    for (const prop of ['label', 'size', 'loading', 'avoidBottomBar', 'offsetBottom']) assert.match(source, new RegExp('\\b' + prop + '\\b'), `${platform} ${prop}`);
    assert.match(read(`packages/${platform}/src/app-navigation.tsx`), /trackBottomBar|useKjunBottomBar/, platform);
  }
});
