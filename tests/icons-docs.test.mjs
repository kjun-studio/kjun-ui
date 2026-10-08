import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { createIconCatalog, searchIcons, selectIcon, iconPageSize } from '../shared/icon-catalog.ts';
import { iconLabels } from '../shared/icon-labels.ts';
import { iconValidationSelections, iconScenarios } from '../shared/icon-examples.ts';
import { validateSettings, exampleDefinition } from '../shared/example-registry.ts';
import { searchDocuments } from '../shared/docs-search.mjs';
const packed = createRequire(new URL('../apps/docs/package.json', import.meta.url));
const { icons, filledIcons } = packed('@kjun-ui/tokens/icons'), { tokens } = packed('@kjun-ui/tokens');
const catalog = createIconCatalog(icons, filledIcons);
const { documents } = JSON.parse(readFileSync('apps/docs/lib/generated/discovery.json'));
test('icon labels exactly cover packed names; shared aliases are valid', () => {
  assert.deepEqual(catalog.map(e => e.name), Object.keys(icons).sort());
  assert.deepEqual(catalog.filter(e => e.filled).map(e => e.name), Object.keys(filledIcons).sort());
  assert.equal(iconPageSize, 24);
  assert.throws(() => createIconCatalog(icons, filledIcons, iconLabels.slice(1)));
  assert.throws(() => createIconCatalog(icons, filledIcons, [...iconLabels, iconLabels[0]]));
  assert.throws(() => createIconCatalog(icons, filledIcons, [...iconLabels.slice(1), ['oops', '오류', '잘못된 키']]));
  assert.throws(() => createIconCatalog(icons, filledIcons, iconLabels.map((e, i) => i ? e : [e[0], e[1]])));
  assert.ok(searchIcons(catalog, '설정').length >= 3);
});
test('search normalizes case, whitespace, hyphens, Korean and requires every word', () => {
  for (const query of ['ARROW LEFT', 'arrow-left', 'arrowleft', ' Arrow-Left ']) assert.equal(searchIcons(catalog, query)[0].name, 'arrow-left');
  assert.equal(searchIcons(catalog, '설 정')[0].name, 'adjustments');
  assert.equal(searchIcons(catalog, 'star 즐겨찾기')[0].name, 'star');
  assert.deepEqual(searchIcons(catalog, 'star 지우개'), []);
  assert.equal(searchIcons(catalog, 'circle')[0].name, 'circle');
  assert.deepEqual(searchIcons(catalog, '').map(e => e.name), Object.keys(icons).sort());
  assert.ok(searchIcons(catalog, '하트').some(e => e.name === 'heart'));
});
test('selection preserves size and only supported current shape, never restores filled', () => {
  const entry = name => catalog.find(e => e.name === name);
  let selected = selectIcon(null, entry('heart'));
  assert.deepEqual(selected, { name: 'heart', size: 16, filled: false });
  selected = selectIcon({ ...selected, size: 24, filled: true }, entry('star'));
  assert.deepEqual(selected, { name: 'star', size: 24, filled: true });
  selected = selectIcon(selected, entry('search'));
  assert.deepEqual(selected, { name: 'search', size: 24, filled: false });
  assert.equal(selectIcon(selected, entry('heart')).filled, false);
});
test('registered configurations cover every packed name, size and filled shape', () => {
  assert.equal(exampleDefinition('GuideIconSelection').controls.find(c => c.key === 'name').kind, 'text');
  for (const selection of iconValidationSelections) assert.deepEqual(validateSettings('GuideIconSelection', selection), selection);
  assert.deepEqual([...new Set(iconValidationSelections.map(e => e.size))].sort((a, b) => a - b), Object.values(tokens.iconSizes));
  for (const settings of [{ name: '../missing' }, { size: 15 }, { filled: 'true' }]) assert.throws(() => validateSettings('GuideIconSelection', settings));
  for (const { name } of iconScenarios) assert.deepEqual(exampleDefinition(name).platforms, ['vue2', 'react', 'native']);
});
test('icons navigation and search preserve component and API priority', () => {
  const i = documents.findIndex(e => e.id === 'icons');
  assert.equal(documents[i - 1].id, 'interaction'); assert.equal(documents[i + 1].id, 'usage-guide');
  assert.deepEqual(documents[i].sections.map(([id]) => id), ['catalog', 'size-alignment', 'variants', 'usage']);
  for (const query of ['아이콘', '아이콘 목록', '아이콘 검색', 'icons', '선형 아이콘', '채움 아이콘']) assert.equal(searchDocuments(documents, query)[0].href, '/icons', query);
  for (const query of ['Icon', 'DsIcon']) assert.equal(searchDocuments(documents, query)[0].href, '/components/icon');
  assert.equal(searchDocuments(documents, 'IconToggle')[0].href, '/components/icon-toggle');
  for (const query of ['filled', 'spin', 'size', 'name']) assert.equal(searchDocuments(documents, query)[0].href, searchDocuments(documents.filter(e => e.id !== 'icons'), query)[0].href, query);
});
