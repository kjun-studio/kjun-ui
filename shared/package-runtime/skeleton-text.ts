// Shared rules for skeleton text: line widths, the line box of a type role, and one pulse clock for every skeleton.
import { tokens, type TypographyRole } from "@kjun-ui/tokens";

type Percent = `${number}%`;
const bodyWidths: Percent[] = ["100%", "96%", "92%", "98%", "94%"];
/** A paragraph that does not look like every other one, with a short last line. */
export function skeletonTextWidths(rows: number): Percent[] {
  const count = Math.max(0, Math.floor(Number.isFinite(rows) ? rows : 0));
  return Array.from({ length: count }, (_, i) => (count === 1 ? "60%" : i === count - 1 ? "55%" : bodyWidths[i % bodyWidths.length]));
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
