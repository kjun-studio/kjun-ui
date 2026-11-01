import { FieldClear } from "./field-clear";
import { useKjunMessageScope } from "../../../shared/package-runtime/messages-context";
import { formatDateValue } from "../../../shared/package-runtime/messages";
import { dateLabel, formatRange, normalizeRange, pickRange, rangeSpoken, type DateRange } from "../../../shared/package-runtime/calendar";
import { FieldPressable, fieldTarget, useFieldSurface } from "./field-surface";
import { inputTypeStyle } from "./typography";
import { tokens, type InputSize } from "@kjun-ui/tokens";
import { useRef, useState, type ReactNode } from "react";
import { Platform, View } from "react-native";
import { KjunIcon } from "./button";
import { KText } from "./internal";
import { FloatingPanel } from "./layers";
import { useKjunStyles } from "./provider";
import { useKjunField } from "./input";
import { CalendarView, type CalendarOptions, type DateRangePreset } from "./calendar";

interface DateFieldProps extends CalendarOptions {
  /** Shows a clear button while there is a value. */
  clearable?: boolean;
  /** Shows the date without opening the calendar. */
  readOnly?: boolean;
  /** Earliest and latest selectable dates (YYYY-MM-DD). */
  min?: string;
  max?: string;
  placeholder?: string;
  size?: InputSize;
  disabled?: boolean;
  ariaLabel?: string;
  error?: boolean;
}
/** The field that opens a calendar; both pickers share it. */
function DateField({ size = "md", clearable, placeholder, ariaLabel, error, disabled = false, readOnly = false, text, spoken, clearLabel, open, setOpen, onClear, children }:
  Omit<DateFieldProps, keyof CalendarOptions | "min" | "max"> & { text: string; spoken: string; clearLabel: string; open: boolean; setOpen: (open: boolean) => void; onClear: () => void; children: (key: number) => ReactNode }) {
  const { colors } = useKjunStyles(), field = useKjunField();
  const ref = useRef<View>(null), spec = tokens.input[size];
  const surface = useFieldSurface(size, { disabled, invalid: error || !!field?.error, open });
  const clear = !!clearable && !!text && !disabled && !readOnly;
  const request = (next: boolean) => { if (!readOnly || !next) setOpen(next); };
  // Each opening draws a fresh calendar on the current value; the panel keeps it through its closing motion.
  const opens = useRef(0), wasOpen = useRef(false);
  if (open && !wasOpen.current) opens.current++;
  wasOpen.current = open;
  return (
    <>
      <View ref={ref} collapsable={false} {...fieldTarget(() => request(true), disabled)} style={{ minHeight: tokens.native.minimumTouchTarget, justifyContent: "center" }}>
        <FieldPressable
          {...surface.hover}
          onFocus={() => surface.setFocused(true)}
          onBlur={() => surface.setFocused(false)}
          hitSlop={{ top: surface.hit, bottom: surface.hit, left: 0, right: 0 }}
          nativeID={field?.id}
          accessibilityRole="button"
          accessibilityLabel={ariaLabel || field?.label || placeholder}
          accessibilityValue={{ text: spoken }}
          accessibilityHint={field?.error || field?.hint}
          accessibilityState={{ disabled, expanded: open && !disabled }}
          {...(Platform.OS === "web" ? {
            "aria-invalid": error || !!field?.error || undefined,
            "aria-describedby": field?.describedBy,
            "aria-required": field?.required || undefined,
            "aria-readonly": readOnly || undefined,
          } : {})}
          disabled={disabled}
          onPress={() => request(true)}
          style={{ ...surface.style, paddingHorizontal: spec.padding - tokens.border.controlWidth, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}
        >
          <KText numberOfLines={1} style={{ flex: 1, marginRight: spec.affixGap + (clear ? spec.clearSize + spec.affixGap : 0), ...inputTypeStyle(size), fontVariant: ["tabular-nums"],
            color: disabled ? colors.textDisabled : text ? colors.text : colors.inputPlaceholder }}>
            {text || placeholder}
          </KText>
          <KjunIcon name="calendar" size={spec.iconSize} color={surface.icon} />
        </FieldPressable>
        {clear && (
          <View style={{ position: "absolute", right: spec.padding + spec.iconSize + spec.affixGap, top: 0, bottom: 0, justifyContent: "center" }}>
            <FieldClear size={size} label={clearLabel} onPress={onClear} />
          </View>
        )}
      </View>
      <FloatingPanel open={open && !disabled} onOpenChange={setOpen} triggerRef={ref}
        // Field popups open on the field's start edge; a bare "bottom" now centers.
        placement="bottom-start" minimumWidth={tokens.extensions.calendar.width} ariaLabel={placeholder}>
        <View style={{ padding: tokens.extensions.calendar.padding }}>{children(opens.current)}</View>
      </FloatingPanel>
    </>
  );
}

export interface KjunDatePickerProps extends DateFieldProps {
  /** YYYY-MM-DD, or an empty string. */
  value: string;
  onValueChange?: (v: string) => void;
  onChange?: (v: string) => void;
}
export function KjunDatePicker({ value, placeholder, clearable = false, min, max, weekStart, markSunday, isDateUnavailable, onValueChange, onChange, ...field }: KjunDatePickerProps) {
  const scope = useKjunMessageScope();
  const [open, setOpen] = useState(false);
  const commit = (next: string) => { if (next !== value) { onValueChange?.(next); onChange?.(next); } setOpen(false); };
  return (
    <DateField {...field} clearable={clearable} placeholder={placeholder ?? scope.messages.datePlaceholder} clearLabel={scope.messages.clearDate}
      text={value ? formatDateValue(value, scope) : ""} spoken={value ? dateLabel(value, scope) : ""} open={open} setOpen={setOpen} onClear={() => commit("")}>
      {key => <CalendarView key={key} value={value} min={min} max={max} clearable={clearable} weekStart={weekStart} markSunday={markSunday} isDateUnavailable={isDateUnavailable}
        onSelect={commit} onClear={() => commit("")} />}
    </DateField>
  );
}

export interface KjunDateRangePickerProps extends DateFieldProps {
  /** Start and end as YYYY-MM-DD; empty strings while unset. A reversed or out-of-bounds range is shown in order and inside the bounds. */
  value: DateRange;
  onValueChange?: (value: DateRange) => void;
  onChange?: (value: DateRange) => void;
  /** Ready-made ranges shown as chips above the days, such as "최근 7일". */
  presets?: readonly DateRangePreset[];
  /** Commits as soon as the second day is picked, without Apply. */
  autoApply?: boolean;
}
/** Two dates picked in one calendar: the first pick starts the range, the second ends it, and Apply commits it. */
export function KjunDateRangePicker({ value: given, placeholder, clearable = false, min, max, weekStart, markSunday, isDateUnavailable, presets, autoApply = false,
  onValueChange, onChange, ...field }: KjunDateRangePickerProps) {
  const scope = useKjunMessageScope();
  const value = normalizeRange(given, min, max);
  const [open, setOpen] = useState(false), [draft, setDraft] = useState(value);
  const commit = (next: DateRange) => { if (next.start !== value.start || next.end !== value.end) { onValueChange?.(next); onChange?.(next); } setOpen(false); };
  const pick = (iso: string) => {
    const next = pickRange(draft, iso, isDateUnavailable);
    setDraft(next);
    if (autoApply && next.end) commit(next);
  };
  return (
    <DateField {...field} clearable={clearable} placeholder={placeholder ?? scope.messages.rangePlaceholder} clearLabel={scope.messages.clearDates}
      text={formatRange(value, iso => formatDateValue(iso, scope))} spoken={rangeSpoken(value, scope)}
      open={open} setOpen={next => { if (next) setDraft(value); setOpen(next); }} onClear={() => commit({ start: "", end: "" })}>
      {key => <CalendarView key={key} range={draft} min={min} max={max} clearable={clearable} weekStart={weekStart} markSunday={markSunday} isDateUnavailable={isDateUnavailable}
        presets={presets} onPreset={next => { const range = normalizeRange(next, min, max); setDraft(range); if (autoApply) commit(range); }}
        onSelect={pick} onClear={() => setDraft({ start: "", end: "" })} onApply={autoApply ? undefined : () => commit(draft)} />}
    </DateField>
  );
}
export type { DateRange, DateRangePreset };
