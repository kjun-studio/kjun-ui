import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';

// Framework-free cores that both the React hooks and the Vue 3 composables use.
async function load(entry) {
  const output = await build({ entryPoints: [entry], bundle: true, write: false, format: 'esm', platform: 'node',
    alias: { '@kjun-ui/tokens': './packages/tokens/src/index.ts' }, define: { 'process.env.NODE_ENV': '"production"' } });
  return import('data:text/javascript;base64,' + Buffer.from(output.outputFiles[0].contents).toString('base64'));
}

test('table core sorts numbers and text, keeps server order and leaves the input untouched', async () => {
  const { sortTableRows } = await load('shared/package-runtime/table-model.ts');
  const data = Object.freeze([{ id: 1, n: 10, s: 'b' }, { id: 2, n: 2, s: 'c' }, { id: 3, n: 33, s: 'a' }]);
  assert.deepEqual(sortTableRows(data, { key: 'n', order: 'asc' }, {}).map(r => r.id), [2, 1, 3]);
  assert.deepEqual(sortTableRows(data, { key: 's', order: 'desc' }, {}).map(r => r.id), [2, 1, 3]);
  assert.equal(sortTableRows(data, { key: 'n', order: 'asc' }, { sortMode: 'server' }), data);
  assert.equal(sortTableRows(data, { key: 'n', order: 'asc' }, { sortable: false }), data);
  assert.equal(sortTableRows(data, { key: '', order: 'asc' }, {}), data);
});

test('table core selection follows row keys, including nested keys', async () => {
  const { tableSelection, toggleSelectedRow, toggleAllRows } = await load('shared/package-runtime/table-model.ts');
  const rows = [{ meta: { id: 'a' } }, { meta: { id: 'b' } }];
  const partial = tableSelection(rows, [{ meta: { id: 'a' } }], 'meta.id');
  assert.equal(partial.isSelected(rows[0]), true);
  assert.deepEqual([partial.all, partial.some], [false, true]);
  assert.deepEqual(toggleSelectedRow([rows[0]], rows[0], 'meta.id'), []);
  assert.deepEqual(toggleSelectedRow([rows[0]], rows[1], 'meta.id'), rows);
  // The header checkbox clears or adds the shown rows only.
  assert.deepEqual(toggleAllRows(rows, rows, 'meta.id', true), []);
  assert.deepEqual(toggleAllRows(rows, [], 'meta.id', false), rows);
  const empty = tableSelection([], [], 'id');
  assert.deepEqual([empty.all, empty.some], [false, false]);
});

test('table core expansion toggles one id and honours single expansion', async () => {
  const { toggleExpandedRow, tableRowKey } = await load('shared/package-runtime/table-model.ts');
  assert.deepEqual(toggleExpandedRow([1, 2], 2, false), [1]);
  assert.deepEqual(toggleExpandedRow([1], 3, false), [1, 3]);
  assert.deepEqual(toggleExpandedRow([1], 3, true), [3]);
  assert.equal(tableRowKey({ id: 7 }, 'id', 4), 7);
  assert.equal(tableRowKey({}, 'id', 4), 4);
});

test('cardLayout decides headings, titled rows, tint and side media the same for every platform', async () => {
  const { cardLayout } = await load('shared/package-runtime/card-layout.ts');
  const parts = { header: false, title: true, subtitle: false, actions: true, body: true, footer: false, media: false };
  const base = { pressable: false, headingLevel: 3, surface: 'default', padding: 'md', mediaPosition: 'top' };
  const plain = cardLayout(parts, base);
  assert.deepEqual([plain.heading, plain.header, plain.titled, plain.titleLevel, plain.tinted, plain.headerGap, plain.sideMedia], [true, true, true, 3, false, 12, false]);
  assert.equal(cardLayout(parts, { ...base, pressable: true }).titleLevel, false);
  assert.equal(cardLayout({ ...parts, header: true }, base).titled, false);
  assert.equal(cardLayout({ ...parts, title: false }, base).heading, false);
  assert.equal(cardLayout({ ...parts, title: false }, base).header, true);
  assert.equal(cardLayout(parts, { ...base, surface: 'muted' }).tinted, true);
  assert.equal(cardLayout(parts, { ...base, surface: 'glass' }).tinted, false);
  assert.equal(cardLayout({ ...parts, media: true }, { ...base, mediaPosition: 'start' }).sideMedia, true);
  assert.equal(cardLayout(parts, { ...base, mediaPosition: 'start' }).sideMedia, false);
});
