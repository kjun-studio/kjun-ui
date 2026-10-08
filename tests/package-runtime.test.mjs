import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir, stat, mkdtemp, rm } from 'node:fs/promises';
import { dirname, resolve, relative, isAbsolute } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { build } from 'esbuild';
import ts from 'typescript';
import { assertCurrentConsumer } from '../scripts/package-state.mjs';

test('every packed relative declaration import resolves inside its own package', async () => {
  const { directory } = await assertCurrentConsumer();
  for (const name of ['icons', 'tokens', 'vue2', 'react', 'native']) {
    const root = resolve(directory, 'node_modules/@kjun-ui', name);
    async function visit(dir) {
      for (const entry of await readdir(dir, { withFileTypes: true })) {
        const path = resolve(dir, entry.name);
        if (entry.isDirectory()) { await visit(path); continue; }
        if (!/\.d\.(ts|cts)$/.test(path)) continue;
        const cjs = path.endsWith('.d.cts');
        const source = ts.preProcessFile(await readFile(path, 'utf8'));
        for (const { fileName } of [...source.importedFiles, ...source.referencedFiles]) {
          assert.ok(!isAbsolute(fileName), `${path} contains an absolute declaration reference: ${fileName}`);
          if (!fileName.startsWith('.')) continue;
          assert.ok(fileName.endsWith(cjs ? '.cjs' : '.js'), `${path}: wrong module suffix ${fileName}`);
          const base = resolve(dirname(path), fileName.replace(/\.(cjs|js)$/, ''));
          assert.ok(!relative(root, base).startsWith('..'), `${path} escapes its package: ${fileName}`);
          const targets = [base + (cjs ? '.d.cts' : '.d.ts')];
          assert.ok((await Promise.all(targets.map(target => stat(target).then(s => s.isFile()).catch(() => false)))).some(Boolean), `${path}: missing ${fileName}`);
        }
      }
    }
    await visit(resolve(root, 'dist'));
  }
});

test('installed ESM and CJS entries bundle and execute without workspace source', async t => {
  const { directory } = await assertCurrentConsumer();
  const output = await mkdtemp(resolve(tmpdir(), 'kjun-entry-test-'));
  t.after(() => rm(output, { recursive: true, force: true }));
  const modules = resolve(directory, 'node_modules');
  for (const format of ['esm', 'cjs']) {
    const outfile = resolve(output, format === 'esm' ? 'entry.mjs' : 'entry.cjs');
    const imports = ['icons', 'tokens', 'vue2', 'react', 'native'].map(name => format === 'esm'
      ? `import * as ${name} from '@kjun-ui/${name}';`
      : `const ${name} = require('@kjun-ui/${name}');`).join('\n');
    await build({
      stdin: { contents: imports + `\nif(tokens.tokens.table.mobileBreakpoint!==768)throw Error('token');
        for(const ui of [vue2,react,native])for(const name of ['DsTable','DsMarketCards','DsSearchInput'])if(!ui[name])throw Error(name);`, resolveDir: directory },
      outfile, bundle: true, format, platform: 'node', packages: 'bundle',
      alias: {
        'react-native': modules + '/react-native-web/dist/index.js',
        'react-native-svg': modules + '/react-native-svg/lib/module/ReactNativeSVG.web.js',
      },
      resolveExtensions: ['.web.tsx', '.web.ts', '.web.js', '.tsx', '.ts', '.js', '.json'],
      define: { 'process.env.NODE_ENV': '"production"', __DEV__: 'false' },
      logLevel: 'silent',
    });
    execFileSync('node', [outfile], { stdio: 'pipe' });
  }
});

test('Native Web resolves its browser host while the device entry remains free of React DOM', async () => {
  const { directory } = await assertCurrentConsumer();
  for (const format of ['esm', 'cjs']) for (const browser of [false, true]) for (const alias of [false, true]) {
    const result = await build({
      stdin: { contents: format === 'esm'
        ? "import {DsModal} from '@kjun-ui/native'; console.log(DsModal);"
        : "console.log(require('@kjun-ui/native').DsModal);", resolveDir: directory },
      bundle: true, write: false, metafile: true, format,
      platform: browser ? 'browser' : 'neutral',
      conditions: browser ? ['browser'] : ['react-native'],
      // Packed previews alias package directories; Metro prefers react-native over browser.
      ...(alias ? { alias: { '@kjun-ui/native': resolve(directory, 'node_modules/@kjun-ui/native') },
        mainFields: browser ? ['browser', 'module', 'main'] : ['react-native', 'main'] } : {}),
      external: ['react', 'react/*', 'react-dom', 'react-native', 'react-native-svg', '@kjun-ui/tokens'],
      logLevel: 'silent',
    });
    const inputs = Object.keys(result.metafile.inputs);
    const suffix = alias || format === 'esm' ? 'js' : 'cjs';
    assert.ok(inputs.some(path => path.endsWith(`/@kjun-ui/native/dist/index${browser ? '.web' : ''}.${suffix}`)));
    const imports = Object.values(result.metafile.outputs).flatMap(output => output.imports.map(item => item.path));
    assert.equal(imports.includes('react-dom'), browser);
  }
});
