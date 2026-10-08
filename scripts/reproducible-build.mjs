import { deepStrictEqual, rejects } from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { writeFile, mkdir, access } from 'node:fs/promises';
import { resolve } from 'node:path';
import { assertCurrentPacked, packageNames } from './package-state.mjs';

process.chdir(resolve(import.meta.dirname, '..'));
const run = name => execFileSync('npm', ['run', name], { stdio: 'inherit' });
const builds = [];
// Run real compilers and npm pack twice, including all emitted files and tarball bytes.
for (let attempt = 0; attempt < 2; attempt++) {
  const stale = packageNames.flatMap(name => ['d.ts', 'd.cts'].map(extension => `packages/${name}/dist/types/obsolete/stale.${extension}`));
  if (attempt) for (const file of stale) {
    await mkdir(resolve(file, '..'), { recursive: true });
    await writeFile(file, 'export declare const obsolete: never;\n');
  }
  run('build:packages');
  for (const file of stale) await rejects(access(file), { code: 'ENOENT' });
  run('pack:local');
  builds.push(await assertCurrentPacked());
}
deepStrictEqual(builds[1].source, builds[0].source, 'Source changed between builds');
deepStrictEqual(builds[1].files, builds[0].files, 'Build output is not reproducible');
deepStrictEqual(builds[1].manifest, builds[0].manifest, 'Package tarballs are not reproducible');
// Leave fixtures and previews using the final, verified package generation.
run('verify:consumers');
await writeFile('artifacts/reproducible-build.json', JSON.stringify({
  verifiedAt: new Date().toISOString(),
  runs: builds.length,
  source: builds[0].source,
  packages: builds[0].manifest,
}, null, 2) + '\n');
console.log('Two builds produced identical files and tarballs for all five packages.');
