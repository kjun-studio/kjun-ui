import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';

const output = await build({ entryPoints: ['shared/package-runtime/table-presentation.ts'], bundle: true,
  write: false, format: 'esm', platform: 'node', define: { 'process.env.NODE_ENV': '"production"' } });
const { tablePresentation, tableCellValue, tableSortOptions, tableSortValue, tableSortFromValue } = await import('data:text/javascript;base64,' + Buffer.from(output.outputFiles[0].contents).toString('base64'));

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
  assert.deepEqual(layout.cardFields(row, layout.sections[0]).map(field => field.column.key), ['zero', 'flag']);
  // The subtitle reads under the title even beside badges, so it never repeats among the fields.
  assert.deepEqual(layout.cardFields(row, layout.sections[1]), []);
  assert.equal(layout.cardLayout, 'stacked');
  const highlighted = tablePresentation({ ...props, cardHighlight: 'zero', cardLayout: 'tiles' }, true);
  assert.equal(highlighted.highlight?.key, 'zero');
  assert.equal(highlighted.tiles, true);
  assert.deepEqual(highlighted.cardFields(row, highlighted.sections[0]).map(field => field.column.key), ['flag']);
  assert.equal(tablePresentation({ ...props, cardHighlight: 'title' }, true).highlight, undefined);
  // A badge, the actions, a column hidden in cards or the subtitle itself never becomes another card part.
  for (const key of ['badge', 'actions', 'hidden', 'subtitle']) assert.equal(tablePresentation({ ...props, cardHighlight: key }, true).highlight, undefined, key);
  assert.equal(tablePresentation({ ...props, cardSubtitle: 'title' }, true).subtitle, undefined);
  assert.equal(highlighted.footerActions, undefined);
  assert.equal(highlighted.cardFooter, false);
  assert.equal(tablePresentation({ ...props, cardLayout: 'rows' }, true).cardBody({ columns: [], layout: 'metrics' }), 'rows');
  const compact = tablePresentation({ ...props, responsive: 'compact', mobileColumns: ['zero', 'title'] }, true);
  assert.equal(compact.card, false);
  assert.deepEqual(compact.visible.map(column => column.key), ['title', 'zero']);
  assert.equal(tablePresentation(props, false).card, false);
});

test('narrow-screen sort choices cover each sortable column in both orders and round-trip', () => {
  const messages = { defaultOrder: 'Default', ascending: 'Up', descending: 'Down' };
  const columns = [{ key: 'name', label: 'Name' }, { key: 'a:b', label: 'Amount', sortable: true }];
  assert.deepEqual(tableSortOptions({ columns }, messages).map(option => option.value), ['', 'a:b:asc', 'a:b:desc']);
  assert.deepEqual(tableSortOptions({ columns, sortable: false }, messages), []);
  assert.deepEqual(tableSortFromValue(tableSortValue({ key: 'a:b', order: 'desc' })), { key: 'a:b', order: 'desc' });
  assert.deepEqual(tableSortFromValue(''), { key: '', order: 'asc' });
});

test('a card leaves out the fields the grid covers and reads a merged cell under its group', () => {
  // A badge column sits between the merged cell and the column it covers: spans follow the grid's column order.
  const columns = [{ key: 'name', label: '종목' }, { key: 'sales', label: '매출' }, { key: 'rating', label: '등급', badge: true },
    { key: 'profit', label: '영업이익' }, { key: 'target', label: '목표가' }];
  const props = { columns, responsive: 'card', columnGroups: [{ label: '실적', columns: ['sales', 'profit'] }],
    cellSpan: (row, column) => row.pending && column.key === 'sales' ? 3 : undefined };
  const layout = tablePresentation(props, true), fields = (row, section) => layout.cardFields(row, section).map(field => [field.column.key, field.label, field.full]);
  const [group, rest] = layout.sections;
  assert.deepEqual(fields({ name: 'A' }, group), [['sales', '매출', false], ['profit', '영업이익', false]]);
  // Merged over the badge and 영업이익, like the grid: 영업이익 goes, 목표가 stays, and the note takes the group's name and the whole line.
  assert.deepEqual(fields({ name: 'B', pending: true }, group), [['sales', '실적', true]]);
  assert.deepEqual(fields({ name: 'B', pending: true }, rest), [['target', '목표가', false]]);
  // Without a section name the note has no label; the app's cellSpan is asked once for a row.
  let calls = 0;
  const plain = tablePresentation({ columns, responsive: 'card', cellSpan: (row, column) => { calls++; return column.key === 'sales' ? 3 : undefined; } }, true), row = { name: 'C' };
  assert.deepEqual(plain.cardFields(row, plain.sections[0]).map(field => [field.column.key, field.label, field.full]), [['sales', '', true], ['target', '목표가', false]]);
  plain.cardFields(row, plain.sections[0]);
  // Asked once per row however often its fields are read: name, sales and target (the two covered columns are not asked).
  assert.equal(calls, 3);
});
