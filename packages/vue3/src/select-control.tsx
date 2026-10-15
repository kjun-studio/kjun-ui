import { computed, defineComponent, inject, nextTick, ref, shallowRef, watch, type ExtractPublicPropTypes, type PropType, type VNode, type VNodeChild, type SlotsType } from "vue";
import { tokens, type InputSize } from "@kjun-ui/tokens";
import { inputTypeStyle } from "../../../shared/package-runtime/typography";
import { isFocusVisible } from "../../../shared/package-runtime/focus-visible";
import { optionDisabled, optionLabel, selectOptions, type OptionValue, type SelectOption } from "../../../shared/package-runtime/options";
import { KjunButton, KjunIcon } from "./button";
import { KjunSpinner } from "./display";
import { FloatingPanel } from "./floating-panel";
import { KjunFieldReset, KjunInput, useCompositionGuard, useKjunField, useKjunId } from "./input";
import { kjunCompoundControlKey } from "./quantity-stepper";
import { usePopupExpanded } from "./runtime/layers";
import { useSelectState } from "./runtime/selection";
import { css } from "./runtime/style";

export type { OptionValue, SelectOption };
type SelectValue = OptionValue | OptionValue[] | null;

const kjunSelectProps = {
  modelValue: { type: [String, Number, Array, null] as PropType<SelectValue>, default: null },
  options: { type: Array as PropType<SelectOption[]>, default: () => [] },
  placeholder: { type: String, default: "선택" },
  ariaLabel: { type: String, default: undefined },
  labelKey: { type: String, default: "label" },
  valueKey: { type: String, default: "value" },
  size: { type: String as PropType<InputSize>, default: "md" },
  disabled: { type: Boolean, default: false },
  searchable: { type: Boolean, default: false },
  open: { type: Boolean, default: undefined },
  loading: { type: Boolean, default: false },
  searchPlaceholder: { type: String, default: "검색..." },
  optionPageSize: { type: Number, default: 0 },
  clearable: { type: Boolean, default: false },
  multiple: { type: Boolean, default: false },
  error: { type: Boolean, default: false },
} as const;
export type KjunSelectProps = ExtractPublicPropTypes<typeof kjunSelectProps>;
/**
 * v-model (a value, or an array with `multiple`), optional v-model:open.
 * Slots: option({ option, selected }), selected({ option }), menuHeader. Events: change, search, clear.
 */
export const KjunSelect = defineComponent({
  name: "KjunSelect",
  props: kjunSelectProps,
  emits: {
    "update:modelValue": (_value: SelectValue) => true, change: (_value: SelectValue) => true,
    "update:open": (_open: boolean) => true, search: (_query: string) => true, clear: () => true,
  },
  slots: Object as SlotsType<{
    option?: (scope: { option: SelectOption; selected: boolean }) => VNodeChild;
    selected?: (scope: { option: SelectOption | undefined }) => VNodeChild;
    menuHeader?: () => VNodeChild;
  }>,
  setup(props, { slots, emit, expose }) {
    const state = useSelectState(() => props.open, () => props.disabled, () => props.optionPageSize, value => emit("update:open", value));
    const composition = useCompositionGuard();
    const trigger = ref<HTMLButtonElement | null>(null), menu = ref<HTMLElement | null>(null);
    const field = useKjunField(), id = useKjunId("kjun-");
    const segment = inject(kjunCompoundControlKey, null);
    const expanded = usePopupExpanded(() => state.open.value, () => trigger.value);
    const focused = shallowRef<string | null>(null), focusVisible = ref(false);
    const change = (value: SelectValue) => { emit("update:modelValue", value); emit("change", value); };
    const model = computed(() => selectOptions({ options: props.options, value: props.modelValue, labelKey: props.labelKey, valueKey: props.valueKey,
      query: state.query.value, pageSize: props.optionPageSize, limit: state.limit.value, loading: props.loading, multiple: props.multiple }));
    const optionElements = () => [...(menu.value?.querySelectorAll<HTMLElement>('[role="option"]:not([aria-disabled="true"])') ?? [])];
    const focusOption = (element: HTMLElement | undefined) => {
      if (!element) return;
      focused.value = element.dataset.key ?? null;
      focusVisible.value = isFocusVisible();
      element.focus({ preventScroll: true });
      element.scrollIntoView({ block: "nearest" });
    };
    // react-aria's autoFocus="first": the selected option, or the first one; a searchable list focuses its input.
    watch(menu, element => {
      if (!element) return;
      nextTick(() => {
        if (!state.open.value) return;
        if (props.searchable) { element.querySelector("input")?.focus({ preventScroll: true }); return; }
        const list = optionElements();
        focusOption(list.find(option => option.getAttribute("aria-selected") === "true") ?? list[0]);
      });
    }, { flush: "post" });
    watch(state.open, value => { if (!value) { focused.value = null; composition.onCompositionend(); } });
    let typed = "", typedAt = 0;
    const listKeydown = (event: KeyboardEvent) => {
      const list = optionElements(), current = list.indexOf(document.activeElement as HTMLElement);
      const go = (index: number) => { event.preventDefault(); focusOption(list[index]); };
      if (event.key === "ArrowDown") go(current < 0 ? 0 : Math.min(list.length - 1, current + 1));
      else if (event.key === "ArrowUp") go(current < 0 ? list.length - 1 : Math.max(0, current - 1));
      else if (event.key === "Home" || event.key === "PageUp") go(0);
      else if (event.key === "End" || event.key === "PageDown") go(list.length - 1);
      else if (event.key === "Enter" || event.key === " ") { if (current >= 0) { event.preventDefault(); list[current].click(); } }
      else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
        const now = Date.now();
        typed = (now - typedAt > 1000 ? "" : typed) + event.key.toLocaleLowerCase();
        typedAt = now;
        const start = Math.max(0, current), order = [...list.slice(start), ...list.slice(0, start)];
        const match = order.find(option => (option.textContent || "").trim().toLocaleLowerCase().startsWith(typed));
        if (match) go(list.indexOf(match));
      }
    };
    expose({ focus: () => trigger.value?.focus() });
    return () => {
      const spec = tokens.input[props.size], owner = field.value;
      const { selected, matching, visible, selectedOption, label, nextValue } = model.value;
      const open = state.open.value;
      const shown = slots.selected?.({ option: selectedOption }) as VNode[] | undefined;
      return (
        <>
          <div class="kjun-select-shell">
            <button ref={trigger} id={owner?.id} type="button" class="kjun-input kjun-select-trigger" data-time-segment={segment ? "true" : undefined}
              disabled={props.disabled} aria-haspopup="listbox" aria-controls={expanded.value ? id : undefined} aria-expanded={expanded.value}
              aria-label={props.ariaLabel || props.placeholder} aria-labelledby={owner?.labelId} aria-describedby={owner?.describedBy}
              aria-invalid={props.error || !!owner?.error ? "true" : undefined}
              style={css({ height: spec.height, borderRadius: spec.radius, ...inputTypeStyle(props.size),
                // Time segments take their padding from compound-controls.css, which also aligns the first value.
                ...(segment ? {} : { paddingInline: spec.padding - tokens.border.controlWidth }) })}
              onClick={() => state.changeOpen(!open)}
              onKeydown={(event: KeyboardEvent) => { if (["ArrowDown", "ArrowUp"].includes(event.key)) { event.preventDefault(); state.changeOpen(true); } }}>
              <span class={!label ? "kjun-placeholder" : undefined}
                style={css({ flex: 1, paddingRight: props.clearable && label ? spec.clearSize + spec.affixGap : undefined })}>
                {shown?.length ? shown : label || props.placeholder}
              </span>
              <KjunIcon name="chevron-down" class="kjun-select-indicator" data-open={expanded.value || undefined}
                size={segment ? tokens.extensions.timePicker.iconSize : spec.iconSize}
                style={{ flexShrink: 0, color: props.disabled ? "var(--_kjun-color-text-disabled)" : "var(--_kjun-color-text-tertiary)" }} />
            </button>
            {props.clearable && !!label && (
              <KjunButton size="sm" variant="ghost" ariaLabel="선택 지우기" disabled={props.disabled} class="kjun-select-clear"
                style={css({ padding: 0, right: spec.padding + spec.iconSize + spec.affixGap, width: spec.clearSize, height: spec.clearSize, minHeight: spec.clearSize, borderRadius: "50%" })}
                onClick={() => { change(props.multiple ? [] : null); emit("clear"); trigger.value?.focus(); }}>
                <KjunIcon name="x" size={spec.iconSize} />
              </KjunButton>
            )}
          </div>
          <FloatingPanel field open={open} onOpenChange={state.changeOpen} trigger={() => trigger.value} placement="bottom-start" matchTriggerWidth
            panelClass="kjun-select-panel kjun-select-options-panel">
            <KjunFieldReset>
              <div ref={menu} class="kjun-select-content">
                {slots.menuHeader && <div class="kjun-select-header">{slots.menuHeader()}</div>}
                {props.searchable && (
                  <div class="kjun-select-search">
                    <KjunInput modelValue={state.query.value} ariaLabel="선택 항목 검색" size="sm" prefixIcon="search"
                      {...{
                        placeholder: props.searchPlaceholder,
                        "onUpdate:modelValue": (value: string) => { state.search(value); emit("search", value); },
                        onCompositionstart: composition.onCompositionstart,
                        onCompositionend: composition.onCompositionend,
                        onKeydown: (event: KeyboardEvent) => {
                          if (composition.isComposing(event)) { event.stopPropagation(); return; }
                          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
                            event.preventDefault();
                            const list = optionElements();
                            focusOption(list[event.key === "ArrowDown" ? 0 : list.length - 1]);
                          }
                        },
                      }} />
                  </div>
                )}
                {props.loading && <div class="kjun-select-empty"><KjunSpinner size="sm" text="검색 중..." /></div>}
                <div key={state.session.value} id={id} class="kjun-listbox" aria-label={props.ariaLabel || props.placeholder} role="listbox"
                  aria-orientation="vertical" aria-multiselectable={props.multiple ? "true" : undefined} tabindex={-1} onKeydown={listKeydown}>
                  {visible.map(({ option, key }) => {
                    const isSelected = selected(option), disabled = optionDisabled(option), isFocused = focused.value === String(key);
                    const content: VNodeChild = slots.option?.({ option, selected: isSelected });
                    return (
                      <div key={key} data-key={String(key)} class="kjun-option" role="option" aria-selected={isSelected}
                        aria-disabled={disabled ? "true" : undefined} tabindex={disabled ? undefined : isFocused ? 0 : -1}
                        data-focused={isFocused || undefined} data-focus-visible={(isFocused && focusVisible.value) || undefined}
                        onFocus={(event: FocusEvent) => { focused.value = String(key); focusVisible.value = isFocusVisible(); void event; }}
                        onPointermove={(event: PointerEvent) => {
                          if (disabled || document.activeElement === event.currentTarget) return;
                          focused.value = String(key); focusVisible.value = false;
                          (event.currentTarget as HTMLElement).focus({ preventScroll: true });
                        }}
                        onClick={() => {
                          if (disabled) return;
                          change(nextValue(option));
                          if (!props.multiple) state.changeOpen(false);
                        }}>
                        {(Array.isArray(content) ? content.length : content) ? content : <span>{optionLabel(option, props.labelKey)}</span>}
                        {isSelected && <KjunIcon name="check" size={tokens.extensions.menu.iconSize} />}
                      </div>
                    );
                  })}
                </div>
                {!props.loading && !matching.length && <div class="kjun-select-empty">결과가 없습니다</div>}
                {!props.loading && visible.length < matching.length && (
                  <KjunButton size="sm" variant="ghost" block onClick={state.showMore}>더 보기</KjunButton>
                )}
              </div>
            </KjunFieldReset>
          </FloatingPanel>
        </>
      );
    };
  },
});
