import { useKjunMessages } from "./runtime/messages";
import { computed, defineComponent, ref, watch, type ExtractPublicPropTypes, type InjectionKey, type PropType, type Ref } from "vue";
import { createNumberDomain, quantityKeyAction, tokens, type InputSize } from "@kjun-ui/tokens";
import { componentIcons } from "../../../shared/package-runtime/component-icons";
import { KjunButton } from "./button";
import { useKjunField } from "./input";
import { provideFallbackIcons } from "./runtime/icons";
import { css } from "./runtime/style";

// Only a composed control's trigger consumes this; popup content keeps its own sizes.
export const kjunCompoundControlKey: InjectionKey<Readonly<Ref<InputSize | null>>> = Symbol("kjunCompoundControl");

const kjunQuantityStepperProps = {
  modelValue: { type: Number, required: true },
  min: { type: Number, default: 0 },
  max: { type: Number, default: undefined },
  step: { type: Number, default: 1 },
  precision: { type: Number, default: 0 },
  disabled: { type: Boolean, default: false },
  error: { type: Boolean, default: false },
  size: { type: String as PropType<InputSize>, default: "md" },
  block: { type: Boolean, default: false },
  id: { type: String, default: undefined },
  ariaLabel: { type: String, default: undefined },
} as const;
export type KjunQuantityStepperProps = ExtractPublicPropTypes<typeof kjunQuantityStepperProps>;
/** v-model; `change` commits each accepted value; `invalid-input` reports an unparsable draft. */
export const KjunQuantityStepper = defineComponent({
  name: "KjunQuantityStepper",
  props: kjunQuantityStepperProps,
  emits: { "update:modelValue": (_value: number) => true, change: (_value: number) => true, "invalid-input": (_draft: string) => true },
  setup(props, { emit }) {
    const m = useKjunMessages();
    provideFallbackIcons(componentIcons);
    const field = useKjunField();
    const domain = computed(() => createNumberDomain({ min: props.min, max: props.max, step: props.step, precision: props.precision }));
    const valid = computed(() => domain.value.valid && domain.value.accepts(props.modelValue));
    const blocked = computed(() => props.disabled || !valid.value);
    const draft = ref(String(props.modelValue));
    let composing = false, dirty = false, accepted = props.modelValue;
    watch(() => [props.modelValue, props.precision, props.min, props.max, props.step], () => {
      draft.value = String(props.modelValue); accepted = props.modelValue; dirty = false;
    });
    watch(valid, ok => { if (!ok) console.warn("KJUN QuantityStepper: 범위·step·정밀도·값을 확인하세요."); }, { immediate: true });
    const settle = (next: number) => {
      draft.value = String(props.modelValue); dirty = false;
      if (next === accepted) return;
      emit("update:modelValue", next); emit("change", next);
    };
    const commit = () => {
      if (blocked.value || composing || !dirty) return;
      const next = domain.value.fromDraft(draft.value);
      if (next === null) { emit("invalid-input", draft.value); draft.value = String(accepted); dirty = false; }
      else settle(next);
    };
    const move = (direction: number) => { if (!blocked.value) settle(domain.value.move(accepted, direction)); };
    const key = (event: KeyboardEvent) => {
      if (blocked.value) return;
      const action = quantityKeyAction(event, composing, dirty);
      if (!action) return;
      event.preventDefault();
      if (action === "cancel") { event.stopPropagation(); dirty = false; draft.value = String(accepted); }
      else if (action === "commit") commit();
      else move(action === "increment" ? 1 : -1);
    };
    // Pressing a step button keeps focus in the input.
    const keepFocus = { onMousedown: (event: MouseEvent) => event.preventDefault() };
    return () => {
      const size = props.size, owner = field.value;
      const buttonStyle = css({ width: tokens.input[size].height, padding: 0 });
      return (
        <div class="kjun-quantity" data-size={size} data-block={String(props.block)} data-error={String(props.error || !!owner?.error)}>
          <KjunButton size={size} style={buttonStyle} variant="ghost" ariaLabel={m.value.decreaseQuantity} disabled={blocked.value || props.modelValue <= props.min}
            {...keepFocus} onClick={() => move(-1)} prefixIcon="minus" />
          <input class="kjun-input" id={props.id || owner?.id} type="text" inputmode={props.precision ? "decimal" : "numeric"} role="spinbutton"
            aria-label={props.ariaLabel || (owner?.labelId ? undefined : m.value.quantity)} aria-labelledby={props.ariaLabel ? undefined : owner?.labelId}
            aria-describedby={owner?.describedBy} aria-invalid={props.error || !!owner?.error ? "true" : undefined}
            aria-valuemin={props.min} aria-valuemax={props.max} aria-valuenow={props.modelValue} value={draft.value} disabled={blocked.value}
            onInput={(event: Event) => { dirty = true; draft.value = (event.target as HTMLInputElement).value; }} onBlur={commit}
            onCompositionstart={() => { composing = true; }}
            onCompositionend={(event: CompositionEvent) => { composing = false; dirty = true; draft.value = (event.currentTarget as HTMLInputElement).value; }}
            onKeydown={key} aria-required={owner?.required ? "true" : undefined} />
          <KjunButton size={size} style={buttonStyle} variant="ghost" ariaLabel={m.value.increaseQuantity}
            disabled={blocked.value || (props.max !== undefined && props.modelValue >= props.max)}
            {...keepFocus} onClick={() => move(1)} prefixIcon="plus" />
        </div>
      );
    };
  },
});
