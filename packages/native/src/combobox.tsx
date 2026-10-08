import { usePopupFocusGuard } from "../../../shared/package-runtime/use-layer";
import { useComboboxModel } from "../../../shared/package-runtime/combobox";
import { tokens, type InputSize } from "@kjun/tokens";
import { useId,useRef,type ReactNode } from "react";
import { Platform, View } from "react-native";
import { DsSpinner } from "./display";
import { DsInput,FieldContext } from "./input";
import { KText } from "./internal";
import { FloatingPanel } from "./layers";
import { useKjunStyles } from "./provider";
import {
OptionRow,
OptionValue,
SelectOption,
optionDisabled,
optionLabel,
optionKey,
} from "./select-options";
export interface DsComboboxProps<T extends SelectOption = SelectOption> {
  value: OptionValue | null;
  options?: T[];
  placeholder?: string;
  ariaLabel?: string;
  labelKey?: string;
  valueKey?: string;
  filterFn?: (option: T, query: string) => boolean;
  size?: InputSize;
  disabled?: boolean;
  error?: boolean;
  clearable?: boolean;
  emptyText?: string;
  renderOption?: (option: T) => ReactNode;
  onValueChange?: (v: OptionValue | null) => void;
  onChange?: (v: OptionValue | null) => void;
  onSearch?: (v: string) => void;
  onClear?: () => void;
}
export function DsCombobox<T extends SelectOption = SelectOption>({
  value,
  options = [],
  placeholder = "검색 또는 선택",
  ariaLabel,
  labelKey = "label",
  valueKey = "value",
  filterFn,
  size = "md",
  disabled = false,
  error = false,
  clearable = false,
  emptyText = "결과가 없습니다",
  renderOption,
  onValueChange,
  onChange,
  onSearch,
  onClear,
}: DsComboboxProps<T>) {
  const model = useComboboxModel({ value, options, labelKey, valueKey, disabled, filterFn,
    onValueChange, onChange, onSearch, onClear });
  return (
    <SearchField
      error={error}
      value={model.displayValue}
      size={size}
      placeholder={placeholder}
      ariaLabel={ariaLabel}
      disabled={disabled}
      clearable={clearable}
      open={model.open}
      onOpenChange={model.changeOpen}
      options={model.options}
      labelKey={labelKey}
      itemKey={valueKey}
      emptyText={emptyText}
      renderOption={renderOption}
      onValueChange={(v) => model.search(v, false)}
      onSelect={model.select}
      onClear={model.clear}
    />
  );
}
export interface SearchFieldProps<T extends SelectOption> {
  value: string;
  size: InputSize;
  placeholder: string;
  ariaLabel?: string;
  disabled?: boolean;
  error?: boolean;
  clearable?: boolean;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  options: T[];
  labelKey: string;
  itemKey: string;
  emptyText: string;
  loading?: boolean;
  /** A failed request; shown instead of the empty text so the two never look alike. */
  failed?: boolean;
  errorText?: string;
  renderOption?: (o: T) => ReactNode;
  onValueChange: (v: string) => void;
  onSelect: (o: T) => void;
  onClear?: () => void;
  onEnter?: () => void;
}
export function SearchField<T extends SelectOption>({
  value,
  size,
  placeholder,
  ariaLabel,
  disabled,
  error,
  clearable,
  open,
  onOpenChange,
  options,
  labelKey,
  itemKey,
  emptyText,
  loading,
  failed = false,
  errorText = "",
  renderOption,
  onValueChange,
  onSelect,
  onClear,
  onEnter,
}: SearchFieldProps<T>) {
  const searchId = "kjun-popup-search-" + useId().replace(/:/g, "");
  const clearing = useRef(false);
  const ref = useRef<View>(null),
    { colors } = useKjunStyles();
  const focusGuard = usePopupFocusGuard(ref);
  const openFromPress = () => { if (!disabled) { focusGuard.clear(); onOpenChange(true); } };
  const inputProps = {
    error,
    value,
    size,
    placeholder,
    ariaLabel: ariaLabel || placeholder,
    disabled,
    clearable,
    prefixIcon: "search",
    onChangeText: onValueChange,
    onClear: () => {
      clearing.current = true;
      onClear?.();
      onOpenChange(false);
      queueMicrotask(() => { clearing.current = false; });
    },
    onSubmitEditing: onEnter,
  };
  return (
    <>
      <View ref={ref} collapsable={false}>
        <DsInput {...inputProps} {...(Platform.OS === 'web' ? { onClick: openFromPress } : { onPressIn: openFromPress })} aria-expanded={open && !disabled} onBlur={focusGuard.clear} onFocus={() => { if (!clearing.current && focusGuard.canOpen()) onOpenChange(true); }} />
      </View>
      <FloatingPanel
        field
        open={open && !disabled}
        onOpenChange={onOpenChange}
        triggerRef={ref}
        placement="bottom-start"
        matchTriggerWidth
        ariaLabel={ariaLabel || placeholder}
      >
        <FieldContext.Provider value={null}>
        <View
          style={{
            padding: tokens.dimension.value8,
            borderBottomWidth: tokens.border.defaultWidth,
            borderBottomColor: colors.border,
          }}
        >
          <DsInput {...inputProps} nativeID={searchId} autoFocus />
        </View>
        {loading ? (
          // Centered like the Select loading row on every platform.
          <View style={{ padding: tokens.dimension.value12, alignItems: "center" }}>
            <DsSpinner size="sm" text="검색 중..." />
          </View>
        ) : failed ? (
          <KText
            accessibilityRole="alert"
            style={{
              padding: tokens.dimension.value12,
              textAlign: "center",
              color: colors.danger,
            }}
          >
            {errorText}
          </KText>
        ) : options.length ? (
          options.map((o, i) => (
            <OptionRow
              key={optionKey(o, itemKey, i)}
              selected={false}
              disabled={optionDisabled(o)}
              label={optionLabel(o, labelKey)}
              onPress={() => {
                onSelect(o);
                onOpenChange(false);
              }}
            >
              {renderOption?.(o)}
            </OptionRow>
          ))
        ) : (
          <KText
            style={{
              padding: tokens.dimension.value12,
              textAlign: "center",
              color: colors.textTertiary,
            }}
          >
            {emptyText}
          </KText>
        )}
        </FieldContext.Provider>
      </FloatingPanel>
    </>
  );
}
