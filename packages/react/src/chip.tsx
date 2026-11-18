import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { forwardRef, type HTMLAttributes } from "react";
import { chipSize } from "../../../shared/package-runtime/chip-size";
import { tokens } from "@kjun-ui/tokens";
import { KjunIcon } from "./button";
// Like Vue, attributes the chip does not use reach its root span.
export interface KjunChipProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> { label: string; icon?: string; removable?: boolean; disabled?: boolean; size?: "sm" | "md" | "lg"; removeLabel?: string; onRemove?: () => void }
/** The ref reaches the removal button, the chip's only focus target; it is null when the chip is not removable. */
export const KjunChip = forwardRef<HTMLButtonElement, KjunChipProps>(function KjunChip({ label, icon, removable = false, disabled = false, size: requested = "md", removeLabel, onRemove, className, ...props }, ref) {
  const m = useKjunMessages(), size = chipSize(requested);
  return <span {...props} className={"kjun-chip" + (className ? " " + className : "")} data-size={size} data-disabled={disabled} data-removable={removable} aria-disabled={disabled && !removable ? true : undefined}>{icon && <KjunIcon name={icon} size={tokens.extensions.chip.iconSizes[size]} />}<span title={label}>{label}</span>{removable && <button ref={ref} type="button" aria-label={removeLabel || m.remove(label)} disabled={disabled} onClick={() => onRemove?.()}><KjunIcon name="x" size={tokens.extensions.chip.removeIconSizes[size]} /></button>}</span>;
});
