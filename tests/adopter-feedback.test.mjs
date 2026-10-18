import test from 'node:test';
import assert from 'node:assert/strict';
import { chooseReturnTarget } from '../shared/package-runtime/layer-state.ts';
import { optionMatchRank, selectOptions } from '../shared/package-runtime/options.ts';

test('chooseReturnTarget prefers a connected element, skips on false, else falls back', () => {
  const trigger = { isConnected: true, focus() {} }, chosen = { isConnected: true, focus() {} }, gone = { isConnected: false, focus() {} };
  assert.equal(chooseReturnTarget(chosen, trigger), chosen);
  assert.equal(chooseReturnTarget(false, trigger), undefined);
  assert.equal(chooseReturnTarget(gone, trigger), trigger);
  assert.equal(chooseReturnTarget(null, trigger), trigger);
  assert.equal(chooseReturnTarget(undefined, trigger), trigger);
});

const branches = [
  { label: '서울 지점', value: 1, code: 'SEL' },
  { label: '부산', value: 2, code: 'BUS' },
  { label: '서울', value: 3, code: 'S01' },
  { label: '인천 서울길', value: 4, code: 'ICN' },
];
const search = (query, extra = {}) => selectOptions({ options: branches, value: null, labelKey: 'label', valueKey: 'value', query,
  pageSize: 0, limit: 0, loading: false, multiple: false, ...extra }).matching.map(item => item.option.value);

test('Select search ranks label prefixes above label matches and keeps order within a rank', () => {
  assert.deepEqual(search('서울'), [1, 3, 4]);
  assert.deepEqual(search(''), [1, 2, 3, 4]);
  assert.deepEqual(search('   '), [1, 2, 3, 4]);
  assert.equal(optionMatchRank(branches[0], '서울', 'label'), 0);
  assert.equal(optionMatchRank(branches[3], '서울', 'label'), 1);
  assert.equal(optionMatchRank(branches[1], '서울', 'label'), -1);
});

test('Select searchKeys match other fields after label matches', () => {
  assert.deepEqual(search('bus'), []);
  assert.deepEqual(search('bus', { searchKeys: ['code'] }), [2]);
  assert.equal(optionMatchRank(branches[1], 'bus', 'label', ['code']), 2);
});

test('Select filterFn replaces matching and keeps the original order', () => {
  assert.deepEqual(search('서울', { filterFn: option => option.value !== 1 }), [2, 3, 4]);
  assert.deepEqual(search('anything', { filterFn: () => true }), [1, 2, 3, 4]);
});
