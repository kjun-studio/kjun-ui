import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { searchDocuments } from '../shared/docs-search.mjs';
const read = file => JSON.parse(readFileSync(new URL(file, import.meta.url), 'utf8'));
const index = read('../apps/docs/lib/generated/discovery.json');
const catalog = read('../shared/component-catalog.json');
const search = query => searchDocuments(index.documents, query);

test('discovery covers every public component exactly once and keeps structural children adjacent', () => {
  const entries = index.documents.filter(document => document.component);
  assert.equal(entries.length, catalog.filter(entry => entry.kind !== "internal").length);
  assert.deepEqual(new Set(entries.map(entry => entry.component)), new Set(catalog.filter(entry => entry.kind !== 'internal').map(entry => entry.name)));
  assert.deepEqual(index.categories.map(category => category.count), [11, 16, 7, 8, 10, 14, 11]);
  assert.equal(entries.filter(entry => entry.parent).length, 4);
  assert.deepEqual(Object.fromEntries(entries.filter(entry => entry.parent).map(entry => [entry.component, entry.parent])), {
    DsDropdownDivider: 'DsDropdown', DsDropdownItem: 'DsDropdown', DsTabPane: 'DsTabs', DsAccordionItem: 'DsAccordion',
  });
  for (const entry of entries.filter(entry => entry.parent)) {
    const parentIndex = entries.findIndex(parent => parent.component === entry.parent);
    const preceding = entries.slice(parentIndex + 1, entries.indexOf(entry));
    assert.ok(parentIndex >= 0 && preceding.every(child => child.parent === entry.parent));
  }
});

test('names, Korean synonyms, purpose and API queries resolve to public documents', () => {
  for (const query of ['즐겨찾기', '관심', '별 토글', '하트 토글'])
    assert.ok(search(query).some(result => result.document.id === 'icon-toggle'), query);
  for (const id of ['collection-toggle', 'favorite-toggle', 'interest-toggle'])
    assert.ok(!index.documents.some(document => document.id === id));
  assert.deepEqual(new Set(search('알림').slice(0, 2).map(result => result.document.id)), new Set(['alert', 'feedback']));
  assert.ok(search('검색').slice(0, 3).some(result => result.document.id === 'search-input'));
  assert.ok(search('검색').slice(0, 3).some(result => result.document.id === 'combobox'));
  assert.equal(search('loadOptions')[0].href, '/components/search-input#api');
  assert.equal(search('queryKey')[0].href, '/components/data-state#api');
  assert.equal(search('SearchInput loadOptions')[0].href, '/components/search-input#api');
  for (const id of ['form-group', 'input', 'form-actions', 'modal'])
    assert.ok(search('저장 폼').some(result => result.document.id === id));
  for (const query of ['Toast', 'Confirm', 'Prompt', 'DsToast', 'ConfirmModal'])
    assert.equal(search(query)[0].document.id, 'feedback');
  for (const query of ['DsButton', 'ds-button', 'ＤｓＢｕｔｔｏｎ', 'BUTTON'])
    assert.equal(search(query)[0].document.id, 'button');
  assert.equal(search('Tab Pane')[0].document.id, 'tab-pane');
  assert.equal(search('데이터상태')[0].document.id, 'data-state');
  assert.equal(search('Table')[0].document.id, 'table');
  for (const [query, id] of [['Tag', 'chip'], ['수량', 'quantity-stepper'], ['범용 행', 'list-row'], ['DsRangeSlider', 'range-slider']]) assert.equal(search(query)[0].document.id, id, query);
  assert.equal(search('thumbLabels')[0].href, '/components/range-slider#api');
  assert.equal(search('없는검색어987654').length, 0);
  assert.equal(new Set(search('loading').map(result => result.document.path)).size, search('loading').length);
});

test('search destinations exist and only component records carry platform claims', () => {
  for (const document of index.documents) {
    assert.equal(!!document.platforms, !!document.component);
    if (document.component) {
      assert.equal(document.platforms.native.deviceVerification, 'not-run');
      assert.equal(document.path, catalog.find(entry => entry.name === document.component).docs);
    }
    if (document.api.length) assert.ok(document.sections.some(([id]) => id === 'api'));
  }
});
