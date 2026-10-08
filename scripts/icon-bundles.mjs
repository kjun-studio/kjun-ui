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
  for (const name of ['icons', 'tokens', 'react', 'vue2', 'native']) alias['@kjun-ui/' + name] = modules + '/@kjun-ui/' + name;
  alias["@kjun-ui/icons/defaults"] = modules + "/@kjun-ui/icons/dist/defaults.js";
  alias["@kjun-ui/icons/metadata"] = modules + "/@kjun-ui/icons/dist/metadata.js";
  alias["@kjun-ui/icons/all"] = modules + "/@kjun-ui/icons/dist/all.js";
  alias["@kjun-ui/icons/icons"] = modules + "/@kjun-ui/icons/dist/icons";
  if (format === 'cjs') for (const key of Object.keys(alias)) if (key.startsWith('@kjun-ui/')) delete alias[key];
  const contents = format === 'esm' ? `import { DsIcon, KjunProvider } from '@kjun-ui/${platform}';
    ${extra ? "import alien from '@kjun-ui/icons/icons/alien';" : ''}
    export { DsIcon, KjunProvider }; export const projectIcons = ${extra ? '{ alien }' : '{}'};` : `const { DsIcon, KjunProvider } = require('@kjun-ui/${platform}');
    ${extra ? "const alien = require('@kjun-ui/icons/icons/alien');" : ''}
    module.exports = { DsIcon, KjunProvider, projectIcons: ${extra ? '{ alien }' : '{}'} };`;
  const bundle = await build({ stdin: { contents, resolveDir: directory }, alias, bundle: true, write: false, minify: true,
    metafile: true, format, platform: 'browser', mainFields: ['browser', 'module', 'main'],
    resolveExtensions: ['.web.js', '.js', '.json'], define: { 'process.env.NODE_ENV': '"production"', __DEV__: 'false', global: 'globalThis' } });
  const inputs = Object.keys(bundle.metafile.inputs).filter(path => path.includes('/@kjun-ui/icons/')).map(path => path.split('/@kjun-ui/icons/')[1]).sort();
  const ext = format === 'esm' ? 'js' : 'cjs';
  const expected = extra ? [`dist/defaults.${ext}`, `dist/icons/alien.${ext}`] : [`dist/defaults.${ext}`];
  if (JSON.stringify(inputs) !== JSON.stringify(expected)) throw Error('Unexpected icon bundle inputs: ' + platform + ' ' + inputs.join(','));
  const bytes = bundle.outputFiles[0].contents;
  results.push({ platform, format, scenario: extra ? 'defaults + alien' : 'defaults', bytes: bytes.length, gzipBytes: gzipSync(bytes).length, iconInputs: inputs });
}
await writeFile('artifacts/icon-bundles.json', JSON.stringify({ tablerVersion: '3.48.0', bundles: results }, null, 2) + '\n');
console.table(results.map(({ iconInputs, ...result }) => result));
console.log('Only default data and the explicitly imported icon are present in all twelve ESM/CommonJS bundles.');
