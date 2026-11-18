import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { tokens, type InputSize } from "@kjun-ui/tokens";
import { forwardRef, useState, type ForwardedRef, type ReactElement, type ReactNode, type RefAttributes } from "react";
import { useSearchInputModel, type SearchInputModelProps } from "../../../shared/package-runtime/search-input";
import { SearchField, type SearchFieldInputProps } from "./combobox";
import type { KjunTextInputHandle } from "./handles";
import { KjunInput } from "./input";
import { useKjunStyles } from "./provider";
import { SelectOption,optionLabel } from "./select-options";
import { KjunSpinnerGlyph } from "./spinner-glyph";
export interface KjunSearchInputProps<T extends SelectOption = SelectOption> extends SearchInputModelProps<T>,
  // The input's own props; value, typing and the popup stay with the search field.
  Pick<SearchFieldInputProps, "nativeID" | "testID" | "autoFocus" | "readOnly" | "style" | "containerStyle" | "enterKeyHint"
    | "autoCapitalize" | "autoCorrect" | "accessibilityHint" | "onFocus" | "onBlur"> {
  placeholder?: string;
  ariaLabel?: string;
  error?: boolean;
  clearable?: boolean;
  size?: InputSize;
  /** Plain mode: the search icon turns into a spinner while results load elsewhere on the screen (a table, a grid). */
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
}: KjunSearchInputProps<T>, ref: ForwardedRef<KjunTextInputHandle>) {
  const m = useKjunMessages();
  const { colors } = useKjunStyles();
  placeholder ??= m.search;
  emptyText ??= m.noResults;
  errorText ??= m.searchFailed;
  const [open, setOpen] = useState(false);
  const model = useSearchInputModel({ value, disabled, debounce, loadOptions, minChars, onValueChange, onSearchError }, open);
  const { query, options, loading: searching, failed } = model;
  const update = (value: string) => {
    model.update(value);
  };
  const clear = () => {
    setOpen(false);
    model.clear();
    onClear?.();
  };
  // The keyboard's return key reads as search.
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
        prefix={loading ? <KjunSpinnerGlyph size={tokens.input[size].iconSize} color={disabled ? colors.textDisabled : colors.textTertiary} /> : undefined}
        aria-busy={loading || undefined}
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
      inputProps={input}
      inputRef={ref}
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
        query.length < minChars ? m.minChars(minChars) : emptyText
      }
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
  props: KjunSearchInputProps<T> & RefAttributes<KjunTextInputHandle>) => ReactElement;
