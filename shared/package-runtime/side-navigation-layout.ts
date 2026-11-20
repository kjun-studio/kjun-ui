// Rules for KjunSideNavigationLayout's spaces rail and menu panel, shared by the Vue 3, React and Native layouts.

/** The menu panel beside a spaces rail: a card set into the rail's band, or flat against it with a line before the page. */
export type SideNavigationPanelSurface = "card" | "flat";

type SpacesGeometry = { paddingX: number; iconSize: number; spacesRailPaddingX: number; spacesPanelWidth: number; spacesPanelInset: number };

/** The rail's cell: an icons-only menu row (padding, icon, padding) with the rail's padding on each side. */
export function spacesRailCellWidth(geometry: Pick<SpacesGeometry, "paddingX" | "iconSize" | "spacesRailPaddingX">): number {
  return geometry.paddingX * 2 + geometry.iconSize + geometry.spacesRailPaddingX * 2;
}

/** The column's width: the rail's cell, plus the panel (and a card's end inset) while the panel is open. */
export function spacesColumnWidth(geometry: SpacesGeometry, surface: SideNavigationPanelSurface, panelCollapsed: boolean): number {
  const rail = spacesRailCellWidth(geometry);
  if (panelCollapsed) return rail;
  return rail + geometry.spacesPanelWidth + (surface === "card" ? geometry.spacesPanelInset : 0);
}

/** Where focus goes after the panel opens or closes: to the rail's expand button when the panel closes around the focus
 * or by its own button, to the panel's collapse button when a button opened it, otherwise it stays (null). */
export function spacesFocusAfterChange(nextCollapsed: boolean, focusInPanel: boolean, byButton: boolean): "expand" | "collapse" | null {
  if (nextCollapsed) return focusInPanel || byButton ? "expand" : null;
  return byButton ? "collapse" : null;
}

/** The layout props a spaces rail replaces (the rail is the collapsed column, and the panel has one width), named only
 * when the app set them, for a development warning. */
export function spacesIgnoredProps(props: { collapsed?: boolean; railLabels?: boolean; width?: string }): string[] {
  const ignored: string[] = [];
  if (props.collapsed) ignored.push("collapsed");
  if (props.railLabels) ignored.push("railLabels");
  if (props.width !== undefined && props.width !== "md") ignored.push("width");
  return ignored;
}
