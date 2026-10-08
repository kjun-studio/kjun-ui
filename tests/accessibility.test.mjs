import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { definitions, targets } from '../shared/accessibility-guides/index.mjs';
import { validateDefinitions, validateRun, isStale, json } from '../scripts/a11y/records.mjs';
import { latestRun, resultFor, verificationHref, apiAnchor } from '../shared/accessibility-guides/selection.ts';
const defs = definitions();
const [catalog, api, navigation] = await Promise.all(['shared/component-catalog.json', 'apps/docs/lib/generated/api-reference.json', 'shared/docs-navigation.json'].map(json));

test('all 77 public components and feedback have explicit platform/item/check/API mappings', () => {
  assert.equal(targets.length, 78); assert.equal(defs.length, 702);
  validateDefinitions(defs, catalog, api, navigation);
  for (const def of defs) {
    if (!def.applicable) assert.ok(def.reason.length > 20);
    if (def.platform === 'native') assert.match(def.platformNote, /Native Web.*iOS·Android.*미실행/);
  }
});
test('documentation rejects missing platforms/items, invented API/check IDs and missing N/A/parent reasons', () => {
  const invalid = (change, pattern) => { const next = structuredClone(defs); change(next); assert.throws(() => validateDefinitions(next, catalog, api, navigation), pattern); };
  invalid(next => next.pop(), /missing\/duplicate item/);
  invalid(next => next.push(next[0]), /missing\/duplicate item/);
  invalid(next => { next[0].id = 'render-passed'; }, /invalid check ID/);
  invalid(next => { next[0].api = ['inventedPalette']; }, /invalid API/);
  invalid(next => { next.find(def => !def.applicable).reason = ''; }, /not-applicable reason/);
  invalid(next => { next.find(def => def.component === 'DsTabPane').scenario.parent = ''; }, /parent context/);
});
function record() {
  const date = '2026-09-14T03:00:00.000Z';
  return { schemaVersion: 1, id: 'a11y-20260914T030000000Z-12345678', startedAt: date, finishedAt: date, definitionHash: 'hash',
    environment: { node: 'v24', os: 'test fixture only', playwright: 'test fixture only' }, packages: [{ name: '@kjun/react', version: '0.2.0', integrity: 'hash' }],
    devices: { ios: 'not-run', android: 'not-run' }, screenReader: 'not-run',
    results: defs.map(def => ({ ...resultFor(def), startedAt: def.applicable ? date : null, finishedAt: def.applicable ? date : null })) };
}
test('failure and skipped records remain valid, while contradictory or incomplete results are rejected', () => {
  const run = record(); run.results[0].status = 'failed'; run.results[0].reason = 'Assertion failure';
  validateRun(run, defs, 'hash');
  const invalid = (change, pattern) => { const next = structuredClone(run); change(next); assert.throws(() => validateRun(next, defs, 'hash'), pattern); };
  invalid(next => next.results.pop(), /missing current check/);
  invalid(next => { next.results[0].reason = null; }, /missing failure/);
  invalid(next => { next.results[0].status = 'not-applicable'; }, /applicability/);
  invalid(next => { next.results[0].startedAt = null; }, /execution time/);
  invalid(next => { next.devices.ios = 'passed'; }, /cannot claim device/);
  invalid(next => { next.results[0].expected = 'rendered'; }, /definition mismatch/);
});
test('current version, integrity and check-definition changes require rerunning, without rewriting history', () => {
  const run = record(); assert.equal(isStale(run, 'hash', run.packages), false);
  assert.equal(isStale(run, 'new definition', run.packages), true);
  assert.equal(isStale(run, 'hash', [{ ...run.packages[0], integrity: 'new bytes' }]), true);
  assert.equal(isStale(run, 'hash', [{ ...run.packages[0], version: '0.3.0' }]), true);
  assert.equal(isStale(run, 'hash', []), true);
  // Historical definitions can contain retired checks; their original results are retained.
  const old = record(); old.results.pop(); validateRun(old, defs, 'new definition');
});
test('selection shares component/platform/record/item and skips filtered non-executions only by default', () => {
  const older = record(), newer = structuredClone(older);
  newer.id = 'a11y-20260914T040000000Z-12345678'; newer.results.forEach(result => { result.startedAt = null; });
  assert.equal(latestRun([newer, older], 'DsButton', 'react'), older);
  assert.equal(resultFor(defs[0], newer).status, 'not-run');
  assert.equal(verificationHref('DsInput', 'native', older.id, 'labeling'), '/verification?component=DsInput&platform=native&record=' + older.id + '#labeling');
  assert.equal(apiAnchor('react', 'props', 'ariaLabel'), 'api-react-props-ariaLabel');
});
test('generated downloads preserve the exact bytes of every original execution record', async () => {
  const generated = await json('apps/docs/lib/generated/accessibility.json');
  for (const run of generated.runs) {
    const bytes = await readFile(new URL('../docs/accessibility-runs/' + run.id + '.json', import.meta.url));
    const downloaded = await readFile(new URL('../apps/docs/public' + run.download, import.meta.url));
    assert.ok(bytes.equals(downloaded));
    assert.equal(JSON.parse(bytes).startedAt, run.startedAt);
  }
});
