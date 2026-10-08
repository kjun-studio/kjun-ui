import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { searchDocuments } from '../shared/docs-search.mjs';
import { interactionScenarios } from '../shared/interaction-examples.ts';
import { exampleDefinition } from '../shared/example-registry.ts';
const { documents } = JSON.parse(readFileSync('apps/docs/lib/generated/discovery.json', 'utf8'));
test('interaction navigation and search preserve component and API priority', () => {
  const index = documents.findIndex(page => page.id === 'interaction');
  assert.equal(documents[index - 1].id, 'accessibility'); assert.equal(documents[index + 1].id, 'icons');
  for (const query of ['상태', '상호작용', 'interaction', '누름 상태', '선택 상태', '읽기 전용', '비활성'])
    assert.equal(searchDocuments(documents, query)[0].href, '/interaction', query);
  for (const [query, href] of [['포커스', '/accessibility'], ['Button', '/components/button'], ['Input', '/components/input'], ['Tabs', '/components/tabs']])
    assert.equal(searchDocuments(documents, query)[0].href, href, query);
  for (const query of ['disabled', 'readOnly', 'readonly', 'loading', 'hover', 'focus', 'selected'])
    assert.ok(searchDocuments(documents, query)[0].href.endsWith('#api'), query);
  assert.deepEqual(documents[index].sections.map(([id]) => id), ['states', 'interaction', 'selection', 'availability', 'loading', 'composition']);
});
test('all four interaction scenarios use registered packed examples and public links', () => {
  assert.equal(interactionScenarios.length, 4);
  for (const { name, scenario, destination } of interactionScenarios) {
    assert.deepEqual(exampleDefinition(name).platforms, ['vue2', 'react', 'native']);
    assert.ok(documents.some(page => page.path === destination.split('#')[0]));
    assert.equal(scenario.action, undefined);
  }
});
