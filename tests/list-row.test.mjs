import test from 'node:test';
import assert from 'node:assert/strict';
import { listRowChoice, listRowKind } from '../shared/package-runtime/list-row.ts';

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
