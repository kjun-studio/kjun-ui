import { test } from 'node:test';
import assert from 'node:assert/strict';
import { transform } from 'esbuild';
import { usageTools } from '../scripts/usage-tools.mjs';
import { compileVueExample } from '../scripts/vue-example.mjs';
import { exampleDefinition, presetConfig } from '../shared/example-registry.ts';
import { applySetupAdditions } from './fixtures/usage-setup.ts';

const platforms = ['vue2', 'react', 'native'];
test('shared setup is the common guide plus independent, composable additions', async () => {
  for (const platform of platforms) for (const palette of ['default', 'violet', 'dark']) {
    const base = usageTools.usageSetup(platform, palette, { feedback: false, domainColors: false });
    const additions = usageTools.usageSetupAdditions(platform, palette);
    assert.doesNotMatch(base[0].code, /KjunFeedbackProvider|appDomainColors|domainColors=/);
    assert.doesNotMatch(base[1].code, /priceUp|--kjun-price-up|favorite|interest/);
    for (const feedback of [false, true]) for (const domainColors of [false, true]) {
      const files = applySetupAdditions(platform, base, additions, { feedback, domainColors });
      assert.deepEqual(files, usageTools.usageSetup(platform, palette, { feedback, domainColors }));
      for (const file of files) {
        if (file.name.endsWith('.css')) continue;
        await transform(file.name.endsWith('.vue') ? compileVueExample(file.code, file.name) : file.code, { loader: file.name.endsWith('.jsx') ? 'jsx' : 'js' });
      }
    }
  }
});
test('every public component and feedback has an explicit independent usage generator', async () => {
  assert.equal(usageTools.usageNames.length, 93);
  assert.equal(usageTools.implementationNames.length, 15);
  for (const name of usageTools.usageNames) for (const platform of platforms) {
    const generator = await usageTools.loadUsageGenerator(name);
    const configs = exampleDefinition(name).presets.map(preset => presetConfig(name, preset.id));
    const defaults = presetConfig(name);
    configs.push({ settings: Object.fromEntries(Object.entries(defaults.settings).map(([key, value]) => [key, typeof value === 'boolean' ? false : value])), values: {} });
    for (const config of configs) {
      const usage = generator({ name, platform, ...config });
      assert.doesNotMatch(usage.code, /rawH|renderExample|instrumentRenderer|catalog-|from ["'].*previews|__KJUN_|eventMap/);
      const module = platform === 'vue2' ? compileVueExample(usage.code, name) : usage.code;
      await transform(module, { loader: platform === 'vue2' ? 'js' : 'jsx' });
      for (const file of usageTools.usageSetup(platform, 'default', usage)) {
        if (file.name.endsWith('.css')) continue;
        await transform(file.name.endsWith('.vue') ? compileVueExample(file.code, file.name) : file.code, { loader: file.name.endsWith('.jsx') ? 'jsx' : 'js' });
      }
    }
    if (name === 'DsButton') assert.ok(generator({ name, platform, ...defaults }).code.trim().split('\n').length <= 30);
  }
  await assert.rejects(() => usageTools.loadUsageGenerator('MissingComponent'), /누락/);
  await assert.rejects(() => usageTools.loadUsageGenerator('GuideActionPlacement'), /누락/);
});
test('usage snapshots preserve falsy state and safely encode user strings in Vue and JSX', async () => {
  const hostile = '따옴표 "\' & < >\n한글 </script>\u2028\u2029';
  for (const platform of platforms) for (const [name, values] of [
    ['DsButton', { count: 0 }], ['DsInput', { input: hostile }], ['DsFormGroup', { input: '' }],
    ['DsCheckbox', { checked: false }], ['DsSelect', { select: null, selectOpen: false }], ['DsRangeSlider', { range: [0, 0] }],
    ['DsTable', { selected: [], expanded: [] }], ['DsDataState', { queryError: null, resultKey: '' }],
    ['KjunFeedbackProvider', {}],
  ]) {
    const { settings } = presetConfig(name);
    for (const key of ['label', 'hint', 'title', 'message', 'confirmTitle', 'confirmMessage', 'promptTitle', 'promptMessage', 'initialValue', 'confirmText', 'cancelText']) if (key in settings) settings[key] = hostile;
    const { code } = await usageTools.usageExample({ name, platform, settings, values: { ...values, message: 'EXCLUDED_EVENT_HISTORY' } });
    assert.doesNotMatch(code, /EXCLUDED_EVENT_HISTORY/);
    if (platform === 'vue2') {
      assert.equal((code.match(/<\/script>/g) || []).length, 1);
      await transform(compileVueExample(code, name), { loader: 'js' });
    } else await transform(code, { loader: 'jsx' });
    for (const [key, value] of Object.entries(values)) {
      if (name === 'DsButton') assert.match(code, platform === 'vue2' ? /count: 0/ : /useState\(0\)/);
      else assert.ok(code.replace(/\s/g, '').includes(JSON.stringify(value, null, 2).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029').replace(/\s/g, '')), `${platform} ${name} ${key}`);
    }
  }
});
test('implementation examples use recommended initial state and delegate common providers to setup', async () => {
  for (const name of usageTools.implementationNames) for (const platform of platforms) {
    const config = usageTools.implementationConfig(name);
    assert.equal(config.settings.arrangement, 'after');
    const usage = await usageTools.usageExample({ name, platform, ...config });
    assert.doesNotMatch(usage.code, /KjunProvider|KjunFeedbackProvider|appColors|appDomainColors|renderExample|instrumentRenderer/);
    assert.equal(usage.feedback, name === 'GuideSettingsForm');
    assert.equal(usage.domainColors, name === 'GuideAssetList');
    const setup = usageTools.usageSetup(platform, 'default', usage);
    assert.equal((setup[0].code.match(/<KjunProvider\b/g) || []).length, 1);
    assert.equal((setup[0].code.match(/<KjunFeedbackProvider\b/g) || []).length, usage.feedback ? 1 : 0);
  }
});
