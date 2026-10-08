import { Fragment, useEffect, useId, useMemo, useRef, useState } from "react";
import { View } from "react-native";
import { createTimeDomain, tokens, type TimePrecision, type InputSize } from "@kjun/tokens";
import { CompoundControlContext } from "./compound-control";
import { DsSelect } from "./select";
import { FieldClear } from "./field-clear";
import { useKjunStyles } from "./provider";
import { KText } from "./internal";
import { inputTypeStyle } from "./typography";
import { FieldContext, useKjunField } from "./input";
export interface DsTimePickerProps { value: string | null; precision?: TimePrecision; min?: string; max?: string; minuteStep?: number; secondStep?: number; disabled?: boolean; error?: boolean; clearable?: boolean; size?: InputSize; ariaLabel?: string; onValueChange?: (value: string | null) => void; onChangeCommit?: (value: string | null) => void }
export function DsTimePicker({ value, precision = "minute", min, max, minuteStep = 1, secondStep = 1, disabled = false, error = false, clearable = true, size = "md", ariaLabel = "시간", onValueChange, onChangeCommit }: DsTimePickerProps) {
  const geometry = tokens.extensions.timePicker, spec = tokens.input[size];
  const { colors } = useKjunStyles();
  const first = useRef<View>(null);
  const [focused, setFocused] = useState(false), [opened, setOpened] = useState<number | null>(null);
  const field = useKjunField(), uid = useId();
  const fieldId = field?.id || `kjun-time-${uid}`;
  const domain = useMemo(() => createTimeDomain({ precision, min, max, minuteStep, secondStep }), [precision, min, max, minuteStep, secondStep]), valid = domain.valid && domain.accepts(value);
  useEffect(() => { if (!valid) console.warn("KJUN TimePicker: 시각 범위·간격·값을 확인하세요."); }, [valid]);
  const change = (next: string | null) => { if (valid && !disabled && next !== value) { onValueChange?.(next); onChangeCommit?.(next); } };
  const time = value === null ? null : domain.parse(value);
  return <View accessibilityLabel={ariaLabel} style={{ flexDirection: "row", alignItems: "center", maxWidth: "100%", minWidth: 0, backgroundColor: colors.inputBg, borderRadius: spec.radius }}>
    <View style={{ flex: 1, flexDirection: "row", alignItems: "center", minWidth: 0 }}>
    {["시", "분", "초"].slice(0, precision === "second" ? 3 : 2).map((label, index) =>
      <Fragment key={label}>{index > 0 && <KText aria-hidden={true} style={{ ...inputTypeStyle(size), width: geometry.separatorWidth, textAlign: "center", color: disabled || !valid ? colors.textDisabled : colors.textSecondary }}>:</KText>}
      <FieldContext.Provider value={{ ...field, id: index === 0 ? fieldId : `${fieldId}-${index}` }}>
        <CompoundControlContext.Provider value={{ size, focusRef: index === 0 ? first : undefined, onFocusChange: setFocused, leading: index === 0 }}>
        {/* Segments hug their values so "09 : 30" stays together; leftover width collects before the clear button. */}
        <View style={{ flexShrink: 0, minWidth: geometry.segmentMinimumWidth }}><DsSelect value={time === null ? null : domain.part(time, index)} options={domain.options(value, index).map(n => ({ value: n, label: String(n).padStart(2, "0") }))} onValueChange={next => { if (typeof next === "number") change(domain.select(value, index, next)); }} onOpenChange={open => setOpened(open ? index : null)} ariaLabel={(field?.label || ariaLabel) + " " + label} placeholder={label} disabled={disabled || !valid} error={error} size={size} clearable={false} searchable={false} /></View>
        </CompoundControlContext.Provider>
      </FieldContext.Provider></Fragment>)}
    </View>
    {/* The 44px clear target overflows the row so the field keeps its size height. */}
    {clearable && value !== null && <View style={{ marginVertical: Math.min(0, (spec.height - tokens.native.minimumTouchTarget) / 2) }}><FieldClear size={size} label={ariaLabel + " 지우기"} disabled={disabled || !valid} onPress={() => { change(null); first.current?.focus(); }} /></View>}
    {(error || !!field?.error || focused || opened !== null) && <View pointerEvents="none" aria-hidden={true} style={{ position: "absolute", inset: 0, borderRadius: spec.radius, borderWidth: error || !!field?.error ? tokens.border.controlWidth : tokens.states.focus.width, borderColor: error || field?.error ? colors.danger : colors.focusRing }} />}
  </View>;
}
