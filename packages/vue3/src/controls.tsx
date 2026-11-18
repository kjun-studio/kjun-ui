import { useKjunMessages } from "./runtime/messages";
import { spinnerGlyph } from "./spinner-glyph";
import { computed, inject, onBeforeUnmount, onMounted, onUpdated, provide, ref, watch,
  type ExtractPublicPropTypes, type InjectionKey, type PropType, type SlotsType, type VNodeChild } from "vue";
import { defineComponent } from "./runtime/component";
import { tokens, type ButtonSize, type InputSize } from "@kjun-ui/tokens";
import { selectionTypeStyle, typeStyle } from "../../../shared/package-runtime/typography";
import { selectionIndicator } from "../../../shared/package-runtime/selection-indicator";
import { groupKeydown } from "../../../shared/package-runtime/group-keyboard";
import { filterSelected, nextFilterValue } from "../../../shared/package-runtime/filter-value";
import { trackFilterScroll } from "../../../shared/package-runtime/filter-scroll";
import { KjunIcon } from "./button";
import { KjunTooltip } from "./popover";
import { useKjunField, useKjunId } from "./input";
import { useFocusVisible } from "./runtime/focus-visible";
import { css } from "./runtime/style";
import { mergeIds } from "../../../shared/package-runtime/aria-ids";
import { provideFallbackIcons } from "./runtime/icons";
import { componentIcons } from "../../../shared/package-runtime/component-icons";

export type ChoiceValue = string | number | boolean | null;
export interface ChoiceOption<T = ChoiceValue> {
  value: T;
  label: string;
  disabled?: boolean;
  icon?: string;
  /** ButtonGroup only: show the icon alone in a square segment; label becomes the accessible name and tooltip. */
  iconOnly?: boolean;
  /** FilterGroup only: a count after the label ("진행 중 12"), joined to the label in the accessible name. A string is shown as given. */
  count?: number | string;
  dot?: string;
}
const choiceClass = (disabled: boolean) => "kjun-choice" + (disabled ? " kjun-choice--disabled" : "");
// The label alone, or the label with supporting text under it (the same structure as React).
const choiceText = (label: string | undefined, slot: (() => unknown) | undefined, description: string | undefined, descriptionId: string) => {
  const content = slot ? slot() : label;
  const text = (Array.isArray(content) ? content.length > 0 : !!content) && <span class="kjun-choice-label">{content}</span>;
  return description
    ? <span class="kjun-choice-text">{text && <span id={labelIdOf(descriptionId)} class="kjun-choice-label">{content}</span>}<span id={descriptionId} class="kjun-choice-description">{description}</span></span>
    : text;
};
const labelIdOf = (descriptionId: string) => descriptionId + "-label";
// The <label> also wraps the description, so with one the control is named by its label text alone.
const namedBy = (description: string | undefined, hasText: boolean, ariaLabel: string | undefined, descriptionId: string) =>
  description && hasText && !ariaLabel ? labelIdOf(descriptionId) : undefined;
/** The control's input, so a parent can move focus to it like React's inputRef. */
function useChoiceInput(expose: (exposed: Record<string, unknown>) => void) {
  const input = ref<HTMLInputElement | null>(null);
  expose({ focus: () => input.value?.focus(), el: input });
  return input;
}

const kjunCheckboxProps = {
  modelValue: { type: [Boolean, Array] as PropType<boolean | ChoiceValue[]>, default: false },
  /** Mixed selection display; v-model keeps its boolean/array shape. */
  indeterminate: { type: Boolean, default: false },
  val: { type: [String, Number, Boolean, null] as PropType<ChoiceValue>, default: undefined },
  label: { type: String, default: undefined },
  ariaLabel: { type: String, default: undefined },
  disabled: { type: Boolean, default: false },
  size: { type: String as PropType<InputSize>, default: "md" },
  /** Supporting text under the label; it also describes the checkbox to screen readers. */
  description: { type: String, default: undefined },
  /** Submits with a form under this name while checked. */
  name: { type: String, default: undefined },
  /** The value a form submits while checked (default "on"). */
  formValue: { type: String, default: undefined },
  /** The checkbox input's id, e.g. to reach it from an outside <label for>. */
  id: { type: String, default: undefined },
} as const;
export type KjunCheckboxProps = ExtractPublicPropTypes<typeof kjunCheckboxProps>;
/** v-model is a boolean, or an array of selected `val`s for a checkbox list. Default slot: label. Exposes focus(). */
export const KjunCheckbox = defineComponent({
  name: "KjunCheckbox",
  props: kjunCheckboxProps,
  emits: { "update:modelValue": (_value: boolean | ChoiceValue[]) => true, change: (_value: boolean | ChoiceValue[]) => true },
  slots: Object as SlotsType<{ default?: () => VNodeChild }>,
  setup(props, { slots, emit, expose }) {
    const field = useKjunField();
    const focus = useFocusVisible();
    const input = useChoiceInput(expose);
    const descriptionId = useKjunId("kjun-checkbox-description-");
    // The mixed state's minus is not in every app's icon set.
    provideFallbackIcons(componentIcons);
    return () => {
      const value = props.modelValue;
      const checked = Array.isArray(value) ? value.includes(props.val as ChoiceValue) : value;
      const invalid = !!field.value?.error;
      return (
        <label class={choiceClass(props.disabled)} data-focus-visible={focus.visible.value || undefined} data-invalid={invalid || undefined}>
          <input ref={input} id={props.id} type="checkbox" class="kjun-sr-only" checked={checked} indeterminate={props.indeterminate} disabled={props.disabled}
            name={props.name} value={props.formValue} aria-label={props.ariaLabel}
            aria-labelledby={namedBy(props.description, !!(props.label || slots.default), props.ariaLabel, descriptionId)}
            // Inside a FormGroup the box keeps its own label but takes the group's hint, error and required state.
            aria-describedby={mergeIds(field.value?.describedBy, props.description ? descriptionId : undefined)}
            aria-invalid={invalid ? "true" : undefined} aria-required={field.value?.required || undefined}
            onFocus={focus.onFocus} onBlur={focus.onBlur}
            onChange={(event: Event) => {
              const next = (event.target as HTMLInputElement).checked;
              const result = Array.isArray(value) ? next ? [...value, props.val as ChoiceValue] : value.filter(v => v !== props.val) : next;
              // Stay controlled: the box shows the bound value until the parent updates it.
              (event.target as HTMLInputElement).checked = checked;
              (event.target as HTMLInputElement).indeterminate = props.indeterminate;
              emit("update:modelValue", result);
              emit("change", result);
            }} />
          <span class={`kjun-choice-control kjun-checkbox kjun-checkbox--${props.size}${checked || props.indeterminate ? " kjun-checkbox--checked" : ""}`}>
            {(checked || props.indeterminate) && <KjunIcon name={props.indeterminate ? "minus" : "check"} size={tokens.extensions.checkbox.iconSizes[props.size]} />}
          </span>
          {choiceText(props.label, slots.default, props.description, descriptionId)}
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
  /** Supporting text under the label; it also describes the switch to screen readers. */
  description: { type: String, default: undefined },
  /** Saving: a spinner turns in the thumb and presses are ignored, without dimming the switch like disabled. */
  loading: { type: Boolean, default: false },
  /** Submits with a form under this name while the switch is on. */
  name: { type: String, default: undefined },
  /** The value a form submits while on (default "on"). */
  formValue: { type: String, default: undefined },
  /** The switch input's id, e.g. to reach it from an outside <label for>. */
  id: { type: String, default: undefined },
} as const;
export type KjunSwitchProps = ExtractPublicPropTypes<typeof kjunSwitchProps>;
/** v-model; default slot: label. Exposes focus(). */
export const KjunSwitch = defineComponent({
  name: "KjunSwitch",
  props: kjunSwitchProps,
  emits: { "update:modelValue": (_value: boolean) => true, change: (_value: boolean) => true },
  slots: Object as SlotsType<{ default?: () => VNodeChild }>,
  setup(props, { slots, emit, expose }) {
    const field = useKjunField();
    const focus = useFocusVisible();
    const input = useChoiceInput(expose);
    const descriptionId = useKjunId("kjun-switch-description-"), savingId = useKjunId("kjun-switch-saving-");
    const m = useKjunMessages();
    return () => (
      <label class={choiceClass(props.disabled)} data-focus-visible={focus.visible.value || undefined} data-loading={props.loading || undefined}>
        {props.loading && <span id={savingId} hidden>{m.value.saving}</span>}
        <input ref={input} id={props.id} type="checkbox" role="switch" class="kjun-sr-only" checked={props.modelValue} disabled={props.disabled} name={props.name} value={props.formValue}
          aria-label={props.ariaLabel || props.label}
          aria-labelledby={namedBy(props.description, !props.ariaLabel && !props.label && !!slots.default, undefined, descriptionId)}
          // aria-busy alone is not read on form controls, so the saving state is also a description.
          aria-describedby={mergeIds(field.value?.describedBy, props.description ? descriptionId : undefined, props.loading ? savingId : undefined)}
          aria-invalid={field.value?.error ? "true" : undefined} aria-required={field.value?.required || undefined} aria-busy={props.loading || undefined} onFocus={focus.onFocus} onBlur={focus.onBlur}
          onChange={(event: Event) => {
            const next = (event.target as HTMLInputElement).checked;
            (event.target as HTMLInputElement).checked = props.modelValue;
            if (props.loading) return;
            emit("update:modelValue", next);
            emit("change", next);
          }} />
        <span class={`kjun-switch kjun-switch--${props.size}${props.modelValue ? " kjun-switch--on" : ""}`}>
          <span class="kjun-switch-thumb">{props.loading && spinnerGlyph({ class: "kjun-switch-spinner", size: tokens.extensions.switch.spinnerSize })}</span>
        </span>
        {choiceText(props.label, slots.default, props.description, descriptionId)}
      </label>
    );
  },
});

interface RadioContext { value: ChoiceValue; name: string; size?: InputSize; disabled: boolean; invalid: boolean; change: (value: ChoiceValue) => void }
const kjunRadioGroupKey: InjectionKey<Readonly<{ value: RadioContext }>> = Symbol("kjunRadioGroup");
const kjunRadioProps = {
  modelValue: { type: [String, Number, Boolean, null] as PropType<ChoiceValue>, default: undefined },
  val: { type: [String, Number, Boolean, null] as PropType<ChoiceValue>, required: true },
  label: { type: String, default: undefined },
  disabled: { type: Boolean, default: false },
  name: { type: String, default: undefined },
  ariaLabel: { type: String, default: undefined },
  /** Inside a RadioGroup the group's size applies unless this is set. */
  size: { type: String as PropType<InputSize>, default: undefined },
  /** Supporting text under the label; it also describes the radio to screen readers. */
  description: { type: String, default: undefined },
  /** The radio input's id, e.g. to reach it from an outside <label for>. */
  id: { type: String, default: undefined },
} as const;
export type KjunRadioProps = ExtractPublicPropTypes<typeof kjunRadioProps>;
/** Inside KjunRadioGroup the group's v-model decides; on its own, v-model holds the selected `val`. Exposes focus(). */
export const KjunRadio = defineComponent({
  name: "KjunRadio",
  props: kjunRadioProps,
  emits: { "update:modelValue": (_value: ChoiceValue) => true, change: (_value: ChoiceValue) => true },
  slots: Object as SlotsType<{ default?: () => VNodeChild }>,
  setup(props, { slots, emit, expose }) {
    const group = inject(kjunRadioGroupKey, null);
    const field = useKjunField();
    const focus = useFocusVisible();
    const input = useChoiceInput(expose);
    const descriptionId = useKjunId("kjun-radio-description-");
    return () => {
      const context = group?.value;
      const selected = (context ? context.value : props.modelValue) === props.val;
      const blocked = props.disabled || !!context?.disabled, size = props.size || context?.size || "md";
      // A lone radio in a FormGroup takes the group's hint, error and required state; inside a RadioGroup the group carries them.
      const own = context ? null : field.value, invalid = context ? context.invalid : !!own?.error;
      return (
        <label class={choiceClass(blocked)} data-focus-visible={focus.visible.value || undefined} data-invalid={invalid || undefined}>
          <input ref={input} id={props.id} type="radio" class="kjun-sr-only" name={context?.name || props.name}
            // A form submits the chosen radio's val, not the browser's default "on".
            value={String(props.val)} checked={selected} disabled={blocked} aria-label={props.ariaLabel}
            aria-labelledby={namedBy(props.description, !!(props.label || slots.default), props.ariaLabel, descriptionId)}
            aria-describedby={mergeIds(own?.describedBy, props.description ? descriptionId : undefined)}
            aria-invalid={own?.error ? "true" : undefined} aria-required={own?.required || undefined}
            onFocus={focus.onFocus} onBlur={focus.onBlur}
            onChange={(event: Event) => {
              (event.target as HTMLInputElement).checked = selected;
              if (context) context.change(props.val);
              else { emit("update:modelValue", props.val); emit("change", props.val); }
            }} />
          <span class={`kjun-choice-control kjun-radio kjun-radio--${size}${selected ? " kjun-radio--checked" : ""}`}>
            {selected && <span class="kjun-radio-dot" />}
          </span>
          {choiceText(props.label, slots.default, props.description, descriptionId)}
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
  /** Size of every radio in the group. */
  size: { type: String as PropType<InputSize>, default: undefined },
  /** Disables every radio in the group. */
  disabled: { type: Boolean, default: false },
  /** The form field name the chosen radio submits under (default: a generated name). */
  name: { type: String, default: undefined },
} as const;
export type KjunRadioGroupProps = ExtractPublicPropTypes<typeof kjunRadioGroupProps>;
/** v-model; default slot replaces the options with KjunRadio children. */
export const KjunRadioGroup = defineComponent({
  name: "KjunRadioGroup",
  props: kjunRadioGroupProps,
  emits: { "update:modelValue": (_value: ChoiceValue) => true, change: (_value: ChoiceValue) => true },
  slots: Object as SlotsType<{ default?: () => VNodeChild }>,
  setup(props, { slots, emit }) {
    const generated = useKjunId("kjun-");
    // Inside a FormGroup the group is named by its label and described by its hint or error.
    const field = useKjunField();
    provide(kjunRadioGroupKey, computed(() => ({
      value: props.modelValue, name: props.name || generated, size: props.size, disabled: props.disabled, invalid: !!field.value?.error,
      change: (next: ChoiceValue) => { emit("update:modelValue", next); emit("change", next); },
    })));
    return () => {
      const owner = field.value, invalid = !!owner?.error;
      return (
        <div role="radiogroup" class="kjun-radio-group" data-direction={props.direction} aria-label={props.ariaLabel}
          aria-labelledby={props.ariaLabel ? undefined : owner?.labelId} aria-describedby={owner?.describedBy}
          aria-invalid={invalid || undefined} aria-required={owner?.required || undefined} aria-disabled={props.disabled || undefined}>
          {slots.default ? slots.default() : props.options.map(option =>
            <KjunRadio key={String(option.value)} val={option.value} label={option.label} disabled={option.disabled} />)}
        </div>
      );
    };
  },
});

export { KjunTextarea } from "./textarea";
export type { KjunTextareaProps } from "./textarea";

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
            const iconOnly = !!(option.iconOnly && option.icon), blocked = props.disabled || option.disabled;
            const segment = (
              <button key={String(option.value)} type="button" aria-pressed={active} aria-label={iconOnly ? option.label : undefined} disabled={blocked}
                // An icon-only segment is square: as wide as the segment is tall.
                style={css({ flex: props.fullWidth ? 1 : undefined, width: iconOnly && !props.fullWidth ? metrics.heights[size] - 2 * metrics.padding[size] : undefined,
                  paddingInline: iconOnly ? 0 : metrics.itemPaddingX[size], borderRadius: metrics.itemRadii[size], ...selectionTypeStyle(size, active) })}
                onClick={() => { emit("update:modelValue", option.value); emit("change", option.value); }}>
                {option.icon && <KjunIcon name={option.icon} size={tokens.button.iconSizes[size]} />}
                {!iconOnly && <span class="kjun-button-group-label">
                  <span aria-hidden="true" style={css(typeStyle(tokens.button.typography[size]))}>{option.label}</span><span>{option.label}</span>
                </span>}
              </button>
            );
            return iconOnly ? <KjunTooltip key={String(option.value)} content={blocked ? "" : option.label}>{segment}</KjunTooltip> : segment;
          })}
        </div>
      );
    };
  },
});

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
    const m = useKjunMessages(), root = ref<HTMLElement | null>(null);
    // Scroll mode, as React's useFilterScroll: fade the clipped edges and keep the selected chip in view
    // (in multiple mode only on mount, so turning a chip off does not pull the row elsewhere).
    let tracker: ReturnType<typeof trackFilterScroll> | undefined;
    const track = () => {
      tracker?.destroy(); tracker = undefined;
      if (props.scroll && root.value) { tracker = trackFilterScroll(root.value); tracker.reveal(); }
    };
    onMounted(track);
    watch(() => props.scroll, track, { flush: "post" });
    watch(() => props.modelValue, () => { if (!props.multiple) tracker?.reveal(); }, { flush: "post" });
    onBeforeUnmount(() => tracker?.destroy());
    return () => {
      const value = props.modelValue, size = props.size;
      return (
        <div ref={root} role="group" aria-label={props.ariaLabel} class="kjun-filter-group" data-scroll={String(props.scroll)} onKeydown={groupKeydown}>
          {props.options.map(option => {
            const on = filterSelected(value, option.value, props.multiple), counted = option.count != null && option.count !== "";
            return (
              <button key={String(option.value)} type="button" class="kjun-filter-chip"
                // Corners follow the button scale with the height, so every size keeps the same shape.
                style={css({ borderRadius: tokens.button.radii[size] })} aria-pressed={on}
                aria-label={counted ? m.value.filterCount(option.label, String(option.count)) : undefined}
                disabled={props.disabled || option.disabled}
                onClick={() => {
                  const next = nextFilterValue(value, option.value, props.multiple);
                  emit("update:modelValue", next);
                  emit("change", next);
                }}>
                <span style={css({ height: tokens.button.heights[size], paddingInline: tokens.extensions.selection.paddingX[size], ...selectionTypeStyle(size, on) })}>
                  {option.dot && <i style={{ background: option.dot }} />}
                  {option.icon && <KjunIcon name={option.icon} size={tokens.extensions.selection.iconSize} />}
                  <span class="kjun-filter-label">
                    <span aria-hidden="true" style={css(typeStyle(tokens.button.typography[size]))}>{option.label}</span>
                    <span>{option.label}</span>
                  </span>
                  {counted && <span class="kjun-filter-count">{option.count}</span>}
                </span>
              </button>
            );
          })}
        </div>
      );
    };
  },
});
