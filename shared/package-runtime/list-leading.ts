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
 * Native: how far a leading square or a switch taller than the title line reaches into the row's vertical padding (a
 * negative margin), so it never grows a one-line row past its minimum height while keeping `minimumInset` to the row's
 * edge. Web does the same in list.css.
 */
export function listRowBleed(height: number, line: number, paddingY: number) {
  return Math.min(0, Math.max(tokens.extensions.list.minimumInset - paddingY, (line - height) / 2));
}
