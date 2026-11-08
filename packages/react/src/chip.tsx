import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import type { HTMLAttributes } from "react";
import { tokens } from "@kjun-ui/tokens";
import { KjunIcon } from "./button";
// Like Vue, attributes the chip does not use reach its root span.
export interface KjunChipProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> { label: string; icon?: string; removable?: boolean; disabled?: boolean; size?: "sm" | "md" | "lg"; removeLabel?: string; onRemove?: () => void }
export function KjunChip({ label, icon, removable = false, disabled = false, size = "md", removeLabel, onRemove, className, ...props }: KjunChipProps) {
  const m = useKjunMessages();
  return <span {...props} className={"kjun-chip" + (className ? " " + className : "")} data-size={size} data-disabled={disabled} data-removable={removable}>{icon && <KjunIcon name={icon} size={tokens.extensions.chip.iconSizes[size]} />}<span title={label}>{label}</span>{removable && <button type="button" aria-label={removeLabel || m.remove(label)} disabled={disabled} onClick={() => onRemove?.()}><KjunIcon name="x" size={tokens.extensions.chip.removeIconSizes[size]} /></button>}</span>;
}
