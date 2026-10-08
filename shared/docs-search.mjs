/** Search only published document records; all query text is treated as data. */
export function normalizeSearch(value) {
  return value.normalize('NFKC').toLocaleLowerCase('en').replace(/[\s_\-·]+/gu, '');
}

export function searchDocuments(documents, query) {
  const normalized = normalizeSearch(query.trim());
  if (!normalized) return documents.map(document => ({ document, href: document.path, match: '', score: 0 }));
  const words = query.trim().split(/\s+/u).map(normalizeSearch).filter(Boolean);
  return documents.flatMap(document => {
    const names = [document.title, document.component || ''];
    const aliases = document.aliases;
    const fields = [...names, ...aliases, ...document.api, ...document.useCases, document.description, ...document.terms];
    if (!words.every(word => fields.some(field => normalizeSearch(field).includes(word)))) return [];
    const exact = list => list.find(value => normalizeSearch(value) === normalized);
    const partial = list => list.find(value => normalizeSearch(value).includes(normalized));
    const apiMatch = exact(document.api) || partial(document.api) || document.api.find(value => words.includes(normalizeSearch(value)));
    const nameMatch = exact(names), aliasMatch = exact(aliases);
    const score = nameMatch ? 600 : aliasMatch ? 500 : partial(names) ? 450 : partial(aliases) ? 400 : apiMatch ? 300 : 100;
    const isApi = score === 300;
    const section = !nameMatch && !aliasMatch && !isApi
      ? document.sections.find(([, title]) => normalizeSearch(title) === normalized) : undefined;
    const match = nameMatch || aliasMatch || (isApi ? `API · ${apiMatch}` : section?.[1] || partial(document.useCases)) || document.description;
    return [{ document, href: document.path + (isApi ? '#api' : section ? '#' + section[0] : ''), match, score }];
  }).sort((a, b) => b.score - a.score || a.document.title.localeCompare(b.document.title, 'en'));
}
