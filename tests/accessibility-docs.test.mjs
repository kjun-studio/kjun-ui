import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { searchDocuments } from '../shared/docs-search.mjs';
import { accessibilityScenarios } from '../shared/accessibility-examples.ts';
import { exampleDefinition } from '../shared/example-registry.ts';
const { documents } = JSON.parse(readFileSync('apps/docs/lib/generated/discovery.json', 'utf8'));
test('accessibility discovery has stable anchors and preserves API/component priority', () => {
  const index = documents.findIndex(page => page.id === 'accessibility');
  assert.equal(documents[index - 1].id, 'styling'); assert.equal(documents[index + 1].id, 'interaction');
  for (const query of ['접근성', 'accessibility', 'a11y', '키보드', '포커스', '접근성 이름', '글자 확대'])
    assert.equal(searchDocuments(documents, query)[0].href, '/accessibility', query);
  for (const [query, href] of [['Tabs', '/components/tabs'], ['Modal', '/components/modal'], ['errorMessage', '/components/input#api']])
    assert.equal(searchDocuments(documents, query)[0].href, href, query);
  assert.deepEqual(documents[index].sections.map(([id]) => id), ['keyboard', 'focus', 'accessible-name', 'text-resize', 'responsibilities']);
});
test('accessibility scenarios use registered packed examples and public detail destinations', () => {
  assert.equal(accessibilityScenarios.length, 3);
  for (const { name, scenario, destination } of accessibilityScenarios) {
    assert.deepEqual(exampleDefinition(name).platforms, ['vue2', 'react', 'native']);
    assert.ok(documents.some(page => page.path === destination.split('#')[0]));
    assert.equal(scenario.action, undefined);
  }
  assert.equal(accessibilityScenarios[1].scenario.viewportHeight, 440);
});
