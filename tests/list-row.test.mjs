import test from 'node:test';
import assert from 'node:assert/strict';
import { listRowChoice, listRowKind, listSectionShape } from '../shared/package-runtime/list-row.ts';
import { listLeadingGeometry, listRowBleed } from '../shared/package-runtime/list-leading.ts';

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
  assert.deepEqual(listSectionShape({ group: 'open', title: 'a' }), { open: true, corner: 'none', bare: true, outside: false });
  assert.equal(listSectionShape({ variant: 'open', group: 'inset', radius: 'md' }).corner, 'none');
  assert.deepEqual(listSectionShape({ group: 'open', variant: 'default', radius: 'md' }), { open: false, corner: 'md', bare: false, outside: true });
  assert.equal(listSectionShape({ group: 'inset' }).open, false);
});

test('open rows put built-in icons on a 40px square, and tall leading content reaches into the padding', () => {
  assert.deepEqual(listLeadingGeometry({ custom: false, background: false, open: true }), { size: 'md', width: 40, iconSize: 20, tile: true });
  // An explicit size and custom content keep their own geometry in an open section.
  assert.equal(listLeadingGeometry({ size: 'sm', custom: false, background: false, open: true }).width, 32);
  assert.equal(listLeadingGeometry({ custom: true, background: false, open: true }).tile, false);
  // A 32px square in a 16px-padded row with a 20px title line moves 6px into the padding (the row stays 56); a 56px
  // square stops 6px from the edge; anything no taller than the line stays put.
  assert.equal(listRowBleed(32, 20, 16), -6);
  assert.equal(listRowBleed(56, 20, 16), -10);
  assert.equal(listRowBleed(28, 20, 12), -4);
  assert.equal(listRowBleed(16, 20, 16), 0);
});
