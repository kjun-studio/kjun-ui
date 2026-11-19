import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  marketCellKind, marketColumnFlash, marketPinnedIdentity, marketRowActivates, marketRowLabel, marketSortIcon, marketSortState, marketStatusColumn,
} from '../shared/package-runtime/market-table.ts';

const read = path => readFile(new URL('../' + path, import.meta.url), 'utf8');
const value = (row, key) => row[key];

test('every column maps to one cell kind', () => {
  assert.deepEqual(['name', 'symbol', 'stock_name'].map(key => marketCellKind({ key })), ['identity', 'identity', 'identity']);
  assert.equal(marketCellKind({ key: 'p', type: 'price' }), 'price');
  assert.equal(marketCellKind({ key: 'c', type: 'percent' }), 'percent');
  assert.equal(marketCellKind({ key: 's', type: 'sparkline' }), 'sparkline');
  assert.equal(marketCellKind({ key: 'f', type: 'net_amount' }), 'signed');
  assert.equal(marketCellKind({ key: 'v', type: 'volume' }), 'text');
  assert.equal(marketCellKind({ key: 'v' }), 'text');
});

test('column flash reaches PriceCell; the old "price" reads as true and "change" stays off', () => {
  assert.equal(marketColumnFlash({ key: 'p', flash: true }), true);
  assert.equal(marketColumnFlash({ key: 'p', flash: 'text' }), 'text');
  assert.equal(marketColumnFlash({ key: 'p', flash: 'background' }), 'background');
  assert.equal(marketColumnFlash({ key: 'p', flash: 'price' }), true);
  assert.equal(marketColumnFlash({ key: 'p', flash: 'change' }), undefined);
  assert.equal(marketColumnFlash({ key: 'p', flash: false }), undefined);
  assert.equal(marketColumnFlash({ key: 'p' }), undefined);
});

test('sort state and icon follow the sorted column only', () => {
  assert.equal(marketSortState({ key: 'a' }, 'a', 'asc'), undefined);
  assert.equal(marketSortState({ key: 'a', sortable: true }, 'b', 'asc'), 'none');
  assert.equal(marketSortState({ key: 'a', sortable: true }, 'a', 'asc'), 'ascending');
  assert.equal(marketSortState({ key: 'a', sortable: true }, 'a', 'desc'), 'descending');
  assert.deepEqual(['ascending', 'descending', 'none', undefined].map(marketSortIcon), ['sort-ascending', 'sort-descending', 'arrows-sort', 'arrows-sort']);
});

test('the status follows the first price column that shows a value', () => {
  const columns = [{ key: 'name' }, { key: 'bid', type: 'price' }, { key: 'ask', type: 'price' }];
  assert.equal(marketStatusColumn(columns, { bid: 1, ask: 2 }, () => false, value), 'bid');
  assert.equal(marketStatusColumn(columns, { bid: null, ask: 2 }, () => false, value), 'ask');
  assert.equal(marketStatusColumn(columns, { bid: 1, ask: 2 }, (_, c) => c.key === 'bid', value), 'ask');
  assert.equal(marketStatusColumn(columns, {}, () => false, value), undefined);
});

test('the row label prefers primaryLabel, then the name field', () => {
  assert.equal(marketRowLabel({ name: 'A' }, undefined, value), 'A');
  assert.equal(marketRowLabel({ name: 'A' }, row => `${row.name}!`, value), 'A!');
  assert.equal(marketRowLabel({}, undefined, value), '');
});

test('only a leading identity column is pinned, and only while stickyIdentity is on', () => {
  const columns = [{ key: 'name' }, { key: 'price' }];
  assert.equal(marketPinnedIdentity(columns, true), 'name');
  assert.equal(marketPinnedIdentity(columns, false), undefined);
  assert.equal(marketPinnedIdentity([{ key: 'price' }, { key: 'name' }], true), undefined);
  assert.equal(marketPinnedIdentity([{ key: 'name' }], true), undefined);
});

test('Enter and Space open a row', () => {
  assert.deepEqual(['Enter', ' ', 'Tab', 'a'].map(marketRowActivates), [true, true, false, false]);
});

test('every platform draws market cells from the shared runtime', async () => {
  for (const file of ['packages/react/src/market-table.tsx', 'packages/vue3/src/market-table.tsx', 'packages/native/src/market-table.tsx']) {
    const source = await read(file);
    for (const name of ['marketCellKind', 'marketColumnFlash', 'marketSortState', 'marketStatusColumn', 'marketPinnedIdentity'])
      assert.match(source, new RegExp(`\\b${name}\\(`), `${file} uses ${name}`);
    assert.doesNotMatch(source, /"stock_name", "name", "symbol"|"investor", "net_amount"/, `${file} keeps no local copy of the shared lists`);
  }
});
