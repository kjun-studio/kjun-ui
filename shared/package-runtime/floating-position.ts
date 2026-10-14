import { tokens } from "@kjun-ui/tokens";

// Viewport (position: fixed) placement for popups, the role react-aria's positioning plays in React.
export type Side = "top" | "bottom" | "left" | "right";
export type Placement = Side | "bottom-start" | "bottom-end" | "top-start" | "top-end";
type Box = { top: number; left: number; right: number; bottom: number; width: number; height: number };
const opposite: Record<Side, Side> = { top: "bottom", bottom: "top", left: "right", right: "left" };
const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), Math.max(min, max));

export interface FloatingOptions {
  placement?: Placement;
  gap?: number;
  margin?: number;
  flip?: boolean;
  /** Cap for the panel height; the available space on the chosen side caps it too. */
  maxHeight?: number;
  arrowSize?: number;
}
export interface FloatingPosition { top: number; left: number; side: Side; maxHeight?: number; arrow: { left?: number; top?: number } }

export function computeFloatingPosition(trigger: Box, floating: { width: number; height: number }, options: FloatingOptions = {}): FloatingPosition {
  const { placement = "bottom", gap = tokens.extensions.floating.anchorGap, margin = tokens.extensions.floating.viewportInset,
    flip = true, maxHeight, arrowSize = tokens.extensions.tooltip.arrowSize } = options;
  const vw = window.innerWidth, vh = window.innerHeight;
  const [preferred, align] = placement.split("-") as [Side, "start" | "end" | undefined];
  const space = (side: Side) => side === "top" ? trigger.top - gap - margin : side === "bottom" ? vh - margin - trigger.bottom - gap
    : side === "left" ? trigger.left - gap - margin : vw - margin - trigger.right - gap;
  const needed = (side: Side) => side === "top" || side === "bottom" ? Math.min(floating.height, maxHeight ?? Infinity) : floating.width;
  let side = preferred;
  // Flip when the preferred side cannot hold the panel and the opposite side has more room.
  if (flip && space(side) < needed(side) && space(opposite[side]) > space(side)) side = opposite[side];
  const vertical = side === "top" || side === "bottom";
  const cap = vertical ? Math.max(0, Math.min(maxHeight ?? Infinity, space(side))) : maxHeight;
  const height = vertical ? Math.min(floating.height, cap ?? Infinity) : floating.height;
  const arrow: FloatingPosition["arrow"] = {};
  let top: number, left: number;
  if (vertical) {
    top = side === "top" ? trigger.top - gap - height : trigger.bottom + gap;
    const start = align === "start" ? trigger.left : align === "end" ? trigger.right - floating.width : trigger.left + trigger.width / 2 - floating.width / 2;
    left = clamp(start, margin, vw - floating.width - margin);
    arrow.left = clamp(trigger.left + trigger.width / 2 - left, arrowSize, floating.width - arrowSize);
  } else {
    left = side === "left" ? trigger.left - gap - floating.width : trigger.right + gap;
    top = clamp(trigger.top + trigger.height / 2 - floating.height / 2, margin, vh - floating.height - margin);
    arrow.top = clamp(trigger.top + trigger.height / 2 - top, arrowSize, floating.height - arrowSize);
  }
  return { top, left, side, maxHeight: cap === Infinity ? undefined : cap, arrow };
}
