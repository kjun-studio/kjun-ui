import { readFile, writeFile, rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { assertCurrentPacked, verifyInstalledPackages } from './package-state.mjs';

const root = resolve(import.meta.dirname, '..');
const directory = resolve(root, 'apps/docs');
const state = await assertCurrentPacked(root);
const docsState = { ...state, manifest: state.manifest.filter(pkg => ['@kjun-ui/react', '@kjun-ui/tokens', '@kjun-ui/icons'].includes(pkg.name)) };
const manifestPath = resolve(directory, 'package.json');
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
if (!process.argv.includes('--check')) {
  const lockPath = resolve(directory, 'package-lock.json');
  const lock = JSON.parse(await readFile(lockPath, 'utf8'));
  // Repacking the same version must invalidate npm's file-tarball lock entry.
  for (const pkg of docsState.manifest) {
    manifest.dependencies[pkg.name] = 'file:../../artifacts/' + pkg.file;
    const key = 'node_modules/' + pkg.name;
    if (lock.packages[key]?.integrity !== pkg.integrity) {
      delete lock.packages[key];
      await rm(resolve(directory, key), { recursive: true, force: true });
    }
  }
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  await writeFile(lockPath, JSON.stringify(lock, null, 2) + '\n');
  execFileSync('npm', ['install', '--no-audit', '--no-fund'], { cwd: directory, stdio: 'inherit' });
}
for (const pkg of docsState.manifest) {
  if (manifest.dependencies[pkg.name] !== 'file:../../artifacts/' + pkg.file)
    throw Error('Docs package references changed. Run npm run docs:install.');
}
await verifyInstalledPackages(directory, docsState);
console.log('Docs consumes verified packed @kjun-ui/react, @kjun-ui/tokens and @kjun-ui/icons.');
