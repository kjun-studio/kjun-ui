import { useKjunMessages } from "./runtime/messages";
import { mergeIds } from "../../../shared/package-runtime/aria-ids";
import { inputEdge, type InputVariant } from "../../../shared/package-runtime/input-variant";
import { inputCount, inputReveal, inputShowsClear } from "../../../shared/package-runtime/input-field";
import { computed, inject, mergeProps, onBeforeUnmount, onMounted, provide, reactive, ref, useId, watch,
  type ExtractPublicPropTypes, type InjectionKey, type PropType, type SlotsType, type VNodeChild } from "vue";
import { defineComponent } from "./runtime/component";
import { tokens, type InputSize, isComposingKey } from "@kjun-ui/tokens";
import { KjunButton, KjunIcon } from "./button";
import { css } from "./runtime/style";

export interface FieldContextValue {
  id: string;
  labelId?: string;
  describedBy?: string;
  error?: string;
  required?: boolean;
  /** A control with its own id registers it so the group label points at it. */
  setControlId?: (id: string | undefined) => void;
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
  /** Marks the field as optional with the "(선택)" / "(optional)" message; required wins when both are set. */
  optional: { type: Boolean, default: false },
  error: { type: String, default: "" },
  hint: { type: String, default: "" },
  /** Hides the label visually while it still names the field. */
  labelHidden: { type: Boolean, default: false },
} as const;
export type KjunFormGroupProps = ExtractPublicPropTypes<typeof kjunFormGroupProps>;
export const KjunFormGroup = defineComponent({
  name: "KjunFormGroup",
  props: kjunFormGroupProps,
  slots: Object as SlotsType<{ default?: () => VNodeChild }>,
  setup(props, { slots }) {
    const m = useKjunMessages();
    const uid = useKjunId("kjun-field-");
    const controlId = ref<string>();
    const setControlId = (value: string | undefined) => { controlId.value = value; };
    const field = computed<FieldContextValue>(() => {
      const id = props.id || uid;
      return {
        id, labelId: props.label ? id + "-label" : undefined,
        // An error takes the hint's slot instead of stacking under it, so the field keeps its height; the control is
        // then described by the error alone.
        describedBy: mergeIds(props.hint && !props.error ? id + "-hint" : undefined, props.error ? id + "-error" : undefined),
        error: props.error, required: props.required, setControlId,
      };
    });
    provide(kjunFieldKey, field);
    return () => {
      const { id, labelId } = field.value;
      return (
        <div class="kjun-form-group">
          {props.label && (
            <label class={"kjun-form-label" + (props.labelHidden ? " kjun-sr-only" : "")} id={labelId} for={controlId.value || id}>
              {props.label}
              {props.required && <span style={{ color: "var(--_kjun-color-danger)" }}> *</span>}
              {props.optional && !props.required && <span class="kjun-form-optional"> {m.value.optional}</span>}
            </label>
          )}
          {slots.default?.()}
          {props.hint && !props.error && <p id={id + "-hint"} class="kjun-form-hint">{props.hint}</p>}
          {props.error && (
            // Text only, like Input's errorMessage: the danger colour and the field border carry the state.
            <p id={id + "-error"} class="kjun-form-error" role="alert">
              {props.error}
            </p>
          )}
        </div>
      );
    };
  },
});

const kjunInputProps = {
  /** null displays an empty field without updating the parent value. */
  modelValue: { type: [String, Number] as PropType<string | number | null>, default: "" },
  size: { type: String as PropType<InputSize>, default: "md" },
  /** "plain" drops the surface, side border and side inset for text edited in place, such as a document title or a note body. */
  variant: { type: String as PropType<InputVariant>, default: "default" },
  error: { type: Boolean, default: false },
  errorMessage: { type: String, default: "" },
  clearable: { type: Boolean, default: false },
  /** With type="password", a 보기/숨기기 button at the end shows the typed password as text and hides it again. */
  revealable: { type: Boolean, default: false },
  /** Shows the character count at the end of the field, as "length/maxLength" when maxlength is set; a longer value reads as an error. */
  showCount: { type: Boolean, default: false },
  /** Character limit (UTF-16 units, like the attribute), as on KjunTextarea; with showCount the count reads "length/maxLength". */
  maxLength: { type: Number, default: undefined },
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
const KjunInputComponent = defineComponent({
  name: "KjunInput",
  inheritAttrs: false,
  props: kjunInputProps,
  emits: { "update:modelValue": (_value: string) => true, clear: () => true, enter: () => true },
  slots: Object as SlotsType<{
    prefix?: () => VNodeChild;
    suffix?: () => VNodeChild;
  }>,
  setup(props, { attrs, slots, emit, expose }) {
    const m = useKjunMessages();
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
    // One observer follows the affix elements as their content changes; it reconnects only when an affix comes or goes.
    let observer: ResizeObserver | undefined;
    const observe = () => {
      observer?.disconnect();
      measure();
      if (typeof ResizeObserver === "undefined") return;
      observer = new ResizeObserver(measure);
      if (before.value) observer.observe(before.value);
      if (after.value) observer.observe(after.value);
    };
    onMounted(() => watch([before, after], observe, { immediate: true, flush: "post" }));
    onBeforeUnmount(() => observer?.disconnect());
    const revealed = ref(false);
    expose({ focus: () => input.value?.focus(), el: input });
    return () => {
      const spec = tokens.input[props.size], edge = inputEdge(props.variant, spec.padding);
      const owner = field.value;
      const showError = !!props.errorMessage && !owner?.error;
      const invalid = !!(props.error || props.errorMessage || owner?.error);
      const ownErrorId = "kjun-input-error-" + uid;
      // A plain maxlength attribute counts too, so existing templates keep working.
      const limit = props.maxLength ?? (attrs.maxlength as number | string | undefined);
      const maxLength = limit == null ? undefined : Number(limit);
      const count = inputCount(props.modelValue, maxLength);
      const countId = "kjun-input-count-" + uid, controlId = props.id || owner?.id;
      const describedBy = mergeIds(attrs["aria-describedby"] as string | undefined, owner?.describedBy, showError ? ownErrorId : undefined, props.showCount ? countId : undefined);
      const prefix = slots.prefix?.() ?? props.prefix, suffix = slots.suffix?.() ?? props.suffix;
      const reveal = inputReveal(attrs.type as string | undefined, props.revealable, revealed.value);
      const showClear = inputShowsClear({ clearable: props.clearable, value: props.modelValue, disabled: props.disabled, readOnly: props.readOnly });
      const invalidAll = invalid || count.over;
      return (
        <div style={{ minWidth: 0 }}>
          <div class="kjun-input-wrap" data-disabled={props.disabled || undefined}>
            {(prefix || props.prefixIcon) && (
              <span ref={before} class="kjun-input-affix" style={css({ left: edge.padding, pointerEvents: "none" })}>
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
              id={controlId}
              type={reveal.type}
              maxlength={maxLength}
              value={props.modelValue ?? ""}
              disabled={props.disabled}
              readonly={props.readOnly}
              required={props.required ?? owner?.required}
              class={["kjun-input", attrs.class]}
              data-variant={props.variant === "plain" ? "plain" : undefined}
              aria-invalid={invalidAll ? "true" : undefined}
              aria-label={props.ariaLabel || (attrs["aria-label"] as string | undefined)}
              aria-labelledby={(attrs["aria-labelledby"] as string | undefined) || owner?.labelId}
              aria-describedby={describedBy}
              style={[css({
                height: spec.height,
                fontSize: spec.fontSize / 16 + "rem",
                lineHeight: spec.lineHeight / 16 + "rem",
                borderRadius: spec.radius,
                paddingLeft: widths.before ? edge.padding + widths.before + spec.affixGap - edge.border : edge.padding - edge.border,
                paddingRight: widths.after ? edge.padding + widths.after + spec.affixGap - edge.border : edge.padding - edge.border,
                "--_kjun-placeholder-size": spec.placeholderSize / 16 + "rem",
              }), attrs.style as never]}
            />
            {(suffix || props.suffixIcon || showClear || props.showCount || reveal.active) && (
              <span ref={after} class="kjun-input-affix" style={css({ right: edge.padding })}>
                {props.showCount && <span id={countId} class="kjun-input-count" data-over={count.over || undefined}>{count.text}</span>}
                {/* Near the limit, what is left is announced as it changes; the count itself is read only on focus. */}
                {props.showCount && <span class="kjun-sr-only" aria-live="polite">{count.remaining == null ? "" : m.value.charactersLeft(count.remaining)}</span>}
                {showClear && (
                  <KjunButton variant="ghost" size="sm" ariaLabel={m.value.clearInput}
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
                {reveal.active && (
                  <KjunButton variant="ghost" size="sm" class="kjun-input-reveal" aria-controls={controlId} disabled={props.disabled}
                    ariaLabel={revealed.value ? m.value.concealPasswordLabel : m.value.revealPasswordLabel}
                    style={css({ height: spec.clearSize, minHeight: spec.clearSize, paddingInline: tokens.space.inline.sm })}
                    onClick={() => { revealed.value = !revealed.value; }}>
                    {{ default: () => (
                      // Both words share one cell, so the button keeps the wider word's width as it toggles.
                      <span class="kjun-input-reveal-label" aria-hidden="true">
                        <span data-hidden={revealed.value || undefined}>{m.value.revealPassword}</span>
                        <span data-hidden={!revealed.value || undefined}>{m.value.concealPassword}</span>
                      </span>
                    ) }}
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

// setup's render-function return does not infer expose(); Vue unwraps el on template refs.
export const KjunInput = KjunInputComponent as typeof KjunInputComponent & {
  new(): InstanceType<typeof KjunInputComponent> & { focus(): void; el: HTMLInputElement | null };
};

/** Hides the enclosing FormGroup from popup content, like React's FieldContext.Provider value={null}. */
export const KjunFieldReset = defineComponent({
  name: "KjunFieldReset",
  slots: Object as SlotsType<{ default?: () => VNodeChild }>,
  setup(_, { slots }) {
    provide(kjunFieldKey, { value: null });
    return () => slots.default?.();
  },
});
