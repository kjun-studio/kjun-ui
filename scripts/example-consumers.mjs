import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { build } from 'esbuild';
import { assertCurrentConsumer } from './package-state.mjs';
import { compileVueExample } from './vue-example.mjs';
import { usageTools } from './usage-tools.mjs';
import { exampleNames, exampleDefinition, presetConfig } from '../shared/example-registry.ts';
const root = resolve(import.meta.dirname, '..');
const consumer = await assertCurrentConsumer();
const manifest = JSON.parse(await readFile(resolve(root, 'artifacts/examples/manifest.json'), 'utf8'));
const bundled = await build({ entryPoints: [resolve(root, 'shared/example-code.ts')], bundle: true, write: false, platform: 'node', format: 'esm', target: 'node24' });
export const codeTools = await import('data:text/javascript;base64,' + Buffer.from(bundled.outputFiles[0].text).toString('base64'));
export const snapshotFixtures = {
  DsButton: { count: 3 }, DsInput: { input: '공유 컴포넌트' }, DsModal: { open: true },
  DsSelect: { select: 'a', selectOpen: true }, DsSearchInput: { search: 'AAA' }, DsFormGroup: { input: '저장할 내용' },
  DsTable: { selected: [{ id: 'a', name: '긴 한국어 자산 이름', symbol: 'AAA', price: 1234567, change: 2.35 }], expanded: ['a'] },
  DsCard: {}, DsProgress: { progress: 0 }, DsCheckbox: { checked: true }, DsSwitch: { switch: false },
  DsRadio: { radio: 'c' }, DsRadioGroup: { radio: 'c' }, DsTextarea: { textarea: '첫 줄\n한글 "인용" </script>' },
  DsCombobox: { combo: 'a' }, DsDatePicker: { date: '2026-09-20' }, DsButtonGroup: { group: 'c' }, DsFilterGroup: { filters: [] },
  DsTabs: { tab: 'two' }, DsTabPane: { tab: 'two' }, DsDrawer: { open: true, input: '' }, DsPopover: { popoverOpen: true },
  DsPagination: { page: 2, pageSize: 50 }, DsIconToggle: { active: true }, DsAnimatedNumber: { number: 0 },
  DsDataState: { queryKey: 'b', resultKey: 'b', queryLoading: false, queryError: null },
  DsListRow: { notifications: false }, DsListSection: { notifications: false }, DsBottomNavigation: { destination: 'activity' },
  DsImage: { imageReady: true, imageVersion: 1 }, DsChip: { removed: true }, DsSlider: { slider: 0 },
  DsRangeSlider: { range: [0, 100] }, DsTimePicker: { time: null }, DsQuantityStepper: { quantity: 0 },
};
export async function prepareExample(platform, name, id, settings, values, palette = 'default', suppliedCode, mode = 'full', suppliedSetup) {
  const directory = resolve(consumer.directory, 'example-checks', platform, (mode === 'usage' ? 'usage-' : '') + name + '-' + id);
  await mkdir(directory, { recursive: true });
  const usage = mode === 'usage' ? await usageTools.usageExample({ name, platform, settings, values }) : null;
  const code = suppliedCode ?? usage?.code ?? codeTools.exampleSource(manifest[name].sources[platform], platform, settings, values);
  let module = code;
  if (platform === 'vue2') {
    module = compileVueExample(code, name);
  }
  await writeFile(resolve(directory, 'Example.' + (platform === 'vue2' ? 'js' : 'jsx')), module);
  await writeFile(resolve(directory, platform === 'native' ? 'kjun.js' : 'kjun.css'), codeTools.exampleSetup(platform, palette));
  if (usage) for (const file of suppliedSetup ?? usageTools.usageSetup(platform, palette, usage)) {
    await writeFile(resolve(directory, file.name.replace('.vue', '.js')), file.name.endsWith('.vue') ? compileVueExample(file.code, 'App').replace('./Example.vue', './Example.js') : file.code);
  }
  const component = usage ? 'App' : 'Example';
  const entry = platform === 'vue2'
    ? `import Vue from "vue"; import Example from "./${component}.js"; new Vue({render: h => h(Example)}).$mount("#root");`
    : `import React from "react"; import {createRoot} from "react-dom/client"; import Example from "./${component}.jsx"; createRoot(document.getElementById("root")).render(<Example/>);`;
  const path = resolve(directory, 'main.jsx');
  await writeFile(path, entry);
  return path;
}
export async function compileEntries(platform, entries) {
  const modules = resolve(consumer.directory, 'node_modules');
  const directory = resolve(root, 'artifacts/export-checks', platform);
  await mkdir(directory, { recursive: true });
  const result = await build({ entryPoints: entries, outdir: directory, bundle: true, platform: 'browser', format: 'esm', splitting: true,
    jsx: 'automatic', target: 'es2020', minify: true, metafile: true,
    alias: { vue: modules + '/vue/dist/vue.runtime.esm.js', 'react-native': modules + '/react-native-web/dist/index.js', 'react-native-svg': modules + '/react-native-svg/lib/module/ReactNativeSVG.web.js' },
    mainFields: ['browser', 'module', 'main'], resolveExtensions: ['.web.js', '.web.tsx', '.tsx', '.ts', '.js', '.jsx', '.json'],
    define: { 'process.env.NODE_ENV': '"production"', __DEV__: 'false', global: 'globalThis' },
  });
  if (!Object.keys(result.metafile.inputs).some(path => path.includes('kjun-consumer-') && path.includes('@kjun-ui/' + platform))) throw Error('Export checks did not consume installed packages.');
  for (const id of Object.keys(entries)) await writeFile(resolve(directory, id + '.html'), `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/fonts/fonts.css">${platform === 'native' ? '' : `<link rel="stylesheet" href="./${id}.css">`}<style>body{margin:24px}</style></head><body><div id="root"></div><script type="module" src="./${id}.js"></script></body></html>`);
}
export async function verifyExampleConsumers(mode = 'full') {
  let count = 0;
  for (const platform of ['vue2', 'react', 'native']) {
    const entries = {};
    for (const name of mode === 'usage' ? usageTools.usageNames : exampleNames) {
      const prepare = (id, settings, values) => prepareExample(platform, name, id, settings, values, 'default', undefined, mode);
      const prefix = (mode === 'usage' ? 'usage-' : '') + name;
      if (mode === 'usage' && usageTools.implementationExamples[name]) {
        const config = usageTools.implementationConfig(name);
        entries[prefix + '-implementation'] = await prepare('implementation', config.settings, config.values);
        count++;
        continue;
      }
      for (const preset of exampleDefinition(name).presets) {
        const config = presetConfig(name, preset.id);
        entries[prefix + '-' + preset.id] = await prepare(preset.id, config.settings, config.values);
        count++;
      }
      if (snapshotFixtures[name] || mode === 'usage') {
        const config = presetConfig(name);
        entries[prefix + '-snapshot'] = await prepare('snapshot', config.settings, snapshotFixtures[name] || {}); count++;
      }
      const config = presetConfig(name);
      if (Object.values(config.settings).includes(true)) {
        const settings = Object.fromEntries(Object.entries(config.settings).map(([key, value]) => [key, typeof value === 'boolean' ? false : value]));
        entries[prefix + '-off'] = await prepare('off', settings, {}); count++;
      }
    }
    await compileEntries(platform, entries);
  }
  console.log(`Compiled ${count} standalone ${mode} examples against installed tarballs (presets, snapshots, false values).`);
}
if (process.argv[1] === import.meta.filename) await verifyExampleConsumers(process.argv.includes('--usage') ? 'usage' : 'full');
