import { useKjunMessageScope } from "../../../shared/package-runtime/messages-context";
import { selectClearMarkStyle, selectClearStyle } from "../../../shared/package-runtime/select-trigger";
import { formatDateValue } from "../../../shared/package-runtime/messages";
import { mergeIds } from "../../../shared/package-runtime/aria-ids";
import { dateLabel, formatRange, normalizeRange, pickRange, rangeSpoken, rangeSubmitted, type DateRange } from "../../../shared/package-runtime/calendar";
import { useOpenState } from "../../../shared/package-runtime/use-open-state";
import { inputTypeStyle } from "./typography";
import { tokens, type InputSize } from "@kjun-ui/tokens";
import { useId, useRef, useState, type ReactNode } from "react";
import { KjunButton, KjunIcon } from "./button";
import { useKjunField } from "./input";
import { FloatingPanel } from "./layers";
import { CalendarView, type CalendarOptions, type DateRangePreset } from "./calendar";

interface DateFieldProps extends CalendarOptions {
  size?: InputSize;
  /** Shows a clear button while there is a value. */
  clearable?: boolean;
  placeholder?: string;
  ariaLabel?: string;
  error?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  /** Earliest and latest selectable dates (YYYY-MM-DD). */
  min?: string;
  max?: string;
  /** Trigger id for an outside <label for>; defaults to the FormGroup's id. */
  id?: string;
  /** Submits the value with a form through a hidden input. */
  name?: string;
  /** Opens and closes the calendar from the app; leave it out to let the field own it. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}
/** The Select-style field that opens a calendar; both pickers share it. */
function DateField({ size = "md", clearable, placeholder, ariaLabel, error, disabled, readOnly, id, name, text, spoken, submitted, clearLabel, open, setOpen, onClear, children }:
  Omit<DateFieldProps, keyof CalendarOptions | "min" | "max" | "open" | "onOpenChange"> & { text: string; spoken: string; submitted: string; clearLabel: string; open: boolean; setOpen: (open: boolean) => void; onClear: () => void; children: ReactNode }) {
  const field = useKjunField(), spec = tokens.input[size];
  const trigger = useRef<HTMLButtonElement>(null), valueId = "kjun-date-" + useId();
  const label = ariaLabel || placeholder!;
  const clear = !!clearable && !!text && !disabled && !readOnly;
  return (
    <>
      <div className="kjun-select-shell kjun-date-picker">
        <button ref={trigger} id={id ?? field?.id} type="button" className="kjun-input kjun-select-trigger kjun-date-trigger"
          disabled={disabled} aria-haspopup="dialog" aria-expanded={open && !disabled}
          // A FormGroup label names the field and the shown date follows it; otherwise the label and spoken date do.
          aria-label={field?.labelId ? undefined : spoken ? label + ", " + spoken : label}
          aria-labelledby={field?.labelId ? mergeIds(field.labelId, valueId) : undefined}
          aria-describedby={field?.describedBy} aria-invalid={error || !!field?.error || undefined} aria-required={field?.required || undefined}
          aria-readonly={readOnly || undefined}
          style={{ height: spec.height, borderRadius: spec.radius, ...inputTypeStyle(size), paddingInline: spec.padding - tokens.border.controlWidth }}
          onClick={() => { if (!readOnly) setOpen(!open); }}
          onKeyDown={event => { if (!readOnly && (event.key === "ArrowDown" || event.key === "ArrowUp")) { event.preventDefault(); setOpen(true); } }}>
          <span id={valueId} className={!text ? "kjun-placeholder" : undefined} style={{ paddingRight: clear ? spec.clearSize + spec.affixGap : undefined }}>
            {text ? <span aria-hidden="true">{text}</span> : placeholder}
            {spoken && <span className="kjun-sr-only">{spoken}</span>}
          </span>
          <KjunIcon name="calendar" size={spec.iconSize} style={{ flexShrink: 0, color: disabled ? "var(--_kjun-color-text-disabled)" : "var(--_kjun-color-text-tertiary)" }} />
        </button>
        {clear && (
          <KjunButton size="sm" variant="ghost" shape="circle" ariaLabel={clearLabel} className="kjun-select-clear"
            style={selectClearStyle(spec)}
            onClick={() => { onClear(); trigger.current?.focus(); }}><span className="kjun-select-clear-mark" style={selectClearMarkStyle(spec)}><KjunIcon name="x" size={spec.clearMarkIconSize} /></span></KjunButton>
        )}
        {name && <input type="hidden" name={name} value={submitted} />}
      </div>
      <FloatingPanel field open={open && !disabled} onOpenChange={setOpen} triggerRef={trigger} placement="bottom-start" className="kjun-calendar-panel"
        // The calendar dialog takes the field's name.
        labelledBy={field?.labelId} ariaLabel={label}
        // A month of days with its footer is taller than a field list, so it takes the general popup height.
        maxHeight={tokens.extensions.floating.maxHeight}>
        {children}
      </FloatingPanel>
    </>
  );
}

export interface KjunDatePickerProps extends DateFieldProps {
  /** YYYY-MM-DD, or an empty string. */
  value: string;
  onValueChange?: (value: string) => void;
  onChange?: (value: string) => void;
}
export function KjunDatePicker({ value, placeholder, clearable = false, min, max, weekStart, markSunday, markSaturday, isDateUnavailable, onValueChange, onChange,
  open: controlled, onOpenChange, ...field }: KjunDatePickerProps) {
  const scope = useKjunMessageScope();
  const [open, setOpen] = useOpenState(controlled, !!field.disabled, onOpenChange);
  const commit = (next: string) => { if (next !== value) { onValueChange?.(next); onChange?.(next); } setOpen(false); };
  return (
    <DateField {...field} clearable={clearable} placeholder={placeholder ?? scope.messages.datePlaceholder} clearLabel={scope.messages.clearDate}
      text={value ? formatDateValue(value, scope) : ""} spoken={value ? dateLabel(value, scope) : ""} submitted={value}
      open={open} setOpen={setOpen} onClear={() => commit("")}>
      <CalendarView value={value} min={min} max={max} clearable={clearable} weekStart={weekStart} markSunday={markSunday} markSaturday={markSaturday} isDateUnavailable={isDateUnavailable}
        onSelect={commit} onClear={() => commit("")} />
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
  /** Shortest and longest range in days, counting both ends; other ends fade while the end is picked and start a new range when pressed. */
  minDays?: number;
  maxDays?: number;
}
/** Two dates picked in one calendar: the first pick starts the range, the second ends it, and Apply commits it. */
export function KjunDateRangePicker({ value: given, placeholder, clearable = false, min, max, weekStart, markSunday, markSaturday, isDateUnavailable, presets, autoApply = false,
  minDays, maxDays, onValueChange, onChange, open: controlled, onOpenChange, ...field }: KjunDateRangePickerProps) {
  const scope = useKjunMessageScope();
  const value = normalizeRange(given, min, max), limits = { minDays, maxDays };
  const [open, setOpen] = useOpenState(controlled, !!field.disabled, onOpenChange), [draft, setDraft] = useState(value);
  // Each opening, by the field or by the app, starts the draft from the current value.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) { setWasOpen(open); if (open) setDraft(value); }
  const commit = (next: DateRange) => { if (next.start !== value.start || next.end !== value.end) { onValueChange?.(next); onChange?.(next); } setOpen(false); };
  const format = (iso: string) => formatDateValue(iso, scope);
  const pick = (iso: string) => {
    const next = pickRange(draft, iso, isDateUnavailable, limits);
    setDraft(next);
    if (autoApply && next.end) commit(next);
  };
  return (
    <DateField {...field} clearable={clearable} placeholder={placeholder ?? scope.messages.rangePlaceholder} clearLabel={scope.messages.clearDates}
      text={formatRange(value, format)} spoken={rangeSpoken(value, scope)} submitted={rangeSubmitted(value)}
      open={open} setOpen={setOpen} onClear={() => commit({ start: "", end: "" })}>
      <CalendarView range={draft} limits={limits} min={min} max={max} clearable={clearable} weekStart={weekStart} markSunday={markSunday} markSaturday={markSaturday} isDateUnavailable={isDateUnavailable}
        presets={presets} onPreset={next => { const range = normalizeRange(next, min, max); setDraft(range); if (autoApply) commit(range); }}
        onSelect={pick} onClear={() => setDraft({ start: "", end: "" })} onApply={autoApply ? undefined : () => commit(draft)} />
    </DateField>
  );
}
export type { DateRange, DateRangePreset };
