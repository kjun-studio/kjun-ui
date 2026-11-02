import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolveSafeArea, safeAreaVars, webSafeBottom, webSafeTop } from '../shared/package-runtime/safe-area.ts';
import { toastEdgeShift } from '../shared/package-runtime/toast-placement.ts';
import { tokens } from '../packages/tokens/dist/index.js';

const read = (path) => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('a provider safe area falls back to its parent and never goes negative', () => {
  assert.deepEqual(resolveSafeArea(), { top: 0, bottom: 0 });
  assert.deepEqual(resolveSafeArea({ top: 47 }, { top: 20, bottom: 34 }), { top: 47, bottom: 34 });
  assert.deepEqual(resolveSafeArea({ top: -8, bottom: NaN }, { top: 20, bottom: 34 }), { top: 0, bottom: 34 });
});

test('web providers write only the values they receive, and edge components can opt out', () => {
  assert.deepEqual(safeAreaVars(), {});
  assert.deepEqual(safeAreaVars({ top: 24, bottom: -4 }), { '--_kjun-safe-top': '24px', '--_kjun-safe-bottom': '0px' });
  assert.equal(webSafeTop(), 'var(--_kjun-safe-area-top)');
  assert.equal(webSafeBottom(false), '0px');
  // Without a provider value the scope falls back to the browser's env() insets.
  assert.match(read('packages/tokens/src/web.css'), /--_kjun-safe-area-top: var\(--_kjun-safe-top, env\(safe-area-inset-top, 0px\)\)/);
});

test('toasts enter from their own edge', () => {
  assert.equal(toastEdgeShift(), -tokens.motionDistance.toast);
  assert.equal(toastEdgeShift('bottom'), tokens.motionDistance.toast);
  const css = read('packages/tokens/src/toast.css');
  assert.match(css, /top: calc\(var\(--_kjun-extension-toast-inset\) \+ var\(--_kjun-safe-area-top\) \+ var\(--_kjun-toast-offset, 0px\)\)/);
  assert.match(css, /\[data-placement="bottom"\] \{\n  top: auto;\n  bottom: calc\(/);
});

test('edge components no longer take numeric safe-area props', () => {
  for (const platform of ['react', 'vue3', 'native'])
    for (const file of ['app-navigation.tsx', 'fab.tsx', 'drawer.tsx'])
      assert.doesNotMatch(read(`packages/${platform}/src/${file}`), /safeArea(Top|Bottom)\??:|safeArea(Top|Bottom): \{ type/, `${platform}/${file}`);
});

test('Native modals and floating panels keep clear of the safe area', () => {
  assert.match(read('packages/native/src/modal.tsx'), /paddingTop: tokens\.modal\.mobileInset \+ insets\.top/);
  assert.match(read('packages/native/src/floating-panel.tsx'), /edgeTop = tokens\.extensions\.floating\.viewportInset \+ insets\.top/);
});

test('nested providers add no box and keep equal inline values', async () => {
  const { shallowEqual, stableValue } = await import('../shared/package-runtime/stable-value.ts');
  assert.equal(shallowEqual({ a: 1 }, { a: 1 }), true);
  assert.equal(shallowEqual({ a: 1 }, { a: 2 }), false);
  assert.equal(shallowEqual({ a: 1 }, { a: 1, b: undefined }), false);
  const keep = stableValue(), first = keep({ save: '저장' });
  assert.equal(keep({ save: '저장' }), first);
  assert.notEqual(keep({ save: '보관' }), first);
  for (const platform of ['react', 'vue3']) assert.match(read(`packages/${platform}/src/provider.tsx`), /display: "contents"/);
  assert.match(read('packages/native/src/provider.tsx'), /parent && style == null \? children : <View style=\{style\}>/);
  // The CSS contract is checked once per mount, not on every app render.
  assert.match(read('packages/react/src/provider.tsx'), /validateKjunCssScope\(container\);\n  \}, \[container\]\);/);
  assert.doesNotMatch(read('packages/vue3/src/provider.tsx'), /onUpdated/);
});
