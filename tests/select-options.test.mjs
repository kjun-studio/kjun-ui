import test from 'node:test';
import assert from 'node:assert/strict';
import { isOptionGroup, selectOptions } from '../shared/package-runtime/options.ts';
import { hiddenLabelCount, selectClearStyle } from '../shared/package-runtime/select-trigger.ts';

const model = (options, extra = {}) => selectOptions({ options, value: null, labelKey: 'label', valueKey: 'value', query: '',
  pageSize: 0, limit: 0, loading: false, multiple: false, ...extra });
const cities = [
  { label: '한국', options: [{ label: '서울', value: 'sel' }, { label: '부산', value: 'bus' }] },
  { label: '일본', options: [{ label: '도쿄', value: 'tyo' }, { label: '오사카', value: 'osa' }] },
  { label: '기타', value: 'etc' },
];

test('Select groups flatten into titled sections in their given order', () => {
  const { sections, grouped, visible } = model(cities);
  assert.equal(grouped, true);
  assert.deepEqual(visible.map(item => item.option.value), ['sel', 'bus', 'tyo', 'osa', 'etc']);
  assert.deepEqual(sections.map(section => [section.label, section.items.map(item => item.option.value)]),
    [['한국', ['sel', 'bus']], ['일본', ['tyo', 'osa']], [undefined, ['etc']]]);
  assert.equal(isOptionGroup(cities[0]), true);
  assert.equal(isOptionGroup(cities[2]), false);
  assert.equal(model(['a', 'b']).grouped, false);
});

test('Select search drops a group with no matching option and ranks within each group', () => {
  const { sections } = model(cities, { query: '도' });
  assert.deepEqual(sections.map(section => section.label), ['일본']);
  const ranked = model([{ label: 'A', options: [{ label: '인천 서울', value: 1 }, { label: '서울', value: 2 }] }, { label: 'B', options: [{ label: '서울역', value: 3 }] }], { query: '서울' });
  assert.deepEqual(ranked.visible.map(item => item.option.value), [2, 1, 3]);
});

test('Select finds a selected option inside a group and pages across groups', () => {
  assert.equal(model(cities, { value: 'tyo' }).label, '도쿄');
  const paged = model(cities, { pageSize: 3, limit: 3 });
  assert.deepEqual(paged.sections.map(section => section.items.length), [2, 1]);
  assert.equal(paged.matching.length, 5);
});

test('Select multipleDisplay "labels" names the selection in value order; "count" keeps the count', () => {
  const options = [{ label: '디자인', value: 'd' }, { label: '개발', value: 'v' }, { label: '마케팅', value: 'm' }];
  const labels = model(options, { multiple: true, value: ['m', 'd'], multipleDisplay: 'labels' });
  assert.deepEqual(labels.labels, ['마케팅', '디자인']);
  assert.equal(labels.label, '마케팅, 디자인');
  assert.equal(model(options, { multiple: true, value: ['m', 'd'], selectedCount: count => `${count}개 선택됨` }).label, '2개 선택됨');
  assert.equal(model(options, { multiple: true, value: ['m'], multipleDisplay: 'labels' }).label, '마케팅');
});

test('Select reports a value even before its option has loaded', () => {
  assert.equal(model([], { value: 'x' }).hasValue, true);
  assert.equal(model([], { value: 'x' }).label, '');
  assert.equal(model([], { value: null }).hasValue, false);
  assert.equal(model([], { multiple: true, value: [] }).hasValue, false);
  assert.equal(model([], { value: 0 }).hasValue, true);
});

test('hiddenLabelCount counts the labels that end past the room', () => {
  assert.equal(hiddenLabelCount([40, 80, 120], 200), 0);
  assert.equal(hiddenLabelCount([40, 80, 120], 100), 1);
  assert.equal(hiddenLabelCount([40, 80, 120], 30), 3);
  assert.equal(hiddenLabelCount([40, 80.4], 80), 0);
});

test('selectClearStyle places the clear button before the indicator', () => {
  assert.deepEqual(selectClearStyle({ padding: 14, iconSize: 16, affixGap: 8, clearSize: 24 }), { right: 38, width: 24, height: 24, minHeight: 24 });
});
