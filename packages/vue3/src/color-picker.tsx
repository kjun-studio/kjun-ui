import { computed, defineComponent, onBeforeUnmount, ref, useId, watch, type ExtractPublicPropTypes, type PropType, type SlotsType, type VNodeChild } from "vue";
import { tokens, type InputSize } from "@kjun-ui/tokens";
import { useKjunMessageScope } from "./runtime/messages";
import { normalizeColor, parseColor } from "../../../shared/package-runtime/color";
import {
  initialFocus, initialPickerState, normalizeSwatches, stateToValue, syncHsv, warnColorPicker, type ColorSwatchInput, type PickerState,
} from "../../../shared/package-runtime/color-picker";
import { inputTypeStyle } from "../../../shared/package-runtime/typography";
import { FloatingPanel } from "./floating-panel";
import { KjunIcon } from "./button";
import { useKjunField } from "./input";
import { css } from "./runtime/style";
import { ColorArea, ColorChannel, HexInputs, SwatchGrid } from "./color-picker-parts";

// Mirrors packages/react/src/color-picker.tsx: same DOM, classes and aria; v-model for the value and v-model:open.
export type KjunColorSwatch = ColorSwatchInput;
const kjunColorPickerProps = {
  /** v-model: uppercase #RRGGBB (#RRGGBBAA with alpha), or null for no color. Leave it out to let the picker keep its own value. */
  modelValue: { type: String as PropType<string | null>, default: undefined },
  defaultValue: { type: String as PropType<string | null>, default: null },
  /** Colors the app offers; strings or { value, label }. */
  swatches: { type: Array as PropType<KjunColorSwatch[]>, default: undefined },
  /** Saturation/brightness area and hue slider. */
  custom: { type: Boolean, default: false },
  /** Opacity slider and % field; the value always carries AA. */
  alpha: { type: Boolean, default: false },
  /** Hex field. */
  input: { type: Boolean, default: false },
  /** A "no color" swatch that sets the value to null. */
  clearable: { type: Boolean, default: false },
  /** v-model:open. */
  open: { type: Boolean, default: undefined },
  defaultOpen: { type: Boolean, default: false },
  size: { type: String as PropType<InputSize>, default: "md" },
  placeholder: { type: String, default: undefined },
  ariaLabel: { type: String, default: undefined },
  error: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  readOnly: { type: Boolean, default: false },
  /** Trigger id for an outside <label for>; defaults to the FormGroup's id. */
  id: { type: String, default: undefined },
  /** Submits the value with a form through a hidden input. */
  name: { type: String, default: undefined },
} as const;
export type KjunColorPickerProps = ExtractPublicPropTypes<typeof kjunColorPickerProps>;
const pct = (a: number) => Math.round(a * 100);

/** A field trigger that opens a panel of swatches, a saturation/brightness area, hue and alpha sliders and a hex field.
 * update:modelValue reports every change, also while dragging; change reports once per finished pick. */
export const KjunColorPicker = defineComponent({
  name: "KjunColorPicker",
  inheritAttrs: false,
  props: kjunColorPickerProps,
  emits: {
    "update:modelValue": (_value: string | null) => true,
    change: (_value: string | null) => true,
    "update:open": (_open: boolean) => true,
  },
  slots: Object as SlotsType<{ trigger: (state: { value: string | null; open: boolean }) => VNodeChild }>,
  setup(props, { emit, slots, attrs }) {
    const scope = useKjunMessageScope(), field = useKjunField();
    const inner = ref(normalizeColor(props.defaultValue, props.alpha));
    const value = computed(() => props.modelValue !== undefined ? normalizeColor(props.modelValue, props.alpha) : inner.value);
    let warned = false;
    watch(() => [props.modelValue !== undefined ? props.modelValue : props.defaultValue, props.alpha] as const, ([raw, alpha]) => {
      if (warned || alpha || typeof raw !== "string") return;
      if (parseColor(raw) && /^#?([0-9a-f]{4}|[0-9a-f]{8})$/i.test(raw.trim())) { warned = true; warnColorPicker("the value has alpha but alpha is off; it is drawn and reported without it."); }
    }, { immediate: true });
    const swatches = computed(() => normalizeSwatches(props.swatches ?? [], props.alpha));
    const nothing = computed(() => !props.custom && !props.input && !swatches.value.length && !props.clearable);
    watch(nothing, none => { if (none) warnColorPicker("turn on custom, input or clearable, or give swatches; showing the hex field."); }, { immediate: true });

    const openInner = ref(props.defaultOpen);
    const open = computed(() => (props.open ?? openInner.value) && !props.disabled && !props.readOnly);
    const setOpen = (next: boolean) => { if (props.open === undefined) openInner.value = next; emit("update:open", next); };

    const state = ref<PickerState>(syncHsv(initialPickerState, value.value, props.alpha));
    watch([value, () => props.alpha], ([next, alpha]) => { state.value = syncHsv(state.value, next, alpha); }, { flush: "sync" });
    // The latest value, so a drag's moves compare against what they reported, not against a render behind.
    let latest = value.value, dragStart: string | null = null;
    watch(value, next => { latest = next; }, { flush: "sync" });
    const change = (next: string | null) => {
      if (next === latest) return false;
      latest = next;
      if (props.modelValue === undefined) inner.value = next;
      emit("update:modelValue", next);
      return true;
    };
    const pick = (next: string | null) => { if (change(next)) emit("change", next); };
    const moveTo = (next: PickerState) => { state.value = next; change(stateToValue(next, props.alpha)); };
    const pickState = (next: PickerState) => { state.value = next; pick(stateToValue(next, props.alpha)); };
    const drag = {
      onStart: () => { dragStart = latest; },
      onEnd: () => { if (latest !== dragStart) emit("change", latest); },
    };
    const selected = computed(() => {
      const at = value.value === null ? -1 : swatches.value.findIndex(s => s.value === value.value);
      return props.clearable ? (value.value === null ? 0 : at < 0 ? -1 : at + 1) : at;
    });

    const trigger = ref<HTMLButtonElement | null>(null), valueId = useId().replace(/[^\w-]/g, "") + "-color";
    const targets = { swatches: [] as (HTMLButtonElement | null)[], area: null as HTMLElement | null, hex: null as HTMLInputElement | null };
    let frame = 0;
    watch(open, next => {
      cancelAnimationFrame(frame);
      if (!next) return;
      frame = requestAnimationFrame(() => requestAnimationFrame(() => {
        const where = initialFocus({ selectedSwatch: selected.value >= 0, custom: props.custom, input: props.input || nothing.value });
        const target = where === "swatch" ? targets.swatches[selected.value] : where === "area" ? targets.area : where === "hex" ? targets.hex : targets.swatches[0];
        target?.focus({ preventScroll: true });
      }));
    }, { immediate: true });
    onBeforeUnmount(() => cancelAnimationFrame(frame));

    return () => {
      const m = scope.value.messages, size = props.size ?? "md", spec = tokens.input[size], owner = field.value, v = value.value, s = state.value;
      const shownHex = v ? v.slice(0, 7) : "", shownAlpha = v && props.alpha ? pct(parseColor(v)!.a) : undefined;
      const spoken = v ? m.colorValue(shownHex, shownAlpha) : m.colorNone;
      const label = props.ariaLabel || props.placeholder || m.colorPlaceholder;
      const chip = tokens.extensions.colorPicker.triggerSwatch[size];
      const showInput = props.input || nothing.value;
      return (
        <>
          <div class={["kjun-select-shell kjun-color-picker", attrs.class]} style={attrs.style as never}>
            <button ref={trigger} id={props.id ?? owner?.id} type="button" class="kjun-input kjun-select-trigger kjun-color-trigger"
              {...Object.fromEntries(Object.entries(attrs).filter(([key]) => key !== "class" && key !== "style"))}
              disabled={props.disabled} aria-haspopup="dialog" aria-expanded={open.value ? "true" : "false"}
              aria-label={owner?.labelId ? undefined : label + ", " + spoken}
              aria-labelledby={owner?.labelId ? owner.labelId + " " + valueId : undefined}
              aria-describedby={owner?.describedBy} aria-invalid={props.error || !!owner?.error ? "true" : undefined} aria-required={owner?.required || undefined}
              aria-readonly={props.readOnly || undefined}
              style={css({ height: spec.height, borderRadius: spec.radius, ...inputTypeStyle(size), paddingInline: spec.padding - tokens.border.controlWidth, gap: spec.affixGap })}
              onClick={() => { if (!props.readOnly) setOpen(!open.value); }}
              onKeydown={(event: KeyboardEvent) => { if (!props.readOnly && (event.key === "ArrowDown" || event.key === "ArrowUp")) { event.preventDefault(); setOpen(true); } }}>
              {slots.trigger ? slots.trigger({ value: v, open: open.value }) : <>
                <span class={"kjun-color-chip" + (v ? " kjun-color-checker" : "")} data-none={v ? undefined : ""} aria-hidden="true" style={css({ width: chip, height: chip })}>
                  <span style={v ? { background: v.slice(0, 7), opacity: props.alpha ? parseColor(v)!.a : 1 } : undefined} />
                </span>
                <span id={valueId} class={v ? undefined : "kjun-placeholder"}>
                  {v ? <span aria-hidden="true">{shownHex}{shownAlpha !== undefined && shownAlpha < 100 && <span class="kjun-color-trigger-alpha">{shownAlpha}%</span>}</span> : props.placeholder ?? m.colorPlaceholder}
                  <span class="kjun-sr-only">{spoken}</span>
                </span>
                <KjunIcon name="chevron-down" size={spec.iconSize} style={{ flexShrink: 0, color: props.disabled ? "var(--_kjun-color-text-disabled)" : "var(--_kjun-color-text-tertiary)" }} />
              </>}
            </button>
            {props.name && <input type="hidden" name={props.name} value={v ?? ""} />}
          </div>
          <FloatingPanel field dialog open={open.value} onOpenChange={setOpen} trigger={() => trigger.value} placement="bottom-start" panelClass="kjun-color-panel"
            maxHeight={tokens.extensions.floating.maxHeight}>
            {props.custom && <ColorArea hsv={s.hsv} label={m.colorArea} valueText={m.colorAreaValue(pct(s.hsv.s), pct(s.hsv.v))}
              areaRef={el => { targets.area = el; }} onMove={hsv => moveTo({ ...state.value, hsv })} onPick={hsv => pickState({ ...state.value, hsv })} {...drag} />}
            {props.custom && <ColorChannel channel="hue" value={s.hsv.h} max={360} label={m.hue} valueText={m.hueValue(Math.round(s.hsv.h))}
              color={stateToValue({ hsv: { h: s.hsv.h, s: 1, v: 1 }, a: 1 }, false)}
              onMove={hue => moveTo({ ...state.value, hsv: { ...state.value.hsv, h: hue } })} onPick={hue => pickState({ ...state.value, hsv: { ...state.value.hsv, h: hue } })} {...drag} />}
            {props.alpha && <ColorChannel channel="alpha" value={pct(s.a)} max={100} label={m.alpha} valueText={pct(s.a) + "%"} color={stateToValue(s, false)}
              onMove={a => moveTo({ ...state.value, a: a / 100 })} onPick={a => pickState({ ...state.value, a: a / 100 })} {...drag} />}
            {showInput && <HexInputs value={v} alpha={props.alpha} alphaPercent={pct(s.a)} clearable={props.clearable} hexLabel={m.hex} alphaLabel={m.alpha}
              onPick={pick} hexRef={el => { targets.hex = el; }} />}
            {(swatches.value.length > 0 || props.clearable) && <SwatchGrid swatches={swatches.value} clearable={props.clearable} selected={selected.value}
              label={m.swatches} noneLabel={m.colorNone} onPick={pick} swatchRef={(index, el) => { targets.swatches[index] = el; }} />}
          </FloatingPanel>
        </>
      );
    };
  },
});
