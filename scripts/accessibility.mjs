import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadCurrent, root, validateRun, isStale } from './a11y/records.mjs';
export async function generateAccessibility(check = false) {
  const current = await loadCurrent();
  const runs = [], outputs = [];
  for (const file of (await readdir(resolve(root, 'docs/accessibility-runs'))).filter(file => file.endsWith('.json')).sort()) {
    const bytes = await readFile(resolve(root, 'docs/accessibility-runs', file));
    const run = JSON.parse(bytes); validateRun(run, current.definitions, current.definitionHash);
    if (file !== run.id + '.json') throw Error('Accessibility record filename mismatch: ' + file);
    const download = '/downloads/accessibility/' + file;
    // Guides only need each check's status; full evidence stays in the downloadable record.
    const results = run.results.map(({ id, component, platform, item, status, startedAt }) => ({ id, component, platform, item, status, startedAt }));
    runs.push({ ...run, results, download, stale: isStale(run, current.definitionHash, current.packages) });
    outputs.push(['apps/docs/public' + download, bytes]);
  }
  if (new Set(runs.map(run => run.id)).size !== runs.length) throw Error('Duplicate accessibility record');
  runs.sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  outputs.push(['apps/docs/lib/generated/accessibility.json', Buffer.from(JSON.stringify({ ...current, runs }, null, 2) + '\n')]);
  for (const [path, bytes] of outputs) {
    const destination = resolve(root, path);
    if (check) {
      const actual = await readFile(destination).catch(() => null);
      if (!actual?.equals(bytes)) throw Error('Stale/missing accessibility output: ' + path + '; run docs:generate');
    } else { await mkdir(resolve(destination, '..'), { recursive: true }); await writeFile(destination, bytes); }
  }
  console.log(`Accessibility docs: ${current.definitions.length} component/platform/items; ${runs.length} retained runs.`);
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) await generateAccessibility(process.argv.includes('--check'));
