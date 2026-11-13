// Shared rules for skeleton text: line widths, the line box of a type role, and one pulse clock for every skeleton.
import { tokens, type TypographyRole } from "@kjun-ui/tokens";

type Percent = `${number}%`;
const bodyWidths: Percent[] = ["100%", "96%", "92%", "98%", "94%"];
/** A paragraph that does not look like every other one, with a short last line. */
export function skeletonTextWidths(rows: number): Percent[] {
  const count = Math.max(0, Math.floor(Number.isFinite(rows) ? rows : 0));
  return Array.from({ length: count }, (_, i) => (count === 1 ? "60%" : i === count - 1 ? "55%" : bodyWidths[i % bodyWidths.length]));
}

/** Rows drawn for a count that may come from data: floored, never negative, and at most 100. */
export function skeletonCount(value: number) {
  return Number.isFinite(value) ? Math.min(100, Math.max(0, Math.floor(value))) : 0;
}

const cycle = <T,>(values: readonly T[], index: number) => values[((Math.floor(index) % values.length) + values.length) % values.length];
const rowTitles: Percent[] = ["42%", "58%", "34%", "50%", "46%"], rowDetails: Percent[] = ["28%", "36%", "22%", "32%", "26%"];
const wideTitles: Percent[] = ["72%", "84%", "60%", "78%", "66%"], wideDetails: Percent[] = ["46%", "54%", "38%", "50%", "42%"];
const scales = [1, 0.8, 1.1, 0.85, 0.95];
/**
 * Line widths for row `index` of a list skeleton, so neighbouring rows differ like real names do.
 * `wide` is for rows whose label column is narrow (market, compact, notification, the market table's identity).
 */
export function skeletonRowWidths(index: number, wide = false) {
  return { title: cycle(wide ? wideTitles : rowTitles, index), detail: cycle(wide ? wideDetails : rowDetails, index) };
}
/** A factor for a fixed-width bar (a value, a label), so a column of them does not read as stripes. */
export function skeletonWidthScale(index: number) {
  return cycle(scales, index);
}
const tableLead: Percent[] = ["48%", "62%", "54%", "70%", "44%"], tableValues: Percent[] = ["44%", "58%", "38%", "50%", "46%"];
/** Bar width for a cell of the table skeleton; row 0 is the header. The first column reads as names, the rest as values. */
export function skeletonTableWidth(row: number, column: number): Percent {
  if (row <= 0) return column === 0 ? "40%" : "36%";
  return column === 0 ? cycle(tableLead, row - 1) : cycle(tableValues, row * 2 + column * 3);
}

/** The web line box of a type role; without a role the line takes the surrounding text's line height. */
export function skeletonLineBox(role?: TypographyRole) {
  return role ? `var(--_kjun-type-${role.replace(/[A-Z]/g, (c) => "-" + c.toLowerCase())}-line)` : "1lh";
}

/**
 * A negative animation delay that puts a skeleton mounted now on the same pulse as every other one,
 * so skeletons that appear at different times still brighten and dim together.
 */
export function skeletonPhase(now = typeof performance === "undefined" ? 0 : performance.now()) {
  return `${-Math.round(now % tokens.motion.shimmer)}ms`;
}
