import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { searchDocuments } from '../shared/docs-search.mjs';
import { motionScenarios } from '../shared/motion-examples.ts';
import { exampleDefinition } from '../shared/example-registry.ts';
const { documents } = JSON.parse(readFileSync('apps/docs/lib/generated/discovery.json', 'utf8'));

test('motion discovery follows tokens and preserves component and API search priority', () => {
  const index = documents.findIndex(page => page.id === 'motion');
  assert.equal(documents[index - 1].id, 'tokens');
  for (const query of ['모션', '애니메이션', 'motion', 'animation', '전환', '동작 줄이기'])
    assert.equal(searchDocuments(documents, query)[0].href, '/motion', query);
  for (const [query, href] of [['Tabs', '/components/tabs'], ['AnimatedNumber', '/components/animated-number'], ['Toast', '/feedback'], ['fromPrevious', '/components/animated-number#api'], ['loadOptions', '/components/search-input#api']])
    assert.equal(searchDocuments(documents, query)[0].href, href, query);
  assert.deepEqual(documents[index].sections.map(([id]) => id), ['principles', 'easing-distance', 'timing', 'examples', 'interruption', 'reduced-motion']);
  assert.deepEqual(documents[index].sectionGroups.flatMap(group => group.sections), documents[index].sections.map(([id]) => id));
});

test('motion scenarios are registered public-package examples with valid detail destinations', () => {
  assert.equal(motionScenarios.length, 6);
  for (const { name, scenario, destination } of motionScenarios) {
    assert.deepEqual(exampleDefinition(name).platforms, ['vue2', 'react', 'native']);
    assert.ok(documents.some(page => page.path === destination));
    assert.equal(scenario.action, undefined, 'motion starts only on user interaction');
    if (['DsModal', 'DsDrawer', 'GuideMotionToast'].includes(name)) assert.equal(scenario.viewportHeight, 600);
  }
  assert.equal(motionScenarios.find(item => item.name === 'GuideMotionNumber').scenario.values.number, 100);
});
