import test from 'node:test';
import assert from 'node:assert/strict';
import { drawerFrame, keyboardEvents, keyboardOverlap } from '../shared/package-runtime/drawer-geometry.ts';

const base = { windowHeight: 800, safeAreaTop: 40, safeAreaBottom: 30, gap: 48, keyboard: 0 };

test('keyboardOverlap measures only the part of the window the keyboard covers', () => {
  assert.equal(keyboardOverlap(800, 500), 300);
  // Android already resized the window: the keyboard starts at its bottom edge.
  assert.equal(keyboardOverlap(500, 500), 0);
  assert.equal(keyboardOverlap(800, 900), 0);
});

test('a bottom sheet clears the top safe area plus the gap and pads the bottom safe area', () => {
  assert.deepEqual(drawerFrame({ ...base, position: 'bottom' }), { maxHeight: 712, height: undefined, paddingTop: 0, paddingBottom: 30, lift: 0 });
  assert.equal(drawerFrame({ ...base, position: 'bottom', maxHeight: 300 }).maxHeight, 300);
  assert.equal(drawerFrame({ ...base, position: 'bottom', maxHeight: 2000 }).maxHeight, 800);
});

test('a bottom sheet rises above the keyboard and drops the bottom safe area while it shows', () => {
  assert.deepEqual(drawerFrame({ ...base, position: 'bottom', keyboard: 300 }), { maxHeight: 412, height: undefined, paddingTop: 0, paddingBottom: 0, lift: 300 });
});

test('a top sheet pads the top safe area and stops short of the bottom', () => {
  assert.deepEqual(drawerFrame({ ...base, position: 'top' }), { maxHeight: 722, height: undefined, paddingTop: 40, paddingBottom: 0, lift: 0 });
  assert.equal(drawerFrame({ ...base, position: 'top', keyboard: 300 }).maxHeight, 452);
});

test('side drawers take the visible height and pad both safe areas', () => {
  assert.deepEqual(drawerFrame({ ...base, position: 'right' }), { maxHeight: 800, height: 800, paddingTop: 40, paddingBottom: 30, lift: 0 });
  assert.deepEqual(drawerFrame({ ...base, position: 'left', keyboard: 300 }), { maxHeight: 500, height: 500, paddingTop: 40, paddingBottom: 0, lift: 0 });
});

test('iOS and Android lift the drawer for the keyboard; the web has none', () => {
  assert.deepEqual(keyboardEvents('ios'), { show: 'keyboardWillShow', hide: 'keyboardWillHide' });
  // Edge-to-edge Android windows no longer resize for the keyboard, and Android only reports after it moves.
  assert.deepEqual(keyboardEvents('android'), { show: 'keyboardDidShow', hide: 'keyboardDidHide' });
  assert.equal(keyboardEvents('web'), null);
});

test('measured against the modal root, a resized Android window does not lift twice', () => {
  // Edge-to-edge: the root keeps the full screen and the keyboard covers its bottom.
  assert.equal(keyboardOverlap(800, 500), 300);
  // adjustResize still applies: the root already stops at the keyboard (or above it, below the status bar).
  assert.equal(keyboardOverlap(476, 500), 0);
});
