import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { buildCoverage, coverageStatus, recordMetadata } from '../scripts/coverage.mjs';

const json = async path => JSON.parse(await readFile(new URL('../' + path, import.meta.url), 'utf8'));
const [catalog, guides, navigation, discovery, helpers, generated] = await Promise.all([
  'shared/component-catalog.json', 'shared/component-guides.json', 'shared/docs-navigation.json',
  'apps/docs/lib/generated/discovery.json', 'shared/platform-helpers.json', 'apps/docs/lib/generated/coverage.json',
].map(json));
const input = { catalog, guides, navigation, discovery, helpers, records: generated.records };

test('coverage includes every public component once, excluding services and internals', () => {
  const data = buildCoverage(input);
  assert.deepEqual(data, generated);
  assert.equal(data.total, 77);
  assert.deepEqual(data.components.map(entry => entry.name).sort(), catalog.filter(entry => entry.kind !== 'internal').map(entry => entry.name).sort());
  assert.equal(new Set(data.components.map(entry => entry.docs)).size, data.total);
  for (const summary of data.summary) {
    assert.equal(summary.provided, 77);
    assert.equal(summary.counts[summary.platform === 'native' ? 'preview' : 'supported'], 77);
    assert.deepEqual(summary.runtimes, [summary.platform === 'native' ? 'react-native-web' : 'chromium']);
  }
  assert.equal(data.summary.find(summary => summary.platform === 'native').devicesNotRun, true);
  assert.deepEqual(data.services.map(service => [service.name, service.platforms]), [
    ['KjunProvider', ['vue2', 'react', 'native']], ['KjunFeedbackProvider', ['vue2', 'react', 'native']], ['DsFormLayout', ['native']],
  ]);
});

test('implementation and verification determine all four statuses and summary counts', () => {
  assert.equal(coverageStatus({ status: 'absent', verification: 'passed' }, 'react'), 'unsupported');
  assert.equal(coverageStatus({ status: 'implemented', verification: 'not-run' }, 'native'), 'review');
  const altered = structuredClone(input);
  altered.catalog[0].platforms.react.status = 'not-implemented';
  altered.catalog[1].platforms.native.verification = 'not-run';
  const data = buildCoverage(altered);
  assert.equal(data.summary[1].provided, 76);
  assert.equal(data.summary[1].counts.unsupported, 1);
  assert.equal(data.summary[2].counts.review, 1);
  assert.equal(data.summary[2].counts.preview, 76);
});

test('coverage rejects missing, duplicate and invalid component, document and evidence mappings', () => {
  const invalid = (mutate, message) => { const next = structuredClone(input); mutate(next); assert.throws(() => buildCoverage(next), message); };
  invalid(data => data.catalog.push(data.catalog[0]), /duplicate component/);
  invalid(data => data.catalog.shift(), /missing\/duplicate\/unknown/);
  invalid(data => data.navigation.components.pop(), /missing\/duplicate\/unknown/);
  invalid(data => data.discovery.documents.push(data.discovery.documents.find(document => document.component)), /missing\/duplicate\/unknown/);
  invalid(data => { data.catalog[0].docs = '/components/incorrect'; }, /invalid document/);
  invalid(data => { data.catalog[0].verificationEvidence = 'docs/missing.md'; }, /missing verification record/);
  invalid(data => { data.records = []; }, /missing verification record/);
  invalid(data => { data.helpers[0].platform = 'react'; }, /FormLayout scope/);
});

test('downloaded records preserve original bytes, opening dates and current link counts', async () => {
  assert.deepEqual(generated.records.map(record => record.date).sort(), ['2026-10-08']);
  assert.deepEqual(generated.records.map(record => record.componentCount), [77]);
  for (const record of generated.records) {
    const source = await readFile(new URL('../' + record.source, import.meta.url));
    const download = await readFile(new URL('../apps/docs/public' + record.download, import.meta.url));
    assert.ok(source.equals(download));
    assert.equal(recordMetadata(record.source, source.toString()).date, record.date);
    assert.equal(record.componentCount, catalog.filter(entry => entry.kind !== 'internal' && entry.verificationEvidence === record.source).length);
  }
  assert.throws(() => recordMetadata('docs/example.md', '# Missing date\n\nNo dated opening.\n\n2026-09-14 · later note'), /date/);
  assert.throws(() => recordMetadata('docs/example.md', '# Bad date\n\n2026-02-30 · invalid'), /date/);
});
