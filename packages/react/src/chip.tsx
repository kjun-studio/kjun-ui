import { tokens } from "@kjun/tokens";
import { DsIcon } from "./button";
export interface DsChipProps { label: string; icon?: string; removable?: boolean; disabled?: boolean; size?: "sm" | "md" | "lg"; removeLabel?: string; onRemove?: () => void }
export function DsChip({ label, icon, removable = false, disabled = false, size = "md", removeLabel, onRemove }: DsChipProps) {
  return <span className="kjun-chip" data-size={size} data-disabled={disabled} data-removable={removable}>{icon && <DsIcon name={icon} size={tokens.extensions.chip.iconSizes[size]} />}<span>{label}</span>{removable && <button type="button" aria-label={removeLabel || label + " 삭제"} disabled={disabled} onClick={onRemove}><DsIcon name="x" size={tokens.extensions.chip.removeIconSizes[size]} /></button>}</span>;
}
