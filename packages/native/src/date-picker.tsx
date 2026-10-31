import { FieldClear } from "./field-clear";
import { useKjunMessageScope } from "../../../shared/package-runtime/messages-context";
import { formatDateValue } from "../../../shared/package-runtime/messages";
import { dateLabel, formatRange, pickRange, type DateRange } from "../../../shared/package-runtime/calendar";
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
import { CalendarView } from "./calendar";

interface DateFieldProps {
  /** Shows a clear button while there is a value. */
  clearable?: boolean;
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
function DateField({ size = "md", clearable, placeholder, ariaLabel, error, disabled = false, text, spoken, open, setOpen, onClear, children }:
  DateFieldProps & { text: string; spoken: string; open: boolean; setOpen: (open: boolean) => void; onClear: () => void; children: ReactNode }) {
  const scope = useKjunMessageScope(), { colors } = useKjunStyles(), field = useKjunField();
  const ref = useRef<View>(null), spec = tokens.input[size];
  const surface = useFieldSurface(size, { disabled, invalid: error || !!field?.error, open });
  const clear = !!clearable && !!text && !disabled;
  return (
    <>
      <View ref={ref} collapsable={false} {...fieldTarget(() => setOpen(true), disabled)} style={{ minHeight: tokens.native.minimumTouchTarget, justifyContent: "center" }}>
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
          } : {})}
          disabled={disabled}
          onPress={() => setOpen(true)}
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
            <FieldClear size={size} label={scope.messages.clearDate} onPress={onClear} />
          </View>
        )}
      </View>
      <FloatingPanel open={open && !disabled} onOpenChange={setOpen} triggerRef={ref}
        // Field popups open on the field's start edge; a bare "bottom" now centers.
        placement="bottom-start" minimumWidth={tokens.extensions.calendar.width} ariaLabel={placeholder}>
        <View style={{ padding: tokens.extensions.calendar.padding }}>{children}</View>
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
export function KjunDatePicker({ value, placeholder, clearable = false, min, max, onValueChange, onChange, ...field }: KjunDatePickerProps) {
  const scope = useKjunMessageScope();
  const [open, setOpen] = useState(false);
  const commit = (next: string) => { if (next !== value) { onValueChange?.(next); onChange?.(next); } setOpen(false); };
  return (
    <DateField {...field} clearable={clearable} min={min} max={max} placeholder={placeholder ?? scope.messages.datePlaceholder}
      text={value ? formatDateValue(value, scope) : ""} spoken={value ? dateLabel(value, scope) : ""} open={open} setOpen={setOpen} onClear={() => commit("")}>
      {open && <CalendarView value={value} min={min} max={max} clearable={clearable} onSelect={commit} onClear={() => commit("")} />}
    </DateField>
  );
}

export interface KjunDateRangePickerProps extends DateFieldProps {
  /** Start and end as YYYY-MM-DD; empty strings while unset. */
  value: DateRange;
  onValueChange?: (value: DateRange) => void;
  onChange?: (value: DateRange) => void;
}
/** Two dates picked in one calendar: the first pick starts the range, the second ends it, and Apply commits it. */
export function KjunDateRangePicker({ value, placeholder, clearable = false, min, max, onValueChange, onChange, ...field }: KjunDateRangePickerProps) {
  const scope = useKjunMessageScope();
  const [open, setOpen] = useState(false), [draft, setDraft] = useState(value);
  const commit = (next: DateRange) => { if (next.start !== value.start || next.end !== value.end) { onValueChange?.(next); onChange?.(next); } setOpen(false); };
  const spoken = value.start ? dateLabel(value.start, scope) + (value.end ? " – " + dateLabel(value.end, scope) : "") : "";
  return (
    <DateField {...field} clearable={clearable} min={min} max={max} placeholder={placeholder ?? scope.messages.rangePlaceholder}
      text={formatRange(value, iso => formatDateValue(iso, scope))} spoken={spoken}
      open={open} setOpen={next => { if (next) setDraft(value); setOpen(next); }} onClear={() => commit({ start: "", end: "" })}>
      {open && <CalendarView range={draft} min={min} max={max} onSelect={iso => setDraft(current => pickRange(current, iso))}
        onClear={() => setDraft({ start: "", end: "" })} onApply={() => commit(draft)} />}
    </DateField>
  );
}
export type { DateRange };
