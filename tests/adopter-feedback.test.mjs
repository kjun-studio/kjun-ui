import test from 'node:test';
import assert from 'node:assert/strict';
import { chooseReturnTarget } from '../shared/package-runtime/layer-state.ts';

test('chooseReturnTarget prefers a connected element, skips on false, else falls back', () => {
  const trigger = { isConnected: true, focus() {} }, chosen = { isConnected: true, focus() {} }, gone = { isConnected: false, focus() {} };
  assert.equal(chooseReturnTarget(chosen, trigger), chosen);
  assert.equal(chooseReturnTarget(false, trigger), undefined);
  assert.equal(chooseReturnTarget(gone, trigger), trigger);
  assert.equal(chooseReturnTarget(null, trigger), trigger);
  assert.equal(chooseReturnTarget(undefined, trigger), trigger);
});
