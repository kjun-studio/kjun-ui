// Expected counts come from the same data the docs render, so adding a section,
// category or example updates the tests instead of breaking them.
import discovery from '../../../apps/docs/lib/generated/discovery.json' with { type: 'json' };
import docsPages from '../../../shared/docs-pages.json' with { type: 'json' };

export { iconPageSize } from '../../../shared/icon-catalog';
export { motionScenarios } from '../../../shared/motion-examples';

/** Links in a page's "상세 문서 바로가기" navigation. */
export const shortcutCount = (id: string) => {
  const groups = discovery.documents.find(document => document.id === id)?.sectionGroups;
  if (!groups) throw Error(`No shortcut groups for ${id}`);
  return groups.length;
};
/** Top-level sections a document page declares. */
export const sectionCount = (id: string) => {
  const sections = docsPages.find(page => page.id === id)?.sections;
  if (!sections) throw Error(`No sections for ${id}`);
  return sections.length;
};
/** Catalog filter buttons: "전체" plus one per category. */
export const categoryFilterCount = discovery.categories.length + 1;
