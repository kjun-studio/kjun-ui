// What a bottom bar draws for each destination, shared by the Vue 3, React and Native bars.

/** How a bottom bar draws its icons: "auto" outlines them and fills the selected one; "filled" and "outline" keep one style for all. */
export type NavigationIconStyle = "auto" | "filled" | "outline";

/** Whether a destination's icon draws its filled glyph (icons without one fall back to the outline). */
export const navigationIconFilled = (style: NavigationIconStyle, selected: boolean) => style === "filled" || (style === "auto" && selected);

/**
 * The bar's layout: `hasIcons` when any destination has an icon, and `iconOnly` when labels are off on such a bar (the
 * lower bar). `parts` tells what one destination draws:
 * - `showLabel`: a destination without an icon always shows its label, so it never disappears from an icon-only bar;
 * - `iconBox`: the icon's box. A labelled bar keeps it empty for a destination without an icon so every label sits on
 *   one line; an icon-only bar drops it, leaving that destination's label centered;
 * - `badgeOnIcon`: the badge sits on the icon box's corner, otherwise in the line after the label.
 */
export function bottomNavigationLayout(items: readonly { icon?: string }[], showLabels: boolean) {
  const hasIcons = items.some(item => item.icon);
  return {
    hasIcons,
    iconOnly: hasIcons && !showLabels,
    parts(item: { icon?: string }) {
      const iconBox = hasIcons && (showLabels || !!item.icon);
      return { showLabel: showLabels || !item.icon, iconBox, badgeOnIcon: iconBox };
    },
  };
}

/**
 * How far a scrolling bar moves so one item is in view: 0 when it already is, otherwise the shortest move that brings it
 * in (its start first when it is wider than the view). Positions share one axis; a negative result scrolls back.
 */
export function revealDelta(itemStart: number, itemEnd: number, viewStart: number, viewEnd: number) {
  if (itemStart < viewStart || itemEnd - itemStart > viewEnd - viewStart) return itemStart - viewStart;
  if (itemEnd > viewEnd) return itemEnd - viewEnd;
  return 0;
}

/**
 * Web: how far a floating bar (the capsule, or a floating action bar's content) stands off the screen's bottom edge — its
 * margin in the page flow and, with sticky, its distance from the viewport's bottom while it sticks, so both agree.
 */
export const floatingBarEdge = (offset: number, safeBottom: string) => `calc(${offset}px + ${safeBottom})`;
