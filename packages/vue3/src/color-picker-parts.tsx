import { defineComponent, ref, watch, watchEffect, type PropType } from "vue";
import { tokens } from "@kjun-ui/tokens";
import { formatColor, hsvToRgb, readableInk, type Hsv } from "../../../shared/package-runtime/color";
import { channelKey, colorAreaKey, hexDraft, hexWithAlpha } from "../../../shared/package-runtime/color-picker";
import { bindRadioKeyboard } from "../../../shared/package-runtime/radio-keyboard";
import { inputTypeStyle } from "../../../shared/package-runtime/typography";
import { KjunIcon } from "./button";
import { css } from "./runtime/style";

// Mirrors packages/react/src/color-picker-parts.tsx: same DOM, classes and aria.
const fraction = (value: number, start: number, length: number) => Math.min(1, Math.max(0, (value - start) / length));

/** Pointer drag on an element: moves report on every step, and release or cancel ends the drag once. */
function drag(onMove: (x: number, y: number) => void, onStart: () => void, onEnd: () => void) {
  let active = false;
  const at = (event: PointerEvent) => {
    const box = (event.currentTarget as HTMLElement).getBoundingClientRect();
    onMove(fraction(event.clientX, box.left, box.width), fraction(event.clientY, box.top, box.height));
  };
  const end = (event: PointerEvent) => {
    if (!active) return;
    active = false;
    const el = event.currentTarget as HTMLElement;
    if (el.hasPointerCapture?.(event.pointerId)) el.releasePointerCapture(event.pointerId);
    onEnd();
  };
  return {
    onPointerdown: (event: PointerEvent) => {
      if (event.button !== 0) return;
      event.preventDefault();
      active = true;
      const el = event.currentTarget as HTMLElement;
      el.setPointerCapture?.(event.pointerId);
      el.focus({ preventScroll: true });
      onStart();
      at(event);
    },
    onPointermove: (event: PointerEvent) => { if (active) at(event); },
    onPointerup: end,
    onPointercancel: end,
    onLostpointercapture: end,
  };
}

const rgb = (hsv: Hsv) => formatColor(hsvToRgb(hsv), false);
const percent = (n: number) => Math.round(n * 100);
type Fn<T> = (value: T) => void;
const dragProps = <T,>() => ({
  onMove: { type: Function as PropType<Fn<T>>, required: true },
  onPick: { type: Function as PropType<Fn<T>>, required: true },
  onStart: { type: Function as PropType<() => void>, required: true },
  onEnd: { type: Function as PropType<() => void>, required: true },
}) as const;

export const ColorArea = defineComponent({
  name: "KjunColorArea",
  props: {
    hsv: { type: Object as PropType<Hsv>, required: true }, label: { type: String, required: true }, valueText: { type: String, required: true },
    areaRef: { type: Function as PropType<(el: HTMLElement | null) => void>, required: true }, ...dragProps<Hsv>(),
  },
  setup(props) {
    const handlers = drag((x, y) => props.onMove({ ...props.hsv, s: x, v: 1 - y }), () => props.onStart(), () => props.onEnd());
    return () => {
      const hsv = props.hsv;
      return (
        <div ref={el => props.areaRef(el as HTMLElement | null)} class="kjun-color-area" role="slider" tabindex={0} aria-label={props.label} aria-roledescription={props.label}
          aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent(hsv.s)} aria-valuetext={props.valueText}
          style={{ "--_kjun-color-picker-hue": rgb({ h: hsv.h, s: 1, v: 1 }) }}
          onKeydown={(event: KeyboardEvent) => {
            const next = colorAreaKey(event.key, event.shiftKey, hsv);
            if (!next) return;
            event.preventDefault();
            props.onPick(next);
          }}
          {...handlers}>
          <span class="kjun-color-thumb" style={{ left: percent(hsv.s) + "%", top: 100 - percent(hsv.v) + "%" }}>
            <span style={{ background: rgb(hsv) }} />
          </span>
        </div>
      );
    };
  },
});

export const ColorChannel = defineComponent({
  name: "KjunColorChannel",
  props: {
    channel: { type: String as PropType<"hue" | "alpha">, required: true }, value: { type: Number, required: true }, max: { type: Number, required: true },
    label: { type: String, required: true }, valueText: { type: String, required: true }, color: { type: String, required: true }, ...dragProps<number>(),
  },
  setup(props) {
    const handlers = drag(x => props.onMove(Math.round(x * props.max)), () => props.onStart(), () => props.onEnd());
    return () => {
      const alpha = props.channel === "alpha";
      return (
        <div class={"kjun-color-channel" + (alpha ? " kjun-color-checker" : "")} data-channel={props.channel} role="slider" tabindex={0}
          aria-label={props.label} aria-valuemin={0} aria-valuemax={props.max} aria-valuenow={Math.round(props.value)} aria-valuetext={props.valueText}
          style={{ "--_kjun-color-picker-current": props.color }}
          onKeydown={(event: KeyboardEvent) => {
            const next = channelKey(event.key, event.shiftKey, props.value, props.max);
            if (next === null) return;
            event.preventDefault();
            props.onPick(next);
          }}
          {...handlers}>
          {alpha && <i />}
          <span class="kjun-color-thumb" style={{ left: (props.value / props.max) * 100 + "%" }}>
            <span class={alpha ? "kjun-color-checker" : undefined} style={{ position: "relative", overflow: "hidden" }}>
              <span style={{ position: "absolute", inset: 0, background: props.color, opacity: alpha ? props.value / props.max : 1 }} />
            </span>
          </span>
        </div>
      );
    };
  },
});

export const SwatchGrid = defineComponent({
  name: "KjunColorSwatchGrid",
  props: {
    swatches: { type: Array as PropType<{ value: string; label: string }[]>, required: true }, clearable: { type: Boolean, required: true },
    selected: { type: Number, required: true }, label: { type: String, required: true }, noneLabel: { type: String, required: true },
    onPick: { type: Function as PropType<(value: string | null) => void>, required: true },
    swatchRef: { type: Function as PropType<(index: number, el: HTMLButtonElement | null) => void>, required: true },
  },
  setup(props) {
    const group = ref<HTMLDivElement | null>(null);
    watchEffect(onCleanup => { if (group.value) onCleanup(bindRadioKeyboard(group.value)); }, { flush: "post" });
    return () => {
      const items = [...(props.clearable ? [{ value: null as string | null, label: props.noneLabel }] : []), ...props.swatches];
      const icon = tokens.extensions.colorPicker.swatchSize * 2 / 3;
      return (
        <div ref={group} class="kjun-color-swatches" role="radiogroup" aria-label={props.label}>
          {items.map((item, index) => {
            const checked = index === props.selected;
            return (
              <button key={index} ref={el => props.swatchRef(index, el as HTMLButtonElement | null)} type="button" role="radio" aria-checked={checked ? "true" : "false"}
                aria-label={item.label} class="kjun-color-swatch" data-selected={checked ? "true" : undefined} data-ink={item.value ? readableInk(item.value) : undefined}
                onClick={() => props.onPick(item.value)}>
                <span class={"kjun-color-chip" + (item.value ? " kjun-color-checker" : "")} data-none={item.value ? undefined : ""}>
                  <span style={item.value ? { background: item.value } : undefined} />
                </span>
                {checked && item.value && <KjunIcon name="check" size={icon} />}
              </button>
            );
          })}
        </div>
      );
    };
  },
});

/** The hex field and, with alpha, the % field. A complete code picks at once; Enter or leaving picks a short code or reverts. */
export const HexInputs = defineComponent({
  name: "KjunColorHexInputs",
  props: {
    value: { type: String as PropType<string | null>, default: null }, alpha: { type: Boolean, required: true }, alphaPercent: { type: Number, required: true },
    clearable: { type: Boolean, required: true }, hexLabel: { type: String, required: true }, alphaLabel: { type: String, required: true },
    onPick: { type: Function as PropType<(value: string | null) => void>, required: true },
    hexRef: { type: Function as PropType<(el: HTMLInputElement | null) => void>, required: true },
  },
  setup(props) {
    const shown = () => props.value ? props.value.slice(1, 7) : "";
    const text = ref(shown()), pct = ref(String(props.alphaPercent));
    let editing: "hex" | "alpha" | null = null;
    watch(shown, next => { if (editing !== "hex") text.value = next; });
    watch(() => props.alphaPercent, next => { if (editing !== "alpha") pct.value = String(next); });
    const withAlpha = (six: string) => props.alpha ? six + (props.value ? props.value.slice(7, 9) : "FF") : six;
    const commitHex = () => {
      editing = null;
      const draft = hexDraft(hexWithAlpha(text.value, props.alpha, props.value ? props.value.slice(7, 9) || "FF" : "FF"), props.alpha);
      if (draft.commit === "revert" || (draft.commit === null && !props.clearable)) { text.value = shown(); return; }
      props.onPick(draft.commit);
      text.value = draft.commit ? draft.commit.slice(1, 7) : "";
    };
    const alphaHex = (n: number) => Math.round(n / 100 * 255).toString(16).toUpperCase().padStart(2, "0");
    const validPct = (t: string) => /^\d{1,3}$/.test(t) && Number(t) <= 100;
    const commitPct = () => {
      editing = null;
      if (!validPct(pct.value) || !props.value) { pct.value = String(props.alphaPercent); return; }
      props.onPick(props.value.slice(0, 7) + alphaHex(Number(pct.value)));
    };
    const keys = (commit: () => void) => (event: KeyboardEvent) => { if (event.key === "Enter") { event.preventDefault(); commit(); } };
    return () => {
      const field = tokens.input.sm;
      const style = css({ height: field.height, borderRadius: field.radius, paddingInline: field.padding - tokens.border.controlWidth, ...inputTypeStyle("sm") });
      return (
        <div class="kjun-color-inputs">
          <div class="kjun-input-wrap">
            <input ref={el => props.hexRef(el as HTMLInputElement | null)} class="kjun-input kjun-input-native kjun-color-hex" aria-label={props.hexLabel} value={text.value}
              maxlength={props.alpha ? 9 : 7} spellcheck={false} autocomplete="off" style={style}
              onInput={(event: Event) => {
                editing = "hex";
                const next = (event.target as HTMLInputElement).value.replace(/^#/, "");
                text.value = next;
                const live = hexDraft(next.length === 6 ? withAlpha(next) : next, props.alpha).live;
                if (live) props.onPick(live);
              }}
              onKeydown={keys(commitHex)} onBlur={commitHex} />
          </div>
          {props.alpha && (
            <input class="kjun-input kjun-input-native kjun-color-alpha" aria-label={props.alphaLabel} value={pct.value} inputmode="numeric" maxlength={3}
              autocomplete="off" style={style}
              onInput={(event: Event) => {
                editing = "alpha";
                const next = (event.target as HTMLInputElement).value;
                pct.value = next;
                if (validPct(next) && props.value) props.onPick(props.value.slice(0, 7) + alphaHex(Number(next)));
              }}
              onKeydown={keys(commitPct)} onBlur={commitPct} />
          )}
        </div>
      );
    };
  },
});
