/** Joins space-separated id lists, keeping each id once; empty input gives undefined so the attribute is omitted. */
export function mergeIds(...lists: (string | null | undefined)[]): string | undefined {
  const ids = [...new Set(lists.flatMap(list => (list ?? "").split(/\s+/)).filter(Boolean))];
  return ids.length ? ids.join(" ") : undefined;
}
