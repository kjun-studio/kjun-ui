import { iconExampleNames } from '../shared/icon-examples.ts';
import { accessibilityExampleNames } from "../shared/accessibility-examples.ts";
import { interactionExampleNames } from "../shared/interaction-examples.ts";
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { build, transform } from 'esbuild';
import { exampleNames, exampleDefinition, presetConfig, validateSettings, visibleControls } from '../shared/example-registry.ts';
import { foundationNames } from '../shared/foundation-examples.ts';
import { motionExampleNames } from '../shared/motion-examples.ts';
const bundled = await build({ entryPoints: ['shared/example-code.ts'], bundle: true, write: false, platform: 'node', format: 'esm' });
const { exampleSource, copiedValues } = await import('data:text/javascript;base64,' + Buffer.from(bundled.outputFiles[0].text).toString('base64'));
const catalog = JSON.parse(await readFile('shared/component-catalog.json', 'utf8'));
const layouts = await import('../shared/visual-guides/usage-content.ts');
const { designCases } = await import('../shared/visual-guides/design-cases.ts');
const manifest = JSON.parse(await readFile('artifacts/examples/manifest.json', 'utf8'));
test('every public component and provider has sources, valid controls and presets on every platform', async () => {
  assert.equal(exampleNames.filter(name => !name.startsWith('Guide')).length, catalog.filter(c => c.kind !== 'internal').length + 2);
  assert.deepEqual(exampleNames.filter(name => name.startsWith('Guide')).sort(), [...layouts.layouts.map(layout => layout.name), ...designCases.map(item => item.name), ...foundationNames, ...motionExampleNames, ...accessibilityExampleNames, ...interactionExampleNames, ...iconExampleNames].sort());
  assert.deepEqual(Object.keys(manifest).sort(), [...exampleNames].sort());
  for (const name of exampleNames) {
    const definition = exampleDefinition(name);
    assert.equal(new Set(definition.controls.map(c => c.key)).size, definition.controls.length);
    for (const preset of definition.presets) {
      const config = presetConfig(name, preset.id);
      assert.deepEqual(validateSettings(name, config.settings), config.settings);
      for (const platform of definition.platforms) {
        let source = exampleSource(manifest[name].sources[platform], platform, config.settings, { ...config.values, input: '<script>한글</script>', message: '이력' });
        assert.doesNotMatch(source, /__KJUN_|\/\* (?:PARAMS|OBSERVE)|instrumentRenderer|catalog-snapshot/);
        assert.ok(source.includes('\\u003cscript>한글\\u003c/script>'));
        if (platform === 'vue2') source = source.slice('<script>\n'.length, -'</script>\n'.length);
        await transform(source, { loader: platform === 'vue2' ? 'js' : 'jsx' });
      }
    }
  }
});
test('only meaningful controls are offered and malformed settings are rejected', () => {
  for (const name of ['DsBadge', 'DsProgress', 'DsDropdownDivider', 'DsErrorBoundary']) assert.equal(exampleDefinition(name).controls.length, 0);
  assert.deepEqual(exampleDefinition('DsIcon').controls.map(c => c.key), ['spin']);
  assert.deepEqual(exampleDefinition('DsPriceCell').controls.map(c => c.key), ['stale']);
  assert.ok(!exampleDefinition('DsKpiHero').controls.some(c => c.key === 'stale'));
  assert.throws(() => validateSettings('DsBadge', { disabled: true }));
  assert.throws(() => validateSettings('DsSelect', { multiple: 'yes' }));
  assert.throws(() => validateSettings('DsSearchInput', { debounce: Infinity }));
  assert.ok(!visibleControls('DsTimePicker', presetConfig('DsTimePicker').settings).some(c => c.key === 'secondStep'));
  assert.ok(visibleControls('DsTimePicker', presetConfig('DsTimePicker', 'seconds').settings).some(c => c.key === 'secondStep'));
  const config = presetConfig('KjunFeedbackProvider', 'confirm');
  assert.ok(!visibleControls('KjunFeedbackProvider', config.settings).some(c => c.key === 'duration'));
});
test('false values and current input survive code generation while event history does not', () => {
  const settings = { ...presetConfig('DsSelect').settings, searchable: false, clearable: false };
  const source = exampleSource(manifest.DsSelect.sources.react, 'react', settings, { select: 'a', selectOpen: true, message: 'last event' });
  assert.match(source, /"searchable": false/); assert.match(source, /"clearable": false/);
  assert.match(source, /"select": "a"/); assert.match(source, /"selectOpen": true/);
  assert.doesNotMatch(source, /last event/);
  assert.deepEqual(copiedValues({ input: '한글', message: 'history' }), { input: '한글' });
});

test('comparison examples hide controls overridden by their fixed cases', () => {
  const keys = (name, preset) => visibleControls(name, presetConfig(name, preset).settings).map(control => control.key);
  assert.ok(!keys('DsButton', 'sizes').includes('size'));
  assert.ok(!keys('DsButton', 'sizes').includes('iconOnly'));
  assert.ok(!keys('DsButton', 'variants').includes('variant'));
  assert.ok(!keys('DsButton', 'states').includes('loading'));
  assert.ok(!keys('DsInput', 'states').includes('readOnly'));
  assert.ok(keys('DsButton', 'default').includes('iconOnly'));
  assert.ok(keys('DsInput', 'default').includes('readOnly'));
});
