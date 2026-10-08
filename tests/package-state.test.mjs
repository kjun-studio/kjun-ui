import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, cp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { buildInputs, packageNames, beginPackageBuild, finishPackageBuild, recordPackedState,
  assertCurrentConsumer, assertCurrentPacked } from '../scripts/package-state.mjs';

async function setup(t) {
  const base = await mkdtemp(resolve(tmpdir(), 'kjun-package-state-'));
  t.after(() => rm(base, { recursive: true, force: true }));
  const write = async (file, value) => {
    const target = resolve(base, file); await mkdir(dirname(target), { recursive: true });
    await writeFile(target, typeof value === 'string' ? value : JSON.stringify(value));
  };
  for (const input of buildInputs) await write((input.endsWith('/src') || input === 'shared/package-runtime') ? input + '/index.ts' : input, input);
  for (const name of packageNames) {
    await write(`packages/${name}/package.json`, { name: '@kjun-ui/' + name, version: '0.2.0' });
    await write(`packages/${name}/dist/index.js`, 'export const value = 1;');
  }
  await finishPackageBuild(await beginPackageBuild(base), base);
  const manifest = [];
  for (const name of packageNames) {
    const bytes = 'test archive: ' + name, file = name + '.tgz';
    await write('artifacts/' + file, bytes);
    manifest.push({ name: '@kjun-ui/' + name, version: '0.2.0', file,
      integrity: 'sha512-' + createHash('sha512').update(bytes).digest('base64') });
  }
  await write('artifacts/manifest.json', manifest); await recordPackedState(base);
  const packed = await assertCurrentPacked(base), directory = resolve(base, 'consumer');
  for (const name of packageNames) {
    for (const file of ['dist', 'README.md', 'package.json']) {
      const target = resolve(directory, 'node_modules/@kjun-ui', name, file);
      await mkdir(dirname(target), { recursive: true });
      await cp(resolve(base, 'packages', name, file), target, { recursive: true });
    }
  }
  await write('consumer/package-lock.json', { packages: Object.fromEntries(manifest.map(p => ['node_modules/' + p.name, { integrity: p.integrity }])) });
  await write('artifacts/consumer.json', { directory, source: packed.source, manifest });
  return { base, write, packed };
}
test('current consumer requires matching source, build, tarballs, lock and installed bytes even at the same version', async t => {
  const { base, write } = await setup(t);
  await assertCurrentConsumer(base);
  for (const [file, expected] of [
    ['packages/react/src/index.ts', /stale package build/],
    ['shared/package-runtime/index.ts', /stale package build/],
    ['scripts/declarations.mjs', /stale package build/],
    ['scripts/vue-prop-type.mjs', /stale package build/],
    ['packages/react/dist/index.js', /output changed/],
    ['artifacts/react.tgz', /tarball integrity mismatch/],
    ['consumer/node_modules/@kjun-ui/react/dist/index.js', /installed files differ/],
  ]) {
    const original = await readFile(resolve(base, file), 'utf8');
    await write(file, original + '\nchanged');
    await assert.rejects(assertCurrentConsumer(base), expected);
    await write(file, original);
    await assertCurrentConsumer(base);
  }
  const lock = JSON.parse(await readFile(resolve(base, 'consumer/package-lock.json'), 'utf8'));
  lock.packages['node_modules/@kjun-ui/react'].integrity = 'old'; await write('consumer/package-lock.json', lock);
  await assert.rejects(assertCurrentConsumer(base), /installed integrity mismatch/);
});
test('an old consumer or interrupted build cannot be certified by existing artifacts', async t => {
  const { base, write } = await setup(t);
  const consumer = JSON.parse(await readFile(resolve(base, 'artifacts/consumer.json'), 'utf8'));
  await write('artifacts/consumer.json', { ...consumer, source: 'previous-source' });
  await assert.rejects(assertCurrentConsumer(base), /stale installed consumer/);
  await write('artifacts/consumer.json', consumer);
  await beginPackageBuild(base);
  await assert.rejects(assertCurrentConsumer(base), /stale package build/);
});
test('API declaration generation is a build output, while authored source changes still invalidate the build', async t => {
  const { base, write } = await setup(t);
  const source = await beginPackageBuild(base);
  await write('packages/vue2/src/index.d.ts', 'export declare const Generated: unknown;');
  await write('packages/vue2/dist/index.d.ts', 'export declare const Generated: unknown;');
  await finishPackageBuild(source, base);
  const next = await beginPackageBuild(base);
  await write('packages/vue2/src/index.ts', 'export const changed = true;');
  await assert.rejects(finishPackageBuild(next, base), /source changed during package build/);
});
