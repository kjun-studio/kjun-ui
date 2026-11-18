import { useKjunMessages } from "./runtime/messages";
import { ref, type ExtractPublicPropTypes, type PropType, type SlotsType, type VNodeChild } from "vue";
import { defineComponent } from "./runtime/component";
import { tokens, type InputSize } from "@kjun-ui/tokens";
import { optionLabel, type SelectOption } from "../../../shared/package-runtime/options";
import { SearchField } from "./combobox";
import { KjunInput } from "./input";
import { useSearchInputModel } from "./runtime/selection";
import { spinnerGlyph } from "./spinner-glyph";

const kjunSearchInputProps = {
  modelValue: { type: String, default: "" },
  placeholder: { type: String, default: undefined },
  ariaLabel: { type: String, default: undefined },
  disabled: { type: Boolean, default: false },
  error: { type: Boolean, default: false },
  clearable: { type: Boolean, default: true },
  debounce: { type: Number, default: 0 },
  size: { type: String as PropType<InputSize>, default: "md" },
  /** Plain mode: the search icon turns into a spinner while results load elsewhere on the page (a table, a grid). */
  loading: { type: Boolean, default: false },
  loadOptions: { type: Function as PropType<(query: string, context: { signal: AbortSignal }) => Promise<SelectOption[]>>, default: undefined },
  itemKey: { type: String, default: "id" },
  labelField: { type: String, default: "name" },
  minChars: { type: Number, default: 2 },
  emptyText: { type: String, default: undefined },
  /** Shown when loadOptions rejects, instead of the empty text. */
  errorText: { type: String, default: undefined },
} as const;
export type KjunSearchInputProps = ExtractPublicPropTypes<typeof kjunSearchInputProps>;
/** v-model; with loadOptions it suggests results. Slot option({ option }); events select, enter, clear, search-error.
 * Other attributes (id, name, class, autofocus, focus listeners) reach the <input>; the template ref has focus() and el. */
const KjunSearchInputComponent = defineComponent({
  name: "KjunSearchInput",
  props: kjunSearchInputProps,
  emits: {
    "update:modelValue": (_value: string) => true, select: (_option: SelectOption) => true, enter: () => true,
    clear: () => true, "search-error": (_error: unknown) => true,
  },
  slots: Object as SlotsType<{ option?: (scope: { option: SelectOption }) => VNodeChild }>,
  setup(props, { slots, emit, expose }) {
    const m = useKjunMessages();
    const open = ref(false);
    const target = ref<{ focus(): void; el: HTMLInputElement | null } | null>(null);
    expose({ focus: () => target.value?.focus(), get el() { return target.value?.el ?? null; } });
    const model = useSearchInputModel(() => ({ value: props.modelValue, disabled: props.disabled, debounce: props.debounce,
      minChars: props.minChars, loadOptions: props.loadOptions }), () => open.value, {
      change: value => emit("update:modelValue", value), error: error => emit("search-error", error),
    });
    const update = (value: string) => { open.value = true; model.update(value); };
    const clear = () => { open.value = false; model.clear(); emit("clear"); };
    return () => !props.loadOptions ? (
      <KjunInput ref={target} error={props.error} modelValue={model.query.value} prefixIcon="search" size={props.size}
        ariaLabel={props.ariaLabel || (props.placeholder ?? m.value.search)} disabled={props.disabled} clearable={props.clearable}
        {...{
          // Phone keyboards show a search key in place of return.
          enterkeyhint: "search", "aria-busy": props.loading || undefined,
          placeholder: (props.placeholder ?? m.value.search), "onUpdate:modelValue": update, onClear: clear, onEnter: () => emit("enter"),
        }}>
        {props.loading ? {
          // The spinner takes the search icon's place, so the text inset does not move while results load.
          prefix: () => spinnerGlyph({ size: tokens.input[props.size].iconSize }),
        } : {}}
      </KjunInput>
    ) : (
      <SearchField ref={target} error={props.error} value={model.query.value} size={props.size} placeholder={(props.placeholder ?? m.value.search)} ariaLabel={props.ariaLabel}
        disabled={props.disabled} clearable={props.clearable} open={open.value && model.query.value.length >= props.minChars}
        onOpenChange={value => { open.value = value; }} options={model.options.value} labelKey={props.labelField} itemKey={props.itemKey}
        emptyText={(props.emptyText ?? m.value.noResults)} loading={model.loading.value} failed={model.failed.value} errorText={(props.errorText ?? m.value.searchFailed)} renderOption={slots.option}
        onValueChange={update} onSelect={option => { model.select(optionLabel(option, props.labelField)); emit("select", option); open.value = false; }}
        onClear={clear} onEnter={() => emit("enter")} {...{ enterkeyhint: "search" }} />
    );
  },
});

// setup's render-function return does not infer expose(); Vue unwraps el on template refs.
export const KjunSearchInput = KjunSearchInputComponent as typeof KjunSearchInputComponent & {
  new(): InstanceType<typeof KjunSearchInputComponent> & { focus(): void; el: HTMLInputElement | null };
};
