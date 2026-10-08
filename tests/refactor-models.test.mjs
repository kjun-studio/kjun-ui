import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';

const output = await build({ entryPoints: ['shared/package-runtime/table-presentation.ts'], bundle: true,
  write: false, format: 'esm', platform: 'node', define: { 'process.env.NODE_ENV': '"production"' } });
const { tablePresentation, tableCellValue } = await import('data:text/javascript;base64,' + Buffer.from(output.outputFiles[0].contents).toString('base64'));

test('Table cell precedence respects deliberate empty, zero and false render results', () => {
  const row = { metric: 0 }, calls = [];
  const column = { key: 'metric', label: 'Metric', render: () => { calls.push('render'); return false; },
    format: () => { calls.push('format'); return 0; } };
  const props = { columns: [column], renderCell: () => { calls.push('cell'); return null; },
    formatValue: () => { calls.push('fallback'); return 'Fallback'; } };
  assert.deepEqual(tableCellValue(props, column, row, 0), { value: 0, body: null });
  assert.deepEqual(calls.splice(0), ['cell']);
  delete props.renderCell;
  assert.equal(tableCellValue(props, column, row, 0).body, false);
  assert.deepEqual(calls.splice(0), ['render']);
  delete column.render;
  assert.equal(tableCellValue(props, column, row, 0).body, 0);
  assert.deepEqual(calls, ['format']);
});

test('Table card sections preserve subtitle data behind badges, unassigned fields and falsy values', () => {
  const columns = [
    { key: 'title', label: 'Title' }, { key: 'subtitle', label: 'Subtitle' },
    { key: 'badge', label: 'Badge', badge: true },
    { key: 'zero', label: 'Zero', hideEmptyInCard: true },
    { key: 'flag', label: 'Flag', hideEmptyInCard: true },
    { key: 'empty', label: 'Empty', hideEmptyInCard: true },
    { key: 'hidden', label: 'Hidden', hideInCard: true },
    { key: 'actions', label: 'Actions', inlineInCard: true },
  ];
  const props = { columns, responsive: 'card', cardSubtitle: 'subtitle',
    cardSections: [{ columns: ['flag', 'zero', 'empty', 'hidden'] }] };
  const row = { title: 'A', subtitle: 'Details', badge: 'Active', zero: 0, flag: false, empty: '' };
  const layout = tablePresentation(props, true);
  assert.equal(layout.card, true);
  assert.deepEqual(layout.columnsForSection(row, layout.sections[0]).map(column => column.key), ['zero', 'flag']);
  assert.deepEqual(layout.columnsForSection(row, layout.sections[1]).map(column => column.key), ['subtitle']);
  const withoutBadge = tablePresentation({ ...props, columns: columns.filter(column => !column.badge) }, true);
  assert.deepEqual(withoutBadge.columnsForSection(row, withoutBadge.sections[1]), []);
  const compact = tablePresentation({ ...props, responsive: 'compact', mobileColumns: ['zero', 'title'] }, true);
  assert.equal(compact.card, false);
  assert.deepEqual(compact.visible.map(column => column.key), ['title', 'zero']);
  assert.equal(tablePresentation(props, false).card, false);
});
