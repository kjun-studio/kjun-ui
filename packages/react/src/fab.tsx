import { tokens } from "@kjun-ui/tokens";
import type { MouseEvent } from "react";
import { KjunIcon } from "./button";

export interface KjunFabProps {
  icon: string;
  /** The FAB has no visible text, so it needs a name. */
  ariaLabel: string;
  disabled?: boolean;
  /** Bottom safe area (px) the FAB stays above. */
  safeAreaBottom?: number;
  /** Extra space below, e.g. a bottom navigation's height. */
  offsetBottom?: number;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
}
/** A round primary action pinned to the bottom end of the viewport. */
export function KjunFab({ icon, ariaLabel, disabled = false, safeAreaBottom = 0, offsetBottom = 0, onClick }: KjunFabProps) {
  return <button type="button" className="kjun-fab" aria-label={ariaLabel} disabled={disabled} onClick={onClick}
    style={{ bottom: tokens.extensions.fab.inset + Math.max(0, safeAreaBottom) + Math.max(0, offsetBottom) }}>
    <KjunIcon name={icon} size={tokens.extensions.fab.iconSize} />
  </button>;
}
