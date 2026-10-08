import { createRequire } from 'node:module';
import { createIconCatalog } from '../shared/icon-catalog.ts';
import { cardDesignExamples } from '../shared/card-examples.ts';
import { designCases, designTerms } from "../shared/visual-guides/design-cases.ts";
import { comparisons, layouts, writing } from '../shared/visual-guides/usage-content.ts';
import { guideTopics, detailSectionGroups } from '../shared/document-navigation.ts';
import { tableDesignExamples } from '../shared/table-examples.ts';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const root = resolve(import.meta.dirname, '..');
const packed = createRequire(resolve(root, 'apps/docs/package.json'));
const { icons, filledIcons } = packed('@kjun/tokens/icons');
createIconCatalog(icons, filledIcons); // Fail docs generation/check on missing, unknown or duplicate names.
const json = async file => JSON.parse(await readFile(resolve(root, file), 'utf8'));
const [catalog, guides, api, navigation, pages, visuals] = await Promise.all([
  'shared/component-catalog.json', 'shared/component-guides.json',
  'apps/docs/lib/generated/api-reference.json', 'shared/docs-navigation.json', 'shared/docs-pages.json', 'apps/docs/lib/generated/visual-guides.json',
].map(json));
const fail = reason => { throw Error('Docs discovery: ' + reason); };
const publicEntries = catalog.filter(entry => entry.kind !== 'internal');
const names = new Set(publicEntries.map(entry => entry.name));
const categoryIds = new Set(navigation.categories.map(category => category.id));
if (categoryIds.size !== navigation.categories.length) fail('duplicate category');
const metadata = new Map();
for (const entry of navigation.components) {
  if (!names.has(entry.name) || metadata.has(entry.name)) fail('unknown/duplicate component ' + entry.name);
  if (!categoryIds.has(entry.category)) fail('unknown category ' + entry.name);
  if (!entry.aliases?.length || !Array.isArray(entry.useCases)) fail('missing search metadata ' + entry.name);
  metadata.set(entry.name, entry);
}
if (metadata.size !== names.size) fail('incomplete public component coverage');
for (const entry of metadata.values()) {
  if (entry.parent) {
    const parent = metadata.get(entry.parent);
    if (!parent || parent.parent || parent.name === entry.name || parent.category !== entry.category)
      fail('invalid parent ' + entry.name);
  }
}
const sectionsFor = slug => ['button', 'input', 'modal'].includes(slug)
  ? [['preview', '미리보기'], ['guidelines', '사용 규칙'], ['usage', '기본 사용법'], ['anatomy', '구조'], ['states', '상태·크기'], ['api', 'API'], ['accessibility', '접근성·플랫폼 차이']]
  : [['preview', '실행 예제'], ['guidelines', '동작과 책임'], ['usage', '기본 사용법'], ...(slug === 'table' ? [['table-designs', '디자인 예제']] : slug === 'card' ? [['card-designs', '디자인 예제']] : []), ['anatomy', '구조'], ['states', '상태·크기'], ['api', 'API'], ['accessibility', '접근성·플랫폼 차이']];
const memberText = item => [item.summary, ...(item.details || []).flatMap(detail => [detail.label, detail.text]).flat()];
const componentDocuments = publicEntries.map(entry => {
  const guide = guides[entry.name], meta = metadata.get(entry.name);
  if (!guide || entry.docs !== '/components/' + guide.slug) fail('invalid destination ' + entry.name);
  const contract = api.components[entry.name];
  if (!contract) fail('missing API ' + entry.name);
  const members = Object.values(contract).flatMap(platform => [...platform.props, ...platform.events, ...platform.slots]);
  const apiNames = members.map(member => member.name);
  const contractTerms = Object.values(contract).flatMap(platform => [...platform.ownership, ...platform.types.flatMap(type => [type.name, type.summary, ...type.fields.flatMap(memberText)])]);
  const category = navigation.categories.find(category => category.id === meta.category);
  return {
    id: guide.slug, path: entry.docs, title: entry.name.slice(2), group: 'Components',
    component: entry.name, description: guide.description, category: meta.category,
    ...(meta.parent ? { parent: meta.parent } : {}),
    aliases: [...meta.aliases, ...(entry.name === 'DsTable' ? tableDesignExamples.map(item => item.label) : entry.name === 'DsCard' ? cardDesignExamples.map(item => item.label) : [])], useCases: meta.useCases,
    api: [...new Set(apiNames)],
    sectionGroups: detailSectionGroups(designCases.filter(item => item.components.includes(entry.name)).map(item => 'design-' + item.id), entry.name === 'DsTable' ? ['table-designs'] : entry.name === 'DsCard' ? ['card-designs'] : []),
    terms: ['구조 도해', 'Anatomy', ...designTerms(designCases.filter(item => item.components.includes(entry.name))), ...Object.values(visuals[entry.name].platforms).flatMap(p => [...p.figures.flatMap(f => f.parts.flatMap(part => [part.label, part.description])), ...p.states.map(s => s.label)]), ...members.flatMap(memberText), ...contractTerms, guide.interaction, guide.states, guide.differences, category.label, ...category.aliases, ...sectionsFor(guide.slug).map(section => section[1])],
    sections: [...sectionsFor(guide.slug).slice(0, -2), ...designCases.filter(item => item.components.includes(entry.name)).map(item => ["design-" + item.id, item.title]), ...sectionsFor(guide.slug).slice(-2)], platforms: entry.platforms,
    thumbnail: '/previews/thumbnails/' + guide.slug + '.png',
  };
});
const components = navigation.categories.flatMap(category => {
  const entries = componentDocuments.filter(entry => entry.category === category.id);
  return entries.filter(entry => !entry.parent).sort((a, b) => a.title.localeCompare(b.title, 'en')).flatMap(parent => [
    parent, ...entries.filter(entry => entry.parent === parent.component).sort((a, b) => a.title.localeCompare(b.title, 'en')),
  ]);
});
const guideSections = guideTopics.flatMap(topic => topic.sections.map(([id]) => id));
const expectedGuideSections = [...new Set(designCases.map(item => item.section)), ...comparisons.map(item => item.id), ...layouts.map(item => item.id), 'writing'];
if (new Set(guideSections).size !== guideSections.length || guideSections.length !== expectedGuideSections.length || expectedGuideSections.some(id => !guideSections.includes(id)))
  fail('missing, duplicate or unknown guide section');
const pageDefinitions = pages.flatMap(page => page.id === 'usage-guide' ? [
  { ...page, sections: guideTopics.map(topic => [topic.id, topic.title]) },
  ...guideTopics.map(topic => ({ ...topic, group: 'Foundations', parentPageId: 'usage-guide' })),
] : [page]);
const guideTerms = page => {
  if (page.parentPageId !== 'usage-guide') return [];
  const ids = page.sections.map(([id]) => id);
  return ['기본 사용법', '구현 방법', '공통 설정', ...(designCases.some(item => ids.includes(item.section)) ? ['전후 비교'] : []), ...designTerms(designCases.filter(item => ids.includes(item.section))),
    ...comparisons.filter(item => ids.includes(item.id)).flatMap(c => [c.title, c.situation, ...c.rows.flat()]),
    ...layouts.filter(item => ids.includes(item.id)).flatMap(l => [l.title, l.description]),
    ...(ids.includes('writing') ? writing.flatMap(w => [w.title, w.before, w.after, w.explanation]) : [])];
};
const documents = [...pageDefinitions.map(page => ({
  ...page, api: [...new Set([...(page.api || []), ...(page.path === '/feedback' ? Object.values(api.feedback).flatMap(p => [...p.methods, ...p.options].flatMap(m => m.name.split(' / '))) : [])])],
  ...(page.id === 'feedback' ? { sectionGroups: detailSectionGroups() } : {}),
  aliases: [...page.aliases, ...catalog.filter(entry => entry.kind === 'internal' && entry.docs === page.path).map(entry => entry.name)],
  terms: [...guideTerms(page), ...(page.path === '/feedback' ? Object.values(api.feedback).flatMap(p => [...p.ownership, ...[...p.methods, ...p.options].flatMap(memberText)]) : []), ...page.sections.map(section => section[1]), ...navigation.categories.filter(category => category.id === page.category).flatMap(category => [category.label, ...category.aliases])],
})), ...components];
for (const key of ['id', 'path'])
  if (new Set(documents.map(document => document[key])).size !== documents.length) fail('duplicate document ' + key);
const knownPages = { overview: '/', principles: '/principles', 'getting-started': '/getting-started', catalog: '/catalog',
  verification: '/verification',
  'usage-guide': '/usage-guide', tokens: '/tokens', motion: '/motion', accessibility: '/accessibility', interaction: '/interaction', icons: '/icons', layout: '/layout', elevation: '/elevation', styling: '/styling', feedback: '/feedback', components: '/components',
  ...Object.fromEntries(guideTopics.map(topic => [topic.id, topic.path])) };
if (pageDefinitions.length !== Object.keys(knownPages).length || pageDefinitions.some(page => knownPages[page.id] !== page.path))
  fail('unimplemented or missing document destination');
for (const document of documents) {
  if (!document.path.startsWith('/') || document.path.includes('#') || document.path.includes('?')) fail('invalid path');
  if (document.api.length && !document.sections.some(([id]) => id === 'api')) fail('missing API destination ' + document.path);
  if (document.parentPageId && !documents.some(parent => parent.id === document.parentPageId && !parent.parentPageId)) fail('invalid document parent');
  if (document.sectionGroups && JSON.stringify(document.sectionGroups.flatMap(group => group.sections)) !== JSON.stringify(document.sections.map(([id]) => id))) fail('invalid section group order ' + document.path);
}
const output = JSON.stringify({
  categories: navigation.categories.map(category => ({ ...category, count: components.filter(entry => entry.category === category.id).length })),
  documents,
}, null, 2) + '\n';
const target = resolve(root, 'apps/docs/lib/generated/discovery.json');
if (process.argv.includes('--check')) {
  if (await readFile(target, 'utf8').catch(() => null) !== output) fail('index is stale; run docs:generate');
} else await writeFile(target, output);
console.log(`Docs discovery aligned: ${components.length} components, ${navigation.categories.length} categories, ${documents.length} documents.`);
