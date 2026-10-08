import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { definitions, targets, platforms, items } from '../../shared/accessibility-guides/index.mjs';
export const root = resolve(import.meta.dirname, '../..');
export const json = async path => JSON.parse(await readFile(resolve(root, path), 'utf8'));
const fail = message => { throw Error('Accessibility verification: ' + message); };
async function files(path) {
  const result = [];
  for (const entry of (await readdir(resolve(root, path), { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
    const child = path + '/' + entry.name;
    if (entry.isDirectory()) result.push(...await files(child)); else result.push(child);
  }
  return result;
}
export async function definitionHash() {
  const inputs = [
    ...await files('shared/accessibility-guides'), ...await files('scripts/a11y'),
    ...await files('previews/catalog'), 'shared/example-registry.ts', 'shared/card-examples.ts', 'shared/table-examples.ts', 'shared/extension-examples.ts', 'shared/demo-colors.ts',
    'scripts/a11y-verify.mjs', 'scripts/examples.mjs', 'tests/browser/packed-fixture.ts',
    ...(await files('tests/fixtures')).filter(path => /\/a11y-|\/style-values/.test(path)),
  ].sort();
  const hash = createHash('sha256');
  hash.update(JSON.stringify(definitions()));
  for (const path of inputs) hash.update(path + '\0').update(await readFile(resolve(root, path)));
  return 'sha256-' + hash.digest('hex');
}
export function validateDefinitions(defs, catalog, api, navigation) {
  const names = [...catalog.filter(entry => entry.kind !== 'internal').map(entry => entry.name), 'KjunFeedbackProvider'];
  if (names.length !== targets.length || new Set(targets.map(target => target.name)).size !== names.length) fail('missing/duplicate target definition');
  const ids = new Set();
  for (const name of names) for (const platform of platforms) for (const item of items) {
    const matches = defs.filter(def => def.component === name && def.platform === platform && def.item === item);
    if (matches.length !== 1) fail('missing/duplicate item ' + [name, platform, item].join('/'));
    const def = matches[0]; if (ids.has(def.id)) fail('duplicate check ID'); ids.add(def.id);
    if (def.id !== `${name}.${platform}.${item}.v1`) fail('invalid check ID ' + def.id);
    for (const key of ['behavior', 'responsibility', 'platformNote', 'procedure', 'expected', 'limitation']) if (!def[key]?.trim()) fail('missing ' + key + ': ' + def.id);
    if (!def.applicable && !def.reason?.trim()) fail('missing not-applicable reason ' + def.id);
    const contract = name === 'KjunFeedbackProvider' ? api.feedback[platform] : api.components[name]?.[platform];
    const members = ['props', 'events', 'slots', 'methods', 'options'].flatMap(key => contract?.[key] || []);
    for (const member of def.api) if (!members.some(entry => entry.name === member)) fail('invalid API ' + name + '/' + platform + '/' + member);
    const parent = navigation.components.find(entry => entry.name === name)?.parent;
    if (parent && def.scenario.parent !== parent) fail('missing parent context ' + def.id);
  }
  if (defs.length !== ids.size) fail('unknown check/target');
}
const statuses = new Set(['passed', 'failed', 'not-run', 'not-applicable']);
export function validateRun(run, defs, hash) {
  if (run.schemaVersion !== 1 || !/^a11y-\d{8}T\d{9}Z-[a-f0-9]{8}$/.test(run.id)) fail('invalid record identity');
  for (const date of [run.startedAt, run.finishedAt]) if (!date || !Number.isFinite(Date.parse(date))) fail('missing actual execution time');
  if (run.finishedAt < run.startedAt) fail('invalid execution interval');
  if (!run.environment?.node || !run.environment?.os || !run.environment?.playwright || !run.definitionHash || !Array.isArray(run.packages)) fail('missing provenance');
  const ids = new Set();
  for (const result of run.results) {
    if (ids.has(result.id)) fail('duplicate result ' + result.id); ids.add(result.id);
    if (result.id !== `${result.component}.${result.platform}.${result.item}.v1` || !platforms.includes(result.platform) || !items.includes(result.item)) fail('invalid result ID');
    if (!statuses.has(result.status) || !result.actual || !result.procedure || !result.expected || !Array.isArray(result.observations)) fail('incomplete result');
    if (result.status !== 'passed' && !result.reason) fail('missing failure/skip reason');
    if (['passed', 'failed'].includes(result.status) && (!result.startedAt || !result.finishedAt || result.startedAt < run.startedAt || result.finishedAt > run.finishedAt)) fail('missing/invalid check execution time');
  }
  if (run.definitionHash === hash) {
    if (ids.size !== defs.length || defs.some(def => !ids.has(def.id))) fail('missing current check results');
    for (const def of defs) {
      const result = run.results.find(result => result.id === def.id);
      if ((result.status === 'not-applicable') !== !def.applicable) fail('incorrect applicability ' + def.id);
      if (result.procedure !== def.procedure || result.expected !== def.expected) fail('result definition mismatch ' + def.id);
    }
  }
  if (run.devices?.ios !== 'not-run' || run.devices?.android !== 'not-run' || run.screenReader !== 'not-run') fail('automatic DOM run cannot claim device or screen reader verification');
}
export function isStale(run, hash, packages) {
  return run.definitionHash !== hash || run.packages.length !== packages.length || packages.some(pkg => !run.packages.some(old => old.name === pkg.name && old.version === pkg.version && old.integrity === pkg.integrity));
}
export async function loadCurrent() {
  const [catalog, api, navigation, packages, hash] = await Promise.all([
    json('shared/component-catalog.json'), json('apps/docs/lib/generated/api-reference.json'), json('shared/docs-navigation.json'), json('artifacts/manifest.json'), definitionHash(),
  ]);
  const defs = definitions(); validateDefinitions(defs, catalog, api, navigation);
  return { definitions: defs, packages, definitionHash: hash };
}
