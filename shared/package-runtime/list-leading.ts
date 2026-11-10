import { tokens } from "@kjun-ui/tokens";

export type ListLeadingSize = "xs" | "sm" | "md" | "lg";

/**
 * Explicit sizes reserve a square. Only a built-in icon background opts into sm automatically; in an open section a
 * built-in icon always sits on a 40px rounded square (its own color, or the secondary role).
 */
export function listLeadingGeometry({ size, custom, background, open = false }: { size?: ListLeadingSize; custom: boolean; background: boolean; open?: boolean }) {
  const list = tokens.extensions.list;
  if (open && !custom && !size) return { size: "md" as ListLeadingSize, width: list.open.leadingSize, column: list.open.leadingSize, iconSize: list.open.leadingIconSize, tile: true };
  const resolved = size ?? (!custom && background ? "sm" : undefined);
  const width = resolved ? list.leadingSizes[resolved] : custom ? list.leadingWidth : tokens.dimension.value24;
  return {
    size: resolved,
    /** The leading box itself (avatar or icon square). */
    width,
    /** The column it sits in: a sized box smaller than the 40px leading column keeps that column (centered), so
     *  titles start on one line whether the row leads with an app avatar or a 32px icon square. */
    column: resolved ? Math.max(width, list.leadingWidth) : width,
    iconSize: resolved ? list.leadingIconSizes[resolved] : list.iconSize,
    tile: !custom && (background || open),
  };
}

/**
 * The leading column a section's rows share (Web's --_kjun-list-shared-column): beside an avatar or a sized square, a
 * plain icon centers in the 40px column (56px beside an lg box), so every title and divider starts on one line. A list
 * of plain icons keeps their 24px column, and rows without leading content are not counted.
 */
export function listSharedColumn(rows: { leading: boolean; custom: boolean; size?: ListLeadingSize; background: boolean }[], open = false) {
  return Math.max(0, ...rows.filter(row => row.leading).map(row => listLeadingGeometry({ size: row.size, custom: row.custom, background: row.background, open }))
    .filter(geometry => geometry.size || geometry.column >= tokens.extensions.list.leadingWidth).map(geometry => geometry.column));
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
