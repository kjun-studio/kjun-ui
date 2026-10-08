import { type InputSize } from "@kjun/tokens";
import { useState, type ReactNode } from "react";
import { useSearchInputModel, type SearchInputModelProps } from "../../../shared/package-runtime/search-input";
import { SearchField } from "./combobox";
import { DsInput } from "./input";
import { SelectOption,optionLabel } from "./select-options";
export interface DsSearchInputProps<T extends SelectOption = SelectOption> extends SearchInputModelProps<T> {
  placeholder?: string;
  ariaLabel?: string;
  error?: boolean;
  clearable?: boolean;
  size?: InputSize;
  itemKey?: string;
  labelField?: string;
  emptyText?: string;
  /** Shown when loadOptions rejects, instead of the empty text. */
  errorText?: string;
  renderOption?: (option: T) => ReactNode;
  onSelect?: (option: T) => void;
  onEnter?: () => void;
  onClear?: () => void;
}
export function DsSearchInput<T extends SelectOption = SelectOption>({
  value,
  placeholder = "검색...",
  ariaLabel,
  disabled = false,
  error = false,
  clearable = true,
  debounce = 0,
  size = "md",
  loadOptions,
  itemKey = "id",
  labelField = "name",
  minChars = 2,
  emptyText = "결과가 없습니다",
  errorText = "검색하지 못했습니다. 다시 시도해 주세요.",
  renderOption,
  onValueChange,
  onSelect,
  onSearchError,
  onEnter,
  onClear,
}: DsSearchInputProps<T>) {
  const [open, setOpen] = useState(false);
  const model = useSearchInputModel({ value, disabled, debounce, loadOptions, minChars, onValueChange, onSearchError }, open);
  const { query, options, loading, failed } = model;
  const update = (value: string) => {
    model.update(value);
  };
  const clear = () => {
    setOpen(false);
    model.clear();
    onClear?.();
  };
  if (!loadOptions)
    return (
      <DsInput
        error={error}
        value={query}
        prefixIcon="search"
        size={size}
        placeholder={placeholder}
        ariaLabel={ariaLabel || placeholder}
        disabled={disabled}
        clearable={clearable}
        onChangeText={update}
        onClear={clear}
        onSubmitEditing={onEnter}
      />
    );
  return (
    <SearchField
      error={error}
      value={query}
      size={size}
      placeholder={placeholder}
      ariaLabel={ariaLabel}
      disabled={disabled}
      clearable={clearable}
      open={open}
      onOpenChange={setOpen}
      options={options}
      labelKey={labelField}
      itemKey={itemKey}
      emptyText={
        query.length < minChars ? `${minChars}자 이상 입력하세요` : emptyText
      }
      loading={loading}
      failed={failed}
      errorText={errorText}
      renderOption={renderOption}
      onValueChange={update}
      onSelect={(o) => {
        model.select(optionLabel(o, labelField));
        onSelect?.(o);
        setOpen(false);
      }}
      onClear={clear}
      onEnter={onEnter}
    />
  );
}
