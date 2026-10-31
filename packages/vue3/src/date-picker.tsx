import { useKjunMessages, useKjunMessageScope } from "./runtime/messages";
import { dateLabel, formatRange, pickRange, type DateRange } from "../../../shared/package-runtime/calendar";
import { CalendarView } from "./calendar";
import { FloatingPanel } from "./floating-panel";
import { formatDateValue } from "../../../shared/package-runtime/messages";
import { computed, defineComponent, provide, ref, useId, watch, type ExtractPublicPropTypes, type PropType, type Ref, type SlotsType, type VNodeChild } from "vue";
import { createTimeDomain, tokens, type InputSize, type TimePrecision } from "@kjun-ui/tokens";
import { inputTypeStyle } from "../../../shared/package-runtime/typography";
import { KjunButton, KjunIcon } from "./button";
import { kjunFieldKey, useKjunField } from "./input";
import { kjunCompoundControlKey } from "./quantity-stepper";
import { KjunSelect } from "./select-control";
import { css } from "./runtime/style";

const dateFieldProps = {
  /** Shows a clear button while there is a value. */
  clearable: { type: Boolean, default: false },
  size: { type: String as PropType<InputSize>, default: "md" },
  placeholder: { type: String, default: undefined },
  ariaLabel: { type: String, default: undefined },
  error: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  readOnly: { type: Boolean, default: false },
  /** Earliest and latest selectable dates (YYYY-MM-DD). */
  min: { type: String, default: undefined },
  max: { type: String, default: undefined },
  /** Trigger id for an outside <label for>; defaults to the FormGroup's id. */
  id: { type: String, default: undefined },
  /** Submits the value with a form through a hidden input. */
  name: { type: String, default: undefined },
} as const;
type DateFieldOptions = ExtractPublicPropTypes<typeof dateFieldProps>;
/** The Select-style field that opens a calendar; both pickers share it. */
function useDateField(props: Readonly<DateFieldOptions & { placeholder?: string }>, open: Ref<boolean>) {
  const field = useKjunField(), scope = useKjunMessageScope();
  const trigger = ref<HTMLButtonElement | null>(null), valueId = useId().replace(/[^\w-]/g, "") + "-date";
  return (state: { text: string; spoken: string; submitted: string; placeholder: string; onClear: () => void }, calendar: () => VNodeChild) => {
    const spec = tokens.input[props.size ?? "md"], owner = field.value, label = props.ariaLabel || state.placeholder;
    const clear = !!props.clearable && !!state.text && !props.disabled && !props.readOnly;
    return (
      <>
        <div class="kjun-select-shell kjun-date-picker">
          <button ref={trigger} id={props.id ?? owner?.id} type="button" class="kjun-input kjun-select-trigger kjun-date-trigger"
            disabled={props.disabled} aria-haspopup="dialog" aria-expanded={open.value && !props.disabled}
            // A FormGroup label names the field and the shown date follows it; otherwise the label and spoken date do.
            aria-label={owner?.labelId ? undefined : state.spoken ? label + ", " + state.spoken : label}
            aria-labelledby={owner?.labelId ? owner.labelId + " " + valueId : undefined}
            aria-describedby={owner?.describedBy} aria-invalid={props.error || !!owner?.error ? "true" : undefined} aria-required={owner?.required || undefined}
            aria-readonly={props.readOnly || undefined}
            style={css({ height: spec.height, borderRadius: spec.radius, ...inputTypeStyle(props.size ?? "md"), paddingInline: spec.padding - tokens.border.controlWidth })}
            onClick={() => { if (!props.readOnly) open.value = !open.value; }}
            onKeydown={(event: KeyboardEvent) => { if (!props.readOnly && (event.key === "ArrowDown" || event.key === "ArrowUp")) { event.preventDefault(); open.value = true; } }}>
            <span id={valueId} class={!state.text ? "kjun-placeholder" : undefined} style={css({ paddingRight: clear ? spec.clearSize + spec.affixGap : undefined })}>
              {state.text ? <span aria-hidden="true">{state.text}</span> : state.placeholder}
              {state.spoken && <span class="kjun-sr-only">{state.spoken}</span>}
            </span>
            <KjunIcon name="calendar" size={spec.iconSize} style={{ flexShrink: 0, color: props.disabled ? "var(--_kjun-color-text-disabled)" : "var(--_kjun-color-text-tertiary)" }} />
          </button>
          {clear && (
            <KjunButton size="sm" variant="ghost" ariaLabel={scope.value.messages.clearDate} class="kjun-select-clear"
              style={css({ padding: 0, right: spec.padding + spec.iconSize + spec.affixGap, width: spec.clearSize, height: spec.clearSize, minHeight: spec.clearSize, borderRadius: "50%" })}
              onClick={() => { state.onClear(); trigger.value?.focus(); }}><KjunIcon name="x" size={spec.iconSize} /></KjunButton>
          )}
          {props.name && <input type="hidden" name={props.name} value={state.submitted} />}
        </div>
        <FloatingPanel field open={open.value && !props.disabled} onOpenChange={(next: boolean) => { open.value = next; }} trigger={() => trigger.value} placement="bottom-start" panelClass="kjun-calendar-panel"
          // A month of days with its footer is taller than a field list, so it takes the general popup height.
          maxHeight={tokens.extensions.floating.maxHeight}>
          {open.value && calendar()}
        </FloatingPanel>
      </>
    );
  };
}

const kjunDatePickerProps = {
  ...dateFieldProps,
  /** YYYY-MM-DD, or an empty string. */
  modelValue: { type: String, default: "" },
} as const;
export type KjunDatePickerProps = ExtractPublicPropTypes<typeof kjunDatePickerProps>;
/** v-model holds YYYY-MM-DD; choosing a day commits and closes. */
export const KjunDatePicker = defineComponent({
  name: "KjunDatePicker",
  props: kjunDatePickerProps,
  emits: { "update:modelValue": (_value: string) => true, change: (_value: string) => true },
  setup(props, { emit }) {
    const scope = useKjunMessageScope();
    const open = ref(false);
    const render = useDateField(props, open);
    const commit = (next: string) => { if (next !== props.modelValue) { emit("update:modelValue", next); emit("change", next); } open.value = false; };
    return () => render({
      text: props.modelValue ? formatDateValue(props.modelValue, scope.value) : "",
      spoken: props.modelValue ? dateLabel(props.modelValue, scope.value) : "", submitted: props.modelValue,
      placeholder: props.placeholder ?? scope.value.messages.datePlaceholder, onClear: () => commit(""),
    }, () => <CalendarView value={props.modelValue} min={props.min} max={props.max} clearable={props.clearable} onSelect={commit} onClear={() => commit("")} />);
  },
});

const kjunDateRangePickerProps = {
  ...dateFieldProps,
  /** Start and end as YYYY-MM-DD; empty strings while unset. */
  modelValue: { type: Object as PropType<DateRange>, default: () => ({ start: "", end: "" }) },
} as const;
export type KjunDateRangePickerProps = ExtractPublicPropTypes<typeof kjunDateRangePickerProps>;
/** v-model holds { start, end }: the first pick starts the range, the second ends it, and Apply commits it. */
export const KjunDateRangePicker = defineComponent({
  name: "KjunDateRangePicker",
  props: kjunDateRangePickerProps,
  emits: { "update:modelValue": (_value: DateRange) => true, change: (_value: DateRange) => true },
  setup(props, { emit }) {
    const scope = useKjunMessageScope();
    const open = ref(false), draft = ref<DateRange>({ ...props.modelValue });
    watch(open, value => { if (value) draft.value = { ...props.modelValue }; });
    const render = useDateField(props, open);
    const commit = (next: DateRange) => {
      if (next.start !== props.modelValue.start || next.end !== props.modelValue.end) { emit("update:modelValue", next); emit("change", next); }
      open.value = false;
    };
    return () => {
      const value = props.modelValue, format = (iso: string) => formatDateValue(iso, scope.value);
      return render({
        text: formatRange(value, format),
        spoken: value.start ? dateLabel(value.start, scope.value) + (value.end ? " – " + dateLabel(value.end, scope.value) : "") : "",
        submitted: value.start && value.end ? value.start + "/" + value.end : "",
        placeholder: props.placeholder ?? scope.value.messages.rangePlaceholder, onClear: () => commit({ start: "", end: "" }),
      }, () => <CalendarView range={draft.value} min={props.min} max={props.max} onSelect={(iso: string) => { draft.value = pickRange(draft.value, iso); }}
        onClear={() => { draft.value = { start: "", end: "" }; }} onApply={() => commit(draft.value)} />);
    };
  },
});

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
  /** Stretches the field to its container's width (default false: the field hugs the time). */
  block: { type: Boolean, default: false },
} as const;
export type KjunTimePickerProps = ExtractPublicPropTypes<typeof kjunTimePickerProps>;

/** One hour, minute or second segment with its own field identity, like React's per-segment FieldContext. */
const TimeSegment = defineComponent({
  name: "KjunTimeSegment",
  props: { segmentId: { type: String, required: true }, labelId: { type: String, required: true } },
  setup(props, { slots }) {
    const field = useKjunField();
    provide(kjunFieldKey, computed(() => ({ ...field.value, id: props.segmentId,
      labelId: field.value?.labelId ? `${field.value.labelId} ${props.labelId}` : undefined })));
    return () => slots.default?.();
  },
});

/** v-model ("HH:mm" or "HH:mm:ss"); `change` commits each choice. */
export const KjunTimePicker = defineComponent({
  name: "KjunTimePicker",
  props: kjunTimePickerProps,
  emits: { "update:modelValue": (_value: string | null) => true, change: (_value: string | null) => true },
  setup(props, { emit }) {
    const m = useKjunMessages();
    provide(kjunCompoundControlKey, computed(() => props.size));
    const root = ref<HTMLElement | null>(null);
    const field = useKjunField(), uid = useId().replace(/[^\w-]/g, "");
    const domain = computed(() => createTimeDomain({ precision: props.precision, min: props.min, max: props.max, minuteStep: props.minuteStep, secondStep: props.secondStep }));
    const valid = computed(() => domain.value.valid && domain.value.accepts(props.modelValue));
    watch(valid, ok => { if (!ok) console.warn("KJUN TimePicker: 시각 범위·간격·값을 확인하세요."); }, { immediate: true });
    const change = (next: string | null) => {
      if (valid.value && !props.disabled && next !== props.modelValue) { emit("update:modelValue", next); emit("change", next); }
    };
    return () => {
      const owner = field.value, fieldId = owner?.id || `kjun-time-${uid}`;
      const value = props.modelValue, time = value === null ? null : domain.value.parse(value);
      const blocked = props.disabled || !valid.value;
      return (
        <div ref={root} class="kjun-time-picker" data-size={props.size} data-block={props.block ? "true" : undefined} data-error={String(props.error || !!owner?.error)} data-disabled={String(blocked)}
          role="group" aria-label={(props.ariaLabel ?? m.value.time)} aria-labelledby={owner?.labelId} aria-describedby={owner?.describedBy}>
          <div class="kjun-time-segments">
            {[m.value.hour, m.value.minute, m.value.second].slice(0, props.precision === "second" ? 3 : 2).flatMap((label, index) => {
              const segmentId = index === 0 ? fieldId : `${fieldId}-${index}`, labelId = `${fieldId}-segment-${index}`;
              return [
                index > 0 && <span key={"sep" + index} class="kjun-time-separator" aria-hidden="true">:</span>,
                <TimeSegment key={label} segmentId={segmentId} labelId={labelId}>
                  <div class="kjun-time-segment">
                    <span id={labelId} class="kjun-sr-only" aria-hidden="true">{label}</span>
                    <KjunSelect modelValue={time === null ? null : domain.value.part(time, index)}
                      options={domain.value.options(value, index).map(n => ({ value: n, label: String(n).padStart(2, "0") }))}
                      onUpdate:modelValue={next => { if (typeof next === "number") change(domain.value.select(value, index, next)); }}
                      ariaLabel={(props.ariaLabel ?? m.value.time) + " " + label} placeholder={m.value.timePlaceholder} disabled={blocked} error={props.error} size={props.size}
                      clearable={false} searchable={false} />
                  </div>
                </TimeSegment>,
              ];
            })}
          </div>
          {props.clearable && value !== null && !blocked
            ? <KjunButton class="kjun-time-clear" size={props.size} variant="ghost" prefixIcon="x" ariaLabel={m.value.clearValue((props.ariaLabel ?? m.value.time))}
                onClick={() => { change(null); root.value?.querySelector<HTMLButtonElement>(".kjun-select-trigger")?.focus(); }} />
            : <span class="kjun-time-icon" aria-hidden="true"><KjunIcon name="clock" size={tokens.input[props.size].iconSize} /></span>}
        </div>
      );
    };
  },
});
