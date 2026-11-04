import { build } from 'esbuild';
import { readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { resolve } from 'node:path';
import { assertCurrentConsumer } from '../../../scripts/package-state.mjs';

const out = import.meta.dirname;
const { directory } = await assertCurrentConsumer();
const modules = directory + '/node_modules';
const alias = {
  react: modules + '/react', 'react-dom': modules + '/react-dom',
  vue: modules + '/vue/dist/vue.runtime.esm-bundler.js',
  'react-native': modules + '/react-native-web/dist/index.js',
  'react-native-svg': modules + '/react-native-svg/lib/module/ReactNativeSVG.web.js',
};
for (const name of ['react', 'vue3', 'native', 'tokens', 'icons']) alias['@kjun-ui/' + name] = modules + '/@kjun-ui/' + name;
for (const name of ['defaults', 'metadata', 'all']) alias['@kjun-ui/icons/' + name] = modules + '/@kjun-ui/icons/dist/' + name + '.js';
alias['@kjun-ui/icons/icons'] = modules + '/@kjun-ui/icons/dist/icons';
alias['@kjun-ui/tokens/icons'] = modules + '/@kjun-ui/tokens/dist/icons.js';
const css = await readFile(modules + '/@kjun-ui/tokens/dist/styles.css', 'utf8');
for (const platform of ['react', 'vue3', 'native']) {
  const vue = platform === 'vue3';
  const source = `
    import { KjunProvider, KjunKpiRow } from '@kjun-ui/${platform}';
    import { applyDemoColors, demoPalettes, demoFont } from './shared/demo-colors';
    ${vue ? "import { createApp } from 'vue';" : "import { createRoot } from 'react-dom/client';"}
    applyDemoColors('default');
    const q = new URLSearchParams(location.search);
    window.kpiClicks = [];
    const props = {
      mobileSummary: q.get('summary') === '1',
      loading: q.get('loading') === '1',
      onItemClick: (_, index) => window.kpiClicks.push(index),
      size: q.get('small') === '1' ? 'sm' : 'md',
      surface: q.get('flat') === '1' ? 'none' : 'card',
      items: ['Metric A', 'Metric B', 'Metric C', 'Metric D'].slice(0, q.get('odd') === '1' ? 3 : 4).map((label, i) => ({ label, value: (i + 1) * 1234, clickable: q.get('click') !== '0', mobileFull: q.get('hero') === '1' && i === 0, animated: false })),
    };
    const app = () => <KjunProvider ${platform === 'native' ? 'colors={demoPalettes.default} fontFamily={demoFont}' : ''}><div id="kpi-audit"><KjunKpiRow {...props} /></div></KjunProvider>;
    ${vue ? "createApp(app).mount('#root');" : "createRoot(document.getElementById('root')).render(app());"}
  `;
  const result = await build({
    stdin: { contents: source, resolveDir: process.cwd(), sourcefile: 'kpi-audit.tsx', loader: 'tsx' },
    bundle: true, write: false, format: 'iife', platform: 'browser', alias,
    ...(vue ? { jsx: 'transform', jsxFactory: 'h', jsxFragment: 'Fragment', inject: [resolve('packages/vue3/src/runtime/jsx.ts')], tsconfigRaw: {} } : { jsx: 'automatic' }),
    mainFields: ['browser', 'module', 'main'], resolveExtensions: ['.web.tsx', '.web.ts', '.web.js', '.tsx', '.ts', '.js', '.json'],
    define: { 'process.env.NODE_ENV': '"production"', __DEV__: 'false', __VUE_OPTIONS_API__: 'true', __VUE_PROD_DEVTOOLS__: 'false', __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'false', global: 'globalThis' },
  });
  const html = '<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><style>' + css + '\nbody{margin:0;padding:24px;background:#f4f4f4}#kpi-audit{width:100%}</style></head><body><div id="root"></div><script>' + result.outputFiles[0].text.replaceAll('</script', '<\\/script') + '</script></body></html>';
  await writeFile(out + '/' + platform + '.html', html);
}
await writeFile(out + '/cli.config.json', JSON.stringify({ browser: { browserName: 'chromium', launchOptions: { executablePath: '/root/.cache/ms-playwright/chromium-1243/chrome-linux-arm64/chrome', headless: true, args: ['--no-sandbox'] }, contextOptions: { viewport: { width: 1000, height: 450 }, deviceScaleFactor: 2 } } }));
createServer(async (req, res) => {
  const platform = new URL(req.url, 'http://localhost').pathname.slice(1);
  if (platform === 'favicon.ico') { res.writeHead(204).end(); return; }
  if (!['react', 'vue3', 'native'].includes(platform)) { res.writeHead(404).end(); return; }
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end(await readFile(out + '/' + platform + '.html'));
}).listen(4197, '127.0.0.1', () => console.log('KPI audit: current packed packages; http://127.0.0.1:4197/react'));
