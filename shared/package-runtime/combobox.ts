import { useEffect, useState } from "react";
import { optionLabel, optionValue, type OptionValue, type SelectOption } from "./options";
import { comboboxOptions } from "./combobox-options";

export function useComboboxModel<T extends SelectOption>({
  value, options, labelKey, valueKey, disabled, filterFn, searchKeys, onValueChange, onChange, onSearch, onClear,
}: {
  value: OptionValue | null; options: T[]; labelKey: string; valueKey: string; disabled: boolean;
  filterFn?: (option: T, query: string) => boolean; searchKeys?: readonly string[];
  onValueChange?: (value: OptionValue | null) => void;
  onChange?: (value: OptionValue | null) => void;
  onSearch?: (value: string) => void; onClear?: () => void;
}) {
  const selected = options.find(option => optionValue(option, valueKey) === value);
  const selectedLabel = selected !== undefined ? optionLabel(selected, labelKey) : "";
  const [query, setQuery] = useState(selectedLabel);
  // Opening shows every option; only text typed since then filters the list.
  const [typed, setTyped] = useState(false);
  const [open, setOpen] = useState(false);
  // Recreated option objects do not replace an in-progress search draft.
  useEffect(() => setQuery(selectedLabel), [value, selectedLabel]);
  useEffect(() => { if (disabled) setOpen(false); }, [disabled]);
  const change = (next: OptionValue | null) => { onValueChange?.(next); onChange?.(next); };
  return {
    open,
    displayValue: open && !disabled ? query : selectedLabel,
    options: comboboxOptions({ options, query, typed, labelKey, filterFn, searchKeys }),
    isSelected: (option: T) => value !== null && optionValue(option, valueKey) === value,
    changeOpen(next: boolean) { setOpen(next); if (next && !open) { setQuery(selectedLabel); setTyped(false); } },
    search(next: string, openOnInput: boolean) { setQuery(next); setTyped(true); if (openOnInput) setOpen(true); onSearch?.(next); },
    select(option: T) { change(optionValue(option, valueKey)); setQuery(optionLabel(option, labelKey)); setTyped(false); setOpen(false); },
    clear() { change(null); onClear?.(); },
  };
}
