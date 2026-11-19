import { useKjunMessages } from "./runtime/messages";
import { computed, onBeforeUnmount, ref, watch, type ExtractPublicPropTypes, type PropType } from "vue";
import { defineComponent } from "./runtime/component";
import { createNumberDomain, quantityKeyAction, tokens, type InputSize } from "@kjun-ui/tokens";
import { componentIcons } from "../../../shared/package-runtime/component-icons";
import { KjunButton } from "./button";
import { useKjunField } from "./input";
import { provideFallbackIcons } from "./runtime/icons";
import { css } from "./runtime/style";
import { numberKeyboard } from "../../../shared/package-runtime/number-input";
import { createPressRepeat, type PressRepeat } from "../../../shared/package-runtime/press-repeat";

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
  /** Submits the value with a surrounding form under this name (a hidden input); not sent while disabled. */
  name: { type: String, default: undefined },
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
    // Only a broken setup (range, step, precision) or a value the precision cannot hold locks the field. A value outside the
    // range (stock fell under the cart quantity) stays editable and shows as invalid; a step or a commit brings it back in range.
    const usable = computed(() => domain.value.fits(props.modelValue));
    const blocked = computed(() => props.disabled || !usable.value);
    const outside = computed(() => usable.value && !domain.value.inRange(props.modelValue));
    const draft = ref(String(props.modelValue));
    let composing = false, dirty = false, accepted = props.modelValue;
    watch(() => [props.modelValue, props.precision, props.min, props.max, props.step], () => {
      draft.value = String(props.modelValue); accepted = props.modelValue; dirty = false;
    });
    watch(usable, ok => { if (!ok) console.warn("KJUN QuantityStepper: 범위·step·정밀도·값을 확인하세요."); }, { immediate: true });
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
    // Returns whether the value moved, so a held button stops at the end of the range.
    const move = (direction: number) => {
      if (blocked.value) return false;
      const next = domain.value.move(accepted, direction);
      settle(next);
      return next !== accepted;
    };
    const repeat = (direction: number) => createPressRepeat(() => move(direction), tokens.extensions.compound.repeatDelay, tokens.extensions.compound.repeatInterval);
    const decrease = repeat(-1), increase = repeat(1);
    onBeforeUnmount(() => { decrease.stop(); increase.stop(); });
    const key = (event: KeyboardEvent) => {
      if (blocked.value) return;
      const action = quantityKeyAction(event, composing, dirty);
      if (!action) return;
      event.preventDefault();
      if (action === "cancel") { event.stopPropagation(); dirty = false; draft.value = String(accepted); }
      else if (action === "commit") commit();
      else move(action === "increment" ? 1 : -1);
    };
    // Pressing a step button keeps focus in the input; holding it repeats the step.
    const stepper = (held: PressRepeat, direction: number) => ({
      onMousedown: (event: MouseEvent) => event.preventDefault(),
      onPointerdown: (event: PointerEvent) => { if (event.button === 0) held.start((event.currentTarget as Element).ownerDocument.defaultView ?? undefined); },
      onClick: () => { if (!held.takeRepeated()) move(direction); },
    });
    return () => {
      const size = props.size, owner = field.value, invalid = props.error || !!owner?.error || outside.value;
      const buttonStyle = css({ width: tokens.input[size].height, padding: 0 });
      return (
        <div class="kjun-quantity" data-size={size} data-block={String(props.block)} data-error={String(invalid)}>
          <KjunButton size={size} style={buttonStyle} variant="ghost" ariaLabel={m.value.decreaseQuantity} disabled={blocked.value || props.modelValue <= props.min}
            {...stepper(decrease, -1)} prefixIcon="minus" />
          <input class="kjun-input" id={props.id || owner?.id} type="text" inputmode={numberKeyboard({ allowNegative: props.min < 0, decimals: props.precision }).inputMode} role="spinbutton"
            aria-label={props.ariaLabel || (owner?.labelId ? undefined : m.value.quantity)} aria-labelledby={props.ariaLabel ? undefined : owner?.labelId}
            aria-describedby={owner?.describedBy} aria-invalid={invalid ? "true" : undefined}
            aria-valuemin={props.min} aria-valuemax={props.max} aria-valuenow={props.modelValue} value={draft.value} disabled={blocked.value}
            onInput={(event: Event) => { dirty = true; draft.value = (event.target as HTMLInputElement).value; }} onBlur={commit}
            onCompositionstart={() => { composing = true; }}
            onCompositionend={(event: CompositionEvent) => { composing = false; dirty = true; draft.value = (event.currentTarget as HTMLInputElement).value; }}
            onKeydown={key} aria-required={owner?.required ? "true" : undefined} />
          <KjunButton size={size} style={buttonStyle} variant="ghost" ariaLabel={m.value.increaseQuantity}
            disabled={blocked.value || (props.max !== undefined && props.modelValue >= props.max)}
            {...stepper(increase, 1)} prefixIcon="plus" />
          {props.name && <input type="hidden" name={props.name} value={String(props.modelValue)} disabled={props.disabled} />}
        </div>
      );
    };
  },
});
