import { usePopupFocusGuard } from "../../../shared/package-runtime/use-layer";
import { useComboboxModel } from "../../../shared/package-runtime/combobox";
import { type InputSize } from "@kjun/tokens";
import {
useEffect,
useId,
useRef,
useState,
type ReactNode
} from "react";
import { DsSpinner } from "./display";
import { DsInput } from "./input";
import { useCompositionGuard } from "./composition";
import { FloatingPanel } from "./layers";
import {
optionDisabled,
optionLabel,
optionKey,
OptionValue,
SelectOption,
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
      onValueChange={(v) => model.search(v, true)}
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
  const composition = useCompositionGuard();
  const clearing = useRef(false);
  const ref = useRef<HTMLInputElement>(null),
    [highlighted, setActive] = useState(-1),
    id = useId();
  const focusGuard = usePopupFocusGuard(ref);
  const active = !disabled && !loading && highlighted >= 0 &&
    highlighted < options.length && !optionDisabled(options[highlighted])
      ? highlighted : -1;
  useEffect(() => setActive(-1), [value, options.length]);
  useEffect(() => {
    if (!open) return;
    const leaveField = (event: FocusEvent) => {
      const target = event.target;
      if (target instanceof Node && !ref.current?.closest(".kjun-input-wrap")?.contains(target) &&
          !document.getElementById(id)?.contains(target)) onOpenChange(false);
    };
    document.addEventListener("focusin", leaveField);
    return () => document.removeEventListener("focusin", leaveField);
  }, [open, onOpenChange, id]);
  useEffect(() => {
    if (highlighted !== active) setActive(-1);
  }, [highlighted, active]);
  const available = options
    .map((o, i) => (optionDisabled(o) ? -1 : i))
    .filter((i) => i >= 0);
  const select = (o: T | undefined) => {
    // Recheck at commitment: an option may change after keyboard highlighting.
    if (o === undefined || disabled || loading || optionDisabled(o)) return;
    onSelect(o);
    onOpenChange(false);
    ref.current?.focus();
  };
  return (
    <>
      <DsInput
        error={error}
        ref={ref}
        value={value}
        size={size}
        placeholder={placeholder}
        ariaLabel={ariaLabel || placeholder}
        disabled={disabled}
        clearable={clearable}
        prefixIcon="search"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open && !disabled}
        aria-controls={open ? id : undefined}
        aria-activedescendant={
          open && active >= 0 ? id + "-" + active : undefined
        }
        onValueChange={(v) => {
          setActive(-1);
          onValueChange(v);
        }}
        onClear={() => {
          clearing.current = true;
          onClear?.();
          onOpenChange(false);
          queueMicrotask(() => { clearing.current = false; });
        }}
        onClick={() => { focusGuard.clear(); onOpenChange(true); }}
        onFocus={() => { if (!clearing.current && focusGuard.canOpen()) onOpenChange(true); }}
        onBlur={(event) => {
          focusGuard.clear();
          // Moving to the input's Clear button must not discard its draft before clicking.
          if (!event.currentTarget.closest(".kjun-input-wrap")?.contains(event.relatedTarget))
            onOpenChange(false);
        }}
        onCompositionStart={composition.onCompositionStart}
        onCompositionEnd={composition.onCompositionEnd}
        onKeyDown={(e) => {
          if (composition.isComposing(e)) return;
          let next = active;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            onOpenChange(true);
            next =
              available[
                Math.min(available.indexOf(active) + 1, available.length - 1)
              ] ?? -1;
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            onOpenChange(true);
            next = available[Math.max(available.indexOf(active) - 1, 0)] ?? -1;
          } else if (open && (e.key === "Home" || e.key === "End")) {
            e.preventDefault();
            next = available[e.key === "Home" ? 0 : available.length - 1] ?? -1;
          } else if (e.key === "Enter") {
            if (open && active >= 0) {
              e.preventDefault();
              select(options[active]);
            } else onEnter?.();
          } else if (e.key === "Escape" && open) {
            e.preventDefault();
            e.stopPropagation();
            onOpenChange(false);
          }
          setActive(next);
          if (next >= 0)
            document
              .getElementById(id + "-" + next)
              ?.scrollIntoView({ block: "nearest" });
        }}
      />
      <FloatingPanel
        field
        nonModal
        open={open && !disabled}
        onOpenChange={onOpenChange}
        triggerRef={ref}
        placement="bottom-start"
        matchTriggerWidth
        className="kjun-select-panel"
      >
        <div
          id={id}
          role="listbox"
          aria-label={ariaLabel || placeholder}
          onMouseDown={(e) => e.preventDefault()}
        >
          {loading ? (
            <div className="kjun-select-empty">
              <DsSpinner size="sm" text="검색 중..." />
            </div>
          ) : failed ? (
            <div className="kjun-select-empty" role="alert">{errorText}</div>
          ) : options.length ? (
            options.map((o, i) => (
              <div
                key={optionKey(o, itemKey, i)}
                id={id + "-" + i}
                role="option"
                aria-selected={active === i}
                aria-disabled={optionDisabled(o) || undefined}
                className="kjun-option"
                data-focused={active === i || undefined}
                onMouseMove={() => {
                  if (!optionDisabled(o)) setActive(i);
                }}
                onClick={() => {
                  if (!optionDisabled(o)) select(o);
                }}
              >
                {renderOption?.(o) || optionLabel(o, labelKey)}
              </div>
            ))
          ) : (
            <div className="kjun-select-empty">{emptyText}</div>
          )}
        </div>
      </FloatingPanel>
    </>
  );
}
