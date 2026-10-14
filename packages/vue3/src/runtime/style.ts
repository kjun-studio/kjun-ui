import type { CSSProperties } from "vue";

// React appends px to numeric lengths; Vue writes values as given. Components port React's style
// objects through this so both platforms emit the same inline styles.
const unitless = new Set([
  "opacity", "zIndex", "fontWeight", "lineHeight", "flex", "flexGrow", "flexShrink", "order", "zoom",
  "aspectRatio", "columnCount", "gridColumn", "gridRow", "orphans", "widows", "tabSize",
]);

export type StyleInput = Record<string, string | number | null | undefined | false>;

export function css(...styles: (StyleInput | null | undefined | false)[]): CSSProperties {
  const result: Record<string, string | number> = {};
  for (const style of styles) {
    if (!style) continue;
    for (const [key, value] of Object.entries(style)) {
      if (value == null || value === false) continue;
      result[key] = typeof value === "number" && value !== 0 && !unitless.has(key) && !key.startsWith("--")
        ? value + "px" : value;
    }
  }
  return result as CSSProperties;
}
