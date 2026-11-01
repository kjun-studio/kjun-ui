import test from 'node:test';
import assert from 'node:assert/strict';
import { createTypeahead } from '../shared/package-runtime/typeahead.ts';

test('typed characters gather within the timeout and search from the current item', () => {
  const find = createTypeahead();
  const labels = ['Apple', 'Banana', 'Blueberry', 'Cherry'];
  assert.equal(find('b', labels, 0, 0), 1);
  assert.equal(find('l', labels, 1, 100), 2);
  assert.equal(find('c', labels, 2, 2000), 3);
  assert.equal(find('z', labels, 3, 4000), -1);
});

test('a space only joins a word already being typed', () => {
  const find = createTypeahead();
  assert.equal(find(' ', ['New file'], 0, 0), -1);
  assert.equal(find('n', ['New file'], 0, 0), 0);
  assert.equal(find(' ', ['New file', 'New folder'], 0, 10), -1);
  assert.equal(find('Shift', ['Shift'], 0, 20), -1);
});
