import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { Fragment, useEffect, useId, useMemo, useRef } from "react";
import { createTimeDomain, type TimePrecision, type InputSize } from "@kjun-ui/tokens";
import { CompoundControlContext } from "./compound-control";
import { KjunSelect } from "./select";
import { KjunButton } from "./button";
import { FieldContext, useKjunField } from "./input";
export interface KjunTimePickerProps {
  value: string | null; precision?: TimePrecision; min?: string; max?: string; minuteStep?: number; secondStep?: number;
  disabled?: boolean; error?: boolean; clearable?: boolean; size?: InputSize; ariaLabel?: string;
  onValueChange?: (value: string | null) => void; onChangeCommit?: (value: string | null) => void;
}
export function KjunTimePicker({ value, precision = "minute", min, max, minuteStep = 1, secondStep = 1, disabled = false, error = false, clearable = true, size = "md", ariaLabel, onValueChange, onChangeCommit }: KjunTimePickerProps) {
  const m = useKjunMessages();
  ariaLabel ??= m.time;
  const root = useRef<HTMLDivElement>(null);
  const field = useKjunField(), uid = useId();
  const fieldId = field?.id || `kjun-time-${uid}`;
  const domain = useMemo(() => createTimeDomain({ precision, min, max, minuteStep, secondStep }), [precision, min, max, minuteStep, secondStep]);
  const valid = domain.valid && domain.accepts(value);
  useEffect(() => { if (!valid) console.warn("KJUN TimePicker: 시각 범위·간격·값을 확인하세요."); }, [valid]);
  const change = (next: string | null) => { if (valid && !disabled && next !== value) { onValueChange?.(next); onChangeCommit?.(next); } };
  const time = value === null ? null : domain.parse(value);
  return <div ref={root} className="kjun-time-picker" data-size={size} data-error={error || !!field?.error} data-disabled={disabled || !valid} role="group" aria-label={ariaLabel} aria-labelledby={field?.labelId} aria-describedby={field?.describedBy}>
    <CompoundControlContext.Provider value={size}><div className="kjun-time-segments">
    {[m.hour, m.minute, m.second].slice(0, precision === "second" ? 3 : 2).map((label, index) => {
      const segmentId = index === 0 ? fieldId : `${fieldId}-${index}`;
      const labelId = `${fieldId}-segment-${index}`;
      return <Fragment key={label}>{index > 0 && <span className="kjun-time-separator" aria-hidden>:</span>}<FieldContext.Provider value={{ ...field, id: segmentId, labelId: field?.labelId ? `${field.labelId} ${labelId}` : undefined }}>
        <div className="kjun-time-segment"><span id={labelId} className="kjun-sr-only" aria-hidden>{label}</span>
          <KjunSelect value={time === null ? null : domain.part(time, index)}
            options={domain.options(value, index).map(n => ({ value: n, label: String(n).padStart(2, "0") }))}
            onValueChange={next => { if (typeof next === "number") change(domain.select(value, index, next)); }}
            ariaLabel={ariaLabel + " " + label} placeholder={label} disabled={disabled || !valid} error={error} size={size} clearable={false} searchable={false} />
        </div>
      </FieldContext.Provider></Fragment>;
    })}
    </div></CompoundControlContext.Provider>
    {clearable && value !== null && <KjunButton className="kjun-time-clear" size={size} variant="ghost" prefixIcon="x" ariaLabel={m.clearValue(ariaLabel)} disabled={disabled || !valid} onClick={() => { change(null); root.current?.querySelector<HTMLButtonElement>(".kjun-select-trigger")?.focus(); }} />}
  </div>;
}
