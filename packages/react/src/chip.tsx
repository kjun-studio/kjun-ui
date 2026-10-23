import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { tokens } from "@kjun-ui/tokens";
import { KjunIcon } from "./button";
export interface KjunChipProps { label: string; icon?: string; removable?: boolean; disabled?: boolean; size?: "sm" | "md" | "lg"; removeLabel?: string; onRemove?: () => void }
export function KjunChip({ label, icon, removable = false, disabled = false, size = "md", removeLabel, onRemove }: KjunChipProps) {
  const m = useKjunMessages();
  return <span className="kjun-chip" data-size={size} data-disabled={disabled} data-removable={removable}>{icon && <KjunIcon name={icon} size={tokens.extensions.chip.iconSizes[size]} />}<span>{label}</span>{removable && <button type="button" aria-label={removeLabel || m.remove(label)} disabled={disabled} onClick={onRemove}><KjunIcon name="x" size={tokens.extensions.chip.removeIconSizes[size]} /></button>}</span>;
}
