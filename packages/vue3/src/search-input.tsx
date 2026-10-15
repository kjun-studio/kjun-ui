import { defineComponent, ref, type ExtractPublicPropTypes, type PropType, type SlotsType, type VNodeChild } from "vue";
import type { InputSize } from "@kjun-ui/tokens";
import { optionLabel, type SelectOption } from "../../../shared/package-runtime/options";
import { SearchField } from "./combobox";
import { KjunInput } from "./input";
import { useSearchInputModel } from "./runtime/selection";

const kjunSearchInputProps = {
  modelValue: { type: String, default: "" },
  placeholder: { type: String, default: "검색..." },
  ariaLabel: { type: String, default: undefined },
  disabled: { type: Boolean, default: false },
  error: { type: Boolean, default: false },
  clearable: { type: Boolean, default: true },
  debounce: { type: Number, default: 0 },
  size: { type: String as PropType<InputSize>, default: "md" },
  loadOptions: { type: Function as PropType<(query: string, context: { signal: AbortSignal }) => Promise<SelectOption[]>>, default: undefined },
  itemKey: { type: String, default: "id" },
  labelField: { type: String, default: "name" },
  minChars: { type: Number, default: 2 },
  emptyText: { type: String, default: "결과가 없습니다" },
  /** Shown when loadOptions rejects, instead of the empty text. */
  errorText: { type: String, default: "검색하지 못했습니다. 다시 시도해 주세요." },
} as const;
export type KjunSearchInputProps = ExtractPublicPropTypes<typeof kjunSearchInputProps>;
/** v-model; with loadOptions it suggests results. Slot option({ option }); events select, enter, clear, search-error. */
export const KjunSearchInput = defineComponent({
  name: "KjunSearchInput",
  props: kjunSearchInputProps,
  emits: {
    "update:modelValue": (_value: string) => true, select: (_option: SelectOption) => true, enter: () => true,
    clear: () => true, "search-error": (_error: unknown) => true,
  },
  slots: Object as SlotsType<{ option?: (scope: { option: SelectOption }) => VNodeChild }>,
  setup(props, { slots, emit }) {
    const open = ref(false);
    const model = useSearchInputModel(() => ({ value: props.modelValue, disabled: props.disabled, debounce: props.debounce,
      minChars: props.minChars, loadOptions: props.loadOptions }), () => open.value, {
      change: value => emit("update:modelValue", value), error: error => emit("search-error", error),
    });
    const update = (value: string) => { open.value = true; model.update(value); };
    const clear = () => { open.value = false; model.clear(); emit("clear"); };
    return () => !props.loadOptions ? (
      <KjunInput error={props.error} modelValue={model.query.value} prefixIcon="search" size={props.size}
        ariaLabel={props.ariaLabel || props.placeholder} disabled={props.disabled} clearable={props.clearable}
        {...{ placeholder: props.placeholder, "onUpdate:modelValue": update, onClear: clear, onEnter: () => emit("enter") }} />
    ) : (
      <SearchField error={props.error} value={model.query.value} size={props.size} placeholder={props.placeholder} ariaLabel={props.ariaLabel}
        disabled={props.disabled} clearable={props.clearable} open={open.value && model.query.value.length >= props.minChars}
        onOpenChange={value => { open.value = value; }} options={model.options.value} labelKey={props.labelField} itemKey={props.itemKey}
        emptyText={props.emptyText} loading={model.loading.value} failed={model.failed.value} errorText={props.errorText} renderOption={slots.option}
        onValueChange={update} onSelect={option => { model.select(optionLabel(option, props.labelField)); emit("select", option); open.value = false; }}
        onClear={clear} onEnter={() => emit("enter")} />
    );
  },
});
