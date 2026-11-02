import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';

// table-groups imports table-model without an extension, so bundle it like package-runtime-cores.test.mjs.
const output = await build({ entryPoints: ['shared/package-runtime/table-groups.ts'], bundle: true, write: false, format: 'esm', platform: 'node' });
const { formatSummary, groupTableRows, summarizeColumn } = await import('data:text/javascript;base64,' + Buffer.from(output.outputFiles[0].contents).toString('base64'));

const rows = [
  { id: 1, status: '진행 중', amount: 4800, meta: { team: 'a' } },
  { id: 2, status: '검토', amount: 3200, meta: { team: 'b' } },
  { id: 3, status: '진행 중', amount: 2400, meta: { team: 'a' } },
  { id: 4, status: null, amount: 'n/a', meta: { team: 'b' } },
];

test('groupTableRows keeps first-appearance order and the row order inside each group', () => {
  const groups = groupTableRows(rows, 'status');
  // Keys carry the value's type, so 1 and "1" (or null and "") never merge.
  assert.deepEqual(groups.map(g => g.key), ['string:진행 중', 'string:검토', 'null:']);
  assert.deepEqual(groups[0].rows.map(r => r.id), [1, 3]);
  assert.equal(groups[2].value, null);
  assert.deepEqual(groupTableRows(rows, 'meta.team').map(g => g.rows.length), [2, 2]);
  assert.equal(groupTableRows(rows, undefined), null);
});

test('summarizeColumn counts rows and reads only finite numbers for the other kinds', () => {
  assert.equal(summarizeColumn(rows, 'amount', 'count'), 4);
  assert.equal(summarizeColumn(rows, 'amount', 'sum'), 10400);
  assert.equal(summarizeColumn(rows, 'amount', 'average'), 10400 / 3);
  assert.equal(summarizeColumn(rows, 'amount', 'min'), 2400);
  assert.equal(summarizeColumn(rows, 'amount', 'max'), 4800);
  assert.equal(summarizeColumn(rows, 'status', 'sum'), null);
  assert.equal(formatSummary(null, 'sum'), '');
  assert.equal(formatSummary(3466.6666, 'average'), new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(3466.6666));
});
