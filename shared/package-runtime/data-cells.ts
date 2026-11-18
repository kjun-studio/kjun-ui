import { tokens } from "@kjun-ui/tokens";

export type HeatCellMode = "diverging" | "sequential" | "price";
export type HeatCellColor = "brand" | "success" | "danger" | "warning";

/**
 * How a heatmap cell is filled. `role` is the web colour role (`--_kjun-color-<role>`); Native maps it.
 * Diverging and price cells measure the distance from `center` (the middle of min..max when left out) on one scale,
 * the longer of the two sides, so the same strength means the same size on either side.
 */
export function heatCell(value: number | null | undefined, min: number, max: number, mode: HeatCellMode, color: HeatCellColor, center?: number | null) {
  if (value == null || !Number.isFinite(value)) return { missing: true as const, role: null, magnitude: 0, opacity: 0 };
  let magnitude: number, positive: boolean;
  if (mode === "sequential") {
    magnitude = max === min ? 0.5 : Math.min(1, Math.max(0, (value - min) / (max - min)));
    positive = true;
  } else {
    const mid = center != null && Number.isFinite(center) ? center : (min + max) / 2,
      scale = Math.max(Math.abs(min - mid), Math.abs(max - mid));
    magnitude = scale > 0 ? Math.min(1, Math.abs(value - mid) / scale) : 0;
    positive = value >= mid;
  }
  const role: HeatCellColor | "price-up" | "price-down" = mode === "sequential" ? color : mode === "price" ? (positive ? "price-up" : "price-down") : positive ? "success" : "danger";
  const { heatMinimum, heatMaximum } = tokens.states.opacity;
  return { missing: false as const, role, magnitude, opacity: magnitude ? heatMinimum + (heatMaximum - heatMinimum) * magnitude : 1 };
}

export type ProgressCellColor = "auto" | "brand" | "success" | "danger" | "warning" | "custom";

/**
 * The bar's width and fill. `custom` is the app's colour when one applies: customColor with color "custom", or
 * customColor alone (color left on "auto"). color "custom" without a customColor falls back to the auto colour.
 */
export function progressCellState<C>(value: number, max: number, color: ProgressCellColor, customColor?: C | null) {
  const percent = max > 0 && Number.isFinite(value) ? Math.min(100, Math.max(0, (value / max) * 100)) : 0,
    custom = customColor != null && customColor !== "" && (color === "custom" || color === "auto") ? customColor : undefined,
    role = color === "auto" || color === "custom" ? (percent < 30 ? "danger" : percent < 70 ? "warning" : "success") : color;
  return { percent, rounded: Math.round(percent), role, custom };
}

export type PriceFlash = boolean | "text" | "background";

/** Which way a price moved, for its flash; null when either side is not a finite number or nothing changed. */
export function priceFlashDirection(previous: number | null | undefined, next: number | null | undefined): "up" | "down" | null {
  if (previous == null || next == null || !Number.isFinite(previous) || !Number.isFinite(next) || previous === next) return null;
  return next > previous ? "up" : "down";
}

/** The flash's kind, or null when it is off. true means the text colour. */
export const priceFlashKind = (flash: PriceFlash | undefined) => flash === "background" ? "background" : flash ? "text" : null;

/** The web keyframe class for a flash (price-motion.css). */
export const priceFlashClass = (kind: "text" | "background", direction: "up" | "down") =>
  "kjun-price-flash-" + direction + (kind === "background" ? "-bg" : "");
