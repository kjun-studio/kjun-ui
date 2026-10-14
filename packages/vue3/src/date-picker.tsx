import { computed, defineComponent, provide, ref, useId, watch, type ExtractPublicPropTypes, type PropType } from "vue";
import { createTimeDomain, tokens, type InputSize, type TimePrecision } from "@kjun-ui/tokens";
import { inputTypeStyle } from "../../../shared/package-runtime/typography";
import { KjunButton } from "./button";
import { KjunInput, kjunFieldKey, useKjunField } from "./input";
import { kjunCompoundControlKey } from "./quantity-stepper";
import { KjunSelect } from "./select-control";
import { css } from "./runtime/style";

const kjunDatePickerProps = {
  modelValue: { type: String, default: "" },
  size: { type: String as PropType<InputSize>, default: "md" },
  placeholder: { type: String, default: "날짜 선택" },
  ariaLabel: { type: String, default: undefined },
  error: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  readOnly: { type: Boolean, default: false },
} as const;
export type KjunDatePickerProps = ExtractPublicPropTypes<typeof kjunDatePickerProps>;
/** v-model holds YYYY-MM-DD; other attributes reach the date <input>. */
export const KjunDatePicker = defineComponent({
  name: "KjunDatePicker",
  inheritAttrs: false,
  props: kjunDatePickerProps,
  emits: { "update:modelValue": (_value: string) => true },
  setup(props, { attrs, emit }) {
    const focused = ref(false);
    return () => {
      const spec = tokens.input[props.size];
      return (
        // The drawn calendar icon matches Native; the transparent browser indicator sits on top of it
        // (sized by these variables) so clicking the icon still opens the browser picker.
        <div class="kjun-date-picker" style={{ position: "relative", "--_kjun-date-icon-inset": spec.padding + "px", "--_kjun-date-icon-size": spec.iconSize + "px" }}>
          <KjunInput {...attrs} modelValue={props.modelValue} size={props.size} suffixIcon="calendar" ariaLabel={props.ariaLabel || props.placeholder}
            error={props.error} disabled={props.disabled} readOnly={props.readOnly} class={!focused.value ? "kjun-date-masked" : ""}
            {...{
              type: "date",
              "onUpdate:modelValue": (value: string) => emit("update:modelValue", value),
              onFocus: () => { focused.value = true; },
              onBlur: () => { focused.value = false; },
            }} />
          {!focused.value && (
            <span aria-hidden="true" class="kjun-date-overlay" style={css({
              left: spec.padding, right: spec.padding + spec.iconSize + spec.affixGap, ...inputTypeStyle(props.size),
              color: props.disabled ? "var(--_kjun-color-text-disabled)" : props.readOnly ? "var(--_kjun-color-text-secondary)"
                : props.modelValue ? "var(--_kjun-color-text)" : "var(--_kjun-color-input-placeholder)",
            })}>
              {props.modelValue ? props.modelValue.replace(/-/g, ". ") + "." : props.placeholder}
            </span>
          )}
        </div>
      );
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
  ariaLabel: { type: String, default: "시간" },
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
        <div ref={root} class="kjun-time-picker" data-size={props.size} data-error={String(props.error || !!owner?.error)} data-disabled={String(blocked)}
          role="group" aria-label={props.ariaLabel} aria-labelledby={owner?.labelId} aria-describedby={owner?.describedBy}>
          <div class="kjun-time-segments">
            {["시", "분", "초"].slice(0, props.precision === "second" ? 3 : 2).flatMap((label, index) => {
              const segmentId = index === 0 ? fieldId : `${fieldId}-${index}`, labelId = `${fieldId}-segment-${index}`;
              return [
                index > 0 && <span key={"sep" + index} class="kjun-time-separator" aria-hidden="true">:</span>,
                <TimeSegment key={label} segmentId={segmentId} labelId={labelId}>
                  <div class="kjun-time-segment">
                    <span id={labelId} class="kjun-sr-only" aria-hidden="true">{label}</span>
                    <KjunSelect modelValue={time === null ? null : domain.value.part(time, index)}
                      options={domain.value.options(value, index).map(n => ({ value: n, label: String(n).padStart(2, "0") }))}
                      onUpdate:modelValue={next => { if (typeof next === "number") change(domain.value.select(value, index, next)); }}
                      ariaLabel={props.ariaLabel + " " + label} placeholder={label} disabled={blocked} error={props.error} size={props.size}
                      clearable={false} searchable={false} />
                  </div>
                </TimeSegment>,
              ];
            })}
          </div>
          {props.clearable && value !== null && (
            <KjunButton class="kjun-time-clear" size={props.size} variant="ghost" prefixIcon="x" ariaLabel={props.ariaLabel + " 지우기"} disabled={blocked}
              onClick={() => { change(null); root.value?.querySelector<HTMLButtonElement>(".kjun-select-trigger")?.focus(); }} />
          )}
        </div>
      );
    };
  },
});
