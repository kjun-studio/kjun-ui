import test from 'node:test';
import assert from 'node:assert/strict';
import { linkRel, listRowChoice, listRowCurrent, listRowEnd, listRowKind, listRowMetrics, listSectionShape, warnListRowProps, warnListSectionProps, warnListSelection } from '../shared/package-runtime/list-row.ts';
import { listLeadingGeometry, listRowBleed } from '../shared/package-runtime/list-leading.ts';
import { nodeText } from '../shared/package-runtime/node-text.ts';

test('a switch row wins, a row given selected is a radio, then link, button and static', () => {
  assert.equal(listRowKind({ checked: false, href: '/x', pressable: true }), 'switch');
  assert.equal(listRowKind({ selected: false, pressable: true }), 'radio');
  assert.equal(listRowKind({ selected: false, pressable: true, mode: 'multiple' }), 'checkbox');
  assert.equal(listRowKind({ selected: true, pressable: false }), 'static');
  assert.equal(listRowKind({ href: '/x', pressable: true }), 'link');
  assert.equal(listRowKind({ pressable: true }), 'button');
  assert.equal(listRowKind({ pressable: false }), 'static');
});

test('a section that owns its value selects rows by value and reports the next value', () => {
  const calls = [];
  const single = { mode: 'single', value: 'a', onValueChange: value => calls.push(value) };
  assert.equal(listRowChoice(single, 'a', false).selected, true);
  const other = listRowChoice(single, 'b', true);
  assert.equal(other.selected, false);
  other.press(); listRowChoice(single, 'a').press();
  assert.deepEqual(calls, ['b']);
  // null is "nothing chosen yet", still owned by the section.
  assert.equal(listRowChoice({ mode: 'single', value: null }, 'a').owned, true);
  const multiple = { mode: 'multiple', value: ['a'], onValueChange: value => calls.push(value) };
  listRowChoice(multiple, 'b').press(); listRowChoice(multiple, 'a').press();
  assert.deepEqual(calls.slice(1), [['a', 'b'], []]);
  // Without a section value, or a row value, or a selection mode, the row keeps its own selected.
  for (const [selection, value] of [[{ mode: 'single' }, 'a'], [single, undefined], [{ mode: 'none', value: 'a' }, 'a']])
    assert.deepEqual(listRowChoice(selection, value, true), { selected: true, owned: false, press: undefined });
});

test('an open section has no card; its group or its own variant opens it', () => {
  assert.deepEqual(listSectionShape({ group: 'open', title: 'a' }), { open: true, details: false, corner: 'none', bare: true, outside: false });
  assert.equal(listSectionShape({ variant: 'open', group: 'inset', radius: 'md' }).corner, 'none');
  assert.deepEqual(listSectionShape({ group: 'open', variant: 'default', radius: 'md' }), { open: false, details: false, corner: 'md', bare: false, outside: true });
  assert.equal(listSectionShape({ group: 'inset' }).open, false);
});

test('open rows put built-in icons on a 40px square, and tall leading content reaches into the padding', () => {
  assert.deepEqual(listLeadingGeometry({ custom: false, background: false, open: true }), { size: 'md', width: 40, column: 40, iconSize: 20, tile: true });
  // A sized box under the 40px leading column keeps that column, so an icon square's title lines up with an avatar's.
  assert.deepEqual([listLeadingGeometry({ custom: false, background: true }).width, listLeadingGeometry({ custom: false, background: true }).column], [32, 40]);
  assert.equal(listLeadingGeometry({ size: 'lg', custom: true, background: false }).column, 56);
  assert.equal(listLeadingGeometry({ custom: false, background: false }).column, 24);
  // An explicit size and custom content keep their own geometry in an open section.
  assert.equal(listLeadingGeometry({ size: 'sm', custom: false, background: false, open: true }).width, 32);
  assert.equal(listLeadingGeometry({ custom: true, background: false, open: true }).tile, false);
  // Leading content and switches may reach into the padding up to 6px from the row's edge, whatever their size.
  assert.equal(listRowBleed(16), -10);
  assert.equal(listRowBleed(12), -6);
  assert.equal(listRowBleed(4), 0);
});

test('choice rows draw a mark in open and multiple-choice lists, other chosen rows a check', () => {
  assert.equal(listRowEnd({ kind: 'radio', selected: false, mode: 'single', open: true }), 'mark');
  assert.equal(listRowEnd({ kind: 'checkbox', selected: false, mode: 'multiple', open: false }), 'mark');
  assert.equal(listRowEnd({ kind: 'radio', selected: true, mode: 'single', open: false }), 'check');
  assert.equal(listRowEnd({ kind: 'radio', selected: false, mode: 'single', open: false }), null);
  assert.equal(listRowEnd({ kind: 'static', selected: true, mode: 'none', open: true }), 'check');
});

test('an explicit divider on an open section warns once in development', t => {
  const env = process.env.NODE_ENV, warnings = [];
  process.env.NODE_ENV = 'development';
  t.mock.method(console, 'warn', message => warnings.push(message));
  try {
    warnListSectionProps({ open: false, divider: true });
    warnListSectionProps({ open: true });
    warnListSectionProps({ open: true, divider: false });
    assert.deepEqual(warnings, []);
    warnListSectionProps({ open: true, divider: true });
    warnListSectionProps({ open: true, divider: true });
    assert.equal(warnings.length, 1);
    assert.match(warnings[0], /^KJUN ListSection: divider has no effect in an open section/);
  } finally { if (env === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = env; }
});

test('a busy pressable row spins in place of its end, a switch row and a static row do not', () => {
  assert.equal(listRowEnd({ kind: 'radio', selected: true, mode: 'single', open: true, busy: true }), 'spinner');
  assert.equal(listRowEnd({ kind: 'button', mode: 'none', open: false, busy: true }), 'spinner');
  assert.equal(listRowEnd({ kind: 'link', mode: 'none', open: false, busy: true }), 'spinner');
  assert.equal(listRowEnd({ kind: 'switch', mode: 'none', open: false, busy: true }), null);
  assert.equal(listRowEnd({ kind: 'static', selected: true, mode: 'none', open: false, busy: true }), 'check');
});

test('row metrics follow the section variant and density, like the web row variables', () => {
  assert.deepEqual(listRowMetrics({ open: false, compact: false }), { paddingY: 16, paddingX: 16, gap: 12, minimumHeight: 56, actionsPadding: 16, title: 'label', description: 'caption', trailing: 'body' });
  assert.equal(listRowMetrics({ open: false, compact: true }).minimumHeight, 44);
  assert.equal(listRowMetrics({ open: false, compact: true }).paddingY, 12);
  assert.deepEqual(listRowMetrics({ open: true, compact: false }), { paddingY: 12, paddingX: 12, gap: 14, minimumHeight: 64, actionsPadding: 12, title: 'input', description: 'body', trailing: 'label' });
  assert.equal(listRowMetrics({ open: true, compact: true }).minimumHeight, 56);
  assert.equal(listRowMetrics({ open: true, compact: true }).paddingY, 8);
});

test('a details section reads its rows: 32 tall, body label, label-weight value, density ignored', () => {
  const details = { paddingY: 6, paddingX: 16, gap: 12, minimumHeight: 32, actionsPadding: 16, title: 'body', description: 'caption', trailing: 'label' };
  assert.deepEqual(listRowMetrics({ open: false, compact: false, details: true }), details);
  assert.deepEqual(listRowMetrics({ open: false, compact: true, details: true }), details);
});

test('details is a section variant of its own: never open, a card in an inset group, not inherited from the group', () => {
  assert.deepEqual(listSectionShape({ variant: 'details', title: 'a' }), { open: false, details: true, corner: 'none', bare: true, outside: false });
  assert.deepEqual(listSectionShape({ variant: 'details', group: 'inset' }), { open: false, details: true, corner: 'lg', bare: false, outside: true });
  assert.equal(listSectionShape({ variant: 'details', group: 'open' }).open, false);
  assert.equal(listSectionShape({ group: 'flush' }).details, false);
});

test('density on a details section and a pressable row in one warn once in development', t => {
  const env = process.env.NODE_ENV, warnings = [];
  process.env.NODE_ENV = 'development';
  t.mock.method(console, 'warn', message => warnings.push(message));
  try {
    warnListSectionProps({ open: false, details: true });
    warnListSectionProps({ open: false, details: false, compact: true });
    warnListRowProps({ pressableDetails: false });
    assert.deepEqual(warnings, []);
    warnListSectionProps({ open: false, details: true, compact: true });
    warnListSectionProps({ open: false, details: true, compact: true });
    warnListRowProps({ pressableDetails: true });
    warnListRowProps({ pressableDetails: true });
    assert.equal(warnings.length, 2);
    assert.match(warnings[0], /^KJUN ListSection: density has no effect in a details section/);
    assert.match(warnings[1], /^KJUN ListRow: a details section's rows are 32 tall/);
  } finally { if (env === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = env; }
});

test('a section value that would be ignored warns once in development', t => {
  const env = process.env.NODE_ENV, warnings = [];
  process.env.NODE_ENV = 'development';
  t.mock.method(console, 'warn', message => warnings.push(message));
  try {
    warnListSelection({ mode: 'single', value: 'a', handled: true });
    warnListSelection({ mode: 'multiple', value: ['a'], handled: true });
    warnListSelection({ mode: 'single', value: undefined, handled: false });
    assert.deepEqual(warnings, []);
    warnListSelection({ mode: 'none', value: 'a', handled: true });
    warnListSelection({ mode: 'multiple', value: 'a', handled: true });
    warnListSelection({ mode: 'single', value: ['a'], handled: true });
    warnListSelection({ mode: 'single', value: 'a', handled: false });
    warnListSelection({ mode: 'single', value: 'a', handled: false });
    assert.equal(warnings.length, 4);
    assert.match(warnings[0], /^KJUN ListSection: value has no effect without selectionMode/);
    assert.match(warnings[1], /"multiple" takes a list/);
    assert.match(warnings[2], /"single" takes one value/);
    assert.match(warnings[3], /without onValueChange/);
  } finally { if (env === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = env; }
});

test('a link row opened in a new tab drops the opener and referrer unless the app gives its own rel', () => {
  assert.equal(linkRel('_blank'), 'noopener noreferrer');
  assert.equal(linkRel('_blank', 'noopener'), 'noopener');
  assert.equal(linkRel(undefined), undefined);
  assert.equal(linkRel('_self'), undefined);
  assert.equal(linkRel(undefined, 'nofollow'), 'nofollow');
});

test('a current row marks its link as the page and other rows as true; switch and choice rows keep their own state', () => {
  assert.equal(listRowCurrent('link', true), 'page');
  assert.equal(listRowCurrent('button', true), 'true');
  assert.equal(listRowCurrent('static', true), 'true');
  for (const kind of ['switch', 'radio', 'checkbox']) assert.equal(listRowCurrent(kind, true), undefined);
  assert.equal(listRowCurrent('link', false), undefined);
});

test('a Native row reads the text of element badges and values, a badge by its label or count', () => {
  const el = (props) => ({ $$typeof: Symbol.for('react.element'), type: () => null, props });
  assert.equal(nodeText('3개월 전'), '3개월 전');
  assert.equal(nodeText(12), '12');
  assert.equal(nodeText(el({ children: 'New' })), 'New');
  assert.equal(nodeText(el({ children: [el({ children: '29,000' }), '원'] })), '29,000 원');
  assert.equal(nodeText(el({ label: '읽지 않은 알림 3개', count: 3 })), '읽지 않은 알림 3개');
  assert.equal(nodeText(el({ count: 120 })), '99+');
  assert.equal(nodeText(el({ count: 0 })), undefined);
  assert.equal(nodeText(el({ name: 'check' })), undefined);
  assert.equal(nodeText(null), undefined);
});
