import { fabOffset } from "../../../shared/package-runtime/bottom-bar";
import { KjunSpinnerGlyph } from "./spinner-glyph";
import { tokens } from "@kjun-ui/tokens";
import { forwardRef, type ButtonHTMLAttributes, type CSSProperties, type MouseEvent } from "react";
import { KjunIcon, useMinimumLoading } from "./button";

export type KjunFabSize = "sm" | "md";
export interface KjunFabProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "type" | "name" | "autoFocus" | "onChange" | "onClick"> {
  icon: string;
  /** Visible text beside the icon; the circle becomes a capsule of the same height. */
  label?: string;
  /** The accessible name. Required without a label, since the icon alone says nothing. */
  ariaLabel?: string;
  /** "md" (default) is 56, "sm" is 48. Both take a label, loading and every state. */
  size?: KjunFabSize;
  /** Swaps the icon for a spinner and stops presses; the button keeps its colour. */
  loading?: boolean;
  disabled?: boolean;
  /** Stays above the bottom safe area from KjunProvider (default true). */
  safeArea?: boolean;
  /** Stays above the app's KjunBottomNavigation and KjunBottomActionBar (default true); false where the bar is not under the FAB. */
  avoidBottomBar?: boolean;
  /** Extra space below, in px. */
  offsetBottom?: number;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
}
/** A primary action pinned to the bottom end of the viewport: a circle, or a capsule with a label. */
export const KjunFab = forwardRef<HTMLButtonElement, KjunFabProps>(function KjunFab(
  { icon, label, ariaLabel, size = "md", loading = false, disabled = false, safeArea = true, avoidBottomBar = true, offsetBottom = 0, onClick, className = "", style, ...rest }, ref) {
  const busy = useMinimumLoading(loading), offset = fabOffset(offsetBottom);
  const iconSize = size === "sm" ? tokens.extensions.fab.smallIconSize : tokens.extensions.fab.iconSize;
  return <button {...rest} ref={ref} type="button" className={"kjun-fab " + className} data-size={size} data-label={label ? "" : undefined}
    data-safe-area={safeArea ? undefined : "false"} data-bottom-bar={avoidBottomBar ? undefined : "false"}
    aria-label={ariaLabel || rest["aria-label"]} aria-busy={busy || undefined} disabled={disabled}
    onClick={event => { if (!busy) onClick?.(event); }}
    style={{ ...(offset ? { "--_kjun-fab-offset": offset + "px" } as CSSProperties : {}), ...style }}>
    {busy ? <KjunSpinnerGlyph size={iconSize} /> : <KjunIcon name={icon} size={iconSize} />}
    {label && <span className="kjun-fab-label">{label}</span>}
  </button>;
});
