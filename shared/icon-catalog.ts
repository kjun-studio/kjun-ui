import { iconLabels } from './icon-labels.ts';
export type IconEntry = { name: string; label: string; aliases: string[]; filled: boolean; category?: string; tags?: readonly string[] };
export const iconPageSize = 24;
export const normalizeIconQuery = (value: string) => value.normalize('NFKC').toLocaleLowerCase('en').replace(/[\s-]+/gu, '');
export function createIconCatalog(icons: Record<string, unknown>, filled: Record<string, unknown>, labels = iconLabels): IconEntry[] {
  const names = Object.keys(icons).sort(), seen = new Set<string>();
  for (const [name, label, ...aliases] of labels) {
    if (!Object.prototype.hasOwnProperty.call(icons, name) || seen.has(name) || !label.trim() || !aliases.length || aliases.some(alias => !alias.trim())) throw Error('Invalid icon label: ' + name);
    seen.add(name);
  }
  if (names.length !== seen.size || Object.keys(filled).some(name => !seen.has(name))) throw Error('Incomplete icon labels');
  return names.map(name => {
    const [, label, ...aliases] = labels.find(entry => entry[0] === name)!;
    return { name, label, aliases, filled: Object.prototype.hasOwnProperty.call(filled, name) };
  });
}
export function searchIcons(entries: IconEntry[], query: string) {
  const exact = normalizeIconQuery(query), words = query.trim().split(/\s+/u).map(normalizeIconQuery).filter(Boolean);
  return entries.filter(entry => {
    const fields = [entry.name, entry.label, ...entry.aliases, ...(entry.tags || []), entry.category || ''].map(normalizeIconQuery);
    return words.every(word => fields.some(field => field.includes(word)));
  }).sort((a, b) => Number(normalizeIconQuery(b.name) === exact) - Number(normalizeIconQuery(a.name) === exact) || a.name.localeCompare(b.name, 'en'));
}
export type IconSelection = { name: string; size: number; filled: boolean };
export function selectIcon(previous: IconSelection | null, entry: IconEntry): IconSelection {
  return { name: entry.name, size: previous?.size ?? 16, filled: !!previous?.filled && entry.filled };
}
