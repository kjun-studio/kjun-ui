import { tokens } from "@kjun-ui/tokens";

export type ListLeadingSize = "xs" | "sm" | "md" | "lg";

/**
 * Explicit sizes reserve a square. Only a built-in icon background opts into sm automatically; in an open section a
 * built-in icon always sits on a 40px rounded square (its own color, or the secondary role).
 */
export function listLeadingGeometry({ size, custom, background, open = false }: { size?: ListLeadingSize; custom: boolean; background: boolean; open?: boolean }) {
  const list = tokens.extensions.list;
  if (open && !custom && !size) return { size: "md" as ListLeadingSize, width: list.open.leadingSize, iconSize: list.open.leadingIconSize, tile: true };
  const resolved = size ?? (!custom && background ? "sm" : undefined);
  return {
    size: resolved,
    width: resolved ? list.leadingSizes[resolved] : custom ? list.leadingWidth : tokens.dimension.value24,
    iconSize: resolved ? list.leadingIconSizes[resolved] : list.iconSize,
    tile: !custom && (background || open),
  };
}

/**
 * How far a leading box, switch or mark may reach into a one-line row's vertical padding (a negative margin, the same
 * on every platform; Web's --_kjun-list-bleed-limit). Anything up to the title line plus twice this fits without
 * growing the row past its minimum height, and taller content still keeps `minimumInset` to the row's edge, whatever
 * its size: an avatar, a leading square or a switch.
 */
export function listRowBleed(paddingY: number) {
  return Math.min(0, tokens.extensions.list.minimumInset - paddingY);
}
