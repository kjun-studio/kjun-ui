import { useEffect, useState } from "react";
import { optionLabel, optionValue, type OptionValue, type SelectOption } from "./options";

export function useComboboxModel<T extends SelectOption>({
  value, options, labelKey, valueKey, disabled, filterFn, onValueChange, onChange, onSearch, onClear,
}: {
  value: OptionValue | null; options: T[]; labelKey: string; valueKey: string; disabled: boolean;
  filterFn?: (option: T, query: string) => boolean;
  onValueChange?: (value: OptionValue | null) => void;
  onChange?: (value: OptionValue | null) => void;
  onSearch?: (value: string) => void; onClear?: () => void;
}) {
  const selected = options.find(option => optionValue(option, valueKey) === value);
  const selectedLabel = selected !== undefined ? optionLabel(selected, labelKey) : "";
  const [query, setQuery] = useState(selectedLabel);
  const [open, setOpen] = useState(false);
  // Recreated option objects do not replace an in-progress search draft.
  useEffect(() => setQuery(selectedLabel), [value, selectedLabel]);
  useEffect(() => { if (disabled) setOpen(false); }, [disabled]);
  const change = (next: OptionValue | null) => { onValueChange?.(next); onChange?.(next); };
  return {
    open,
    displayValue: open && !disabled ? query : selectedLabel,
    options: options.filter(option => filterFn ? filterFn(option, query)
      : optionLabel(option, labelKey).toLocaleLowerCase().includes(query.toLocaleLowerCase())),
    changeOpen(next: boolean) { setOpen(next); if (next && !open) setQuery(selectedLabel); },
    search(next: string, openOnInput: boolean) { setQuery(next); if (openOnInput) setOpen(true); onSearch?.(next); },
    select(option: T) { change(optionValue(option, valueKey)); setQuery(optionLabel(option, labelKey)); setOpen(false); },
    clear() { change(null); onClear?.(); },
  };
}
