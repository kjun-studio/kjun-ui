import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';

// combobox-options.ts imports its sibling options module without an extension, which Node cannot resolve, so the test bundles it.
const output = await build({ entryPoints: ['shared/package-runtime/combobox-options.ts'], bundle: true, write: false, format: 'esm', platform: 'node' });
const { comboboxOptions } = await import('data:text/javascript;base64,' + Buffer.from(output.outputFiles[0].contents).toString('base64'));

const options = [
  { value: 'a', label: 'Alpha', code: 'SUB' },
  { value: 'b', label: 'Beta', code: 'BTA' },
  { value: 'c', label: 'Alphabet', code: 'ABC' },
];
const labels = list => list.map(option => option.label);
const run = (query, extra = {}) => labels(comboboxOptions({ options, query, typed: true, labelKey: 'label', ...extra }));

test('Combobox shows every option until the user types after opening', () => {
  assert.deepEqual(labels(comboboxOptions({ options, query: 'Alpha', typed: false, labelKey: 'label' })), ['Alpha', 'Beta', 'Alphabet']);
});

test('Combobox ranks label prefix, label contains, then searchKeys and trims the query', () => {
  assert.deepEqual(run('b'), ['Beta', 'Alphabet']);
  // Alphabet contains "b" in its label (rank 1); Alpha only through its code SUB (rank 2).
  assert.deepEqual(run('b', { searchKeys: ['code'] }), ['Beta', 'Alphabet', 'Alpha']);
  assert.deepEqual(run('su', { searchKeys: ['code'] }), ['Alpha']);
  assert.deepEqual(run('  eta '), ['Beta']);
  assert.deepEqual(run(''), ['Alpha', 'Beta', 'Alphabet']);
});

test('A caller filterFn owns matching and keeps the original order', () => {
  assert.deepEqual(run('zzz', { filterFn: () => true }), ['Alpha', 'Beta', 'Alphabet']);
  assert.deepEqual(run('t', { filterFn: (option, query) => option.label.endsWith(query) }), ['Alphabet']);
});
