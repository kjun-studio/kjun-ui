import { mergeIds } from "../../../shared/package-runtime/aria-ids";
import { computed, defineComponent, inject, mergeProps, onBeforeUnmount, onMounted, onUpdated, provide, ref,
  type ExtractPublicPropTypes, type InjectionKey, type PropType, type SlotsType, type VNodeChild } from "vue";
import { tokens, type ButtonSize, type InputSize } from "@kjun-ui/tokens";
import { selectionTypeStyle, typeStyle } from "../../../shared/package-runtime/typography";
import { selectionIndicator } from "../../../shared/package-runtime/selection-indicator";
import { groupKeydown } from "../../../shared/package-runtime/group-keyboard";
import { KjunIcon } from "./button";
import { useKjunField, useKjunId } from "./input";
import { useFocusVisible } from "./runtime/focus-visible";
import { css } from "./runtime/style";

export type ChoiceValue = string | number | boolean | null;
export interface ChoiceOption<T = ChoiceValue> { value: T; label: string; disabled?: boolean; icon?: string; dot?: string }
const choiceClass = (disabled: boolean) => "kjun-choice" + (disabled ? " kjun-choice--disabled" : "");
const choiceLabel = (label: string | undefined, slot: (() => unknown) | undefined) => {
  const content = slot ? slot() : label;
  return (Array.isArray(content) ? content.length > 0 : !!content) && <span class="kjun-choice-label">{content}</span>;
};

const kjunCheckboxProps = {
  modelValue: { type: [Boolean, Array] as PropType<boolean | ChoiceValue[]>, default: false },
  val: { type: [String, Number, Boolean, null] as PropType<ChoiceValue>, default: undefined },
  label: { type: String, default: undefined },
  ariaLabel: { type: String, default: undefined },
  disabled: { type: Boolean, default: false },
  size: { type: String as PropType<InputSize>, default: "md" },
} as const;
export type KjunCheckboxProps = ExtractPublicPropTypes<typeof kjunCheckboxProps>;
/** v-model is a boolean, or an array of selected `val`s for a checkbox list. Default slot: label. */
export const KjunCheckbox = defineComponent({
  name: "KjunCheckbox",
  props: kjunCheckboxProps,
  emits: { "update:modelValue": (_value: boolean | ChoiceValue[]) => true, change: (_value: boolean | ChoiceValue[]) => true },
  slots: Object as SlotsType<{ default?: () => VNodeChild }>,
  setup(props, { slots, emit }) {
    const field = useKjunField();
    const focus = useFocusVisible();
    return () => {
      const value = props.modelValue;
      const checked = Array.isArray(value) ? value.includes(props.val as ChoiceValue) : value;
      return (
        <label class={choiceClass(props.disabled)} data-focus-visible={focus.visible.value || undefined}>
          <input type="checkbox" class="kjun-sr-only" checked={checked} disabled={props.disabled} aria-label={props.ariaLabel}
            // Inside a FormGroup the box keeps its own label but takes the group's hint, error and required state.
            aria-describedby={field.value?.describedBy} aria-invalid={field.value?.error ? "true" : undefined} aria-required={field.value?.required || undefined}
            onFocus={focus.onFocus} onBlur={focus.onBlur}
            onChange={(event: Event) => {
              const next = (event.target as HTMLInputElement).checked;
              const result = Array.isArray(value) ? next ? [...value, props.val as ChoiceValue] : value.filter(v => v !== props.val) : next;
              // Stay controlled: the box shows the bound value until the parent updates it.
              (event.target as HTMLInputElement).checked = checked;
              emit("update:modelValue", result);
              emit("change", result);
            }} />
          <span class={`kjun-choice-control kjun-checkbox kjun-checkbox--${props.size}${checked ? " kjun-checkbox--checked" : ""}`}>
            {checked && <KjunIcon name="check" size={tokens.extensions.checkbox.iconSizes[props.size]} />}
          </span>
          {choiceLabel(props.label, slots.default)}
        </label>
      );
    };
  },
});

const kjunSwitchProps = {
  modelValue: { type: Boolean, default: false },
  label: { type: String, default: undefined },
  ariaLabel: { type: String, default: undefined },
  disabled: { type: Boolean, default: false },
  size: { type: String as PropType<InputSize>, default: "md" },
} as const;
export type KjunSwitchProps = ExtractPublicPropTypes<typeof kjunSwitchProps>;
/** v-model; default slot: label. */
export const KjunSwitch = defineComponent({
  name: "KjunSwitch",
  props: kjunSwitchProps,
  emits: { "update:modelValue": (_value: boolean) => true, change: (_value: boolean) => true },
  slots: Object as SlotsType<{ default?: () => VNodeChild }>,
  setup(props, { slots, emit }) {
    const field = useKjunField();
    const focus = useFocusVisible();
    return () => (
      <label class={choiceClass(props.disabled)} data-focus-visible={focus.visible.value || undefined}>
        <input type="checkbox" role="switch" class="kjun-sr-only" checked={props.modelValue} disabled={props.disabled}
          aria-label={props.ariaLabel || props.label} aria-describedby={field.value?.describedBy}
          aria-invalid={field.value?.error ? "true" : undefined} aria-required={field.value?.required || undefined} onFocus={focus.onFocus} onBlur={focus.onBlur}
          onChange={(event: Event) => {
            const next = (event.target as HTMLInputElement).checked;
            (event.target as HTMLInputElement).checked = props.modelValue;
            emit("update:modelValue", next);
            emit("change", next);
          }} />
        <span class={`kjun-switch kjun-switch--${props.size}${props.modelValue ? " kjun-switch--on" : ""}`}>
          <span class="kjun-switch-thumb" />
        </span>
        {choiceLabel(props.label, slots.default)}
      </label>
    );
  },
});

interface RadioContext { value: ChoiceValue; name: string; change: (value: ChoiceValue) => void }
const kjunRadioGroupKey: InjectionKey<Readonly<{ value: RadioContext }>> = Symbol("kjunRadioGroup");
const kjunRadioProps = {
  modelValue: { type: [String, Number, Boolean, null] as PropType<ChoiceValue>, default: undefined },
  val: { type: [String, Number, Boolean, null] as PropType<ChoiceValue>, required: true },
  label: { type: String, default: undefined },
  disabled: { type: Boolean, default: false },
  name: { type: String, default: undefined },
  ariaLabel: { type: String, default: undefined },
} as const;
export type KjunRadioProps = ExtractPublicPropTypes<typeof kjunRadioProps>;
/** Inside KjunRadioGroup the group's v-model decides; on its own, v-model holds the selected `val`. */
export const KjunRadio = defineComponent({
  name: "KjunRadio",
  props: kjunRadioProps,
  emits: { "update:modelValue": (_value: ChoiceValue) => true, change: (_value: ChoiceValue) => true },
  slots: Object as SlotsType<{ default?: () => VNodeChild }>,
  setup(props, { slots, emit }) {
    const group = inject(kjunRadioGroupKey, null);
    const focus = useFocusVisible();
    return () => {
      const context = group?.value;
      const selected = (context ? context.value : props.modelValue) === props.val;
      return (
        <label class={choiceClass(props.disabled)} data-focus-visible={focus.visible.value || undefined}>
          <input type="radio" class="kjun-sr-only" name={context?.name || props.name} checked={selected} disabled={props.disabled}
            aria-label={props.ariaLabel} onFocus={focus.onFocus} onBlur={focus.onBlur}
            onChange={(event: Event) => {
              (event.target as HTMLInputElement).checked = selected;
              if (context) context.change(props.val);
              else { emit("update:modelValue", props.val); emit("change", props.val); }
            }} />
          <span class={"kjun-choice-control kjun-radio" + (selected ? " kjun-radio--checked" : "")}>
            {selected && <span class="kjun-radio-dot" />}
          </span>
          {choiceLabel(props.label, slots.default)}
        </label>
      );
    };
  },
});

const kjunRadioGroupProps = {
  modelValue: { type: [String, Number, Boolean, null] as PropType<ChoiceValue>, default: null },
  options: { type: Array as PropType<ChoiceOption[]>, default: () => [] },
  direction: { type: String as PropType<"horizontal" | "vertical">, default: "horizontal" },
  ariaLabel: { type: String, default: undefined },
} as const;
export type KjunRadioGroupProps = ExtractPublicPropTypes<typeof kjunRadioGroupProps>;
/** v-model; default slot replaces the options with KjunRadio children. */
export const KjunRadioGroup = defineComponent({
  name: "KjunRadioGroup",
  props: kjunRadioGroupProps,
  emits: { "update:modelValue": (_value: ChoiceValue) => true, change: (_value: ChoiceValue) => true },
  slots: Object as SlotsType<{ default?: () => VNodeChild }>,
  setup(props, { slots, emit }) {
    const name = useKjunId("kjun-");
    provide(kjunRadioGroupKey, computed(() => ({
      value: props.modelValue, name,
      change: (next: ChoiceValue) => { emit("update:modelValue", next); emit("change", next); },
    })));
    return () => (
      <div role="radiogroup" aria-label={props.ariaLabel} style={css({
        display: "flex", flexDirection: props.direction === "vertical" ? "column" : "row", flexWrap: props.direction === "vertical" ? "nowrap" : "wrap",
        gap: props.direction === "vertical" ? tokens.dimension.value8 : tokens.dimension.value16,
      })}>
        {slots.default ? slots.default() : props.options.map(option =>
          <KjunRadio key={String(option.value)} val={option.value} label={option.label} disabled={option.disabled} />)}
      </div>
    );
  },
});

const kjunTextareaProps = {
  modelValue: { type: String, default: "" },
  size: { type: String as PropType<InputSize>, default: "md" },
  error: { type: Boolean, default: false },
  resize: { type: String as PropType<"none" | "vertical" | "horizontal" | "both">, default: "vertical" },
  rows: { type: Number, default: 3 },
  ariaLabel: { type: String, default: undefined },
  id: { type: String, default: undefined },
  required: { type: Boolean, default: undefined },
  disabled: { type: Boolean, default: false },
  readOnly: { type: Boolean, default: false },
} as const;
export type KjunTextareaProps = ExtractPublicPropTypes<typeof kjunTextareaProps>;
/** v-model; other attributes reach the <textarea>. */
export const KjunTextarea = defineComponent({
  name: "KjunTextarea",
  inheritAttrs: false,
  props: kjunTextareaProps,
  emits: { "update:modelValue": (_value: string) => true },
  setup(props, { attrs, emit, expose }) {
    const field = useKjunField();
    const textarea = ref<HTMLTextAreaElement | null>(null);
    expose({ focus: () => textarea.value?.focus(), el: textarea });
    return () => {
      const spec = tokens.input[props.size], owner = field.value;
      return (
        <textarea {...mergeProps(attrs, { onInput: (event: Event) => emit("update:modelValue", (event.target as HTMLTextAreaElement).value) })}
          disabled={props.disabled} readonly={props.readOnly}
          ref={textarea}
          id={props.id || owner?.id}
          value={props.modelValue}
          rows={props.rows}
          required={props.required ?? owner?.required}
          aria-label={props.ariaLabel || (attrs["aria-label"] as string | undefined)}
          aria-labelledby={(attrs["aria-labelledby"] as string | undefined) || owner?.labelId}
          aria-describedby={mergeIds(attrs["aria-describedby"] as string | undefined, owner?.describedBy)}
          aria-invalid={props.error || !!owner?.error ? "true" : undefined}
          class={["kjun-input kjun-textarea", attrs.class]}
          style={[css({
            fontSize: spec.fontSize / 16 + "rem",
            lineHeight: spec.lineHeight / 16 + "rem",
            padding: `${spec.textareaPaddingY}px ${spec.padding - tokens.border.controlWidth}px`,
            minHeight: Math.max(spec.height, props.rows * spec.lineHeight + spec.textareaPaddingY * 2 + 2 * tokens.border.controlWidth),
            borderRadius: spec.radius,
            resize: props.resize,
          }), attrs.style as never]} />
      );
    };
  },
});

/** The decorative selected background follows the pressed button after each render. */
function useSelectionIndicator(tabs = false) {
  const group = ref<HTMLElement | null>(null), indicator = ref<HTMLElement | null>(null);
  let handle: ReturnType<typeof selectionIndicator> | undefined;
  onMounted(() => { if (group.value && indicator.value) handle = selectionIndicator(group.value, indicator.value, tabs); });
  onUpdated(() => handle?.update());
  onBeforeUnmount(() => handle?.destroy());
  return { group, indicator };
}
export { useSelectionIndicator };

const kjunButtonGroupProps = {
  modelValue: { type: [String, Number, Boolean, null] as PropType<ChoiceValue>, default: null },
  options: { type: Array as PropType<ChoiceOption[]>, required: true },
  size: { type: String as PropType<ButtonSize>, default: "md" },
  variant: { type: String as PropType<"primary" | "secondary" | "ghost">, default: undefined },
  disabled: { type: Boolean, default: false },
  fullWidth: { type: Boolean, default: false },
  ariaLabel: { type: String, default: undefined },
} as const;
export type KjunButtonGroupProps = ExtractPublicPropTypes<typeof kjunButtonGroupProps>;
export const KjunButtonGroup = defineComponent({
  name: "KjunButtonGroup",
  props: kjunButtonGroupProps,
  emits: { "update:modelValue": (_value: ChoiceValue) => true, change: (_value: ChoiceValue) => true },
  setup(props, { emit }) {
    const { group, indicator } = useSelectionIndicator();
    return () => {
      const size = props.size, metrics = tokens.buttonGroup;
      return (
        <div ref={group} role="group" aria-label={props.ariaLabel} class="kjun-button-group" onKeydown={groupKeydown}
          style={css({ height: metrics.heights[size], padding: metrics.padding[size], borderRadius: metrics.radii[size], width: props.fullWidth ? "100%" : "fit-content" })}>
          <span ref={indicator} class="kjun-button-group-indicator" aria-hidden="true" hidden style={css({ borderRadius: metrics.itemRadii[size] })} />
          {props.options.map(option => {
            const active = props.modelValue === option.value;
            return (
              <button key={String(option.value)} type="button" aria-pressed={active} disabled={props.disabled || option.disabled}
                style={css({ flex: props.fullWidth ? 1 : undefined, paddingInline: metrics.itemPaddingX[size], borderRadius: metrics.itemRadii[size], ...selectionTypeStyle(size, active) })}
                onClick={() => { emit("update:modelValue", option.value); emit("change", option.value); }}>
                {option.icon && <KjunIcon name={option.icon} size={tokens.extensions.selection.iconSize} />}
                <span class="kjun-button-group-label">
                  <span aria-hidden="true" style={css(typeStyle(tokens.button.typography[size]))}>{option.label}</span><span>{option.label}</span>
                </span>
              </button>
            );
          })}
        </div>
      );
    };
  },
});

const filterPadding = { xs: tokens.dimension.value8, sm: tokens.dimension.value12, md: tokens.dimension.value12, lg: tokens.dimension.value14, xl: tokens.dimension.value16 };
const kjunFilterGroupProps = {
  modelValue: { type: [String, Number, Boolean, null, Array] as PropType<ChoiceValue | ChoiceValue[]>, default: null },
  options: { type: Array as PropType<ChoiceOption[]>, required: true },
  size: { type: String as PropType<ButtonSize>, default: "sm" },
  disabled: { type: Boolean, default: false },
  multiple: { type: Boolean, default: false },
  scroll: { type: Boolean, default: false },
  ariaLabel: { type: String, default: undefined },
} as const;
export type KjunFilterGroupProps = ExtractPublicPropTypes<typeof kjunFilterGroupProps>;
export const KjunFilterGroup = defineComponent({
  name: "KjunFilterGroup",
  props: kjunFilterGroupProps,
  emits: { "update:modelValue": (_value: ChoiceValue | ChoiceValue[]) => true, change: (_value: ChoiceValue | ChoiceValue[]) => true },
  setup(props, { emit }) {
    return () => {
      const value = props.modelValue, size = props.size;
      const selected = (v: ChoiceValue) => props.multiple ? Array.isArray(value) && (v === null ? value.length === 0 : value.includes(v)) : value === v;
      return (
        <div role="group" aria-label={props.ariaLabel} class="kjun-filter-group" data-scroll={String(props.scroll)} onKeydown={groupKeydown}>
          {props.options.map(option => (
            <button key={String(option.value)} type="button" class="kjun-filter-chip"
              // Corners follow the button scale with the height, so every size keeps the same shape.
              style={css({ borderRadius: tokens.button.radii[size] })} aria-pressed={selected(option.value)} disabled={props.disabled || option.disabled}
              onClick={() => {
                const next = props.multiple
                  ? option.value === null ? []
                    : Array.isArray(value) && value.includes(option.value) ? value.filter(v => v !== option.value)
                    : [...(Array.isArray(value) ? value : []), option.value]
                  : option.value;
                emit("update:modelValue", next);
                emit("change", next);
              }}>
              <span style={css({ height: tokens.button.heights[size], paddingInline: filterPadding[size], ...selectionTypeStyle(size, selected(option.value)) })}>
                {option.dot && <i style={{ background: option.dot }} />}
                {option.icon && <KjunIcon name={option.icon} size={tokens.extensions.selection.iconSize} />}
                <span class="kjun-filter-label">
                  <span aria-hidden="true" style={css(typeStyle(tokens.button.typography[size]))}>{option.label}</span>
                  <span>{option.label}</span>
                </span>
              </span>
            </button>
          ))}
        </div>
      );
    };
  },
});
