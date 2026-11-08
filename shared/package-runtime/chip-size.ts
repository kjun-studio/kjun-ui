import { tokens } from "@kjun-ui/tokens";

export type ChipSize = keyof typeof tokens.extensions.chip.typography;
/** Templates and plain JS can pass any string; an unknown size draws as md instead of losing its icon and spacing. */
export function chipSize(size: unknown): ChipSize {
  return typeof size === "string" && Object.prototype.hasOwnProperty.call(tokens.extensions.chip.typography, size) ? size as ChipSize : "md";
}
