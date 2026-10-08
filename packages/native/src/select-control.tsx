import { usePopupExpanded } from "../../../shared/package-runtime/use-layer";
import { FieldClear } from "./field-clear";
import { FieldPressable, fieldTarget, useFieldSurface } from "./field-surface";
import { typeStyle, inputTypeStyle } from "./typography";
import { selectOptions } from "../../../shared/package-runtime/options";
import { tokens,type InputSize } from "@kjun/tokens";
import { useContext, useEffect, useRef,type ReactNode } from "react";
import { CompoundControlContext } from "./compound-control";
import { useSelectState } from "../../../shared/package-runtime/select";
import { Platform, View } from "react-native";
import { DsButton,DsIcon } from "./button";
import { DsSpinner } from "./display";
import { DsInput,FieldContext,useKjunField } from "./input";
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
  const { open, query, limit, changeOpen, search, showMore } = useSelectState(controlled, disabled, optionPageSize, onOpenChange);
  const { colors } = useKjunStyles(),
    field = useKjunField(),
    ref = useRef<View>(null),
    spec = tokens.input[size];
  const trigger = useRef<View>(null);
  const compound = useContext(CompoundControlContext);
  useEffect(() => { if (compound?.focusRef) compound.focusRef.current = trigger.current; }, [compound?.focusRef]);
  const expanded = usePopupExpanded(open, ref);
  const selectedRow = useRef<{ y: number; height: number } | null>(null);
  const surface = useFieldSurface(size, { disabled, invalid: error || !!field?.error, open: expanded });

  const change = (v: OptionValue | OptionValue[] | null) => {
    onValueChange?.(v);
    onChange?.(v);
  };
  const { selected, matching, visible, selectedOption, label, nextValue } = selectOptions({
    options, value, labelKey, valueKey, query, pageSize: optionPageSize, limit, loading, multiple,
  });
  const firstSelected = visible.findIndex(({ option }) => selected(option));
  if (firstSelected < 0) selectedRow.current = null;
  return (
    <>
      <View ref={ref} collapsable={false} {...fieldTarget(() => changeOpen(!open), disabled)} style={{ position: "relative", minHeight: tokens.native.minimumTouchTarget, justifyContent: "center",
        // Inside a compound field the touch target overflows so the shared surface keeps its size height.
        ...(compound ? { marginVertical: Math.min(0, (spec.height - tokens.native.minimumTouchTarget) / 2) } : {}) }}>
        <FieldPressable
          ref={trigger}
          focusRing={!compound}
          {...surface.hover}
          onFocus={() => { surface.setFocused(true); compound?.onFocusChange?.(true); }}
          onBlur={() => { surface.setFocused(false); compound?.onFocusChange?.(false); }}
          nativeID={field?.id}
          accessibilityRole="button"
          accessibilityLabel={ariaLabel || field?.label || placeholder}
          accessibilityValue={{ text: label || placeholder }}
          accessibilityState={{ disabled, expanded }}
          accessibilityHint={field?.error || field?.hint}
          {...(Platform.OS === "web" ? {
            "aria-invalid": error || !!field?.error || undefined,
            "aria-describedby": field?.describedBy,
            "aria-required": field?.required || undefined,
          } : {})}
          disabled={disabled}
          hitSlop={{ top: surface.hit, bottom: surface.hit, left: 0, right: 0 }}
          onPress={() => changeOpen(!open)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: tokens.dimension.value8,
            ...surface.style,
            paddingHorizontal: spec.padding - tokens.border.controlWidth,
            paddingRight: spec.padding - tokens.border.controlWidth,
            ...(compound ? { paddingHorizontal: tokens.extensions.timePicker.segmentPadding, paddingRight: tokens.extensions.timePicker.segmentPadding, paddingLeft: compound.leading ? spec.padding - tokens.border.controlWidth : tokens.extensions.timePicker.segmentPadding, gap: tokens.extensions.timePicker.segmentPadding, backgroundColor: !disabled && (surface.active || surface.hovered) ? colors.hover : "transparent", borderColor: "transparent", outlineWidth: 0 } : {}),
          }}
        >
          <View style={{ flex: 1, minWidth: 0, paddingRight: clearable && label ? tokens.native.minimumTouchTarget + spec.affixGap : 0 }}>
            {/* A hidden "00" sizes time segments, so the placeholder and the value occupy the same slot. */}
            {compound && <KText aria-hidden={true} importantForAccessibility="no-hide-descendants" style={{ ...inputTypeStyle(size), fontVariant: ["tabular-nums"], opacity: 0 }}>00</KText>}
            {renderSelected?.(selectedOption) || <KText numberOfLines={1} style={{
              ...inputTypeStyle(size),
              color: disabled ? colors.textDisabled : label ? colors.text : colors.inputPlaceholder,
              ...(compound ? { position: "absolute", left: 0, right: 0, textAlign: "center", fontVariant: ["tabular-nums"] } as const : {}),
            }}>{label || placeholder}</KText>}
          </View>
          {/* Like Vue and React, the indicator turns over while the list is open. */}
          <View style={{ transform: [{ rotate: expanded ? "180deg" : "0deg" }] }}>
            <DsIcon
              name="chevron-down"
              size={compound ? tokens.extensions.timePicker.iconSize : spec.iconSize}
              color={surface.icon}
            />
          </View>
        </FieldPressable>
        {clearable && !!label && (
          <View
            style={{
              position: "absolute",
              right: spec.padding + spec.iconSize + spec.affixGap,
              top: 0,
              bottom: 0,
              justifyContent: "center",
            }}
          >
            <FieldClear size={size} label="선택 지우기" disabled={disabled} onPress={() => {
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
      >
        <FieldContext.Provider value={null}>
        {menuHeader}
        {searchable && (
          <View
            style={{
              padding: tokens.dimension.value8,
              borderBottomWidth: tokens.border.defaultWidth,
              borderBottomColor: colors.border,
            }}
          >
            <DsInput
              autoFocus
              value={query}
              placeholder={searchPlaceholder}
              ariaLabel="선택 항목 검색"
              size="sm"
              prefixIcon="search"
              onChangeText={(v) => {
                search(v);
                onSearch?.(v);
              }}
            />
          </View>
        )}
        {loading ? (
          <View style={{ padding: tokens.dimension.value12 }}>
            <DsSpinner size="sm" text="검색 중..." />
          </View>
        ) : (
          visible.map(({ option: o, key }, index) => (
            <OptionRow
              key={key}
              selected={selected(o)}
              onLayout={index === firstSelected ? (event) => { selectedRow.current = event.nativeEvent.layout; } : undefined}
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
          ))
        )}
        {!loading && !matching.length && (
          <KText
            style={{
              padding: tokens.dimension.value12,
              textAlign: "center",
              color: colors.textTertiary,
            }}
          >
            결과가 없습니다
          </KText>
        )}
        {!loading && visible.length < matching.length && (
          <DsButton
            size="sm"
            variant="ghost"
            block
            onPress={showMore}
          >
            더 보기
          </DsButton>
        )}
        </FieldContext.Provider>
      </FloatingPanel>
    </>
  );
}
