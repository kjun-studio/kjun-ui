import { usePopupExpanded } from "../../../shared/package-runtime/use-layer";
import { typeStyle, inputTypeStyle } from "./typography";
import { selectOptions } from "../../../shared/package-runtime/options";
import { tokens,type InputSize } from "@kjun-ui/tokens";
import {
useId,
useContext,
useRef,
useEffect,
type ReactNode
} from "react";
import { ListBox,ListBoxItem } from "react-aria-components";
import { useSelectState } from "../../../shared/package-runtime/select";
import { useCompositionGuard } from "./composition";
import { DsButton,DsIcon } from "./button";
import { DsSpinner } from "./display";
import { DsInput,FieldContext,useKjunField } from "./input";
import { CompoundControlContext } from "./compound-control";
import { FloatingPanel } from "./layers";
import {
optionDisabled,
optionLabel,
OptionValue,
SelectOption,
} from "./select-options";
export interface DsSelectProps<T extends SelectOption = SelectOption> {
  value: OptionValue | OptionValue[] | null;
  options?: T[];
  placeholder?: string;
  ariaLabel?: string;
  labelKey?: string;
  valueKey?: string;
  size?: InputSize;
  disabled?: boolean;
  searchable?: boolean;
  open?: boolean;
  loading?: boolean;
  searchPlaceholder?: string;
  optionPageSize?: number;
  clearable?: boolean;
  multiple?: boolean;
  error?: boolean;
  menuHeader?: ReactNode;
  renderOption?: (option: T, selected: boolean) => ReactNode;
  renderSelected?: (option: T | undefined) => ReactNode;
  onValueChange?: (v: OptionValue | OptionValue[] | null) => void;
  onChange?: (v: OptionValue | OptionValue[] | null) => void;
  onOpenChange?: (v: boolean) => void;
  onSearch?: (v: string) => void;
  onClear?: () => void;
}
export function DsSelect<T extends SelectOption = SelectOption>({
  value,
  options = [],
  placeholder = "선택",
  ariaLabel,
  labelKey = "label",
  valueKey = "value",
  size = "md",
  disabled = false,
  searchable = false,
  open: controlled,
  loading = false,
  searchPlaceholder = "검색...",
  optionPageSize = 0,
  clearable = false,
  multiple = false,
  error = false,
  menuHeader,
  renderOption,
  renderSelected,
  onValueChange,
  onChange,
  onOpenChange,
  onSearch,
  onClear,
}: DsSelectProps<T>) {
  const { open, query, limit, session, changeOpen, search, showMore } = useSelectState(controlled, disabled, optionPageSize, onOpenChange);
  const composition = useCompositionGuard();
  const ref = useRef<HTMLButtonElement>(null),
    menu = useRef<HTMLDivElement>(null),
    field = useKjunField(),
    id = useId();
  const segment = useContext(CompoundControlContext) !== null;
  const spec = tokens.input[size];
  const expanded = usePopupExpanded(open, ref);
  useEffect(() => {
    if (open && searchable) menu.current?.querySelector('input')?.focus({ preventScroll: true });
    if (!open) composition.onCompositionEnd();
  }, [open, searchable]);
  const change = (v: OptionValue | OptionValue[] | null) => {
    onValueChange?.(v);
    onChange?.(v);
  };
  const { selected, matching, visible, selectedOption, label, nextValue } = selectOptions({
    options, value, labelKey, valueKey, query, pageSize: optionPageSize, limit, loading, multiple,
  });
  return (
    <>
      <div className="kjun-select-shell">
        <button
          ref={ref}
          id={field?.id}
          type="button"
          className="kjun-input kjun-select-trigger"
          data-time-segment={segment || undefined}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-controls={expanded ? id : undefined}
          aria-expanded={expanded}
          aria-label={ariaLabel || placeholder}
          aria-labelledby={field?.labelId}
          aria-describedby={field?.describedBy}
          aria-invalid={error || !!field?.error || undefined}
          style={{
            height: spec.height,
            borderRadius: spec.radius,
            ...inputTypeStyle(size),
            // Time segments take their padding from compound-controls.css, which also aligns the first value.
            ...(segment ? {} : { paddingInline: spec.padding - tokens.border.controlWidth }),
          }}
          onClick={() => changeOpen(!open)}
          onKeyDown={(e) => {
            if (["ArrowDown", "ArrowUp"].includes(e.key)) {
              e.preventDefault();
              changeOpen(true);
            }
          }}
        >
          <span className={!label ? "kjun-placeholder" : undefined} style={{ flex: 1, paddingRight: clearable && label ? spec.clearSize + spec.affixGap : undefined }}>
            {renderSelected?.(selectedOption) || label || placeholder}
          </span>
          <DsIcon name="chevron-down" className="kjun-select-indicator" data-open={expanded || undefined} size={segment ? tokens.extensions.timePicker.iconSize : spec.iconSize} style={{ flexShrink: 0, color: disabled ? "var(--_kjun-color-text-disabled)" : "var(--_kjun-color-text-tertiary)" }} />
        </button>
        {clearable && !!label && (
          <DsButton
            size="sm"
            variant="ghost"
            ariaLabel="선택 지우기"
            disabled={disabled}
            className="kjun-select-clear"
            style={{
                    padding: 0, right: spec.padding + spec.iconSize + spec.affixGap, width: spec.clearSize, height: spec.clearSize, minHeight: spec.clearSize, borderRadius: "50%" }}
            onClick={() => {
              change(multiple ? [] : null);
              onClear?.();
              ref.current?.focus();
            }}
          ><DsIcon name="x" size={spec.iconSize} /></DsButton>
        )}
      </div>
      <FloatingPanel
        field
        open={open}
        onOpenChange={changeOpen}
        triggerRef={ref}
        placement="bottom-start"
        matchTriggerWidth
        className="kjun-select-panel kjun-select-options-panel"
      >
        <FieldContext.Provider value={null}><div ref={menu} className="kjun-select-content">
          {menuHeader && <div className="kjun-select-header">{menuHeader}</div>}
          {searchable && (
            <div className="kjun-select-search">
              <DsInput
                autoFocus
                value={query}
                placeholder={searchPlaceholder}
                ariaLabel="선택 항목 검색"
                size="sm"
                prefixIcon="search"
                onValueChange={(v) => {
                  search(v);
                  onSearch?.(v);
                }}
                onCompositionStart={composition.onCompositionStart}
                onCompositionEnd={composition.onCompositionEnd}
                onKeyDown={(e) => {
                  if (composition.isComposing(e)) {
                    e.stopPropagation();
                    return;
                  }
                  if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                    e.preventDefault();
                    const all = menu.current?.querySelectorAll<HTMLElement>(
                      '[role="option"]:not([aria-disabled="true"])'
                    );
                    all?.[e.key === "ArrowDown" ? 0 : all.length - 1]?.focus();
                  }
                }}
              />
            </div>
          )}
          {loading && (
            <div className="kjun-select-empty">
              <DsSpinner size="sm" text="검색 중..." />
            </div>
          )}
          <ListBox
            key={session}
            id={id}
            aria-label={ariaLabel || placeholder}
            // The popup owns Escape dismissal; selection changes only through options or Clear.
            escapeKeyBehavior="none"
            selectionMode={multiple ? "multiple" : "single"}
            selectedKeys={
              new Set(
                visible.flatMap(({ option, key }) => (selected(option) ? [key] : []))
              )
            }
            disabledKeys={
              new Set(
                visible.flatMap(({ option, key }) =>
                  optionDisabled(option) ? [key] : []
                )
              )
            }
            autoFocus={searchable ? false : "first"}
            className="kjun-listbox"

          >
            {visible.map(({ option: o, key }) => (
              <ListBoxItem
                key={key}
                id={key}
                onPress={() => {
                  if (optionDisabled(o)) return;
                  change(nextValue(o));
                  if (!multiple) changeOpen(false);
                }}
                textValue={optionLabel(o, labelKey)}
                className="kjun-option"
              >
                {renderOption?.(o, selected(o)) || (
                  <span>{optionLabel(o, labelKey)}</span>
                )}
                {selected(o) && <DsIcon name="check" size={tokens.extensions.menu.iconSize} />}
              </ListBoxItem>
            ))}
          </ListBox>
          {!loading && !matching.length && (
            <div className="kjun-select-empty">결과가 없습니다</div>
          )}
          {!loading && visible.length < matching.length && (
            <DsButton
              size="sm"
              variant="ghost"
              block
              onClick={showMore}
            >
              더 보기
            </DsButton>
          )}
        </div></FieldContext.Provider>
      </FloatingPanel>
    </>
  );
}
