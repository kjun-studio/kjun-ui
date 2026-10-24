import { useKjunMessages } from "./runtime/messages";
import { computed, defineComponent, onBeforeUnmount, ref, watch, type ExtractPublicPropTypes, type PropType, type SlotsType, type VNode, type VNodeChild } from "vue";
import type { InputSize } from "@kjun-ui/tokens";
import { optionDisabled, optionKey, optionLabel, type OptionValue, type SelectOption } from "../../../shared/package-runtime/options";
import { KjunSpinner } from "./display";
import { FloatingPanel, focusReturnProp, readFocusReturn } from "./floating-panel";
import { KjunInput, useCompositionGuard, useKjunId } from "./input";
import { usePopupFocusGuard } from "./runtime/layers";
import { useComboboxModel } from "./runtime/selection";

/** The shared input + listbox of Combobox and SearchInput (React's SearchField). */
export const SearchField = defineComponent({
  name: "KjunSearchField",
  props: {
    value: { type: String, required: true },
    size: { type: String as PropType<InputSize>, required: true },
    placeholder: { type: String, required: true },
    ariaLabel: { type: String, default: undefined },
    disabled: { type: Boolean, default: false },
    error: { type: Boolean, default: false },
    clearable: { type: Boolean, default: false },
    open: { type: Boolean, required: true },
    options: { type: Array as PropType<SelectOption[]>, required: true },
    labelKey: { type: String, required: true },
    itemKey: { type: String, required: true },
    emptyText: { type: String, required: true },
    loading: { type: Boolean, default: false },
    /** A failed request; shown instead of the empty text so the two never look alike. */
    failed: { type: Boolean, default: false },
    errorText: { type: String, default: "" },
    renderOption: { type: Function as PropType<(scope: { option: SelectOption }) => VNodeChild>, default: undefined },
    onOpenChange: { type: Function as PropType<(open: boolean) => void>, required: true },
    onValueChange: { type: Function as PropType<(value: string) => void>, required: true },
    onSelect: { type: Function as PropType<(option: SelectOption) => void>, required: true },
    onClear: { type: Function as PropType<() => void>, default: undefined },
    onEnter: { type: Function as PropType<() => void>, default: undefined },
    returnFocus: { type: Function as PropType<() => HTMLElement | null | undefined>, default: undefined },
  },
  setup(props) {
    const m = useKjunMessages();
    const composition = useCompositionGuard();
    let clearing = false;
    const field = ref<{ el: HTMLInputElement | null } | null>(null);
    const input = () => field.value?.el ?? null;
    const highlighted = ref(-1), id = useKjunId("kjun-");
    const focusGuard = usePopupFocusGuard(input);
    const active = computed(() => !props.disabled && !props.loading && highlighted.value >= 0 && highlighted.value < props.options.length
      && !optionDisabled(props.options[highlighted.value]) ? highlighted.value : -1);
    watch(() => [props.value, props.options.length], () => { highlighted.value = -1; });
    const leaveField = (event: FocusEvent) => {
      const target = event.target;
      if (target instanceof Node && !input()?.closest(".kjun-input-wrap")?.contains(target) && !document.getElementById(id)?.contains(target))
        props.onOpenChange(false);
    };
    watch(() => props.open, open => {
      if (open) document.addEventListener("focusin", leaveField);
      else document.removeEventListener("focusin", leaveField);
    }, { immediate: true });
    onBeforeUnmount(() => document.removeEventListener("focusin", leaveField));
    const available = computed(() => props.options.map((option, i) => (optionDisabled(option) ? -1 : i)).filter(i => i >= 0));
    const select = (option: SelectOption | undefined) => {
      // Recheck at commitment: an option may change after keyboard highlighting.
      if (option === undefined || props.disabled || props.loading || optionDisabled(option)) return;
      props.onSelect(option);
      props.onOpenChange(false);
      (props.returnFocus?.() ?? input())?.focus();
    };
    const keydown = (event: KeyboardEvent) => {
      if (composition.isComposing(event)) return;
      const list = available.value;
      let next = active.value;
      if (event.key === "ArrowDown") { event.preventDefault(); props.onOpenChange(true); next = list[Math.min(list.indexOf(active.value) + 1, list.length - 1)] ?? -1; }
      else if (event.key === "ArrowUp") { event.preventDefault(); props.onOpenChange(true); next = list[Math.max(list.indexOf(active.value) - 1, 0)] ?? -1; }
      else if (props.open && (event.key === "Home" || event.key === "End")) { event.preventDefault(); next = list[event.key === "Home" ? 0 : list.length - 1] ?? -1; }
      else if (event.key === "Enter") {
        if (props.open && active.value >= 0) { event.preventDefault(); select(props.options[active.value]); }
        else props.onEnter?.();
      } else if (event.key === "Escape" && props.open) { event.preventDefault(); event.stopPropagation(); props.onOpenChange(false); props.returnFocus?.()?.focus(); }
      highlighted.value = next;
      if (next >= 0) document.getElementById(id + "-" + next)?.scrollIntoView({ block: "nearest" });
    };
    return () => {
      const shown = props.open && !props.disabled;
      return (
        <>
          <KjunInput ref={field} error={props.error} modelValue={props.value} size={props.size}
            ariaLabel={props.ariaLabel || props.placeholder} disabled={props.disabled} clearable={props.clearable} prefixIcon="search"
            {...{
              placeholder: props.placeholder, role: "combobox", "aria-autocomplete": "list", "aria-expanded": String(shown),
              "aria-controls": props.open ? id : undefined,
              "aria-activedescendant": props.open && active.value >= 0 ? id + "-" + active.value : undefined,
              "onUpdate:modelValue": (value: string) => { highlighted.value = -1; props.onValueChange(value); },
              onClear: () => { clearing = true; props.onClear?.(); props.onOpenChange(false); queueMicrotask(() => { clearing = false; }); },
              onClick: () => { focusGuard.clear(); props.onOpenChange(true); },
              onFocus: () => { if (!clearing && focusGuard.canOpen()) props.onOpenChange(true); },
              onBlur: (event: FocusEvent) => {
                focusGuard.clear();
                // Moving to the input's Clear button must not discard its draft before clicking.
                if (!(event.currentTarget as HTMLElement).closest(".kjun-input-wrap")?.contains(event.relatedTarget as Node | null)) props.onOpenChange(false);
              },
              onCompositionstart: composition.onCompositionstart,
              onCompositionend: composition.onCompositionend,
              onKeydown: keydown,
            }} />
          <FloatingPanel field nonModal open={shown} onOpenChange={props.onOpenChange} trigger={input} placement="bottom-start" matchTriggerWidth panelClass="kjun-select-panel">
            <div id={id} role="listbox" aria-label={props.ariaLabel || props.placeholder} onMousedown={(event: MouseEvent) => event.preventDefault()}>
              {props.loading ? <div class="kjun-select-empty"><KjunSpinner size="sm" text={m.value.searching} /></div>
                : props.failed ? <div class="kjun-select-empty" role="alert">{props.errorText}</div>
                : props.options.length ? props.options.map((option, i) => {
                    const custom = props.renderOption?.({ option }) as VNode[] | undefined;
                    return (
                      <div key={optionKey(option, props.itemKey, i)} id={id + "-" + i} role="option" aria-selected={active.value === i}
                        aria-disabled={optionDisabled(option) ? "true" : undefined} class="kjun-option" data-focused={active.value === i || undefined}
                        onMousemove={() => { if (!optionDisabled(option)) highlighted.value = i; }}
                        onClick={() => { if (!optionDisabled(option)) select(option); }}>
                        {custom?.length ? custom : optionLabel(option, props.labelKey)}
                      </div>
                    );
                  })
                : <div class="kjun-select-empty">{props.emptyText}</div>}
            </div>
          </FloatingPanel>
        </>
      );
    };
  },
});

const kjunComboboxProps = {
  modelValue: { type: [String, Number, null] as PropType<OptionValue | null>, default: null },
  options: { type: Array as PropType<SelectOption[]>, default: () => [] },
  placeholder: { type: String, default: undefined },
  ariaLabel: { type: String, default: undefined },
  labelKey: { type: String, default: "label" },
  valueKey: { type: String, default: "value" },
  filterFn: { type: Function as PropType<(option: SelectOption, query: string) => boolean>, default: undefined },
  size: { type: String as PropType<InputSize>, default: "md" },
  disabled: { type: Boolean, default: false },
  error: { type: Boolean, default: false },
  clearable: { type: Boolean, default: false },
  emptyText: { type: String, default: undefined },
  /** Where focus goes after choosing an option or Escape. Closing while typing keeps focus in the input. Web only. */
  returnFocus: focusReturnProp,
} as const;
export type KjunComboboxProps = ExtractPublicPropTypes<typeof kjunComboboxProps>;
/** v-model; slot option({ option }); events change, search, clear. */
export const KjunCombobox = defineComponent({
  name: "KjunCombobox",
  props: kjunComboboxProps,
  emits: { "update:modelValue": (_value: OptionValue | null) => true, change: (_value: OptionValue | null) => true, search: (_query: string) => true, clear: () => true },
  slots: Object as SlotsType<{ option?: (scope: { option: SelectOption }) => VNodeChild }>,
  setup(props, { slots, emit }) {
    const m = useKjunMessages();
    const model = useComboboxModel(() => ({ value: props.modelValue, options: props.options, labelKey: props.labelKey, valueKey: props.valueKey,
      disabled: props.disabled, filterFn: props.filterFn }), {
      change: value => { emit("update:modelValue", value); emit("change", value); },
      search: value => emit("search", value),
      clear: () => emit("clear"),
    });
    return () => (
      <SearchField error={props.error} value={model.displayValue.value} size={props.size} placeholder={(props.placeholder ?? m.value.searchOrSelect)} ariaLabel={props.ariaLabel}
        disabled={props.disabled} clearable={props.clearable} open={model.open.value} onOpenChange={model.changeOpen} options={model.options.value}
        labelKey={props.labelKey} itemKey={props.valueKey} emptyText={(props.emptyText ?? m.value.noResults)} renderOption={slots.option}
        onValueChange={value => model.search(value, true)} onSelect={model.select} onClear={model.clear}
        returnFocus={props.returnFocus === undefined ? undefined : () => readFocusReturn(props.returnFocus)} />
    );
  },
});
