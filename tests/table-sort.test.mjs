import test from 'node:test';
import assert from 'node:assert/strict';
import { nextTableSort } from '../packages/tokens/dist/index.js';

test('table sort cycles ascending, descending and original order without mutating prior state', () => {
  let state = null;
  for (const expected of [
    { key: 'amount', order: 'asc' },
    { key: 'amount', order: 'desc' },
    { key: '', order: 'asc' },
    { key: 'amount', order: 'asc' },
  ]) {
    if (state) Object.freeze(state);
    state = nextTableSort(state, 'amount');
    assert.deepEqual(state, expected);
  }
});

test('changing columns starts ascending from either direction or an explicitly cleared sort', () => {
  for (const state of [null, { key: '', order: 'asc' }, { key: 'amount', order: 'asc' }, { key: 'amount', order: 'desc' }]) {
    assert.deepEqual(nextTableSort(state, 'name'), { key: 'name', order: 'asc' });
  }
});
