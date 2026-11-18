import test from 'node:test';
import assert from 'node:assert/strict';
import { compareTableValues, filterTableRows, sortTableRows, tableRowIndex, tableSelection, toggleAllRows, toggleSelectedRow } from '../shared/package-runtime/table-model.ts';

const sorted = (data, key, order = 'asc', extra = {}) => sortTableRows(data, { key, order }, extra).map(r => r[key]);

test('dates sort by time and empty values stay last in both directions', () => {
  const data = [{ d: new Date(2026, 2, 1) }, { d: null }, { d: new Date(2025, 0, 1) }, { d: undefined }, { d: new Date(2026, 0, 1) }];
  assert.deepEqual(sorted(data, 'd').map(d => d?.getFullYear?.() ?? d), [2025, 2026, 2026, null, undefined]);
  assert.deepEqual(sorted(data, 'd', 'desc').map(d => d?.getFullYear?.() ?? d), [2026, 2026, 2025, null, undefined]);
});

test('text sorts by locale with numbers inside it, mixed numbers compare numerically', () => {
  assert.deepEqual(sorted([{ t: 'item10' }, { t: 'item2' }, { t: 'B' }, { t: 'a' }], 't'), ['a', 'B', 'item2', 'item10']);
  assert.deepEqual(sorted([{ n: 10 }, { n: '9' }, { n: 1 }], 'n'), [1, '9', 10]);
  assert.ok(compareTableValues(false, true) < 0);
});

test('a column comparator replaces the shared order and equal values keep the data order', () => {
  const data = [{ id: 1, p: 'low' }, { id: 2, p: 'high' }, { id: 3, p: 'low' }];
  const rank = { low: 0, high: 1 };
  assert.deepEqual(sortTableRows(data, { key: 'p', order: 'asc' }, { compare: (a, b) => rank[a] - rank[b] }).map(r => r.id), [1, 3, 2]);
  assert.deepEqual(sortTableRows(data, { key: 'p', order: 'desc' }, { compare: (a, b) => rank[a] - rank[b] }).map(r => r.id), [2, 1, 3]);
});

test('rows without the rowKey field select one by one', () => {
  const a = { name: 'a' }, b = { name: 'b' };
  const state = tableSelection([a, b], [a], 'id');
  assert.equal(state.isSelected(a), true);
  assert.equal(state.isSelected(b), false);
  assert.equal(state.some, true);
  assert.deepEqual(toggleSelectedRow([a], b, 'id'), [a, b]);
  assert.deepEqual(toggleSelectedRow([a, b], a, 'id'), [b]);
});

test('the header checkbox keeps selections from other pages', () => {
  const page1 = [{ id: 1 }, { id: 2 }], page2 = [{ id: 3 }, { id: 4 }];
  const kept = [page1[0]];
  assert.deepEqual(toggleAllRows(page2, kept, 'id', false).map(r => r.id), [1, 3, 4]);
  assert.deepEqual(toggleAllRows(page2, [...kept, ...page2], 'id', true).map(r => r.id), [1]);
  const index = tableRowIndex(page2);
  assert.equal(index(page2[1]), 1);
  assert.equal(index({ id: 9 }), -1);
});

test('rowSelectable: locked rows are skipped by the header checkbox and do not keep it from filling', () => {
  const rows = [{ id: 1 }, { id: 2, locked: true }, { id: 3 }];
  const open = (row) => !row.locked;
  const none = tableSelection(rows, [], 'id', open);
  assert.equal(none.selectableCount, 2);
  assert.equal(none.isSelectable(rows[1]), false);
  const added = toggleAllRows(rows, [], 'id', none.all, open);
  assert.deepEqual(added.map(r => r.id), [1, 3]);
  const full = tableSelection(rows, added, 'id', open);
  assert.equal(full.all, true);
  assert.equal(full.some, false);
  // A locked row selected by the app stays when the header box clears the open rows.
  assert.deepEqual(toggleAllRows(rows, [...added, rows[1]], 'id', true, open).map(r => r.id), [2]);
  assert.equal(tableSelection(rows, [], 'id', () => false).all, false);
});

test('a client search keeps rows whose searched fields contain the query, ignoring case', () => {
  const rows = [{ name: 'Alpha', city: { name: '서울' }, n: 12 }, { name: 'beta', city: { name: '부산' }, n: 7 }];
  assert.deepEqual(filterTableRows(rows, ' ALP ', ['name']).map(r => r.name), ['Alpha']);
  assert.deepEqual(filterTableRows(rows, '부산', ['name', 'city.name']).map(r => r.name), ['beta']);
  assert.deepEqual(filterTableRows(rows, '12', ['n']).map(r => r.name), ['Alpha']);
  assert.equal(filterTableRows(rows, '  ', ['name']), rows);
  assert.deepEqual(filterTableRows(rows, 'object', ['city']), []);
});
