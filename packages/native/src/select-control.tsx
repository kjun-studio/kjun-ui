import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { usePopupExpanded } from "../../../shared/package-runtime/use-layer";
import { FieldClear, fieldClearRight } from "./field-clear";
import { FieldPressable, QuietFocusContext, fieldTarget, useFieldSurface } from "./field-surface";
import { typeStyle, inputTypeStyle } from "./typography";
import { selectOptions, type SelectMultipleDisplay } from "../../../shared/package-runtime/options";
import { hiddenLabelCount } from "../../../shared/package-runtime/select-trigger";
import { mergeIds } from "../../../shared/package-runtime/aria-ids";
import { tokens,type InputSize } from "@kjun-ui/tokens";
import { useRef, useState, type ReactNode } from "react";
import { useSelectState } from "../../../shared/package-runtime/select";
import { Platform, View } from "react-native";
import { KjunButton,KjunIcon } from "./button";
import { KjunSpinner } from "./display";
import { KjunInput,FieldContext,useKjunField } from "./input";
import { KText } from "./internal";
import { FloatingPanel } from "./layers";
import { useKjunStyles } from "./provider";
import {
OptionRow,
OptionValue,
SelectOption,
optionDisabled,
optionLabel,
} from "./select-options";
export interface KjunSelectProps<T extends SelectOption = SelectOption> {
  value: OptionValue | OptionValue[] | null;
  /** Options, or groups `{ label, options }` that put a title over their options. */
  options?: T[];
  placeholder?: string;
  ariaLabel?: string;
  labelKey?: string;
  /** Trigger nativeID; defaults to the FormGroup's id. */
  id?: string;
  /** Extra description ids, merged with the FormGroup's hint and error (Native Web). */
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
}
export function KjunSelect<T extends SelectOption = SelectOption>({
  value,
  options = [],
  placeholder,
  ariaLabel,
  labelKey = "label",
  id,
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
}: KjunSelectProps<T>) {
  const m = useKjunMessages();
  placeholder ??= m.select;
  searchPlaceholder ??= m.search;
  const { open, query, limit, changeOpen, search, showMore } = useSelectState(controlled, disabled, optionPageSize, onOpenChange);
  const { colors } = useKjunStyles(),
    field = useKjunField(),
    ref = useRef<View>(null),
    spec = tokens.input[size];
  const trigger = useRef<View>(null);
  const expanded = usePopupExpanded(open, ref);
  const selectedRow = useRef<{ y: number; height: number } | null>(null);
  const surface = useFieldSurface(size, { disabled, readOnly, invalid: error || !!field?.error, open: expanded });

  const change = (v: OptionValue | OptionValue[] | null) => {
    onValueChange?.(v);
    onChange?.(v);
  };
  const { selected, matching, visible, sections, selectedOption, label, labels, hasValue, nextValue } = selectOptions({
    options, value, labelKey, valueKey, query, pageSize: optionPageSize, limit, loading, multiple, filterFn, searchKeys,
    selectedCount: m.selectedCount, multipleDisplay,
  });
  const listed = multiple && multipleDisplay === "labels" && labels.length > 1;
  const labelsKey = listed ? labels.join("\n") : "";
  // Hidden copies of the labels measure where each ends; the ones past the room left are counted after the line.
  const [widths, setWidths] = useState<{ key: string; values: number[] }>({ key: "", values: [] });
  const [room, setRoom] = useState(0);
  const measured = listed && room > 0 && widths.key === labelsKey && widths.values.length === labels.length && widths.values.every(width => width > 0);
  let end = 0;
  const hidden = measured ? hiddenLabelCount(widths.values.map(width => (end += width)), room) : 0;
  const custom = renderSelected?.(selectedOption, value);
  const showClear = clearable && !readOnly && !disabled && hasValue;
  const firstSelectedKey = visible.find(({ option }) => selected(option))?.key;
  if (firstSelectedKey === undefined) selectedRow.current = null;
  // Like Web, the header and search stay above the list; only the options scroll.
  const panelHeader = menuHeader != null || searchable ? (
    <FieldContext.Provider value={null}>
      {menuHeader}
      {searchable && (
        <View style={{ padding: tokens.dimension.value8, borderBottomWidth: tokens.border.defaultWidth, borderBottomColor: colors.border }}>
          <QuietFocusContext.Provider value={true}>
            <KjunInput
              autoFocus
              value={query}
              placeholder={searchPlaceholder}
              ariaLabel={m.searchOptions}
              size="sm"
              prefixIcon="search"
              onChangeText={(v) => {
                search(v);
                onSearch?.(v);
              }}
            />
          </QuietFocusContext.Provider>
        </View>
      )}
    </FieldContext.Provider>
  ) : undefined;
  return (
    <>
      <View ref={ref} collapsable={false} {...fieldTarget(() => { if (!readOnly) changeOpen(!open); }, disabled)} style={{ position: "relative", minHeight: tokens.native.minimumTouchTarget, justifyContent: "center" }}>
        <FieldPressable
          ref={trigger}
          {...surface.hover}
          onFocus={() => surface.setFocused(true)}
          onBlur={() => surface.setFocused(false)}
          nativeID={id ?? field?.id}
          accessibilityRole="button"
          accessibilityLabel={ariaLabel || field?.label || placeholder}
          accessibilityValue={{ text: label || placeholder }}
          accessibilityState={{ disabled, expanded }}
          accessibilityHint={field?.error || field?.hint}
          {...(Platform.OS === "web" ? {
            "aria-invalid": error || !!field?.error || undefined,
            "aria-describedby": mergeIds(ariaDescribedBy, field?.describedBy),
            "aria-readonly": readOnly || undefined,
          } : {})}
          disabled={disabled}
          hitSlop={{ top: surface.hit, bottom: surface.hit, left: 0, right: 0 }}
          onPress={() => { if (!readOnly) changeOpen(!open); }}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: tokens.dimension.value8,
            ...surface.style,
            paddingHorizontal: spec.padding - tokens.border.controlWidth,
            paddingRight: spec.padding - tokens.border.controlWidth,
          }}
        >
          <View style={{ flex: 1, minWidth: 0, paddingRight: showClear ? tokens.native.minimumTouchTarget + spec.affixGap : 0 }}>
            {custom || (listed ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: tokens.dimension.value6 }}>
                <View style={{ flex: 1, minWidth: 0 }} onLayout={event => setRoom(event.nativeEvent.layout.width)}>
                  <KText numberOfLines={1} style={{ ...inputTypeStyle(size), color: surface.ink }}>{label}</KText>
                  {/* Each name measured on its own; their running sum is where each would end on the line. */}
                  <View key={labelsKey} aria-hidden={true} importantForAccessibility="no-hide-descendants"
                    style={{ pointerEvents: "none", position: "absolute", left: 0, right: 0, top: 0, opacity: 0 }}>
                    {labels.map((text, index) => (
                      <KText key={index} style={{ ...inputTypeStyle(size), alignSelf: "flex-start" }} onLayout={event => {
                        const { width } = event.nativeEvent.layout;
                        setWidths(previous => {
                          const values = previous.key === labelsKey ? [...previous.values] : labels.map(() => 0);
                          values[index] = width;
                          return { key: labelsKey, values };
                        });
                      }}>{index ? ", " : ""}{text}</KText>
                    ))}
                  </View>
                </View>
                {hidden > 0 && <KText aria-hidden={true} style={{ ...inputTypeStyle(size), flexShrink: 0, color: disabled ? colors.textDisabled : colors.textTertiary, fontVariant: ["tabular-nums"] }}>+{hidden}</KText>}
              </View>
            ) : <KText numberOfLines={1} style={{
              ...inputTypeStyle(size),
              color: !label ? (disabled ? colors.textDisabled : colors.inputPlaceholder) : surface.ink,
            }}>{label || placeholder}</KText>)}
          </View>
          {/* Like Vue and React, the indicator turns over while the list is open. */}
          {!readOnly && <View style={{ transform: [{ rotate: expanded ? "180deg" : "0deg" }] }}>
            <KjunIcon name="chevron-down" size={spec.iconSize} color={surface.icon} />
          </View>}
        </FieldPressable>
        {showClear && (
          <View
            style={{
              position: "absolute",
              right: fieldClearRight(spec),
              top: 0,
              bottom: 0,
              justifyContent: "center",
            }}
          >
            <FieldClear mark size={size} label={m.clearSelection} disabled={disabled} onPress={() => {
              change(multiple ? [] : null);
              onClear?.();
              trigger.current?.focus();
            }} />
          </View>
        )}
      </View>
      <FloatingPanel
        field
        open={open}
        onOpenChange={changeOpen}
        triggerRef={ref}
        placement="bottom-start"
        matchTriggerWidth
        ariaLabel={ariaLabel || placeholder}
        menu
        reveal={selectedRow}
        header={panelHeader}
      >
        <FieldContext.Provider value={null}>
        {loading ? (
          <View style={{ padding: tokens.dimension.value12, alignItems: "center" }}>
            <KjunSpinner size="sm" text={m.searching} />
          </View>
        ) : (
          sections.flatMap(section => [
            ...(section.label === undefined ? [] : [
              <KText key={section.key} accessibilityRole="header" style={{ ...typeStyle("meta"), color: colors.textTertiary,
                paddingTop: tokens.extensions.menu.sectionPaddingTop, paddingBottom: tokens.extensions.menu.sectionPaddingBottom, paddingHorizontal: tokens.extensions.menu.optionPaddingX }}>{section.label}</KText>,
            ]),
            ...section.items.map(({ option: o, key }) => (
              <OptionRow
                key={key}
                selected={selected(o)}
                onLayout={key === firstSelectedKey ? (event) => { selectedRow.current = event.nativeEvent.layout; } : undefined}
                disabled={optionDisabled(o)}
                multiple={multiple}
                label={optionLabel(o, labelKey)}
                onPress={() => {
                  change(nextValue(o));
                  if (!multiple) changeOpen(false);
                }}
              >
                {renderOption?.(o, selected(o))}
              </OptionRow>
            )),
          ])
        )}
        {!loading && !matching.length && (
          <KText
            style={{
              padding: tokens.dimension.value12,
              textAlign: "center",
              color: colors.textTertiary,
            }}
          >
            {m.noResults}
          </KText>
        )}
        {!loading && visible.length < matching.length && (
          <KjunButton
            size="sm"
            variant="ghost"
            block
            onPress={showMore}
          >
            {m.loadMore}
          </KjunButton>
        )}
        </FieldContext.Provider>
      </FloatingPanel>
    </>
  );
}
