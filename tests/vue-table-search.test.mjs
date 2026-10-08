import { test } from 'node:test';
import assert from 'node:assert/strict';
import search from '../packages/vue2/src/source/data-display/table/search.js';

function model(t) {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const events = [];
  const vm = { ...search.data(), $emit: (name, value) => events.push([name, value]) };
  for (const [name, method] of Object.entries(search.methods)) vm[name] = method.bind(vm);
  return { vm, events };
}
test('clearing a pending Vue Table search emits empty once and cancels the earlier draft', t => {
  const { vm, events } = model(t);
  vm.searchQuery = 'old'; vm.handleSearch(); t.mock.timers.tick(100);
  vm.clearSearch(); t.mock.timers.tick(300);
  assert.deepEqual(events, [['search', '']]);
});
test('typing after clearing starts a fresh 300ms search window', t => {
  const { vm, events } = model(t);
  vm.searchQuery = 'old'; vm.handleSearch(); t.mock.timers.tick(100);
  vm.clearSearch(); vm.searchQuery = 'new'; vm.handleSearch();
  t.mock.timers.tick(299); assert.deepEqual(events, [['search', '']]);
  t.mock.timers.tick(1); assert.deepEqual(events, [['search', ''], ['search', 'new']]);
});
test('destroying a Vue Table cancels its pending search', t => {
  const { vm, events } = model(t);
  vm.searchQuery = 'old'; vm.handleSearch(); search.beforeDestroy.call(vm);
  t.mock.timers.tick(300); assert.deepEqual(events, []);
});
