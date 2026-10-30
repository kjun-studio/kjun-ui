import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, stat, utimes, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { ensureDocsBuild } from '../scripts/docs-build-cache.mjs';

async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), 'kjun-docs-cache-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const write = async (file, value = 'original') => {
    const path = join(root, file);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, value);
  };
  for (const file of ['apps/docs/app/page.tsx', 'apps/docs/app/docs.css', 'apps/docs/vite.config.ts',
    'apps/docs/package-lock.json', 'apps/docs/public/previews/catalog.js', 'shared/data.json',
    'previews/presentation/registry.mjs', 'scripts/docs-test.mjs', 'package.json', 'package-lock.json',
    'tsconfig.json', 'artifacts/manifest.json']) await write(file);
  const state = { builds: 0, verifications: 0 };
  const options = {
    root, env: { KJUN_PREVIEW_READY_MS: '30000' }, report() {},
    async verify() { state.verifications++; },
    async build() {
      state.builds++;
      for (const file of ['server/index.js', 'server/BUILD_ID', 'server/vinext-server.json',
        'client/vinext-client-entry-manifest.json', 'client/_next/chunk.js']) {
        await write('apps/docs/dist/' + file, 'built-' + state.builds);
      }
    },
  };
  const run = overrides => ensureDocsBuild({ ...options, ...overrides });
  return { root, state, write, run, options };
}

test('an unchanged docs build is reused across test profiles while packed verification still runs', async t => {
  const f = await fixture(t);
  assert.equal((await f.run()).reused, false);
  const env = { ...f.options.env, KJUN_WORKFLOW_OWNER: 'another-lock', npm_lifecycle_event: 'test:docs:smoke',
    PLAYWRIGHT_JSON_OUTPUT_FILE: 'another-report.json', KJUN_REVIEW_CAPTURES: '1' };
  assert.equal((await f.run({ env })).reused, true);
  assert.deepEqual(f.state, { builds: 1, verifications: 2 });
  await f.write('tests/browser/docs/new.spec.ts', 'new assertion');
  await f.write('apps/docs/.wrangler/logs/debug.log', 'runtime log');
  await f.write('apps/docs/tsconfig.tsbuildinfo', 'typecheck metadata');
  assert.equal((await f.run()).reused, true);
  // A hit must never hide stale or tampered installed packages.
  await assert.rejects(f.run({ verify: async () => { throw Error('installed packages differ'); } }), /installed packages differ/);
  assert.equal(f.state.builds, 1);
});

test('source, shared definitions, previews, dependency locks and packed manifests invalidate reuse', async t => {
  const f = await fixture(t);
  await f.run();
  for (const file of ['apps/docs/app/page.tsx', 'apps/docs/app/docs.css', 'apps/docs/vite.config.ts',
    'shared/data.json', 'previews/presentation/registry.mjs', 'apps/docs/public/previews/catalog.js',
    'apps/docs/package-lock.json', 'package-lock.json', 'artifacts/manifest.json']) {
    await f.write(file, 'modified');
    assert.equal((await f.run()).reused, false, file);
    assert.equal((await f.run()).reused, true, file);
  }
});

test('content hashes notice same-size edits with restored timestamps and added or deleted inputs', async t => {
  const f = await fixture(t);
  await f.run();
  const path = join(f.root, 'apps/docs/app/page.tsx'), before = await stat(path);
  await f.write('apps/docs/app/page.tsx', 'replaced');
  await utimes(path, before.atime, before.mtime);
  assert.equal((await f.run()).reused, false);
  await f.write('apps/docs/public/new.svg');
  assert.equal((await f.run()).reused, false);
  await rm(join(f.root, 'apps/docs/public/new.svg'));
  assert.equal((await f.run()).reused, false);
});

test('build environment and dotenv changes invalidate reuse without storing their values', async t => {
  const f = await fixture(t);
  await f.run();
  for (const env of [{ ...f.options.env, KJUN_PREVIEW_READY_MS: '15000' },
    { ...f.options.env, NEXT_PUBLIC_LABEL: 'fixture-private-value' },
    { ...f.options.env, CUSTOM_BUILD_SETTING: 'fixture-private-value' }]) {
    assert.equal((await f.run({ env })).reused, false);
    assert.equal((await f.run({ env })).reused, true);
  }
  await f.write('apps/docs/.env.production', 'APP_TOKEN=fixture-private-value');
  assert.equal((await f.run()).reused, false);
  await f.write('.env.local', 'APP_TOKEN=another-fixture-value');
  assert.equal((await f.run()).reused, false);
  const state = await readFile(join(f.root, 'artifacts/docs-test-build.json'), 'utf8');
  assert.ok(!state.includes('fixture-private-value') && !state.includes('another-fixture-value'));
});

test('missing, changed or additional build outputs and corrupt markers trigger rebuilding', async t => {
  const f = await fixture(t);
  await f.run();
  await f.write('apps/docs/dist/client/_next/chunk.js', 'corrupted bundle');
  assert.equal((await f.run()).reused, false);
  await rm(join(f.root, 'apps/docs/dist/server/index.js'));
  assert.equal((await f.run()).reused, false);
  await f.write('apps/docs/dist/client/stale.js');
  assert.equal((await f.run()).reused, false);
  await f.write('artifacts/docs-test-build.json', '{broken json');
  assert.equal((await f.run()).reused, false);
  const marker = JSON.parse(await readFile(join(f.root, 'artifacts/docs-test-build.json'), 'utf8'));
  delete marker.outputs;
  await f.write('artifacts/docs-test-build.json', JSON.stringify(marker));
  await rm(join(f.root, 'apps/docs/dist/server/index.js'));
  assert.equal((await f.run()).reused, false);
});

test('failed, incomplete or concurrently edited builds cannot leave a reusable marker', async t => {
  const f = await fixture(t), marker = join(f.root, 'artifacts/docs-test-build.json');
  await f.run();
  await f.write('shared/data.json', 'changed');
  await assert.rejects(f.run({ build: async () => { throw Error('build failed'); } }), /build failed/);
  await assert.rejects(stat(marker), { code: 'ENOENT' });
  await rm(join(f.root, 'apps/docs/dist'), { recursive: true });
  await assert.rejects(f.run({ build: async () => {} }), { code: 'ENOENT' });
  await assert.rejects(stat(marker), { code: 'ENOENT' });
  await assert.rejects(f.run({ build: async () => {
    await f.options.build();
    await f.write('shared/data.json', 'changed while building');
  } }), /빌드 도중 입력이 변경/);
  await assert.rejects(stat(marker), { code: 'ENOENT' });
  assert.equal((await f.run()).reused, false);
  assert.equal((await f.run()).reused, true);
});
