import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { usePopupFocusGuard } from "../../../shared/package-runtime/use-layer";
import { useComboboxModel } from "../../../shared/package-runtime/combobox";
import { tokens, type InputSize } from "@kjun-ui/tokens";
import {
useEffect,
useId,
useImperativeHandle,
useRef,
useState,
type ReactNode,
type Ref
} from "react";
import { KjunSpinner } from "./display";
import { KjunIcon } from "./button";
import { KjunInput, type KjunInputProps } from "./input";
import { useCompositionGuard } from "./composition";
import { FloatingPanel } from "./layers";
import { resolveFocusReturn, type FocusReturn } from "./floating-panel";
import {
optionDisabled,
optionLabel,
optionKey,
OptionValue,
SelectOption,
} from "./select-options";
export interface KjunComboboxProps<T extends SelectOption = SelectOption> {
  value: OptionValue | null;
  options?: T[];
  placeholder?: string;
  ariaLabel?: string;
  labelKey?: string;
  valueKey?: string;
  /** Replaces the default ranked label/searchKeys match; results keep the original order. */
  filterFn?: (option: T, query: string) => boolean;
  /** Option fields searched besides the label; matches rank after label matches. */
  searchKeys?: string[];
  size?: InputSize;
  disabled?: boolean;
  error?: boolean;
  clearable?: boolean;
  emptyText?: string;
  /** Candidates are being fetched: the list shows a searching row and options cannot be chosen. */
  loading?: boolean;
  renderOption?: (option: T, selected: boolean) => ReactNode;
  onValueChange?: (v: OptionValue | null) => void;
  onChange?: (v: OptionValue | null) => void;
  onSearch?: (v: string) => void;
  onClear?: () => void;
  /** Where focus goes after choosing an option or Escape. Closing while typing keeps focus in the input. Web only. */
  returnFocus?: FocusReturn;
}
export function KjunCombobox<T extends SelectOption = SelectOption>({
  value,
  options = [],
  placeholder,
  ariaLabel,
  labelKey = "label",
  valueKey = "value",
  filterFn,
  searchKeys,
  size = "md",
  disabled = false,
  error = false,
  clearable = false,
  emptyText,
  loading = false,
  renderOption,
  onValueChange,
  onChange,
  onSearch,
  onClear,
  returnFocus,
}: KjunComboboxProps<T>) {
  const m = useKjunMessages();
  placeholder ??= m.searchOrSelect;
  emptyText ??= m.noResults;
  const model = useComboboxModel({ value, options, labelKey, valueKey, disabled, filterFn, searchKeys,
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
      loading={loading}
      isSelected={model.isSelected}
      renderOption={renderOption}
      onValueChange={(v) => model.search(v, true)}
      onSelect={model.select}
      onClear={model.clear}
      returnFocus={resolveFocusReturn(returnFocus)}
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
  /** The field's chosen option: checked in the list and highlighted when the list opens. */
  isSelected?: (o: T) => boolean;
  renderOption?: (o: T, selected: boolean) => ReactNode;
  onValueChange: (v: string) => void;
  onSelect: (o: T) => void;
  onClear?: () => void;
  onEnter?: () => void;
  returnFocus?: () => HTMLElement | null;
  /** SearchInput's own input attributes (id, name, className, autoFocus, focus handlers) and its ref. */
  inputProps?: SearchFieldInputProps;
  inputRef?: Ref<HTMLInputElement>;
}
/** Input attributes a search field passes through; the field owns value, typing, keys and the popup wiring. */
export type SearchFieldInputProps = Omit<KjunInputProps, "value" | "size" | "placeholder" | "ariaLabel" | "disabled" | "error" | "clearable"
  | "prefixIcon" | "role" | "onValueChange" | "onClear" | "onEnter" | "onChange" | "onKeyDown" | "onClick" | "onCompositionStart" | "onCompositionEnd">;
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
  isSelected,
  renderOption,
  onValueChange,
  onSelect,
  onClear,
  onEnter,
  returnFocus,
  inputProps,
  inputRef,
}: SearchFieldProps<T>) {
  const m = useKjunMessages();
  const composition = useCompositionGuard();
  const clearing = useRef(false);
  const ref = useRef<HTMLInputElement>(null),
    [highlighted, setActive] = useState(-1),
    id = "kjun-" + useId();
  useImperativeHandle(inputRef, () => ref.current!);
  const focusGuard = usePopupFocusGuard(ref);
  const active = !disabled && !loading && highlighted >= 0 &&
    highlighted < options.length && !optionDisabled(options[highlighted])
      ? highlighted : -1;
  useEffect(() => setActive(-1), [value, options.length]);
  // Opening starts from the chosen option, after the reset above in the same commit.
  useEffect(() => {
    if (!open || !isSelected) return;
    const index = options.findIndex(o => isSelected(o) && !optionDisabled(o));
    if (index < 0) return;
    setActive(index);
    const frame = requestAnimationFrame(() => document.getElementById(id + "-" + index)?.scrollIntoView({ block: "nearest" }));
    return () => cancelAnimationFrame(frame);
    // Only the open transition moves the highlight; typing keeps its own.
  }, [open]);
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
    (returnFocus?.() ?? ref.current)?.focus();
  };
  return (
    <>
      <KjunInput
        {...inputProps}
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
        onFocus={(event) => { inputProps?.onFocus?.(event); if (!clearing.current && focusGuard.canOpen()) onOpenChange(true); }}
        onBlur={(event) => {
          inputProps?.onBlur?.(event);
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
            returnFocus?.()?.focus();
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
              <KjunSpinner size="sm" text={m.searching} />
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
                {renderOption?.(o, isSelected?.(o) ?? false) || <span>{optionLabel(o, labelKey)}</span>}
                {isSelected?.(o) && <KjunIcon name="check" size={tokens.extensions.menu.iconSize} />}
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
