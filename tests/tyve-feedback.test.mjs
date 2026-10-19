import test from 'node:test';
import assert from 'node:assert/strict';
import { mergeIds } from '../shared/package-runtime/aria-ids.ts';

test('mergeIds joins id lists once each and drops empties', () => {
  assert.equal(mergeIds('a b', 'b', undefined, ' c '), 'a b c');
  assert.equal(mergeIds(undefined, '', null), undefined);
});
