import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { usePopupExpanded } from "../../../shared/package-runtime/use-layer";
import { mergeIds } from "../../../shared/package-runtime/aria-ids";
import { typeStyle, inputTypeStyle } from "./typography";
import { selectOptions } from "../../../shared/package-runtime/options";
import { tokens,type InputSize } from "@kjun-ui/tokens";
import {
useId,
useContext,
useRef,
useEffect,
useLayoutEffect,
useState,
type ReactNode
} from "react";
import { Header, ListBox, ListBoxItem, ListBoxSection } from "react-aria-components";
import { measureHiddenLabels, selectClearMarkStyle, selectClearStyle } from "../../../shared/package-runtime/select-trigger";
import type { SelectMultipleDisplay } from "../../../shared/package-runtime/options";
import { useSelectState } from "../../../shared/package-runtime/select";
import { centerSelectedOption } from "../../../shared/package-runtime/center-option";
import { useCompositionGuard } from "./composition";
import { KjunButton,KjunIcon } from "./button";
import { KjunSpinner } from "./display";
import { KjunInput,FieldContext,useKjunField } from "./input";
import { CompoundControlContext } from "./compound-control";
import { FloatingPanel } from "./layers";
import { resolveFocusReturn, type FocusReturn } from "./floating-panel";
import {
optionDisabled,
optionLabel,
OptionValue,
SelectOption,
} from "./select-options";
export interface KjunSelectProps<T extends SelectOption = SelectOption> {
  value: OptionValue | OptionValue[] | null;
  /** Options, or groups `{ label, options }` that put a title over their options. */
  options?: T[];
  placeholder?: string;
  ariaLabel?: string;
  labelKey?: string;
  /** Trigger id for an outside <label for>; defaults to the FormGroup's id. */
  id?: string;
  /** Extra description ids, merged with the FormGroup's hint and error. */
  ariaDescribedBy?: string;
  valueKey?: string;
  size?: InputSize;
  disabled?: boolean;
  /** Shows the value without opening the list or clearing it. */
  readOnly?: boolean;
  searchable?: boolean;
  open?: boolean;
  loading?: boolean;
  searchPlaceholder?: string;
  optionPageSize?: number;
  clearable?: boolean;
  multiple?: boolean;
  /** With multiple: "count" shows "N selected" for two or more, "labels" names them and counts the ones that do not fit. */
  multipleDisplay?: SelectMultipleDisplay;
  error?: boolean;
  menuHeader?: ReactNode;
  renderOption?: (option: T, selected: boolean) => ReactNode;
  /** `value` lets a value whose option has not loaded yet still show something. */
  renderSelected?: (option: T | undefined, value: OptionValue | OptionValue[] | null) => ReactNode;
  onValueChange?: (v: OptionValue | OptionValue[] | null) => void;
  onChange?: (v: OptionValue | OptionValue[] | null) => void;
  onOpenChange?: (v: boolean) => void;
  onSearch?: (v: string) => void;
  /** Replaces the default ranked label/searchKeys match; results keep the original order. */
  filterFn?: (option: T, query: string) => boolean;
  /** Extra option fields searched after the label. */
  searchKeys?: string[];
  onClear?: () => void;
  /** Where focus goes when the menu closes by choosing or Escape, instead of the trigger (e.g. an edited cell). Web only. */
  returnFocus?: FocusReturn;
}
export function KjunSelect<T extends SelectOption = SelectOption>({
  value,
  options = [],
  placeholder,
  ariaLabel,
  labelKey = "label",
  id: triggerId,
  ariaDescribedBy,
  valueKey = "value",
  size = "md",
  disabled = false,
  readOnly = false,
  searchable = false,
  open: controlled,
  loading = false,
  searchPlaceholder,
  optionPageSize = 0,
  clearable = false,
  multiple = false,
  multipleDisplay = "count",
  error = false,
  menuHeader,
  renderOption,
  renderSelected,
  onValueChange,
  onChange,
  onOpenChange,
  onSearch,
  onClear,
  filterFn,
  searchKeys,
  returnFocus,
}: KjunSelectProps<T>) {
  const m = useKjunMessages();
  placeholder ??= m.select;
  searchPlaceholder ??= m.search;
  const { open, query, limit, session, changeOpen, search, showMore } = useSelectState(controlled, disabled, optionPageSize, onOpenChange);
  const composition = useCompositionGuard();
  const ref = useRef<HTMLButtonElement>(null),
    menu = useRef<HTMLDivElement>(null),
    field = useKjunField(),
    id = "kjun-" + useId();
  const segment = useContext(CompoundControlContext) !== null;
  const spec = tokens.input[size];
  const expanded = usePopupExpanded(open, ref);
  const registerControl = field?.setControlId;
  useEffect(() => {
    if (!registerControl || !triggerId) return;
    registerControl(triggerId);
    return () => registerControl(undefined);
  }, [registerControl, triggerId]);
  useEffect(() => {
    if (open && searchable) menu.current?.querySelector('input')?.focus({ preventScroll: true });
    if (!open) composition.onCompositionEnd();
    // After the list has focused and revealed the selected option, move it to the middle.
    if (open && segment) {
      let frame = requestAnimationFrame(() => { frame = requestAnimationFrame(() => centerSelectedOption(menu.current?.querySelector<HTMLElement>(".kjun-listbox"))); });
      return () => cancelAnimationFrame(frame);
    }
  }, [open, searchable, segment]);
  const change = (v: OptionValue | OptionValue[] | null) => {
    onValueChange?.(v);
    onChange?.(v);
  };
  const { selected, matching, visible, sections, grouped, selectedOption, label, labels, hasValue, nextValue } = selectOptions({
    options, value, labelKey, valueKey, query, pageSize: optionPageSize, limit, loading, multiple, filterFn, searchKeys,
    selectedCount: m.selectedCount, multipleDisplay,
  });
  const listed = multiple && multipleDisplay === "labels" && labels.length > 1;
  const valuesText = useRef<HTMLSpanElement>(null);
  const [hidden, setHidden] = useState(0);
  const labelsKey = listed ? labels.join("\n") : "";
  // Count the labels that do not fit; the count's own width can hide one more, so it re-measures on resize.
  useLayoutEffect(() => {
    const text = valuesText.current;
    if (!text) { setHidden(0); return; }
    const update = () => setHidden(measureHiddenLabels(text));
    update();
    const observer = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(update);
    observer?.observe(text);
    return () => observer?.disconnect();
  }, [labelsKey]);
  const custom = renderSelected?.(selectedOption, value);
  const showClear = clearable && !readOnly && !disabled && hasValue;
  const focusSearch = () => menu.current?.querySelector<HTMLInputElement>(".kjun-select-search input")?.focus({ preventScroll: true });
  const option = (o: T, key: string) => (
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
      {selected(o) && !segment && <KjunIcon name="check" size={tokens.extensions.menu.iconSize} />}
    </ListBoxItem>
  );
  return (
    <>
      <div className="kjun-select-shell">
        <button
          ref={ref}
          id={triggerId ?? field?.id}
          type="button"
          className="kjun-input kjun-select-trigger"
          data-time-segment={segment || undefined}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-controls={expanded ? id : undefined}
          aria-expanded={expanded}
          // The placeholder names the trigger only when nothing else can (an id lets an outside label do it).
          aria-label={ariaLabel || (triggerId || field ? undefined : placeholder)}
          aria-labelledby={field?.labelId}
          aria-describedby={mergeIds(ariaDescribedBy, field?.describedBy)}
          aria-invalid={error || !!field?.error || undefined}
          aria-readonly={readOnly || undefined}
          style={{
            height: spec.height,
            borderRadius: spec.radius,
            ...inputTypeStyle(size),
            // Time segments take their padding from compound-controls.css, which also aligns the first value.
            ...(segment ? {} : { paddingInline: spec.padding - tokens.border.controlWidth }),
          }}
          onClick={() => { if (!readOnly) changeOpen(!open); }}
          onKeyDown={(e) => {
            if (!readOnly && ["ArrowDown", "ArrowUp"].includes(e.key)) {
              e.preventDefault();
              changeOpen(true);
            }
          }}
        >
          <span className={!custom && !label ? "kjun-placeholder" : listed && !custom ? "kjun-select-values" : undefined} style={{ flex: 1, paddingRight: showClear ? spec.clearSize + spec.affixGap : undefined }}>
            {custom || (listed ? <>
              <span ref={valuesText} className="kjun-select-values-text">{labels.map((text, index) => <span key={index}>{index ? ", " : ""}{text}</span>)}</span>
              {hidden > 0 && <span className="kjun-select-values-more" aria-hidden="true">+{hidden}</span>}
            </> : label || placeholder)}
          </span>
          {/* Time segments read as one value, and a read-only value does not open, so neither carries an indicator. */}
          {!segment && !readOnly && <KjunIcon name="chevron-down" className="kjun-select-indicator" data-open={expanded || undefined} size={spec.iconSize} style={{ flexShrink: 0, color: disabled ? "var(--_kjun-color-text-disabled)" : "var(--_kjun-color-text-tertiary)" }} />}
        </button>
        {showClear && (
          <KjunButton
            size="sm"
            variant="ghost"
            shape="circle"
            ariaLabel={m.clearSelection}
            disabled={disabled}
            className="kjun-select-clear"
            style={selectClearStyle(spec)}
            onClick={() => {
              change(multiple ? [] : null);
              onClear?.();
              ref.current?.focus();
            }}
          ><span className="kjun-select-clear-mark" style={selectClearMarkStyle(spec)}><KjunIcon name="x" size={spec.clearMarkIconSize} /></span></KjunButton>
        )}
      </div>
      <FloatingPanel
        field
        open={open}
        returnFocus={resolveFocusReturn(returnFocus)}
        onOpenChange={changeOpen}
        triggerRef={ref}
        placement="bottom-start"
        matchTriggerWidth
        className={"kjun-select-panel kjun-select-options-panel" + (segment ? " kjun-time-options" : "")}
      >
        <FieldContext.Provider value={null}><div ref={menu} className="kjun-select-content"
          // A searchable list hands typing back to its search: Arrow Up on the first option, or a printable key.
          onKeyDownCapture={searchable ? (e) => {
            const target = e.target as HTMLElement;
            if (target.getAttribute("role") !== "option") return;
            const first = menu.current?.querySelector('[role="option"]:not([aria-disabled="true"])');
            const printable = e.key.length === 1 && e.key !== " " && !e.ctrlKey && !e.metaKey && !e.altKey;
            if (!(e.key === "ArrowUp" && target === first) && !printable) return;
            e.preventDefault();
            e.stopPropagation();
            if (printable) { search(query + e.key); onSearch?.(query + e.key); }
            focusSearch();
          } : undefined}>
          {menuHeader && <div className="kjun-select-header">{menuHeader}</div>}
          {searchable && (
            <div className="kjun-select-search">
              <KjunInput
                autoFocus
                value={query}
                placeholder={searchPlaceholder}
                ariaLabel={m.searchOptions}
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
              <KjunSpinner size="sm" text={m.searching} />
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
            {grouped ? sections.map(section => section.label === undefined
              ? section.items.map(({ option: o, key }) => option(o, key))
              : (
                <ListBoxSection key={section.key} id={section.key} className="kjun-select-group">
                  <Header className="kjun-menu-section-title">{section.label}</Header>
                  {section.items.map(({ option: o, key }) => option(o, key))}
                </ListBoxSection>
              )) : visible.map(({ option: o, key }) => option(o, key))}
          </ListBox>
          {!loading && !matching.length && (
            <div className="kjun-select-empty">{m.noResults}</div>
          )}
          {!loading && visible.length < matching.length && (
            <KjunButton
              size="sm"
              variant="ghost"
              block
              onClick={showMore}
            >
              {m.loadMore}
            </KjunButton>
          )}
        </div></FieldContext.Provider>
      </FloatingPanel>
    </>
  );
}
