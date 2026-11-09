import { defineComponent, ref, watch, watchEffect, type PropType } from "vue";
import { tokens } from "@kjun-ui/tokens";
import { formatColor, hsvToRgb, readableInk, type Hsv } from "../../../shared/package-runtime/color";
import { channelKey, colorAreaKey } from "../../../shared/package-runtime/color-picker";
import { alphaFieldLive, hexFieldCommit, hexFieldLive, hexFieldText } from "../../../shared/package-runtime/color-picker-model";
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

type Item = { value: string | null; label: string };
/** One radio group of color items; "no color" is the item whose value is null. */
export const SwatchGrid = defineComponent({
  name: "KjunColorSwatchGrid",
  props: {
    items: { type: Array as PropType<Item[]>, required: true }, selected: { type: Number, required: true }, label: { type: String, required: true },
    onPick: { type: Function as PropType<(value: string | null) => void>, required: true },
    swatchRef: { type: Function as PropType<(index: number, el: HTMLButtonElement | null) => void>, default: undefined },
  },
  setup(props) {
    const group = ref<HTMLDivElement | null>(null);
    watchEffect(onCleanup => { if (group.value) onCleanup(bindRadioKeyboard(group.value)); }, { flush: "post" });
    return () => {
      const icon = tokens.extensions.colorPicker.swatchIconSize;
      return (
        <div ref={group} class="kjun-color-swatches" role="radiogroup" aria-label={props.label}>
          {props.items.map((item, index) => {
            const checked = index === props.selected;
            return (
              <button key={index} ref={el => props.swatchRef?.(index, el as HTMLButtonElement | null)} type="button" role="radio" aria-checked={checked ? "true" : "false"}
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

/** Recent colors under the swatches: a caption and one more radio group. */
export const RecentColors = defineComponent({
  name: "KjunColorRecent",
  props: {
    items: { type: Array as PropType<Item[]>, required: true }, selected: { type: Number, required: true }, label: { type: String, required: true },
    onPick: { type: Function as PropType<(value: string | null) => void>, required: true },
  },
  setup(props) {
    return () => (
      <div class="kjun-color-recent">
        <span class="kjun-type-caption kjun-color-recent-label" aria-hidden="true">{props.label}</span>
        <SwatchGrid items={props.items} selected={props.selected} label={props.label} onPick={props.onPick} />
      </div>
    );
  },
});

/** The eyedropper button and the hex and % fields. Typing changes the value once a code is complete;
 * Enter or leaving a field commits it (a short code expands, a bad one reverts). */
export const ColorInputs = defineComponent({
  name: "KjunColorInputs",
  props: {
    fields: { type: Boolean, required: true }, value: { type: String as PropType<string | null>, default: null }, alpha: { type: Boolean, required: true },
    alphaPercent: { type: Number, required: true }, clearable: { type: Boolean, required: true }, hexLabel: { type: String, required: true },
    alphaLabel: { type: String, required: true }, eyeDropper: { type: Object as PropType<{ label: string; onPick: () => void } | null>, default: null },
    onEdit: { type: Function as PropType<(live: string | null) => void>, required: true },
    onCommit: { type: Function as PropType<(next: string | null | "revert") => void>, required: true },
    hexRef: { type: Function as PropType<(el: HTMLInputElement | null) => void>, required: true },
  },
  setup(props) {
    const shown = () => hexFieldText(props.value);
    const text = ref(shown()), pct = ref(String(props.alphaPercent));
    // editing: the field being typed in; reported: the last value the fields changed. A value from anywhere else (a swatch,
    // a drag, the app) ends the edit, so a late blur cannot write stale text over it.
    let editing: "hex" | "alpha" | null = null, reported = props.value;
    watch(() => [props.value, props.alphaPercent] as const, ([value, percent]) => {
      if (value !== reported) { editing = null; reported = value; }
      if (editing !== "hex") text.value = shown();
      if (editing !== "alpha") pct.value = String(percent);
    });
    const edit = (field: "hex" | "alpha", live: string | null) => { editing = field; if (live !== null) reported = live; props.onEdit(live); };
    const commitHex = () => {
      // Nothing typed (or already committed by Enter): leaving the field changes nothing.
      if (editing !== "hex") return;
      editing = null;
      const next = hexFieldCommit(text.value, props.alpha, props.value, props.clearable);
      text.value = next === "revert" ? shown() : hexFieldText(next);
      if (next !== "revert") reported = next;
      props.onCommit(next);
    };
    const commitPct = () => {
      if (editing !== "alpha") return;
      editing = null;
      const next = alphaFieldLive(pct.value, props.value);
      if (next === null) pct.value = String(props.alphaPercent); else reported = next;
      props.onCommit(next ?? "revert");
    };
    const keys = (commit: () => void) => (event: KeyboardEvent) => { if (event.key === "Enter") { event.preventDefault(); commit(); } };
    return () => {
      const field = tokens.input.sm;
      const style = css({ height: field.height, borderRadius: field.radius, paddingInline: field.padding - tokens.border.controlWidth, ...inputTypeStyle("sm") });
      return (
        <div class="kjun-color-inputs">
          {props.eyeDropper && (
            <button type="button" class="kjun-input kjun-color-eyedropper" aria-label={props.eyeDropper.label} onClick={props.eyeDropper.onPick}
              style={css({ width: field.height, height: field.height, borderRadius: field.radius })}>
              <KjunIcon name="color-picker" size={field.iconSize} />
            </button>
          )}
          {props.fields && (
            <div class="kjun-input-wrap">
              <input ref={el => props.hexRef(el as HTMLInputElement | null)} class="kjun-input kjun-input-native kjun-color-hex" aria-label={props.hexLabel} value={text.value}
                maxlength={props.alpha ? 9 : 7} spellcheck={false} autocomplete="off" style={style}
                onInput={(event: Event) => {
                  const next = (event.target as HTMLInputElement).value.replace(/^#/, "");
                  text.value = next;
                  edit("hex", hexFieldLive(next, props.alpha, props.value));
                }}
                onKeydown={keys(commitHex)} onBlur={commitHex} />
            </div>
          )}
          {props.fields && props.alpha && (
            <input class="kjun-input kjun-input-native kjun-color-alpha" aria-label={props.alphaLabel} value={pct.value} inputmode="numeric" maxlength={3}
              autocomplete="off" style={style}
              onInput={(event: Event) => {
                const next = (event.target as HTMLInputElement).value;
                pct.value = next;
                edit("alpha", alphaFieldLive(next, props.value));
              }}
              onKeydown={keys(commitPct)} onBlur={commitPct} />
          )}
        </div>
      );
    };
  },
});
