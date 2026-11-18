import { tokens } from "@kjun-ui/tokens";

export type CopyButtonSize = "xs" | "sm" | "md";
/** CopyButton takes ghost-button geometry for its size: an icon-only control is a square of the button
 * height, a labelled one has the icon-side and label-side insets and the content gap. */
export function copyButtonGeometry(size: CopyButtonSize, labelled: boolean) {
  const height = tokens.button.heights[size];
  return {
    height,
    radius: tokens.button.radii[size],
    gap: tokens.button.contentGaps[size],
    width: labelled ? undefined : height,
    paddingStart: labelled ? tokens.button.iconSidePaddingX[size] : 0,
    paddingEnd: labelled ? tokens.button.paddingX[size] : 0,
  };
}
