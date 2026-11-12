/** How a bottom bar draws its icons: "auto" outlines them and fills the selected one; "filled" and "outline" keep one style for all. */
export type NavigationIconStyle = "auto" | "filled" | "outline";

/** Whether a destination's icon draws its filled glyph (icons without one fall back to the outline). */
export const navigationIconFilled = (style: NavigationIconStyle, selected: boolean) => style === "filled" || (style === "auto" && selected);
