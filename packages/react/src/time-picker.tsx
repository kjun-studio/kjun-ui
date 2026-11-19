import { useKjunMessageScope } from "../../../shared/package-runtime/messages-context";
import { createSegmentTyping, periodLeads, segmentStep, timeSegments, type HourCycle, type TimeSegmentModel } from "../../../shared/package-runtime/time-segments";
import { resolveTimeLayout, resolveTimeTrigger, timeText, timeWheel, wheelPick, wheelStart, type TimeLayout, type TimeTrigger } from "../../../shared/package-runtime/time-wheel";
import { selectClearMarkStyle, selectClearStyle } from "../../../shared/package-runtime/select-trigger";
import { coarsePointer } from "../../../shared/package-runtime/color-picker";
import { mergeIds } from "../../../shared/package-runtime/aria-ids";
import { warnPicker } from "../../../shared/package-runtime/calendar";
import { Fragment, useEffect, useId, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { createTimeDomain, tokens, type TimePrecision, type InputSize } from "@kjun-ui/tokens";
import { KjunButton, KjunIcon } from "./button";
import { useKjunField } from "./input";
import { FloatingPanel } from "./layers";
import { KjunDrawer } from "./drawer";
import { inputTypeStyle } from "./typography";
import { TimeWheel } from "./time-wheel";
export type { TimeLayout, TimeTrigger };
export interface KjunTimePickerProps {
  value: string | null; precision?: TimePrecision; min?: string; max?: string; minuteStep?: number; secondStep?: number;
  disabled?: boolean; error?: boolean; clearable?: boolean; size?: InputSize; ariaLabel?: string;
  /** 24 (default) shows 00–23; 12 adds an AM/PM column and shows 1–12. The value stays "HH:mm". */
  hourCycle?: HourCycle;
  /** Where the wheel opens: auto (default) takes a popover on a mouse screen and a bottom sheet on a touch screen;
   * inline shows the wheel in place with no field. */
  layout?: TimeLayout;
  /** The field that opens the wheel: segments (typing digits works; the popover default) or a one-line button (the sheet default). */
  trigger?: TimeTrigger;
  /** Shows the time without changing it. */
  readOnly?: boolean;
  /** Submits the value with a form through a hidden input. */
  name?: string;
  /** The first segment's (or the button's) id, for an outside <label for>; defaults to the FormGroup's id. */
  id?: string;
  /** Stretches the field to its container's width (default false: the field hugs the time). */
  block?: boolean;
  /** Each change: a confirmed wheel, a typed or stepped segment, a cleared field, or a stopped inline column. */
  onValueChange?: (value: string | null) => void; onChangeCommit?: (value: string | null) => void;
}

const subscribeCoarse = (notify: () => void) => {
  if (typeof matchMedia !== "function") return () => {};
  const media = matchMedia("(pointer: coarse)");
  media.addEventListener("change", notify);
  return () => media.removeEventListener("change", notify);
};
const segmentText = (segment: TimeSegmentModel) => segment.value === null ? "" : segment.options.find(option => option.value === segment.value)?.label ?? String(segment.value).padStart(2, "0");

export function KjunTimePicker({ value, precision = "minute", min, max, minuteStep = 1, secondStep = 1, disabled = false, error = false, clearable = true, size = "md", ariaLabel,
  hourCycle = 24, layout: layoutProp = "auto", trigger: triggerProp, readOnly = false, name, id, block = false, onValueChange, onChangeCommit }: KjunTimePickerProps) {
  const scope = useKjunMessageScope(), m = scope.messages;
  ariaLabel ??= m.time;
  const root = useRef<HTMLDivElement>(null), opener = useRef<HTMLElement | null>(null);
  const field = useKjunField(), uid = useId();
  const fieldId = id || field?.id || `kjun-time-${uid}`;
  const [typing] = useState(createSegmentTyping);
  const coarse = useSyncExternalStore(subscribeCoarse, coarsePointer, () => false);
  const layout = resolveTimeLayout(layoutProp, coarse), trigger = resolveTimeTrigger(triggerProp, layout === "inline" ? "popover" : layout);
  const domain = useMemo(() => createTimeDomain({ precision, min, max, minuteStep, secondStep }), [precision, min, max, minuteStep, secondStep]);
  // Only a broken domain locks the field; a value off the step or bounds stays editable and snaps on the next choice.
  const accepted = domain.accepts(value);
  useEffect(() => { if (!domain.valid) warnPicker("TimePicker: check min, max, minuteStep and secondStep."); else if (!accepted) warnPicker(`TimePicker: ${value} is outside the step or bounds.`); }, [domain, accepted, value]);
  const blocked = disabled || !domain.valid, invalid = error || !!field?.error;
  const change = (next: string | null) => { if (!blocked && !readOnly && next !== value) { onValueChange?.(next); onChangeCommit?.(next); } };
  const shape = { precision, hourCycle, minuteStep, secondStep, messages: m, periodFirst: periodLeads(scope.language) };

  // popover and sheet turn a draft and commit it with the confirm button; inline commits each stop.
  const [open, setOpen] = useState(false), [draft, setDraft] = useState(() => wheelStart(domain, value)), [focusColumn, setFocusColumn] = useState<number | null>(null);
  const openAt = (column: number, from: HTMLElement | null) => {
    if (blocked || readOnly) return;
    opener.current = from;
    setDraft(wheelStart(domain, value)); setFocusColumn(column); setOpen(true);
  };
  const confirm = () => { change(draft); setOpen(false); };
  const shown = layout === "inline" ? value !== null && accepted ? value : draft : draft;
  const columns = timeWheel(domain, shown, shape);
  const pick = (key: Parameters<typeof wheelPick>[2], next: number) => {
    const time = wheelPick(domain, shown, key, next, shape);
    setDraft(time);
    if (layout === "inline") change(time);
  };
  const wheel = (inline: boolean) => <TimeWheel columns={columns} label={ariaLabel} labelledBy={inline ? field?.labelId : undefined} inline={inline}
    disabled={blocked} readOnly={readOnly} focusColumn={inline ? null : focusColumn} onPick={pick} onEnter={inline ? undefined : confirm} />;
  const now = <KjunButton size={layout === "sheet" ? "md" : "sm"} variant="ghost" onClick={() => setDraft(wheelStart(domain, null))}>{m.now}</KjunButton>;
  const actions = <>
    <KjunButton size={layout === "sheet" ? "md" : "sm"} variant="secondary" onClick={() => setOpen(false)}>{m.cancel}</KjunButton>
    <KjunButton size={layout === "sheet" ? "md" : "sm"} variant="primary" onClick={confirm}>{m.confirm}</KjunButton>
  </>;
  const hidden = name && <input type="hidden" name={name} value={value ?? ""} />;

  if (layout === "inline") return <div className="kjun-time-picker-inline" data-block={block || undefined} data-error={invalid || undefined} id={id ?? field?.id}>
    {wheel(true)}{hidden}
  </div>;

  const panel = layout === "sheet"
    ? <KjunDrawer open={open && !blocked} onOpenChange={setOpen} position="bottom" title={ariaLabel} closable={false} handle headerActions={now} footer={actions}
        returnFocus={() => opener.current}>
        <div className="kjun-time-sheet-body">{wheel(false)}</div>
      </KjunDrawer>
    : <FloatingPanel field open={open && !blocked} onOpenChange={setOpen} triggerRef={root} placement="bottom-start" className="kjun-time-panel"
        labelledBy={field?.labelId} ariaLabel={ariaLabel} returnFocus={() => opener.current}
        // The wheel and its buttons are taller than a field list, so the panel takes the general popup height.
        maxHeight={tokens.extensions.floating.maxHeight}>
        {wheel(false)}
        <div className="kjun-time-panel-footer">{now}<span className="kjun-time-panel-actions">{actions}</span></div>
      </FloatingPanel>;

  if (trigger === "button") {
    const spec = tokens.input[size], text = timeText(domain, value, shape), valueId = `${fieldId}-value`;
    const clear = clearable && value !== null && !blocked && !readOnly;
    return <>
      <div ref={root} className="kjun-select-shell kjun-time-button-field" data-block={block || undefined}>
        <button id={fieldId} type="button" className="kjun-input kjun-select-trigger kjun-time-trigger" disabled={blocked} aria-haspopup="dialog" aria-expanded={open && !blocked}
          aria-label={field?.labelId ? undefined : text ? ariaLabel + ", " + text : ariaLabel} aria-labelledby={field?.labelId ? mergeIds(field.labelId, valueId) : undefined}
          aria-describedby={field?.describedBy} aria-invalid={invalid || undefined} aria-required={field?.required || undefined} aria-readonly={readOnly || undefined}
          style={{ height: spec.height, borderRadius: spec.radius, ...inputTypeStyle(size), paddingInline: spec.padding - tokens.border.controlWidth }}
          onClick={event => openAt(0, event.currentTarget)}
          onKeyDown={event => { if (event.key === "ArrowDown" || event.key === "ArrowUp") { event.preventDefault(); openAt(0, event.currentTarget); } }}>
          <span id={valueId} className={text ? undefined : "kjun-placeholder"} style={{ paddingRight: clear ? spec.clearSize + spec.affixGap : undefined }}>{text || m.selectTime}</span>
          <KjunIcon name="clock" size={spec.iconSize} style={{ flexShrink: 0, color: blocked ? "var(--_kjun-color-text-disabled)" : "var(--_kjun-color-text-tertiary)" }} />
        </button>
        {clear && <KjunButton size="sm" variant="ghost" shape="circle" ariaLabel={m.clearValue(ariaLabel)} className="kjun-select-clear" style={selectClearStyle(spec)}
          onClick={() => { change(null); root.current?.querySelector<HTMLButtonElement>(".kjun-time-trigger")?.focus(); }}>
          <span className="kjun-select-clear-mark" style={selectClearMarkStyle(spec)}><KjunIcon name="x" size={spec.clearMarkIconSize} /></span></KjunButton>}
        {hidden}
      </div>
      {panel}
    </>;
  }

  const segments = timeSegments(domain, value, shape);
  const inputs = () => Array.from(root.current?.querySelectorAll<HTMLInputElement>(".kjun-time-segment-value") ?? []);
  return <>
    <div ref={root} className="kjun-time-picker" data-size={size} data-block={block || undefined} data-error={invalid} data-disabled={blocked} data-readonly={readOnly || undefined}
      data-open={open || undefined} role="group" aria-label={ariaLabel} aria-labelledby={field?.labelId} aria-describedby={field?.describedBy}>
      <div className="kjun-time-segments">
        {segments.map((segment, index) => {
          const labelId = `${fieldId}-segment-${index}`, text = segmentText(segment);
          // The AM/PM segment reads as a word, so it carries no ":" before or after it.
          const separated = index > 0 && segment.key !== "period" && segments[index - 1].key !== "period";
          return <Fragment key={segment.key}>{separated && <span className="kjun-time-separator" aria-hidden>:</span>}
            <div className="kjun-time-segment" data-period={segment.key === "period" || undefined}>
              <span id={labelId} className="kjun-sr-only" aria-hidden>{segment.label}</span>
              <input id={index === 0 ? fieldId : `${fieldId}-${index}`} className="kjun-time-segment-value" role="spinbutton" inputMode="none" autoComplete="off" spellCheck={false}
                value={text} placeholder={m.timePlaceholder} disabled={blocked} onChange={() => {}}
                aria-label={field?.labelId ? undefined : ariaLabel + " " + segment.label} aria-labelledby={field?.labelId ? `${field.labelId} ${labelId}` : undefined}
                aria-valuenow={segment.value ?? undefined} aria-valuetext={text || undefined} aria-readonly={readOnly || undefined}
                aria-invalid={invalid || undefined} aria-required={field?.required || undefined} aria-describedby={field?.describedBy} aria-haspopup="dialog"
                // Segments take keys, not text: a pasted or dropped string and the browser's own editing change nothing.
                onBeforeInput={event => event.preventDefault()} onPaste={event => event.preventDefault()} onDrop={event => event.preventDefault()}
                onClick={event => openAt(index, event.currentTarget)}
                onKeyDown={event => {
                  if (blocked || readOnly || event.ctrlKey || event.metaKey) return;
                  if (event.key === "Enter" || event.key === " " || (event.altKey && event.key === "ArrowDown")) { event.preventDefault(); openAt(index, event.currentTarget); return; }
                  if (event.altKey) return;
                  const stepped = segmentStep(segment, event.key);
                  if (stepped !== null) { event.preventDefault(); change(segment.pick(stepped)); return; }
                  // Digits (and a/p on AM/PM) pick the segment's value; a full segment moves focus to the next one.
                  const typed = typing.key(segment, index, event.key);
                  if (!typed) return;
                  event.preventDefault();
                  if (typed.value !== null) change(segment.pick(typed.value));
                  if (typed.advance) inputs()[index + 1]?.focus();
                }} />
            </div></Fragment>;
        })}
      </div>
      {clearable && value !== null && !blocked && !readOnly
        ? <KjunButton className="kjun-time-clear" size={size} variant="ghost" prefixIcon="x" ariaLabel={m.clearValue(ariaLabel)} onClick={() => { change(null); inputs()[0]?.focus(); }} />
        : <span className="kjun-time-icon" aria-hidden="true" onClick={() => openAt(0, inputs()[0] ?? null)}><KjunIcon name="clock" size={tokens.input[size].iconSize} /></span>}
      {hidden}
    </div>
    {panel}
  </>;
}
