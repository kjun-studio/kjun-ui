import { useKjunMessageScope } from "./runtime/messages";
import { periodLeads, timeSegments, type HourCycle } from "../../../shared/package-runtime/time-segments";
import { warnPicker } from "../../../shared/package-runtime/calendar";
import { computed, defineComponent, provide, ref, useId, watch, type ExtractPublicPropTypes, type PropType } from "vue";
import { createTimeDomain, tokens, type InputSize, type TimePrecision } from "@kjun-ui/tokens";
import { KjunButton, KjunIcon } from "./button";
import { kjunFieldKey, useKjunField } from "./input";
import { kjunCompoundControlKey } from "./quantity-stepper";
import { KjunSelect } from "./select-control";

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
  /** 24 (default) shows 00–23; 12 adds an AM/PM segment and shows 1–12. The value stays "HH:mm". */
  hourCycle: { type: Number as PropType<HourCycle>, default: 24 },
  /** Shows the time without changing it. */
  readOnly: { type: Boolean, default: false },
  /** Submits the value with a form through a hidden input. */
  name: { type: String, default: undefined },
  /** Stretches the field to its container's width (default false: the field hugs the time). */
  block: { type: Boolean, default: false },
} as const;
export type KjunTimePickerProps = ExtractPublicPropTypes<typeof kjunTimePickerProps>;

/** One segment with its own field identity, like React's per-segment FieldContext. */
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
    const scope = useKjunMessageScope();
    provide(kjunCompoundControlKey, computed(() => props.size));
    const root = ref<HTMLElement | null>(null);
    const field = useKjunField(), uid = useId().replace(/[^\w-]/g, "");
    const domain = computed(() => createTimeDomain({ precision: props.precision, min: props.min, max: props.max, minuteStep: props.minuteStep, secondStep: props.secondStep }));
    // Only a broken domain locks the field; a value off the step or bounds stays editable and snaps on the next choice.
    watch([domain, () => props.modelValue], () => {
      if (!domain.value.valid) warnPicker("TimePicker: check min, max, minuteStep and secondStep.");
      else if (!domain.value.accepts(props.modelValue)) warnPicker(`TimePicker: ${props.modelValue} is outside the step or bounds.`);
    }, { immediate: true });
    const blocked = computed(() => props.disabled || !domain.value.valid);
    const change = (next: string | null) => {
      if (!blocked.value && !props.readOnly && next !== props.modelValue) { emit("update:modelValue", next); emit("change", next); }
    };
    return () => {
      const m = scope.value.messages, owner = field.value, fieldId = owner?.id || `kjun-time-${uid}`, label = props.ariaLabel ?? m.time;
      const value = props.modelValue;
      const segments = timeSegments(domain.value, value, { precision: props.precision, hourCycle: props.hourCycle, messages: m, periodFirst: periodLeads(scope.value.language) });
      return (
        <div ref={root} class="kjun-time-picker" data-size={props.size} data-block={props.block ? "true" : undefined} data-error={String(props.error || !!owner?.error)}
          data-disabled={String(blocked.value)} data-readonly={props.readOnly ? "true" : undefined}
          role="group" aria-label={label} aria-labelledby={owner?.labelId} aria-describedby={owner?.describedBy}>
          <div class="kjun-time-segments">
            {segments.flatMap((segment, index) => {
              const segmentId = index === 0 ? fieldId : `${fieldId}-${index}`, labelId = `${fieldId}-segment-${index}`;
              // The AM/PM segment reads as a word, so it carries no ":" before or after it.
              const separated = index > 0 && segment.key !== "period" && segments[index - 1].key !== "period";
              return [
                separated && <span key={"sep" + index} class="kjun-time-separator" aria-hidden="true">:</span>,
                <TimeSegment key={segment.key} segmentId={segmentId} labelId={labelId}>
                  <div class="kjun-time-segment" data-period={segment.key === "period" || undefined}>
                    <span id={labelId} class="kjun-sr-only" aria-hidden="true">{segment.label}</span>
                    <KjunSelect modelValue={segment.value} options={segment.options}
                      onUpdate:modelValue={next => { if (typeof next === "number") change(segment.pick(next)); }}
                      ariaLabel={label + " " + segment.label} placeholder={m.timePlaceholder} disabled={blocked.value} readOnly={props.readOnly} error={props.error} size={props.size}
                      clearable={false} searchable={false} />
                  </div>
                </TimeSegment>,
              ];
            })}
          </div>
          {props.clearable && value !== null && !blocked.value && !props.readOnly
            ? <KjunButton class="kjun-time-clear" size={props.size} variant="ghost" prefixIcon="x" ariaLabel={m.clearValue(label)}
                onClick={() => { change(null); root.value?.querySelector<HTMLButtonElement>(".kjun-select-trigger")?.focus(); }} />
            : <span class="kjun-time-icon" aria-hidden="true"><KjunIcon name="clock" size={tokens.input[props.size].iconSize} /></span>}
          {props.name && <input type="hidden" name={props.name} value={value ?? ""} />}
        </div>
      );
    };
  },
});
