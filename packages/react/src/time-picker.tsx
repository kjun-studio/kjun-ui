import { useKjunMessageScope } from "../../../shared/package-runtime/messages-context";
import { periodLeads, timeSegments, type HourCycle } from "../../../shared/package-runtime/time-segments";
import { warnPicker } from "../../../shared/package-runtime/calendar";
import { Fragment, useEffect, useId, useMemo, useRef } from "react";
import { createTimeDomain, tokens, type TimePrecision, type InputSize } from "@kjun-ui/tokens";
import { CompoundControlContext } from "./compound-control";
import { KjunSelect } from "./select";
import { KjunButton, KjunIcon } from "./button";
import { FieldContext, useKjunField } from "./input";
export interface KjunTimePickerProps {
  value: string | null; precision?: TimePrecision; min?: string; max?: string; minuteStep?: number; secondStep?: number;
  disabled?: boolean; error?: boolean; clearable?: boolean; size?: InputSize; ariaLabel?: string;
  /** 24 (default) shows 00–23; 12 adds an AM/PM segment and shows 1–12. The value stays "HH:mm". */
  hourCycle?: HourCycle;
  /** Shows the time without changing it. */
  readOnly?: boolean;
  /** Submits the value with a form through a hidden input. */
  name?: string;
  /** Stretches the field to its container's width (default false: the field hugs the time). */
  block?: boolean;
  onValueChange?: (value: string | null) => void; onChangeCommit?: (value: string | null) => void;
}
export function KjunTimePicker({ value, precision = "minute", min, max, minuteStep = 1, secondStep = 1, disabled = false, error = false, clearable = true, size = "md", ariaLabel,
  hourCycle = 24, readOnly = false, name, block = false, onValueChange, onChangeCommit }: KjunTimePickerProps) {
  const scope = useKjunMessageScope(), m = scope.messages;
  ariaLabel ??= m.time;
  const root = useRef<HTMLDivElement>(null);
  const field = useKjunField(), uid = useId();
  const fieldId = field?.id || `kjun-time-${uid}`;
  const domain = useMemo(() => createTimeDomain({ precision, min, max, minuteStep, secondStep }), [precision, min, max, minuteStep, secondStep]);
  // Only a broken domain locks the field; a value off the step or bounds stays editable and snaps on the next choice.
  const accepted = domain.accepts(value);
  useEffect(() => { if (!domain.valid) warnPicker("TimePicker: check min, max, minuteStep and secondStep."); else if (!accepted) warnPicker(`TimePicker: ${value} is outside the step or bounds.`); }, [domain, accepted, value]);
  const blocked = disabled || !domain.valid;
  const change = (next: string | null) => { if (!blocked && !readOnly && next !== value) { onValueChange?.(next); onChangeCommit?.(next); } };
  const segments = timeSegments(domain, value, { precision, hourCycle, messages: m, periodFirst: periodLeads(scope.language) });
  return <div ref={root} className="kjun-time-picker" data-size={size} data-block={block || undefined} data-error={error || !!field?.error} data-disabled={blocked} data-readonly={readOnly || undefined}
    role="group" aria-label={ariaLabel} aria-labelledby={field?.labelId} aria-describedby={field?.describedBy}>
    <CompoundControlContext.Provider value={size}><div className="kjun-time-segments">
    {segments.map((segment, index) => {
      const segmentId = index === 0 ? fieldId : `${fieldId}-${index}`;
      const labelId = `${fieldId}-segment-${index}`;
      // The AM/PM segment reads as a word, so it carries no ":" before or after it.
      const separated = index > 0 && segment.key !== "period" && segments[index - 1].key !== "period";
      return <Fragment key={segment.key}>{separated && <span className="kjun-time-separator" aria-hidden>:</span>}<FieldContext.Provider value={{ ...field, id: segmentId, labelId: field?.labelId ? `${field.labelId} ${labelId}` : undefined }}>
        <div className="kjun-time-segment" data-period={segment.key === "period" || undefined}><span id={labelId} className="kjun-sr-only" aria-hidden>{segment.label}</span>
          <KjunSelect value={segment.value} options={segment.options}
            onValueChange={next => { if (typeof next === "number") change(segment.pick(next)); }}
            ariaLabel={ariaLabel + " " + segment.label} placeholder={m.timePlaceholder} disabled={blocked} readOnly={readOnly} error={error} size={size} clearable={false} searchable={false} />
        </div>
      </FieldContext.Provider></Fragment>;
    })}
    </div></CompoundControlContext.Provider>
    {clearable && value !== null && !blocked && !readOnly
      ? <KjunButton className="kjun-time-clear" size={size} variant="ghost" prefixIcon="x" ariaLabel={m.clearValue(ariaLabel)} onClick={() => { change(null); root.current?.querySelector<HTMLButtonElement>(".kjun-select-trigger")?.focus(); }} />
      : <span className="kjun-time-icon" aria-hidden="true"><KjunIcon name="clock" size={tokens.input[size].iconSize} /></span>}
    {name && <input type="hidden" name={name} value={value ?? ""} />}
  </div>;
}
