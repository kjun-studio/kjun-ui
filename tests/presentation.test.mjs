import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { presentations, overviewScenes, captureFor, capture } from '../previews/presentation/registry.mjs';
import { usageGuideHref } from '../shared/document-navigation.ts';
test('presentation registry covers each public component exactly once', async () => {
  const catalog = JSON.parse(await readFile(new URL('../shared/component-catalog.json', import.meta.url)));
  const expected = catalog.filter(c => c.kind !== 'internal').map(c => c.name).sort();
  assert.deepEqual(presentations.map(p => p.name).sort(), expected);
  for (const scene of presentations) {
    const profile = captureFor(scene);
    assert.ok(profile, scene.name + ' capture profile');
    assert.equal(profile.width * profile.deviceScaleFactor, 1280);
    assert.equal(profile.height * profile.deviceScaleFactor, 800);
    assert.ok(scene.width === null || (scene.width > 0 && scene.width <= profile.width - 2 * profile.padding));
  }
  assert.deepEqual(captureFor(presentations.find(scene => scene.name === 'DsRadio')), captureFor(presentations.find(scene => scene.name === 'DsRadioGroup')));
  assert.ok(captureFor(presentations.find(scene => scene.name === 'DsKpiRow')).width >= 768);
  for (const name of ['DsButtonGroup', 'DsChip']) assert.equal(captureFor(presentations.find(scene => scene.name === name)).deviceScaleFactor / capture.deviceScaleFactor, 2);
  assert.equal(presentations.find(scene => scene.name === 'DsFreshness').captureType, 'control');
});
test('overview images connect the canonical list, form and data guide anchors', () => {
  assert.deepEqual(overviewScenes.map(scene => scene.destination), ['generic-lists', 'form', 'assets'].map(usageGuideHref));
  assert.equal(new Set(overviewScenes.map(scene => scene.id)).size, 3);
  for (const scene of overviewScenes) {
    assert.ok(scene.title && scene.description && scene.alt);
    assert.deepEqual(captureFor(scene), { width: 640, height: 400, deviceScaleFactor: 2, padding: 32 });
  }
});
