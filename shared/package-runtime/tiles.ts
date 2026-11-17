// KjunTiles on every platform: how many same-width cells fit, the gap between them and each cell's width.
// Web gets the same result from CSS (container query + auto-fill grid); Native applies these to its measured width.
/** auto is compact in a container narrower than the breakpoint (tokens.responsive.tilesGap) and regular from it. */
export type TilesGap = "auto" | "compact" | "regular";
/** A cell's narrowest width before a column is dropped: tokens.extensions.tiles.minItem. */
export type TilesMinItem = "sm" | "md" | "lg";
export type TilesMaxColumns = 2 | 3 | 4;

const maxColumnsSteps: readonly number[] = [2, 3, 4];

/** The gap step that applies at a container width. */
export const tilesGapStep = (gap: TilesGap, width: number, breakpoint: number): "compact" | "regular" =>
  gap === "auto" ? (width < breakpoint ? "compact" : "regular") : gap;

/** As many columns as keep each cell at least minItem wide, between one and maxColumns. Unmeasured widths get one. */
export function tilesColumns(width: number, minItem: number, gap: number, maxColumns: number): number {
  const fit = Math.floor((width + gap) / (minItem + gap));
  return Number.isFinite(fit) && fit > 1 ? Math.min(fit, maxColumns) : 1;
}

/** Each cell's share of the width after the gaps, like a grid track; undefined until the container has a width. */
export const tilesCellWidth = (width: number, columns: number, gap: number): number | undefined =>
  width > 0 ? (width - gap * (columns - 1)) / columns : undefined;

/** The props with their defaults; a maxColumns outside 2·3·4 falls back to 4. A Vue template's max-columns="3"
 *  arrives as the string "3" and counts as 3. */
export const tilesProps = (gap?: TilesGap, minItem?: TilesMinItem, maxColumns?: number | string) => {
  const columns = Number(maxColumns);
  return {
    gap: gap ?? "auto",
    minItem: minItem ?? "md",
    maxColumns: (maxColumnsSteps.includes(columns) ? columns : 4) as TilesMaxColumns,
  };
};
