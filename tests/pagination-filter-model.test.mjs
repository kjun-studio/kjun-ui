import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';

async function load(entry) {
  const output = await build({ entryPoints: [entry], bundle: true, write: false, format: 'esm', platform: 'node' });
  return import('data:text/javascript;base64,' + Buffer.from(output.outputFiles[0].contents).toString('base64'));
}
const show = items => items.map(n => (typeof n === 'number' ? n : '…')).join(' ');

test('pagination keeps one length on every page and never hides a single page behind an ellipsis', async () => {
  const { paginationItems } = await load('shared/package-runtime/pagination.ts');
  const lines = Array.from({ length: 10 }, (_, i) => show(paginationItems(i + 1, 10)));
  assert.deepEqual(lines, [
    '1 2 3 4 5 … 10', '1 2 3 4 5 … 10', '1 2 3 4 5 … 10', '1 2 3 4 5 … 10',
    '1 … 4 5 6 … 10', '1 … 5 6 7 … 10',
    '1 … 6 7 8 9 10', '1 … 6 7 8 9 10', '1 … 6 7 8 9 10', '1 … 6 7 8 9 10',
  ]);
  for (let page = 1; page <= 30; page++) assert.equal(paginationItems(page, 30, 2).length, 9);
  assert.equal(show(paginationItems(3, 7)), '1 2 3 4 5 6 7');
  assert.equal(show(paginationItems(1, 1)), '1');
  assert.deepEqual(paginationItems(1, 0), []);
  assert.equal(show(paginationItems(50, 10)), '1 … 6 7 8 9 10');
  assert.equal(show(paginationItems(5, 20, 0)), '1 … 5 … 20');
});

test('page rows give the first and last row on the page', async () => {
  const { pageRows } = await load('shared/package-runtime/pagination.ts');
  assert.deepEqual(pageRows(5, 20, 195), { from: 81, to: 100 });
  assert.deepEqual(pageRows(10, 20, 195), { from: 181, to: 195 });
});

test('filter value toggles in multiple mode and "all" (null) clears', async () => {
  const { nextFilterValue, filterSelected } = await load('shared/package-runtime/filter-value.ts');
  assert.equal(nextFilterValue('a', 'b', false), 'b');
  assert.deepEqual(nextFilterValue(['a'], 'b', true), ['a', 'b']);
  assert.deepEqual(nextFilterValue(['a', 'b'], 'a', true), ['b']);
  assert.deepEqual(nextFilterValue(['a'], null, true), []);
  assert.deepEqual(nextFilterValue(null, 'a', true), ['a']);
  assert.equal(filterSelected([], null, true), true);
  assert.equal(filterSelected(['a'], null, true), false);
  assert.equal(filterSelected(['a'], 'a', true), true);
  assert.equal(filterSelected('a', 'a', false), true);
});
