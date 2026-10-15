import { computed, defineComponent, inject, mergeProps, onBeforeUnmount, onMounted, onUpdated, provide, reactive, ref, useId,
  type ExtractPublicPropTypes, type InjectionKey, type PropType, type SlotsType, type VNodeChild } from "vue";
import { tokens, type InputSize, isComposingKey } from "@kjun-ui/tokens";
import { KjunButton, KjunIcon } from "./button";
import { css } from "./runtime/style";

export interface FieldContextValue {
  id: string;
  labelId?: string;
  describedBy?: string;
  error?: string;
  required?: boolean;
}
// Internal boundary for composite fields; index.ts exports only public controls.
export const kjunFieldKey: InjectionKey<Readonly<{ value: FieldContextValue | null }>> = Symbol("kjunField");
export const useKjunField = () => inject(kjunFieldKey, { value: null });
/** A Vue useId value without the characters that are awkward in id references. */
export const useKjunId = (prefix: string) => prefix + useId().replace(/[^\w-]/g, "");

// Some IMEs end composition before delivering the confirming Enter (keyCode 229).
export function useCompositionGuard() {
  let composing = false;
  return {
    onCompositionstart: () => { composing = true; },
    onCompositionend: () => { composing = false; },
    isComposing: (event: KeyboardEvent) => isComposingKey(event, composing),
  };
}

const kjunFormGroupProps = {
  label: { type: String, default: undefined },
  id: { type: String, default: undefined },
  required: { type: Boolean, default: false },
  error: { type: String, default: "" },
  hint: { type: String, default: "" },
} as const;
export type KjunFormGroupProps = ExtractPublicPropTypes<typeof kjunFormGroupProps>;
export const KjunFormGroup = defineComponent({
  name: "KjunFormGroup",
  props: kjunFormGroupProps,
  slots: Object as SlotsType<{ default?: () => VNodeChild }>,
  setup(props, { slots }) {
    const uid = useKjunId("kjun-field-");
    const field = computed<FieldContextValue>(() => {
      const id = props.id || uid;
      return {
        id, labelId: props.label ? id + "-label" : undefined,
        describedBy: props.error ? id + "-error" : props.hint ? id + "-hint" : undefined,
        error: props.error, required: props.required,
      };
    });
    provide(kjunFieldKey, field);
    return () => {
      const { id, labelId, describedBy } = field.value;
      return (
        <div class="kjun-form-group">
          {props.label && (
            <label class="kjun-form-label" id={labelId} for={id}>
              {props.label}
              {props.required && <span style={{ color: "var(--_kjun-color-danger)" }}> *</span>}
            </label>
          )}
          {slots.default?.()}
          {props.error ? (
            <p id={describedBy} class="kjun-form-error" role="alert">
              <KjunIcon name="alert-circle" size={tokens.extensions.form.messageIconSize} />
              {props.error}
            </p>
          ) : props.hint ? (
            <p id={describedBy} class="kjun-form-hint">{props.hint}</p>
          ) : null}
        </div>
      );
    };
  },
});

const kjunInputProps = {
  modelValue: { type: [String, Number] as PropType<string | number>, default: "" },
  size: { type: String as PropType<InputSize>, default: "md" },
  error: { type: Boolean, default: false },
  errorMessage: { type: String, default: "" },
  clearable: { type: Boolean, default: false },
  prefixIcon: { type: String, default: undefined },
  suffixIcon: { type: String, default: undefined },
  prefix: { type: String, default: undefined },
  suffix: { type: String, default: undefined },
  ariaLabel: { type: String, default: undefined },
  id: { type: String, default: undefined },
  disabled: { type: Boolean, default: false },
  readOnly: { type: Boolean, default: false },
  required: { type: Boolean, default: undefined },
} as const;
export type KjunInputProps = ExtractPublicPropTypes<typeof kjunInputProps>;
/** v-model; slots prefix and suffix override the matching props. Other attributes reach the <input>. */
export const KjunInput = defineComponent({
  name: "KjunInput",
  inheritAttrs: false,
  props: kjunInputProps,
  emits: { "update:modelValue": (_value: string) => true, clear: () => true, enter: () => true },
  slots: Object as SlotsType<{
    prefix?: () => VNodeChild;
    suffix?: () => VNodeChild;
  }>,
  setup(props, { attrs, slots, emit, expose }) {
    const field = useKjunField();
    const uid = useKjunId("kjun-");
    const input = ref<HTMLInputElement | null>(null);
    const before = ref<HTMLElement | null>(null), after = ref<HTMLElement | null>(null);
    const composition = useCompositionGuard();
    const widths = reactive({ before: 0, after: 0 });
    const measure = () => {
      const b = before.value?.getBoundingClientRect().width || 0, a = after.value?.getBoundingClientRect().width || 0;
      if (b !== widths.before) widths.before = b;
      if (a !== widths.after) widths.after = a;
    };
    let observer: ResizeObserver | undefined;
    const observe = () => {
      observer?.disconnect();
      observer = new ResizeObserver(measure);
      if (before.value) observer.observe(before.value);
      if (after.value) observer.observe(after.value);
      measure();
    };
    onMounted(observe);
    onUpdated(observe);
    onBeforeUnmount(() => observer?.disconnect());
    expose({ focus: () => input.value?.focus(), el: input });
    return () => {
      const spec = tokens.input[props.size];
      const owner = field.value;
      const showError = !!props.errorMessage && !owner?.error;
      const invalid = !!(props.error || props.errorMessage || owner?.error);
      const ownErrorId = "kjun-input-error-" + uid;
      const describedBy = [attrs["aria-describedby"], owner?.describedBy, showError ? ownErrorId : undefined].filter(Boolean).join(" ") || undefined;
      const prefix = slots.prefix?.() ?? props.prefix, suffix = slots.suffix?.() ?? props.suffix;
      return (
        <div style={{ minWidth: 0 }}>
          <div class="kjun-input-wrap" data-disabled={props.disabled || undefined}>
            {(prefix || props.prefixIcon) && (
              <span ref={before} class="kjun-input-affix" style={css({ left: spec.padding, pointerEvents: "none" })}>
                {prefix || <KjunIcon name={props.prefixIcon!} size={spec.iconSize} />}
              </span>
            )}
            <input
              {...mergeProps(attrs, {
                onInput: (event: Event) => emit("update:modelValue", (event.target as HTMLInputElement).value),
                onKeydown: (event: KeyboardEvent) => {
                  if (event.key === "Enter" && !event.defaultPrevented && !composition.isComposing(event)) emit("enter");
                },
                onCompositionstart: composition.onCompositionstart,
                onCompositionend: composition.onCompositionend,
              })}
              ref={input}
              id={props.id || owner?.id}
              value={props.modelValue}
              disabled={props.disabled}
              readonly={props.readOnly}
              required={props.required ?? owner?.required}
              class={["kjun-input", attrs.class]}
              aria-invalid={invalid ? "true" : undefined}
              aria-label={props.ariaLabel || (attrs["aria-label"] as string | undefined)}
              aria-labelledby={(attrs["aria-labelledby"] as string | undefined) || owner?.labelId}
              aria-describedby={describedBy}
              style={[css({
                height: spec.height,
                fontSize: spec.fontSize / 16 + "rem",
                lineHeight: spec.lineHeight / 16 + "rem",
                borderRadius: spec.radius,
                paddingLeft: widths.before ? spec.padding + widths.before + spec.affixGap - tokens.border.controlWidth : spec.padding - tokens.border.controlWidth,
                paddingRight: widths.after ? spec.padding + widths.after + spec.affixGap - tokens.border.controlWidth : spec.padding - tokens.border.controlWidth,
                "--_kjun-placeholder-size": spec.placeholderSize / 16 + "rem",
              }), attrs.style as never]}
            />
            {(suffix || props.suffixIcon || props.clearable) && (
              <span ref={after} class="kjun-input-affix" style={css({ right: spec.padding })}>
                {props.clearable && !!props.modelValue && (
                  <KjunButton variant="ghost" size="sm" ariaLabel="입력 지우기" disabled={props.disabled || props.readOnly}
                    style={css({ padding: 0, height: spec.clearSize, minHeight: spec.clearSize, width: spec.clearSize, borderRadius: "50%" })}
                    onClick={() => {
                      const el = input.value;
                      if (!el || props.disabled || props.readOnly) return;
                      // A native input event reaches v-model and the app's own input listeners alike.
                      el.value = "";
                      el.dispatchEvent(new Event("input", { bubbles: true }));
                      emit("clear");
                      el.focus();
                    }}>
                    {{ default: () => <KjunIcon name="x" size={spec.iconSize} /> }}
                  </KjunButton>
                )}
                {suffix || (props.suffixIcon && <KjunIcon name={props.suffixIcon} size={spec.iconSize} />)}
              </span>
            )}
          </div>
          {showError && <p class="kjun-form-error" id={ownErrorId} role="alert">{props.errorMessage}</p>}
        </div>
      );
    };
  },
});

/** Hides the enclosing FormGroup from popup content, like React's FieldContext.Provider value={null}. */
export const KjunFieldReset = defineComponent({
  name: "KjunFieldReset",
  slots: Object as SlotsType<{ default?: () => VNodeChild }>,
  setup(_, { slots }) {
    provide(kjunFieldKey, { value: null });
    return () => slots.default?.();
  },
});
