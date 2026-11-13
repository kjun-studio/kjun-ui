import test from 'node:test';
import assert from 'node:assert/strict';
import { tableHeaderRows, tableSpans } from '../shared/package-runtime/table-columns.ts';

const cols = keys => keys.map(key => ({ key }));
const shape = rows => rows && rows.map(cell => cell.kind === 'group' ? `[${cell.label}:${cell.columns.map(c => c.key).join(',')}]` : cell.column.key);

test('without groups that touch a shown column the header stays one row', () => {
  assert.equal(tableHeaderRows(cols(['a', 'b']), undefined), null);
  assert.equal(tableHeaderRows(cols(['a', 'b']), []), null);
  assert.equal(tableHeaderRows(cols(['a', 'b']), [{ label: 'X', columns: ['z'] }]), null);
});

test('a group spans its shown columns; the others stand alone over both rows', () => {
  assert.deepEqual(shape(tableHeaderRows(cols(['name', 'sales', 'profit', 'target']), [{ label: '실적', columns: ['sales', 'profit'] }])),
    ['name', '[실적:sales,profit]', 'target']);
  // A hidden column drops out of its group, and a group with no shown column is gone.
  assert.deepEqual(shape(tableHeaderRows(cols(['name', 'profit']), [{ label: '실적', columns: ['sales', 'profit'] }, { label: 'Y', columns: ['q'] }])),
    ['name', '[실적:profit]']);
  // Shown columns are never reordered: a group split by another column becomes two runs with the same label.
  assert.deepEqual(shape(tableHeaderRows(cols(['a', 'x', 'b']), [{ label: 'G', columns: ['a', 'b'] }])), ['[G:a]', 'x', '[G:b]']);
  // A column listed by two groups belongs to the first.
  assert.deepEqual(shape(tableHeaderRows(cols(['a', 'b']), [{ label: 'G', columns: ['a'] }, { label: 'H', columns: ['a', 'b'] }])), ['[G:a]', '[H:b]']);
  const [group] = tableHeaderRows(cols(['a', 'b']), [{ label: 'G', columns: ['a', 'b'] }]);
  assert.equal(group.span, 2);
  assert.equal(typeof group.key, 'string');
});

test('a cell span covers the next columns and never runs past the row', () => {
  const columns = cols(['name', 'sales', 'profit', 'target']);
  assert.deepEqual(tableSpans(columns, column => column.key === 'sales' ? 2 : undefined), [1, 2, 0, 1]);
  assert.deepEqual(tableSpans(columns, column => column.key === 'profit' ? 9 : null), [1, 1, 2, 0]);
  assert.deepEqual(tableSpans(columns, column => column.key === 'name' ? 4 : 1), [4, 0, 0, 0]);
  // Spans that are not whole numbers above one are ignored; a covered column's own span is too.
  assert.deepEqual(tableSpans(columns, column => ({ name: 0, sales: 2.5, profit: -1, target: Number.NaN })[column.key]), [1, 1, 1, 1]);
  assert.deepEqual(tableSpans(columns, column => ({ name: 2, sales: 3 })[column.key]), [2, 0, 1, 1]);
  assert.deepEqual(tableSpans(columns, undefined), [1, 1, 1, 1]);
  assert.deepEqual(tableSpans([], () => 2), []);
});

