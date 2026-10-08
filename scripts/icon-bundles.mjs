import { build } from 'esbuild';
import { gzipSync } from 'node:zlib';
import { writeFile } from 'node:fs/promises';
import { assertCurrentConsumer } from './package-state.mjs';
const { directory } = await assertCurrentConsumer();
const modules = directory + '/node_modules';
const results = [];
for (const platform of ['react', 'vue2', 'native']) for (const format of ['esm', 'cjs']) for (const extra of [false, true]) {
  const alias = {
    react: modules + '/react', 'react-dom': modules + '/react-dom', vue: modules + '/vue/dist/vue.runtime.esm.js',
    'react-native': modules + '/react-native-web/dist/index.js',
    'react-native-svg': modules + '/react-native-svg/lib/module/ReactNativeSVG.web.js',
  };
  for (const name of ['icons', 'tokens', 'react', 'vue2', 'native']) alias['@kjun/' + name] = modules + '/@kjun/' + name;
  alias["@kjun/icons/defaults"] = modules + "/@kjun/icons/dist/defaults.js";
  alias["@kjun/icons/metadata"] = modules + "/@kjun/icons/dist/metadata.js";
  alias["@kjun/icons/all"] = modules + "/@kjun/icons/dist/all.js";
  alias["@kjun/icons/icons"] = modules + "/@kjun/icons/dist/icons";
  if (format === 'cjs') for (const key of Object.keys(alias)) if (key.startsWith('@kjun/')) delete alias[key];
  const contents = format === 'esm' ? `import { DsIcon, KjunProvider } from '@kjun/${platform}';
    ${extra ? "import alien from '@kjun/icons/icons/alien';" : ''}
    export { DsIcon, KjunProvider }; export const projectIcons = ${extra ? '{ alien }' : '{}'};` : `const { DsIcon, KjunProvider } = require('@kjun/${platform}');
    ${extra ? "const alien = require('@kjun/icons/icons/alien');" : ''}
    module.exports = { DsIcon, KjunProvider, projectIcons: ${extra ? '{ alien }' : '{}'} };`;
  const bundle = await build({ stdin: { contents, resolveDir: directory }, alias, bundle: true, write: false, minify: true,
    metafile: true, format, platform: 'browser', mainFields: ['browser', 'module', 'main'],
    resolveExtensions: ['.web.js', '.js', '.json'], define: { 'process.env.NODE_ENV': '"production"', __DEV__: 'false', global: 'globalThis' } });
  const inputs = Object.keys(bundle.metafile.inputs).filter(path => path.includes('/@kjun/icons/')).map(path => path.split('/@kjun/icons/')[1]).sort();
  const ext = format === 'esm' ? 'js' : 'cjs';
  const expected = extra ? [`dist/defaults.${ext}`, `dist/icons/alien.${ext}`] : [`dist/defaults.${ext}`];
  if (JSON.stringify(inputs) !== JSON.stringify(expected)) throw Error('Unexpected icon bundle inputs: ' + platform + ' ' + inputs.join(','));
  const bytes = bundle.outputFiles[0].contents;
  results.push({ platform, format, scenario: extra ? 'defaults + alien' : 'defaults', bytes: bytes.length, gzipBytes: gzipSync(bytes).length, iconInputs: inputs });
}
await writeFile('artifacts/icon-bundles.json', JSON.stringify({ tablerVersion: '3.48.0', bundles: results }, null, 2) + '\n');
console.table(results.map(({ iconInputs, ...result }) => result));
console.log('Only default data and the explicitly imported icon are present in all twelve ESM/CommonJS bundles.');
