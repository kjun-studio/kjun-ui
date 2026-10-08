import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { guideTopics, usageGuideHref, legacyGuideDestination } from '../shared/document-navigation.ts';
import { designSections } from '../shared/visual-guides/design-cases.ts';
import { comparisons, layouts } from '../shared/visual-guides/usage-content.ts';
import { searchDocuments } from '../shared/docs-search.mjs';
const { documents } = JSON.parse(readFileSync('apps/docs/lib/generated/discovery.json', 'utf8'));

test('every original guide section has one canonical page and a valid legacy destination', () => {
  const sections = guideTopics.flatMap(topic => topic.sections.map(([id]) => id));
  const expected = [...designSections, ...comparisons, ...layouts].map(item => item.id).concat('writing');
  assert.equal(sections.length, 23);
  assert.equal(new Set(sections).size, sections.length);
  assert.deepEqual(new Set(sections), new Set(expected));
  for (const topic of guideTopics) {
    const page = documents.find(page => page.path === topic.path);
    assert.equal(page.parentPageId, 'usage-guide');
    assert.deepEqual(page.sections, topic.sections);
    for (const [id] of topic.sections) {
      assert.equal(usageGuideHref(id), topic.path + '#' + id);
      assert.equal(legacyGuideDestination('/usage-guide', '?platform=native&note=%ED%95%9C%EA%B8%80', '#' + id), topic.path + '?platform=native&note=%ED%95%9C%EA%B8%80#' + id);
    }
  }
  for (const hash of ['', '#unknown', '#%E0%A4%A']) assert.equal(legacyGuideDestination('/usage-guide', '', hash), null);
  assert.equal(legacyGuideDestination('/usage-guide/forms', '', '#form'), null);
  assert.throws(() => usageGuideHref('unknown'), /Unknown/);
});

test('all component and feedback navigation groups follow the complete document order', () => {
  const pages = documents.filter(page => page.component || page.id === 'feedback');
  assert.equal(pages.length, 78);
  for (const page of pages) {
    assert.deepEqual(page.sectionGroups.map(group => group.title), ['사용법', '디자인', 'API', '접근성']);
    assert.deepEqual(page.sectionGroups.flatMap(group => group.sections), page.sections.map(([id]) => id), page.path);
    assert.deepEqual(page.sectionGroups.map(group => group.sections[0]), ['preview', page.component === 'DsTable' ? 'table-designs' : page.component === 'DsCard' ? 'card-designs' : 'anatomy', 'api', 'accessibility']);
  }
});

test('guide purpose searches lead to their topic, while component API priority remains intact', () => {
  for (const [query, path] of [['입력 폼', '/usage-guide/forms'], ['데이터 조회', '/usage-guide/data'], ['키보드 배치', '/usage-guide/mobile'], ['문구 작성', '/usage-guide/feedback']]) {
    assert.equal(searchDocuments(documents, query)[0].document.path, path, query);
  }
  assert.equal(searchDocuments(documents, 'loadOptions')[0].href, '/components/search-input#api');
  assert.equal(searchDocuments(documents, 'validator')[0].href, '/feedback#api');
});
