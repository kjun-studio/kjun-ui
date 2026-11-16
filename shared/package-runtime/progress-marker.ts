import { tokens } from "@kjun-ui/tokens";

/**
 * Where a reference marker stands on a bar (such as "today" on a budget), as a percent of the rail.
 * `marker` is on the value's own scale, 0 to `max`; null means there is nothing to draw.
 */
export function progressMarker(marker: number | null | undefined, max: number): number | null {
  if (marker == null || !Number.isFinite(marker) || !Number.isFinite(max) || max <= 0) return null;
  return Math.min(100, Math.max(0, (marker / max) * 100));
}

/** How far the marker's left edge moves back from its percent, so that at 0 and at max the line stays whole inside the rail. */
export const progressMarkerInset = (percent: number) => (percent / 100) * tokens.extensions.progress.marker.width;
