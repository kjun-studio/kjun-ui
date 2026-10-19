/** Joins space-separated id lists, keeping each id once; empty input gives undefined so the attribute is omitted. */
export function mergeIds(...lists: (string | null | undefined)[]): string | undefined {
  const ids = [...new Set(lists.flatMap(list => (list ?? "").split(/\s+/)).filter(Boolean))];
  return ids.length ? ids.join(" ") : undefined;
}
/** Joins hint and error text for platforms that announce one accessibility hint string. */
export function joinHints(...parts: (string | null | undefined)[]): string | undefined {
  const text = parts.filter(Boolean);
  return text.length ? text.join(". ") : undefined;
}
