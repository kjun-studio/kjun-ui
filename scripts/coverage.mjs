import { readFile, writeFile, mkdir, readdir, rm } from 'node:fs/promises';
import { resolve, basename } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = resolve(import.meta.dirname, '..');
export const platforms = ['vue2', 'react', 'native'];
const fail = message => { throw Error('Docs coverage: ' + message); };

export function coverageStatus(state, platform) {
  if (state.status !== 'implemented') return 'unsupported';
  if (state.verification !== 'passed') return 'review';
  return platform === 'native' ? 'preview' : 'supported';
}

export function recordMetadata(source, text) {
  const title = text.match(/^# (.+)$/m)?.[1];
  // Dates belong to the record's opening paragraph, never build/file timestamps.
  const date = text.match(/^# .+\r?\n\s*\r?\n(\d{4}-\d{2}-\d{2})(?=[, ·\r\n])/m)?.[1];
  if (!title || !date || new Date(date).toISOString().slice(0, 10) !== date) fail('missing/invalid record title or date: ' + source);
  return { id: basename(source, '.md'), title, date, source, download: '/downloads/verification/' + basename(source) };
}

export function buildCoverage({ catalog, guides, navigation, discovery, helpers, records }) {
  if (new Set(catalog.map(entry => entry.name)).size !== catalog.length) fail('duplicate component');
  const entries = catalog.filter(entry => entry.kind !== 'internal');
  const names = new Set(entries.map(entry => entry.name));
  const documents = discovery.documents.filter(document => document.component);
  for (const [label, items, name] of [
    ['navigation', navigation.components, item => item.name],
    ['discovery', documents, item => item.component],
  ]) {
    if (items.length !== names.size || new Set(items.map(name)).size !== names.size || items.some(item => !names.has(name(item))))
      fail('missing/duplicate/unknown component in ' + label);
  }
  if (new Set(entries.map(entry => entry.docs)).size !== entries.length) fail('duplicate document destination');
  if (new Set(records.map(record => record.id)).size !== records.length) fail('duplicate record destination');
  const components = entries.map(entry => {
    const document = documents.find(document => document.component === entry.name);
    const meta = navigation.components.find(meta => meta.name === entry.name);
    const guide = guides[entry.name];
    if (!guide?.differences || entry.docs !== '/components/' + guide.slug || document.path !== entry.docs || !document.sections.some(([id]) => id === 'api'))
      fail('invalid document/API destination: ' + entry.name);
    if (document.category !== meta.category || !navigation.categories.some(category => category.id === meta.category)) fail('invalid category: ' + entry.name);
    const record = records.find(record => record.source === entry.verificationEvidence);
    if (!record) fail('missing verification record: ' + entry.name);
    for (const platform of platforms) {
      const state = entry.platforms[platform];
      if (!state?.status || !state.verification || !state.runtime) fail('missing platform state: ' + entry.name + '/' + platform);
    }
    return { name: entry.name, title: document.title, docs: entry.docs, category: meta.category,
      differences: guide.differences, platforms: entry.platforms,
      states: Object.fromEntries(platforms.map(platform => [platform, coverageStatus(entry.platforms[platform], platform)])),
      recordId: record.id };
  }).sort((a, b) => a.title.localeCompare(b.title, 'en'));
  const services = [
    { name: 'KjunProvider', description: '색상·서체 적용 영역', docs: '/styling', linkLabel: '색상·서체 연결', platforms },
    { name: 'KjunFeedbackProvider', description: 'Toast·Confirm·Prompt', docs: '/feedback', linkLabel: '피드백 서비스', platforms },
    ...helpers.filter(helper => helper.name === 'DsFormLayout').map(helper => ({ name: helper.name, description: helper.description,
      docs: helper.docs, linkLabel: 'FormGroup 사용 안내', platforms: [helper.platform] })),
  ];
  if (services.length !== 3 || services[2].platforms.join() !== 'native') fail('invalid FormLayout scope');
  for (const service of services)
    if (names.has(service.name) || !discovery.documents.some(document => document.path === service.docs)) fail('invalid service destination/count: ' + service.name);
  return { total: components.length,
    summary: platforms.map(platform => ({ platform, provided: components.filter(entry => entry.platforms[platform].status === 'implemented').length,
      counts: Object.fromEntries(['supported', 'preview', 'review', 'unsupported'].map(status => [status, components.filter(entry => entry.states[platform] === status).length])),
      runtimes: [...new Set(components.filter(entry => entry.platforms[platform].verification === 'passed').map(entry => entry.platforms[platform].runtime))],
      devicesNotRun: platform === 'native' && components.some(entry => entry.platforms.native.deviceVerification !== 'passed') })),
    components, services,
    records: records.map(record => ({ ...record, componentCount: components.filter(entry => entry.recordId === record.id).length })),
  };
}

async function generate() {
  const json = async file => JSON.parse(await readFile(resolve(root, file), 'utf8'));
  const [catalog, guides, navigation, discovery, helpers] = await Promise.all([
    'shared/component-catalog.json', 'shared/component-guides.json', 'shared/docs-navigation.json',
    'apps/docs/lib/generated/discovery.json', 'shared/platform-helpers.json',
  ].map(json));
  const sources = [...new Set(catalog.filter(entry => entry.kind !== 'internal').map(entry => entry.verificationEvidence))].sort();
  const originals = await Promise.all(sources.map(async source => {
    if (!/^docs\/[\w./-]+\.md$/.test(source) || source.split('/').includes('..')) fail('invalid record path: ' + source);
    const bytes = await readFile(resolve(root, source)).catch(() => fail('missing verification record: ' + source));
    return { bytes, metadata: recordMetadata(source, bytes.toString('utf8')) };
  }));
  const data = buildCoverage({ catalog, guides, navigation, discovery, helpers, records: originals.map(record => record.metadata) });
  const outputs = [
    ['apps/docs/lib/generated/coverage.json', Buffer.from(JSON.stringify(data, null, 2) + '\n')],
    ...originals.map(({ bytes, metadata }) => ['apps/docs/public' + metadata.download, bytes]),
  ];
  // Published records come only from tracked sources; leftovers from earlier builds must not ship.
  const downloads = resolve(root, 'apps/docs/public/downloads/verification');
  const expected = originals.map(({ metadata }) => basename(metadata.download)).sort();
  if (process.argv.includes('--check')) {
    const actual = (await readdir(downloads).catch(() => [])).sort();
    if (actual.join() !== expected.join()) fail('unexpected verification downloads: ' + actual.filter(file => !expected.includes(file)).join(', ') + '; run docs:generate');
  } else await rm(downloads, { recursive: true, force: true });
  for (const [path, bytes] of outputs) {
    const destination = resolve(root, path);
    if (process.argv.includes('--check')) {
      const current = await readFile(destination).catch(() => null);
      if (!current?.equals(bytes)) fail('stale or missing output: ' + path + '; run docs:generate');
    } else {
      await mkdir(resolve(destination, '..'), { recursive: true });
      await writeFile(destination, bytes);
    }
  }
  console.log(`Docs coverage aligned: ${data.total} public components, ${data.services.length} services, ${data.records.length} original records.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) await generate();
