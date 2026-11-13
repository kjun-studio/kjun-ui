import { tokens } from "@kjun-ui/tokens";

export type EmptySize = "sm" | "md";

/** KjunEmpty's per-size geometry. The icon stroke is in the 24-unit viewBox, so every size paints iconStroke px. */
export function emptyGeometry(size: EmptySize) {
  const e = tokens.extensions.empty, sm = size === "sm";
  const iconSize = sm ? e.smIconSize : e.iconSize;
  return {
    iconSize,
    iconStroke: (e.iconStroke * 24) / iconSize,
    iconGap: sm ? e.smIconGap : e.iconGap,
    titleSize: sm ? e.smTitleSize : e.titleSize,
    titleLineHeight: sm ? e.smTitleLineHeight : e.titleLineHeight,
    paddingY: sm ? e.smPaddingY : e.paddingY,
    actionGap: sm ? e.smActionGap : e.actionGap,
  };
}

/**
 * Vertical padding, by who owns the space: a list section keeps the empty note one row tall,
 * a data state supplies its own size padding, and only a free-standing empty uses its size.
 */
export function emptyPaddingY(size: EmptySize, owner: { list: false | "default" | "compact"; state: boolean }) {
  if (owner.list) return owner.list === "compact" ? 0 : tokens.extensions.list.compactPaddingY;
  return owner.state ? 0 : emptyGeometry(size).paddingY;
}
