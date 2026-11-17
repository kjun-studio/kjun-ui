import { tokens } from "@kjun-ui/tokens";
import { spinnerArc, spinnerCircle, spinnerStroke } from "../../../shared/package-runtime/spinner-geometry";

/** Internal loading ring shared by Spinner, Button, Fab, List, Switch and Toast. Decorative: the owner announces the state. */
export function spinnerGlyph({ size, stroke, class: className }: { size: number; stroke?: number; class?: string }) {
  const width = spinnerStroke(size, stroke);
  return (
    <svg class={"kjun-spin kjun-spinner-glyph" + (className ? " " + className : "")} width={size} height={size}
      viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx={spinnerCircle.cx} cy={spinnerCircle.cy} r={spinnerCircle.r} stroke="currentColor" stroke-width={width} opacity={tokens.states.opacity.spinnerTrack} />
      <path d={spinnerArc} stroke="currentColor" stroke-width={width} stroke-linecap="round" />
    </svg>
  );
}
