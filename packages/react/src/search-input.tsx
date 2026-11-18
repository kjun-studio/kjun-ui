import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { tokens, type InputSize } from "@kjun-ui/tokens";
import { forwardRef, useState, type ForwardedRef, type ReactElement, type ReactNode, type RefAttributes } from "react";
import { useSearchInputModel, type SearchInputModelProps } from "../../../shared/package-runtime/search-input";
import { SearchField, type SearchFieldInputProps } from "./combobox";
import { KjunSpinnerGlyph } from "./spinner-glyph";
import { KjunInput } from "./input";
import { SelectOption,optionLabel } from "./select-options";
export interface KjunSearchInputProps<T extends SelectOption = SelectOption> extends SearchInputModelProps<T>,
  // The input's own attributes; value, typing, keys and the popup stay with the search field.
  Pick<SearchFieldInputProps, "id" | "name" | "className" | "style" | "autoFocus" | "autoComplete" | "readOnly" | "required" | "inputMode"
    | "enterKeyHint" | "onFocus" | "onBlur" | "aria-describedby" | "aria-labelledby"> {
  placeholder?: string;
  ariaLabel?: string;
  error?: boolean;
  clearable?: boolean;
  size?: InputSize;
  /** Plain mode: the search icon turns into a spinner while results load elsewhere on the page (a table, a grid). */
  loading?: boolean;
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
// forwardRef drops type parameters; the cast keeps KjunSearchInput generic over its option type.
export const KjunSearchInput = forwardRef(function KjunSearchInput<T extends SelectOption = SelectOption>({
  value,
  placeholder,
  ariaLabel,
  disabled = false,
  error = false,
  clearable = true,
  debounce = 0,
  size = "md",
  loading = false,
  loadOptions,
  itemKey = "id",
  labelField = "name",
  minChars = 2,
  emptyText,
  errorText,
  renderOption,
  onValueChange,
  onSelect,
  onSearchError,
  onEnter,
  onClear,
  ...inputProps
}: KjunSearchInputProps<T>, ref: ForwardedRef<HTMLInputElement>) {
  const m = useKjunMessages();
  placeholder ??= m.search;
  emptyText ??= m.noResults;
  errorText ??= m.searchFailed;
  const [open, setOpen] = useState(false);
  const model = useSearchInputModel({ value, disabled, debounce, loadOptions, minChars, onValueChange, onSearchError }, open);
  const { query, options, loading: searching, failed } = model;
  const update = (value: string) => {
    setOpen(true);
    model.update(value);
  };
  const clear = () => {
    setOpen(false);
    model.clear();
    onClear?.();
  };
  // Phone keyboards show a search key in place of return.
  const input = { enterKeyHint: "search" as const, ...inputProps };
  if (!loadOptions)
    return (
      <KjunInput
        {...input}
        ref={ref}
        error={error}
        value={query}
        prefixIcon="search"
        // The spinner takes the search icon's place, so the text inset does not move while results load.
        prefix={loading ? <KjunSpinnerGlyph size={tokens.input[size].iconSize} /> : undefined}
        size={size}
        placeholder={placeholder}
        ariaLabel={ariaLabel || placeholder}
        aria-busy={loading || undefined}
        disabled={disabled}
        clearable={clearable}
        onValueChange={update}
        onClear={clear}
        onEnter={onEnter}
      />
    );
  return (
    <SearchField
      inputProps={input}
      inputRef={ref}
      error={error}
      value={query}
      size={size}
      placeholder={placeholder}
      ariaLabel={ariaLabel}
      disabled={disabled}
      clearable={clearable}
      open={open && query.length >= minChars}
      onOpenChange={setOpen}
      options={options}
      labelKey={labelField}
      itemKey={itemKey}
      emptyText={emptyText}
      loading={searching}
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
}) as <T extends SelectOption = SelectOption>(
  props: KjunSearchInputProps<T> & RefAttributes<HTMLInputElement>) => ReactElement;
