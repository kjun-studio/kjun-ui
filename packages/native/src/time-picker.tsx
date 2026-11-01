import { useKjunMessageScope } from "../../../shared/package-runtime/messages-context";
import { periodLeads, timeSegments, type HourCycle } from "../../../shared/package-runtime/time-segments";
import { warnPicker } from "../../../shared/package-runtime/calendar";
import { Fragment, useEffect, useId, useMemo, useRef, useState } from "react";
import { Platform, View } from "react-native";
import { createTimeDomain, tokens, type TimePrecision, type InputSize } from "@kjun-ui/tokens";
import { CompoundControlContext } from "./compound-control";
import { KjunSelect } from "./select";
import { FieldClear } from "./field-clear";
import { KjunIcon } from "./button";
import { useKjunStyles } from "./provider";
import { KText } from "./internal";
import { inputTypeStyle } from "./typography";
import { FieldContext, useKjunField } from "./input";
export interface KjunTimePickerProps { value: string | null; precision?: TimePrecision; min?: string; max?: string; minuteStep?: number; secondStep?: number; disabled?: boolean; error?: boolean; clearable?: boolean; size?: InputSize; ariaLabel?: string;
  /** 24 (default) shows 00–23; 12 adds an AM/PM segment and shows 1–12. The value stays "HH:mm". */
  hourCycle?: HourCycle;
  /** Shows the time without changing it. */
  readOnly?: boolean;
  /** Stretches the field to its container's width (default false: the field hugs the time). */
  block?: boolean; onValueChange?: (value: string | null) => void; onChangeCommit?: (value: string | null) => void }
export function KjunTimePicker({ value, precision = "minute", min, max, minuteStep = 1, secondStep = 1, disabled = false, error = false, clearable = true, size = "md", ariaLabel,
  hourCycle = 24, readOnly = false, block = false, onValueChange, onChangeCommit }: KjunTimePickerProps) {
  const scope = useKjunMessageScope(), m = scope.messages;
  ariaLabel ??= m.time;
  const geometry = tokens.extensions.timePicker, spec = tokens.input[size];
  const { colors } = useKjunStyles();
  const first = useRef<View>(null);
  const [focused, setFocused] = useState(false), [opened, setOpened] = useState<number | null>(null);
  const field = useKjunField(), uid = useId();
  const fieldId = field?.id || `kjun-time-${uid}`;
  const domain = useMemo(() => createTimeDomain({ precision, min, max, minuteStep, secondStep }), [precision, min, max, minuteStep, secondStep]);
  // Only a broken domain locks the field; a value off the step or bounds stays editable and snaps on the next choice.
  const accepted = domain.accepts(value);
  useEffect(() => { if (!domain.valid) warnPicker("TimePicker: check min, max, minuteStep and secondStep."); else if (!accepted) warnPicker(`TimePicker: ${value} is outside the step or bounds.`); }, [domain, accepted, value]);
  const blocked = disabled || !domain.valid;
  const change = (next: string | null) => { if (!blocked && !readOnly && next !== value) { onValueChange?.(next); onChangeCommit?.(next); } };
  const segments = timeSegments(domain, value, { precision, hourCycle, messages: m, periodFirst: periodLeads(scope.language) });
  // Segments are named like the web ones: the field's label (or ariaLabel) and the segment.
  const name = field?.label || ariaLabel;
  // A time is a short fixed-length value, so the field hugs it; block stretches it like Input.
  return <View role="group" accessibilityLabel={name} accessibilityHint={field?.error || field?.hint}
    {...(Platform.OS === "web" ? { "aria-describedby": field?.describedBy } : {})}
    style={{ flexDirection: "row", alignItems: "center", alignSelf: block ? "stretch" : "flex-start", maxWidth: "100%", minWidth: 0, backgroundColor: colors.inputBg, borderRadius: spec.radius }}>
    <View style={{ ...(block ? { flex: 1 } : {}), flexDirection: "row", alignItems: "center", minWidth: 0 }}>
    {segments.map((segment, index) => {
      // The AM/PM segment reads as a word, so it carries no ":" before or after it.
      const separated = index > 0 && segment.key !== "period" && segments[index - 1].key !== "period";
      const gap = index > 0 && !separated;
      return <Fragment key={segment.key}>{separated ? <KText aria-hidden={true} style={{ ...inputTypeStyle(size), width: geometry.separatorWidth, textAlign: "center", color: blocked ? colors.textDisabled : colors.textSecondary }}>:</KText> : null}
      <FieldContext.Provider value={{ ...field, id: index === 0 ? fieldId : `${fieldId}-${index}` }}>
        <CompoundControlContext.Provider value={{ size, focusRef: index === 0 ? first : undefined, onFocusChange: setFocused, leading: index === 0 }}>
        {/* Segments hug their values so "09 : 30" stays together; leftover width collects before the clear button. */}
        <View style={{ flexShrink: 0, minWidth: geometry.segmentMinimumWidth, marginLeft: gap ? geometry.separatorWidth : 0 }}><KjunSelect value={segment.value} options={segment.options}
          onValueChange={next => { if (typeof next === "number") change(segment.pick(next)); }} onOpenChange={open => setOpened(open ? index : null)}
          ariaLabel={name + " " + segment.label} placeholder={m.timePlaceholder} disabled={blocked} readOnly={readOnly} error={error} size={size} clearable={false} searchable={false} /></View>
        </CompoundControlContext.Provider>
      </FieldContext.Provider></Fragment>;
    })}
    </View>
    {/* The 44px clear target overflows the row so the field keeps its size height. Without a value to clear (or while disabled) the slot shows a clock. */}
    {clearable && value !== null && !blocked && !readOnly
      ? <View style={{ marginVertical: Math.min(0, (spec.height - tokens.native.minimumTouchTarget) / 2) }}><FieldClear size={size} label={m.clearValue(ariaLabel)} onPress={() => { change(null); first.current?.focus(); }} /></View>
      : <View aria-hidden={true} importantForAccessibility="no-hide-descendants" style={{ width: tokens.native.minimumTouchTarget, alignItems: "center", justifyContent: "center" }}><KjunIcon name="clock" size={spec.iconSize} color={blocked ? colors.textDisabled : colors.textTertiary} /></View>}
    {!!(error || !!field?.error || focused || opened !== null) && <View pointerEvents="none" aria-hidden={true} style={{ position: "absolute", inset: 0, borderRadius: spec.radius, borderWidth: error || !!field?.error ? tokens.border.controlWidth : tokens.states.focus.width, borderColor: error || field?.error ? colors.danger : colors.focusRing }} />}
  </View>;
}
