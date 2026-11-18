import { computed, onBeforeUnmount, onBeforeUpdate, onMounted, ref, useId, watch, watchEffect, type ExtractPublicPropTypes, type PropType, type SlotsType, type VNodeChild } from "vue";
import { defineComponent } from "./runtime/component";
import { tokens, type InputSize } from "@kjun-ui/tokens";
import { useKjunMessageScope } from "./runtime/messages";
import { normalizeColor } from "../../../shared/package-runtime/color";
import {
  coarsePointer, colorName, createPickerWarnings, initialFocusTarget, initialPickerState, normalizeSwatches, pickerSummary, selectedSwatchIndex, stateToValue, swatchItems, syncHsv,
  type ColorSwatchInput, type PickerState,
} from "../../../shared/package-runtime/color-picker";
import { createCommitSession, eyeDropperSupported, nextRecentColors, pickScreenColor, recentColorItems } from "../../../shared/package-runtime/color-picker-model";
import { inputTypeStyle } from "../../../shared/package-runtime/typography";
import { FloatingPanel } from "./floating-panel";
import { KjunIcon } from "./button";
import { useKjunField } from "./input";
import { css } from "./runtime/style";
import { ColorArea, ColorChannel, ColorInputs, SwatchGrid, SwatchGroup } from "./color-picker-parts";

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
  /** v-model:recentColors: recent colors the app keeps (strings or { value, label }); giving it shows a "recent" row of up to 8 under the swatches,
   * leaving out colors the swatches already offer.
   * When the panel closes on a new value, update:recentColors brings the next list: that value first, at most 8. */
  recentColors: { type: Array as PropType<KjunColorSwatch[]>, default: undefined },
  /** A button that picks a color from the screen, where the browser has an EyeDropper (Chromium desktop); hidden elsewhere. */
  eyeDropper: { type: Boolean, default: false },
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
  /** Draws the panel in the page flow, without a trigger: a filled 240px block for settings screens. open, size, placeholder,
   * variant and the trigger slot do not apply. Recent colors move after each finished pick that did not come from the recent row. */
  inline: { type: Boolean, default: false },
  /** "swatch" draws a square color button as tall as the field (for toolbars) instead of the field trigger. */
  variant: { type: String as PropType<"field" | "swatch">, default: "field" },
  /** With variant="swatch": an icon over a bar of the color, on a clear button (a text-color tool). */
  icon: { type: String, default: undefined },
} as const;
export type KjunColorPickerProps = ExtractPublicPropTypes<typeof kjunColorPickerProps>;
const pct = (a: number) => Math.round(a * 100);

/** A field trigger that opens a panel of swatches, a saturation/brightness area, hue and alpha sliders and a hex field.
 * update:modelValue reports every change, also while dragging; change reports once per finished pick (a hex or % field on Enter or leaving it). */
export const KjunColorPicker = defineComponent({
  name: "KjunColorPicker",
  inheritAttrs: false,
  props: kjunColorPickerProps,
  emits: {
    "update:modelValue": (_value: string | null) => true,
    change: (_value: string | null) => true,
    "update:open": (_open: boolean) => true,
    "update:recentColors": (_colors: string[]) => true,
  },
  slots: Object as SlotsType<{ trigger: (state: { value: string | null; open: boolean }) => VNodeChild }>,
  setup(props, { emit, slots, attrs }) {
    const scope = useKjunMessageScope(), field = useKjunField();
    const inner = ref(normalizeColor(props.defaultValue, props.alpha));
    const value = computed(() => props.modelValue !== undefined ? normalizeColor(props.modelValue, props.alpha) : inner.value);
    const swatches = computed(() => normalizeSwatches(props.swatches ?? [], props.alpha));
    const recent = computed(() => props.recentColors === undefined ? null : recentColorItems(props.recentColors, props.alpha, swatches.value));
    const nothing = computed(() => !props.custom && !props.input && !swatches.value.length && !props.clearable);
    const warn = createPickerWarnings();
    watchEffect(() => warn({ raw: props.modelValue !== undefined ? props.modelValue : props.defaultValue, alpha: props.alpha, swatches: props.swatches, nothing: nothing.value }));

    const openInner = ref(props.defaultOpen);
    const open = computed(() => !props.inline && (props.open ?? openInner.value) && !props.disabled && !props.readOnly);
    const setOpen = (next: boolean) => { if (props.open === undefined) openInner.value = next; emit("update:open", next); };

    const state = ref<PickerState>(syncHsv(initialPickerState, value.value, props.alpha));
    watch([value, () => props.alpha], ([next, alpha]) => { state.value = syncHsv(state.value, next, alpha); }, { flush: "sync" });
    // The latest value, so moves within one pick compare against what they reported, not against a render behind.
    let latest = value.value;
    watch(value, next => { latest = next; }, { flush: "sync" });
    // Like React: a controlled parent that keeps its value pulls latest back on the next render.
    onBeforeUpdate(() => { latest = value.value; });
    const session = createCommitSession(() => latest);
    const change = (next: string | null) => {
      if (next === latest) return false;
      latest = next;
      if (props.modelValue === undefined) inner.value = next;
      emit("update:modelValue", next);
      return true;
    };
    /** An inline panel moves recent colors once a pick finishes; a pick from the recent row leaves the row where it is. */
    const committed = (next: string | null, fromRecent = false) => {
      emit("change", next);
      if (!props.inline || fromRecent || props.recentColors === undefined) return;
      const list = nextRecentColors(props.recentColors, next, props.alpha);
      if (list) emit("update:recentColors", list);
    };
    const pick = (next: string | null, fromRecent = false) => { if (change(next)) committed(next, fromRecent); };
    const pickRecent = (next: string | null) => pick(next, true);
    const endSession = () => { if (session.end()) committed(latest); };
    const moveTo = (next: PickerState) => { state.value = next; change(stateToValue(next, props.alpha)); };
    const pickState = (next: PickerState) => { state.value = next; pick(stateToValue(next, props.alpha)); };
    const drag = { onStart: () => session.begin(), onEnd: endSession };
    const onEdit = (live: string | null) => { session.begin(); if (live !== null) change(live); };
    const onCommit = (next: string | null | "revert") => { if (next !== "revert") change(next); endSession(); };
    const selected = computed(() => selectedSwatchIndex(value.value, swatches.value, props.clearable));

    const canPickScreen = ref(false);
    onMounted(() => { canPickScreen.value = props.eyeDropper && eyeDropperSupported(); });
    watch(() => props.eyeDropper, on => { canPickScreen.value = on && eyeDropperSupported(); });
    let unmounted = false;
    onBeforeUnmount(() => { unmounted = true; });
    const pickFromScreen = async () => { const next = await pickScreenColor(props.alpha, latest); if (next && !unmounted) pick(next); };

    const trigger = ref<HTMLButtonElement | null>(null), uid = useId().replace(/[^\w-]/g, ""), valueId = uid + "-color", nameId = uid + "-color-name";
    const targets = { swatches: [] as (HTMLButtonElement | null)[], area: null as HTMLElement | null, hex: null as HTMLInputElement | null };
    let frame = 0, openedWith: string | null | undefined;
    watch(open, next => {
      cancelAnimationFrame(frame);
      if (!next) {
        // Closing ends an edit a field had not committed yet (Escape while typing): the change commits once, before recent colors move.
        endSession();
        // Recent colors move when the panel closes on a new value, so the row never reorders under the pointer.
        const start = openedWith;
        openedWith = undefined;
        if (start === undefined || props.recentColors === undefined || latest === start) return;
        const list = nextRecentColors(props.recentColors, latest, props.alpha);
        if (list) emit("update:recentColors", list);
        return;
      }
      openedWith = latest;
      frame = requestAnimationFrame(() => requestAnimationFrame(() => {
        // Someone already put focus on a control (clicked a field in the panel): leave it there.
        if (trigger.value?.ownerDocument.activeElement?.matches('input, textarea, [role="slider"], [role="radio"]')) return;
        initialFocusTarget(targets, { selected: selected.value, custom: props.custom, input: props.input || nothing.value })?.focus({ preventScroll: true });
      }));
    }, { immediate: true });
    onBeforeUnmount(() => cancelAnimationFrame(frame));

    return () => {
      const m = scope.value.messages, size = props.size ?? "md", spec = tokens.input[size], owner = field.value, v = value.value, s = state.value;
      const summary = pickerSummary(v, props.alpha, m, colorName(v, [swatches.value, recent.value ?? []])), spoken = summary.spoken;
      const percent = summary.percent !== undefined && summary.percent < 100 ? summary.percent + "%" : "";
      const detail = summary.name ? summary.hex + (percent && " " + percent) : percent;
      const grid = (swatches.value.length > 0 || props.clearable) && { items: swatchItems(swatches.value, props.clearable, m.colorNone), selected: selected.value,
        label: m.swatches, onPick: (next: string | null) => pick(next), swatchRef: (index: number, el: HTMLButtonElement | null) => { targets.swatches[index] = el; } };
      const recentRow = recent.value && recent.value.length > 0 && { items: recent.value, selected: recent.value.findIndex(item => item.value === v), label: m.recentColors, onPick: pickRecent };
      const label = props.ariaLabel || props.placeholder || m.colorPlaceholder;
      const chip = tokens.extensions.colorPicker.triggerSwatch[size];
      const showInput = props.input || nothing.value;
      const swatch = props.variant === "swatch";
      const rest = Object.fromEntries(Object.entries(attrs).filter(([key]) => key !== "class" && key !== "style"));
      const body = <>
        {props.custom && <ColorArea hsv={s.hsv} label={m.colorArea} valueText={m.colorAreaValue(pct(s.hsv.s), pct(s.hsv.v))} empty={v === null} hint={m.colorAreaHint}
          areaRef={el => { targets.area = el; }} onMove={hsv => moveTo({ ...state.value, hsv })} onPick={hsv => pickState({ ...state.value, hsv })} {...drag} />}
        {props.custom && <ColorChannel channel="hue" value={s.hsv.h} max={360} label={m.hue} valueText={m.hueValue(Math.round(s.hsv.h))}
          color={stateToValue({ hsv: { h: s.hsv.h, s: 1, v: 1 }, a: 1 }, false)}
          onMove={hue => moveTo({ ...state.value, hsv: { ...state.value.hsv, h: hue } })} onPick={hue => pickState({ ...state.value, hsv: { ...state.value.hsv, h: hue } })} {...drag} />}
        {props.alpha && <ColorChannel channel="alpha" value={pct(s.a)} max={100} label={m.alpha} valueText={pct(s.a) + "%"} color={stateToValue(s, false)}
          onMove={a => moveTo({ ...state.value, a: a / 100 })} onPick={a => pickState({ ...state.value, a: a / 100 })} {...drag} />}
        {(showInput || canPickScreen.value) && <ColorInputs fields={showInput} value={v} alpha={props.alpha} alphaPercent={pct(s.a)} clearable={props.clearable}
          hexLabel={m.hex} alphaLabel={m.alpha} eyeDropper={canPickScreen.value ? { label: m.eyeDropper, onPick: pickFromScreen } : null}
          onEdit={onEdit} onCommit={onCommit} hexRef={el => { targets.hex = el; }} />}
        {(grid || recentRow) && <div class="kjun-color-section">
          {grid && (recentRow ? <SwatchGroup caption={m.swatches} {...grid} /> : <SwatchGrid {...grid} />)}
          {recentRow && <SwatchGroup caption={m.recentColors} {...recentRow} />}
        </div>}
      </>;

      if (props.inline) return (
        <div {...rest} id={props.id ?? owner?.id} role="group" class={["kjun-color-panel kjun-color-inline", attrs.class]} style={attrs.style as never}
          aria-label={owner?.labelId ? undefined : label} aria-labelledby={owner?.labelId} aria-describedby={owner?.describedBy}
          data-disabled={props.disabled ? "true" : undefined} data-readonly={props.readOnly ? "true" : undefined} inert={props.disabled || props.readOnly || undefined}>
          {body}
          {props.name && <input type="hidden" name={props.name} value={v ?? ""} />}
        </div>
      );

      const fill = <span style={v ? { background: summary.hex, opacity: summary.opacity } : undefined} />;
      const content = slots.trigger ? <>{slots.trigger({ value: v, open: open.value })}<span id={valueId} class="kjun-sr-only">{spoken}</span></>
        : swatch && props.icon ? <span class="kjun-color-tool" aria-hidden="true">
            <KjunIcon name={props.icon} size={spec.iconSize} />
            <span class={"kjun-color-indicator" + (v ? " kjun-color-checker" : "")} data-none={v ? undefined : ""}>{fill}</span>
            <span id={valueId} class="kjun-sr-only">{spoken}</span>
          </span>
        : <>
          <span class={"kjun-color-chip" + (v ? " kjun-color-checker" : "")} data-none={v ? undefined : ""} aria-hidden="true" style={css({ width: chip, height: chip })}>{fill}</span>
          {swatch ? <span id={valueId} class="kjun-sr-only">{spoken}</span> : <span id={valueId} class={v ? undefined : "kjun-placeholder"}>
            {v ? <span aria-hidden="true">{summary.name ?? summary.hex}{detail && <span class="kjun-color-trigger-alpha">{detail}</span>}</span> : props.placeholder ?? m.colorPlaceholder}
            <span class="kjun-sr-only">{spoken}</span>
          </span>}
          {!swatch && <KjunIcon name="chevron-down" size={spec.iconSize} style={{ flexShrink: 0, color: props.disabled ? "var(--_kjun-color-text-disabled)" : "var(--_kjun-color-text-tertiary)" }} />}
        </>;
      return (
        <>
          <div class={["kjun-select-shell kjun-color-picker", attrs.class]} data-variant={swatch ? "swatch" : undefined} style={attrs.style as never}>
            <button ref={trigger} id={props.id ?? owner?.id} type="button" class="kjun-input kjun-select-trigger kjun-color-trigger" {...rest}
              data-variant={swatch ? (props.icon ? "tool" : "swatch") : undefined}
              disabled={props.disabled} aria-haspopup="dialog" aria-expanded={open.value ? "true" : "false"}
              aria-label={owner?.labelId ? undefined : label + ", " + spoken}
              aria-labelledby={owner?.labelId ? owner.labelId + " " + valueId : undefined}
              aria-describedby={owner?.describedBy} aria-invalid={props.error || !!owner?.error ? "true" : undefined} aria-required={owner?.required || undefined}
              aria-readonly={props.readOnly || undefined}
              style={css(swatch ? { width: spec.height, height: spec.height, borderRadius: spec.radius, padding: 0 }
                : { height: spec.height, borderRadius: spec.radius, ...inputTypeStyle(size), paddingInline: spec.padding - tokens.border.controlWidth, gap: spec.affixGap })}
              onClick={() => { if (!props.readOnly) setOpen(!open.value); }}
              onKeydown={(event: KeyboardEvent) => { if (!props.readOnly && (event.key === "ArrowDown" || event.key === "ArrowUp")) { event.preventDefault(); setOpen(true); } }}>
              {content}
            </button>
            {/* Names the panel: the FormGroup label, or this. */}
            <span id={nameId} hidden>{label}</span>
            {props.name && <input type="hidden" name={props.name} value={v ?? ""} />}
          </div>
          <FloatingPanel field dialog open={open.value} onOpenChange={setOpen} trigger={() => trigger.value} placement="bottom-start" panelClass="kjun-color-panel" matchTriggerWidth={!swatch && coarsePointer()}
            maxHeight={tokens.extensions.floating.maxHeight} labelledBy={owner?.labelId ?? nameId}>
            {body}
          </FloatingPanel>
        </>
      );
    };
  },
});
