import { tokens } from "@kjun-ui/tokens";
import type { CSSProperties } from "react";
import { spinnerArc, spinnerCircle, spinnerStroke } from "../../../shared/package-runtime/spinner-geometry";

/** Internal loading ring shared by Spinner, Button, Fab, List, Switch and Toast. Decorative: the owner announces the state. */
export function KjunSpinnerGlyph({ size, stroke, className, style }: { size: number; stroke?: number; className?: string; style?: CSSProperties }) {
  const width = spinnerStroke(size, stroke);
  return (
    <svg className={"kjun-spin kjun-spinner-glyph" + (className ? " " + className : "")} width={size} height={size}
      viewBox="0 0 24 24" fill="none" aria-hidden="true" style={style}>
      <circle {...spinnerCircle} stroke="currentColor" strokeWidth={width} opacity={tokens.states.opacity.spinnerTrack} />
      <path d={spinnerArc} stroke="currentColor" strokeWidth={width} strokeLinecap="round" />
    </svg>
  );
}
