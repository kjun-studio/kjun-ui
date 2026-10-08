import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const packageNames = ['icons', 'tokens', 'vue2', 'react', 'native'];
const root = resolve(import.meta.dirname, '..');
export const buildInputs = [
  'package.json', 'package-lock.json', 'scripts/build.mjs', 'scripts/icon-build.mjs', 'scripts/vue-component.mjs',
  'scripts/package-state.mjs', 'scripts/tokens.mjs', 'scripts/token-model.mjs', 'scripts/token-validation.mjs', 'scripts/token-aliases.mjs', 'scripts/responsive-css.mjs', 'scripts/roles.mjs', 'scripts/api.mjs',
  'scripts/declarations.mjs', 'scripts/vue-prop-type.mjs', 'shared/package-runtime',
  'shared/web-style-sources.json', 'packages/vue2/style-theme.mjs',
  'packages/vue2/style-utilities.json', 'licenses/Tabler-LICENSE', 'LICENSE',
  ...packageNames.flatMap(name => [`packages/${name}/src`, `packages/${name}/package.json`, `packages/${name}/README.md`]),
];
const digest = value => createHash('sha256').update(value).digest('hex');
const json = async path => JSON.parse(await readFile(path, 'utf8'));
const save = async (base, file, value) => {
  await mkdir(resolve(base, 'artifacts'), { recursive: true });
  await writeFile(resolve(base, 'artifacts', file), JSON.stringify(value, null, 2) + '\n');
};
const fail = message => {
  throw Error(`KJUN package state: ${message}. Run npm run build:packages && npm run pack:local && npm run verify:consumers in kjun_ui_dev.`);
};
async function files(base, entries) {
  const paths = [];
  async function visit(path, isFile = false) {
    if (isFile) { paths.push(path); return; }
    let children;
    try { children = await readdir(resolve(base, path), { withFileTypes: true }); }
    catch (error) { if (error.code !== 'ENOTDIR') throw error; }
    if (children) {
      for (const child of children.sort((a, b) => a.name.localeCompare(b.name))) {
        if (child.isSymbolicLink()) fail('unexpected symbolic link: ' + path + '/' + child.name);
        await visit(path + '/' + child.name, !child.isDirectory());
      }
    } else paths.push(path);
  }
  for (const entry of [...entries].sort()) await visit(entry);
  // Icon modules have many small files. Bound parallel reads while retaining the
  // deterministic traversal order and verifying every byte (including declarations).
  const result = [];
  for (let i = 0; i < paths.length; i += 32) result.push(...await Promise.all(paths.slice(i, i + 32).map(async path =>
    [path, digest(await readFile(resolve(base, path)))])));
  return Object.fromEntries(result);
}
export async function sourceFingerprint(base = root) {
  const inputs = await files(base, buildInputs);
  // api.mjs regenerates this file during the build; its dist copy is checked as output.
  delete inputs['packages/vue2/src/index.d.ts'];
  return digest(JSON.stringify(inputs));
}
async function packageFiles(base) {
  return Object.fromEntries(await Promise.all(packageNames.map(async name => [
    '@kjun-ui/' + name, await files(resolve(base, 'packages', name), ['dist', 'package.json', 'README.md']),
  ])));
}
export async function beginPackageBuild(base = root) {
  await save(base, 'build-state.json', { pending: true });
  return sourceFingerprint(base);
}
export async function finishPackageBuild(source, base = root) {
  if (source !== await sourceFingerprint(base)) fail('source changed during package build');
  await save(base, 'build-state.json', { source, files: await packageFiles(base) });
}
export async function assertCurrentBuild(base = root) {
  const state = await json(resolve(base, 'artifacts/build-state.json')).catch(() => null);
  if (!state || state.pending || state.source !== await sourceFingerprint(base)) fail('missing or stale package build');
  if (JSON.stringify(state.files) !== JSON.stringify(await packageFiles(base))) fail('package output changed after build');
  return state;
}
async function verifyTarballs(base, manifest) {
  if (manifest.length !== packageNames.length || new Set(manifest.map(p => p.name)).size !== packageNames.length)
    fail('incomplete package manifest');
  for (const name of packageNames) {
    const item = manifest.find(p => p.name === '@kjun-ui/' + name);
    if (!item) fail('missing package: ' + name);
    const bytes = await readFile(resolve(base, 'artifacts', item.file));
    const integrity = 'sha512-' + createHash('sha512').update(bytes).digest('base64');
    if (integrity !== item.integrity) fail('tarball integrity mismatch: ' + item.name);
  }
}
export async function recordPackedState(base = root) {
  const state = await assertCurrentBuild(base);
  const manifest = await json(resolve(base, 'artifacts/manifest.json'));
  await verifyTarballs(base, manifest);
  await save(base, 'pack-state.json', { ...state, manifest });
}
export async function assertCurrentPacked(base = root) {
  const build = await assertCurrentBuild(base);
  const state = await json(resolve(base, 'artifacts/pack-state.json')).catch(() => null);
  const manifest = await json(resolve(base, 'artifacts/manifest.json'));
  if (!state || state.source !== build.source || JSON.stringify(state.files) !== JSON.stringify(build.files) ||
      JSON.stringify(state.manifest) !== JSON.stringify(manifest)) fail('missing or stale tarballs');
  await verifyTarballs(base, manifest);
  return state;
}
export async function verifyInstalledPackages(directory, state) {
  const lock = await json(resolve(directory, 'package-lock.json'));
  for (const pkg of state.manifest) {
    if (lock.packages['node_modules/' + pkg.name]?.integrity !== pkg.integrity)
      fail('installed integrity mismatch: ' + pkg.name);
    const installed = await files(resolve(directory, 'node_modules', pkg.name), ['dist', 'package.json', 'README.md']);
    if (JSON.stringify(installed) !== JSON.stringify(state.files[pkg.name])) fail('installed files differ: ' + pkg.name);
  }
}
export async function assertCurrentConsumer(base = root) {
  const state = await assertCurrentPacked(base);
  const consumer = await json(resolve(base, 'artifacts/consumer.json')).catch(() => null);
  if (!consumer || consumer.source !== state.source || JSON.stringify(consumer.manifest) !== JSON.stringify(state.manifest))
    fail('missing or stale installed consumer');
  await verifyInstalledPackages(consumer.directory, state);
  return consumer;
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await assertCurrentConsumer();
  console.log('Current source, built files, tarballs and installed packages match.');
}
