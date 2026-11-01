import { useKjunMessageScope } from "./runtime/messages";
import { dateLabel, formatRange, normalizeRange, pickRange, rangeSpoken, rangeSubmitted, type DateRange } from "../../../shared/package-runtime/calendar";
import { CalendarView, calendarOptionProps, type DateRangePreset } from "./calendar";
import { FloatingPanel } from "./floating-panel";
import { formatDateValue } from "../../../shared/package-runtime/messages";
import { computed, defineComponent, ref, useId, watch, type ExtractPublicPropTypes, type PropType, type Ref, type VNode, cloneVNode } from "vue";
import { tokens, type InputSize } from "@kjun-ui/tokens";
import { inputTypeStyle } from "../../../shared/package-runtime/typography";
import { KjunButton, KjunIcon } from "./button";
import { useKjunField } from "./input";
import { css } from "./runtime/style";

const dateFieldProps = {
  ...calendarOptionProps,
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
  // Each opening draws a fresh calendar on the current value; the panel keeps it through its closing motion.
  const opens = ref(0);
  watch(open, value => { if (value) opens.value++; });
  return (state: { text: string; spoken: string; submitted: string; placeholder: string; clearLabel: string; onClear: () => void }, calendar: () => VNode) => {
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
            <KjunButton size="sm" variant="ghost" ariaLabel={state.clearLabel} class="kjun-select-clear"
              style={css({ padding: 0, right: spec.padding + spec.iconSize + spec.affixGap, width: spec.clearSize, height: spec.clearSize, minHeight: spec.clearSize, borderRadius: "50%" })}
              onClick={() => { state.onClear(); trigger.value?.focus(); }}><KjunIcon name="x" size={spec.iconSize} /></KjunButton>
          )}
          {props.name && <input type="hidden" name={props.name} value={state.submitted} />}
        </div>
        <FloatingPanel field open={open.value && !props.disabled} onOpenChange={(next: boolean) => { open.value = next; }} trigger={() => trigger.value} placement="bottom-start" panelClass="kjun-calendar-panel"
          // A month of days with its footer is taller than a field list, so it takes the general popup height.
          maxHeight={tokens.extensions.floating.maxHeight}>
          {cloneVNode(calendar(), { key: opens.value })}
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
      placeholder: props.placeholder ?? scope.value.messages.datePlaceholder, clearLabel: scope.value.messages.clearDate, onClear: () => commit(""),
    }, () => <CalendarView value={props.modelValue} min={props.min} max={props.max} clearable={props.clearable} weekStart={props.weekStart} markSunday={props.markSunday}
      isDateUnavailable={props.isDateUnavailable} onSelect={commit} onClear={() => commit("")} />);
  },
});

const kjunDateRangePickerProps = {
  ...dateFieldProps,
  /** Start and end as YYYY-MM-DD; empty strings while unset. A reversed or out-of-bounds range is shown in order and inside the bounds. */
  modelValue: { type: Object as PropType<DateRange>, default: () => ({ start: "", end: "" }) },
  /** Ready-made ranges shown as chips above the days, such as "최근 7일". */
  presets: { type: Array as PropType<readonly DateRangePreset[]>, default: undefined },
  /** Commits as soon as the second day is picked, without Apply. */
  autoApply: { type: Boolean, default: false },
} as const;
export type KjunDateRangePickerProps = ExtractPublicPropTypes<typeof kjunDateRangePickerProps>;
/** v-model holds { start, end }: the first pick starts the range, the second ends it, and Apply commits it. */
export const KjunDateRangePicker = defineComponent({
  name: "KjunDateRangePicker",
  props: kjunDateRangePickerProps,
  emits: { "update:modelValue": (_value: DateRange) => true, change: (_value: DateRange) => true },
  setup(props, { emit }) {
    const scope = useKjunMessageScope();
    const value = computed(() => normalizeRange(props.modelValue, props.min, props.max));
    const open = ref(false), draft = ref<DateRange>({ ...value.value });
    watch(open, next => { if (next) draft.value = { ...value.value }; });
    const render = useDateField(props, open);
    const commit = (next: DateRange) => {
      if (next.start !== value.value.start || next.end !== value.value.end) { emit("update:modelValue", next); emit("change", next); }
      open.value = false;
    };
    const pick = (iso: string) => {
      draft.value = pickRange(draft.value, iso, props.isDateUnavailable);
      if (props.autoApply && draft.value.end) commit(draft.value);
    };
    return () => {
      const format = (iso: string) => formatDateValue(iso, scope.value);
      return render({
        text: formatRange(value.value, format), spoken: rangeSpoken(value.value, scope.value), submitted: rangeSubmitted(value.value),
        placeholder: props.placeholder ?? scope.value.messages.rangePlaceholder, clearLabel: scope.value.messages.clearDates,
        onClear: () => commit({ start: "", end: "" }),
      }, () => <CalendarView range={draft.value} min={props.min} max={props.max} clearable={props.clearable} weekStart={props.weekStart} markSunday={props.markSunday}
        isDateUnavailable={props.isDateUnavailable} presets={props.presets}
        onPreset={(next: DateRange) => { draft.value = normalizeRange(next, props.min, props.max); if (props.autoApply) commit(draft.value); }}
        onSelect={pick} onClear={() => { draft.value = { start: "", end: "" }; }} onApply={props.autoApply ? undefined : () => commit(draft.value)} />);
    };
  },
});
export type { DateRange, DateRangePreset };
