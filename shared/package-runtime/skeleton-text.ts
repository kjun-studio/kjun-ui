// Line widths for KjunSkeleton text: a paragraph that does not look like every other one, with a short last line.
type Percent = `${number}%`;
const bodyWidths: Percent[] = ["100%", "96%", "92%", "98%", "94%"];
export function skeletonTextWidths(rows: number): Percent[] {
  const count = Math.max(0, Math.floor(Number.isFinite(rows) ? rows : 0));
  return Array.from({ length: count }, (_, i) => (count === 1 ? "60%" : i === count - 1 ? "55%" : bodyWidths[i % bodyWidths.length]));
}
