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
