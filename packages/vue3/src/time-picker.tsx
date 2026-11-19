import { useKjunMessageScope } from "./runtime/messages";
import { createSegmentTyping, periodLeads, segmentStep, timeSegments, type HourCycle, type TimeSegmentModel } from "../../../shared/package-runtime/time-segments";
import { resolveTimeLayout, resolveTimeTrigger, timeText, timeWheel, wheelPick, wheelStart, type TimeLayout, type TimeTrigger, type WheelColumnKey } from "../../../shared/package-runtime/time-wheel";
import { selectClearMarkStyle, selectClearStyle } from "../../../shared/package-runtime/select-trigger";
import { coarsePointer } from "../../../shared/package-runtime/color-picker";
import { warnPicker } from "../../../shared/package-runtime/calendar";
import { inputTypeStyle } from "../../../shared/package-runtime/typography";
import { computed, onBeforeUnmount, onMounted, ref, useId, watch, type ExtractPublicPropTypes, type PropType } from "vue";
import { defineComponent } from "./runtime/component";
import { css } from "./runtime/style";
import { createTimeDomain, tokens, type InputSize, type TimePrecision } from "@kjun-ui/tokens";
import { KjunButton, KjunIcon } from "./button";
import { useKjunField } from "./input";
import { FloatingPanel } from "./floating-panel";
import { KjunDrawer } from "./drawer";
import { TimeWheel } from "./time-wheel";

const kjunTimePickerProps = {
  modelValue: { type: String as PropType<string | null>, default: null },
  precision: { type: String as PropType<TimePrecision>, default: "minute" },
  min: { type: String, default: undefined },
  max: { type: String, default: undefined },
  minuteStep: { type: Number, default: 1 },
  secondStep: { type: Number, default: 1 },
  disabled: { type: Boolean, default: false },
  error: { type: Boolean, default: false },
  clearable: { type: Boolean, default: true },
  size: { type: String as PropType<InputSize>, default: "md" },
  ariaLabel: { type: String, default: undefined },
  /** 24 (default) shows 00–23; 12 adds an AM/PM column and shows 1–12. The value stays "HH:mm". */
  hourCycle: { type: Number as PropType<HourCycle>, default: 24 },
  /** Where the wheel opens: auto (default) takes a popover on a mouse screen and a bottom sheet on a touch screen;
   * inline shows the wheel in place with no field. */
  layout: { type: String as PropType<TimeLayout>, default: "auto" },
  /** The field that opens the wheel: segments (typing digits works; the popover default) or a one-line button (the sheet default). */
  trigger: { type: String as PropType<TimeTrigger>, default: undefined },
  /** Shows the time without changing it. */
  readOnly: { type: Boolean, default: false },
  /** Submits the value with a form through a hidden input. */
  name: { type: String, default: undefined },
  /** The first segment's (or the button's) id, for an outside <label for>; defaults to the FormGroup's id. */
  id: { type: String, default: undefined },
  /** Stretches the field to its container's width (default false: the field hugs the time). */
  block: { type: Boolean, default: false },
} as const;
export type KjunTimePickerProps = ExtractPublicPropTypes<typeof kjunTimePickerProps>;
export type { TimeLayout, TimeTrigger };

const segmentText = (segment: TimeSegmentModel) => segment.value === null ? "" : segment.options.find(option => option.value === segment.value)?.label ?? String(segment.value).padStart(2, "0");

/** v-model ("HH:mm" or "HH:mm:ss"); `change` commits each change: a confirmed wheel, a typed or stepped segment, a cleared field or a stopped inline column. */
export const KjunTimePicker = defineComponent({
  name: "KjunTimePicker",
  props: kjunTimePickerProps,
  emits: { "update:modelValue": (_value: string | null) => true, change: (_value: string | null) => true },
  setup(props, { emit }) {
    const scope = useKjunMessageScope();
    const root = ref<HTMLElement | null>(null);
    let opener: HTMLElement | null = null;
    const field = useKjunField(), uid = useId().replace(/[^\w-]/g, "");
    const coarse = ref(false);
    let media: MediaQueryList | undefined;
    const sync = () => { coarse.value = coarsePointer(); };
    onMounted(() => { sync(); if (typeof matchMedia === "function") { media = matchMedia("(pointer: coarse)"); media.addEventListener("change", sync); } });
    onBeforeUnmount(() => media?.removeEventListener("change", sync));
    const domain = computed(() => createTimeDomain({ precision: props.precision, min: props.min, max: props.max, minuteStep: props.minuteStep, secondStep: props.secondStep }));
    // Only a broken domain locks the field; a value off the step or bounds stays editable and snaps on the next choice.
    watch([domain, () => props.modelValue], () => {
      if (!domain.value.valid) warnPicker("TimePicker: check min, max, minuteStep and secondStep.");
      else if (!domain.value.accepts(props.modelValue)) warnPicker(`TimePicker: ${props.modelValue} is outside the step or bounds.`);
    }, { immediate: true });
    const blocked = computed(() => props.disabled || !domain.value.valid);
    const layout = computed(() => resolveTimeLayout(props.layout, coarse.value));
    const typing = createSegmentTyping();
    const change = (next: string | null) => {
      if (!blocked.value && !props.readOnly && next !== props.modelValue) { emit("update:modelValue", next); emit("change", next); }
    };
    // popover and sheet turn a draft and commit it with the confirm button; inline commits each stop.
    const open = ref(false), draft = ref(wheelStart(domain.value, props.modelValue)), focusColumn = ref<number | null>(null);
    const openAt = (column: number, from: HTMLElement | null) => {
      if (blocked.value || props.readOnly) return;
      opener = from;
      draft.value = wheelStart(domain.value, props.modelValue); focusColumn.value = column; open.value = true;
    };
    const confirm = () => { change(draft.value); open.value = false; };
    const inputs = () => Array.from(root.value?.querySelectorAll<HTMLInputElement>(".kjun-time-segment-value") ?? []);

    return () => {
      const m = scope.value.messages, owner = field.value, fieldId = props.id || owner?.id || `kjun-time-${uid}`, label = props.ariaLabel ?? m.time;
      const value = props.modelValue, invalid = props.error || !!owner?.error, kind = layout.value;
      const shape = { precision: props.precision, hourCycle: props.hourCycle, minuteStep: props.minuteStep, secondStep: props.secondStep, messages: m, periodFirst: periodLeads(scope.value.language) };
      const shown = kind === "inline" && value !== null && domain.value.accepts(value) ? value : draft.value;
      const pick = (key: WheelColumnKey, next: number) => {
        const time = wheelPick(domain.value, shown, key, next, shape);
        draft.value = time;
        if (kind === "inline") change(time);
      };
      const wheel = (inline: boolean) => <TimeWheel columns={timeWheel(domain.value, shown, shape)} label={label} labelledBy={inline ? owner?.labelId : undefined} inline={inline}
        disabled={blocked.value} readOnly={props.readOnly} focusColumn={inline ? null : focusColumn.value} onPick={pick} onEnter={inline ? undefined : confirm} />;
      const buttonSize = kind === "sheet" ? "md" : "sm";
      const now = () => <KjunButton size={buttonSize} variant="ghost" onClick={() => { draft.value = wheelStart(domain.value, null); }}>{m.now}</KjunButton>;
      const actions = () => [
        <KjunButton key="cancel" size={buttonSize} variant="secondary" onClick={() => { open.value = false; }}>{m.cancel}</KjunButton>,
        <KjunButton key="confirm" size={buttonSize} variant="primary" onClick={confirm}>{m.confirm}</KjunButton>,
      ];
      const hidden = props.name && <input type="hidden" name={props.name} value={value ?? ""} />;

      if (kind === "inline") return <div class="kjun-time-picker-inline" data-block={props.block || undefined} data-error={invalid || undefined} id={props.id ?? owner?.id}>
        {wheel(true)}{hidden}
      </div>;

      const panel = kind === "sheet"
        ? <KjunDrawer open={open.value && !blocked.value} onUpdate:open={(next: boolean) => { open.value = next; }} position="bottom" title={label} closable={false} handle
            returnFocus={() => opener}>
            {{ default: () => <div class="kjun-time-sheet-body">{wheel(false)}</div>, headerActions: now, footer: actions }}
          </KjunDrawer>
        : <FloatingPanel field open={open.value && !blocked.value} onOpenChange={(next: boolean) => { open.value = next; }} trigger={() => root.value} placement="bottom-start" panelClass="kjun-time-panel"
            labelledBy={owner?.labelId} ariaLabel={label} returnFocus={() => opener}
            // The wheel and its buttons are taller than a field list, so the panel takes the general popup height.
            maxHeight={tokens.extensions.floating.maxHeight}>
            {wheel(false)}
            <div class="kjun-time-panel-footer">{now()}<span class="kjun-time-panel-actions">{actions()}</span></div>
          </FloatingPanel>;

      if (resolveTimeTrigger(props.trigger, kind) === "button") {
        const spec = tokens.input[props.size], text = timeText(domain.value, value, shape), valueId = `${fieldId}-value`;
        const clear = props.clearable && value !== null && !blocked.value && !props.readOnly;
        return <>
          <div ref={root} class="kjun-select-shell kjun-time-button-field" data-block={props.block || undefined}>
            <button id={fieldId} type="button" class="kjun-input kjun-select-trigger kjun-time-trigger" disabled={blocked.value} aria-haspopup="dialog" aria-expanded={open.value && !blocked.value}
              aria-label={owner?.labelId ? undefined : text ? label + ", " + text : label} aria-labelledby={owner?.labelId ? owner.labelId + " " + valueId : undefined}
              aria-describedby={owner?.describedBy} aria-invalid={invalid ? "true" : undefined} aria-required={owner?.required || undefined} aria-readonly={props.readOnly || undefined}
              style={css({ height: spec.height, borderRadius: spec.radius, ...inputTypeStyle(props.size), paddingInline: spec.padding - tokens.border.controlWidth })}
              onClick={(event: MouseEvent) => openAt(0, event.currentTarget as HTMLElement)}
              onKeydown={(event: KeyboardEvent) => { if (event.key === "ArrowDown" || event.key === "ArrowUp") { event.preventDefault(); openAt(0, event.currentTarget as HTMLElement); } }}>
              <span id={valueId} class={text ? undefined : "kjun-placeholder"} style={css({ paddingRight: clear ? spec.clearSize + spec.affixGap : undefined })}>{text || m.selectTime}</span>
              <KjunIcon name="clock" size={spec.iconSize} style={{ flexShrink: 0, color: blocked.value ? "var(--_kjun-color-text-disabled)" : "var(--_kjun-color-text-tertiary)" }} />
            </button>
            {clear && <KjunButton size="sm" variant="ghost" shape="circle" ariaLabel={m.clearValue(label)} class="kjun-select-clear" style={css(selectClearStyle(spec))}
              onClick={() => { change(null); root.value?.querySelector<HTMLButtonElement>(".kjun-time-trigger")?.focus(); }}>
              <span class="kjun-select-clear-mark" style={css(selectClearMarkStyle(spec))}><KjunIcon name="x" size={spec.clearMarkIconSize} /></span></KjunButton>}
            {hidden}
          </div>
          {panel}
        </>;
      }

      const segments = timeSegments(domain.value, value, shape);
      return <>
        <div ref={root} class="kjun-time-picker" data-size={props.size} data-block={props.block ? "true" : undefined} data-error={String(invalid)}
          data-disabled={String(blocked.value)} data-readonly={props.readOnly ? "true" : undefined} data-open={open.value || undefined}
          role="group" aria-label={label} aria-labelledby={owner?.labelId} aria-describedby={owner?.describedBy}>
          <div class="kjun-time-segments">
            {segments.flatMap((segment, index) => {
              const labelId = `${fieldId}-segment-${index}`, text = segmentText(segment);
              // The AM/PM segment reads as a word, so it carries no ":" before or after it.
              const separated = index > 0 && segment.key !== "period" && segments[index - 1].key !== "period";
              return [
                separated && <span key={"sep" + index} class="kjun-time-separator" aria-hidden="true">:</span>,
                <div key={segment.key} class="kjun-time-segment" data-period={segment.key === "period" || undefined}>
                  <span id={labelId} class="kjun-sr-only" aria-hidden="true">{segment.label}</span>
                  <input id={index === 0 ? fieldId : `${fieldId}-${index}`} class="kjun-time-segment-value" role="spinbutton" inputmode="none" autocomplete="off" spellcheck={false}
                    value={text} placeholder={m.timePlaceholder} disabled={blocked.value}
                    aria-label={owner?.labelId ? undefined : label + " " + segment.label} aria-labelledby={owner?.labelId ? `${owner.labelId} ${labelId}` : undefined}
                    aria-valuenow={segment.value ?? undefined} aria-valuetext={text || undefined} aria-readonly={props.readOnly || undefined}
                    aria-invalid={invalid ? "true" : undefined} aria-required={owner?.required || undefined} aria-describedby={owner?.describedBy} aria-haspopup="dialog"
                    // Segments take keys, not text: a pasted or dropped string and the browser's own editing change nothing.
                    onBeforeinput={(event: Event) => event.preventDefault()} onPaste={(event: Event) => event.preventDefault()} onDrop={(event: Event) => event.preventDefault()}
                    onClick={(event: MouseEvent) => openAt(index, event.currentTarget as HTMLElement)}
                    onKeydown={(event: KeyboardEvent) => {
                      if (blocked.value || props.readOnly || event.ctrlKey || event.metaKey) return;
                      if (event.key === "Enter" || event.key === " " || (event.altKey && event.key === "ArrowDown")) { event.preventDefault(); openAt(index, event.currentTarget as HTMLElement); return; }
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
                </div>,
              ];
            })}
          </div>
          {props.clearable && value !== null && !blocked.value && !props.readOnly
            ? <KjunButton class="kjun-time-clear" size={props.size} variant="ghost" prefixIcon="x" ariaLabel={m.clearValue(label)}
                onClick={() => { change(null); inputs()[0]?.focus(); }} />
            : <span class="kjun-time-icon" aria-hidden="true" onClick={() => openAt(0, inputs()[0] ?? null)}><KjunIcon name="clock" size={tokens.input[props.size].iconSize} /></span>}
          {hidden}
        </div>
        {panel}
      </>;
    };
  },
});
