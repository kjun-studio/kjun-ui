import test from 'node:test';
import assert from 'node:assert/strict';
import { createLayerState } from '../shared/package-runtime/layer-state.ts';
import { readTokenDefinitions, compileTokens, shadowCss, extensionGeometryCss } from '../scripts/token-model.mjs';
const source = await readTokenDefinitions(new URL('..', import.meta.url).pathname);
test('shadow prototypes propagate through semantic and component references without becoming spacing', () => {
  const s = structuredClone(source);
  s.shadowScale.contact[0].blurRadius = 29;
  s.shadowScale.ambient[0].blurRadius = 31;
  const tokens = compileTokens(s);
  assert.deepEqual(tokens.elevation.flat, []);
  assert.equal(tokens.card.elevation.raised[0].blurRadius, 29);
  for (const surface of [tokens.modal, ...['menu','popover','drawer'].map(key => tokens.extensions[key])]) assert.equal(surface.elevation[0].blurRadius, 31);
  assert.equal(shadowCss(tokens.elevation.flat), 'none');
  assert.doesNotMatch(extensionGeometryCss(tokens, s), /elevation/);
  assert.deepEqual(tokens.layers, { page: { content: 0, sticky: 10, navigation: 20 } });
  assert.equal('shadows' in tokens, false);
});
test('new windows suppress old popups once, preserve ownership and never reactivate stale controlled state', () => {
  const state = createLayerState(), trigger = { focus() {} }; let closes = 0;
  state.open('page-popup', 'popup', undefined, () => closes++, trigger);
  state.open('first', 'window', undefined, () => {});
  assert.equal(state.entries.get('first').returnTarget, trigger);
  assert.equal(state.isBlocked('page-popup'), true);
  assert.equal(closes, 1);
  state.open('first-popup', 'popup', 'first', () => closes++);
  assert.ok(state.zIndex('first-popup', 'popup') > state.zIndex('first', 'content'));
  state.open('second', 'window', 'first', () => {});
  assert.equal(closes, 2);
  assert.equal(state.entries.get('second').owner, 'first');
  assert.equal(state.zIndex('first', 'backdrop'), 1100);
  assert.equal(state.zIndex('first-popup', 'popup'), 1110);
  assert.equal(state.zIndex('second', 'content'), 1201);
  state.remove('second'); state.remove('first');
  assert.equal(state.isActive('page-popup'), false);
  state.open('page-popup', 'popup', undefined, () => closes++);
  assert.equal(state.isBlocked('page-popup'), true);
  state.remove('page-popup'); state.open('page-popup', 'popup', undefined, () => closes++);
  assert.equal(state.isActive('page-popup'), true);
});
test('only the top active layer dismisses and removed parents suppress their popups', () => {
  const state = createLayerState(), closed = [];
  state.open('window', 'window', undefined, () => closed.push('window'));
  state.open('popup', 'popup', 'window', () => closed.push('popup'));
  state.requestClose('window'); state.requestClose('popup');
  assert.deepEqual(closed, ['popup']);
  state.remove('window');
  assert.equal(state.isActive('popup'), false);
  assert.equal(state.topWindow(), undefined);
});

test('a menu removed within the launch event retains its opening control for the new window', () => {
  const state = createLayerState(), trigger = { focus() {} }, item = { focus() {} };
  state.open('menu', 'popup', undefined, () => {}, trigger);
  state.remove('menu', item);
  state.open('dialog', 'window', undefined, () => {}, item);
  assert.equal(state.entries.get('dialog').returnTarget, trigger);
});

test('a window reopened during exit becomes active above a newer window', () => {
  const state = createLayerState();
  const trigger = { focus() {} };
  state.open('first', 'window', undefined, () => {}, trigger);
  state.markClosing('first');
  state.open('second', 'window', undefined, () => {});
  state.open('first', 'window', undefined, () => {});
  assert.equal(state.topWindow().id, 'first');
  assert.equal(state.entries.get('first').returnTarget, trigger);
  assert.equal(state.entries.get('first').owner, undefined);
  assert.equal(state.zIndex('first', 'content'), 1301);
  assert.equal(state.isActive('second'), false);
});

test('closing a parent suppresses its popups before the retained surface leaves', () => {
  const state = createLayerState(); let closes = 0;
  state.open('parent', 'window', undefined, () => {});
  state.open('popup', 'popup', 'parent', () => closes++);
  state.markClosing('parent'); state.markClosing('parent');
  assert.equal(state.isBlocked('popup'), true);
  assert.equal(closes, 1);
  state.open('parent', 'window', undefined, () => {});
  assert.equal(state.isActive('popup'), false);
  assert.equal(closes, 1);
});

test('restored input focus stays distinct from the next user focus', () => {
  const state = createLayerState(), input = { focus() {} };
  state.open('suggestions', 'popup', undefined, () => {}, input);
  state.open('window', 'window', undefined, () => {});
  assert.equal(state.remove('suggestions'), undefined);
  assert.equal(state.remove('window'), input);
  assert.equal(state.isRestoredFocus(input), true);
  state.clearRestoredFocus(input);
  assert.equal(state.isRestoredFocus(input), false);
});
