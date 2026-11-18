import { onMounted, onUpdated, ref, watch, watchEffect, type CSSProperties, type PropType } from "vue";
import { defineComponent } from "./runtime/component";
import { tokens } from "@kjun-ui/tokens";
import { formatColor, hsvToRgb, readableInk, type Hsv } from "../../../shared/package-runtime/color";
import { channelKey, colorAreaKey, trackFraction } from "../../../shared/package-runtime/color-picker";
import { alphaFieldLive, hexFieldClean, hexFieldCommit, hexFieldLive, hexFieldText } from "../../../shared/package-runtime/color-picker-model";
import { bindRadioKeyboard } from "../../../shared/package-runtime/radio-keyboard";
import { inputTypeStyle } from "../../../shared/package-runtime/typography";
import { KjunButton, KjunIcon } from "./button";
import { css } from "./runtime/style";

// Mirrors packages/react/src/color-picker-parts.tsx: same DOM, classes and aria.
const thumb = tokens.extensions.colorPicker.thumbSize;

/** Pointer drag on an element: moves report on every step, and release or cancel ends the drag once. */
function drag(onMove: (x: number, y: number) => void, onStart: () => void, onEnd: () => void) {
  let active = false;
  const at = (event: PointerEvent) => {
    const box = (event.currentTarget as HTMLElement).getBoundingClientRect();
    // The ends lie half a thumb in, where the thumb stops: a press in that margin picks the first or last value.
    onMove(trackFraction(event.clientX, box.left, box.width, thumb), trackFraction(event.clientY, box.top, box.height, thumb));
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
/** A thumb at fractions x, y of its box, kept inside it (see .kjun-color-thumb). */
const place = (x: number, y: number | null): CSSProperties => ({
  left: x * 100 + "%", ...(y === null ? {} : { top: y * 100 + "%" }), transform: `translate(${-x * 100}%, ${y === null ? -50 : -y * 100}%)`,
});
type Fn<T> = (value: T) => void;
const dragProps = <T,>() => ({
  onMove: { type: Function as PropType<Fn<T>>, required: true },
  onPick: { type: Function as PropType<Fn<T>>, required: true },
  onStart: { type: Function as PropType<() => void>, required: true },
  onEnd: { type: Function as PropType<() => void>, required: true },
}) as const;

/** The saturation/brightness area; with no value yet (empty) it shows a hint instead of a thumb. */
export const ColorArea = defineComponent({
  name: "KjunColorArea",
  props: {
    hsv: { type: Object as PropType<Hsv>, required: true }, label: { type: String, required: true }, valueText: { type: String, required: true },
    empty: { type: Boolean, required: true }, hint: { type: String, required: true },
    areaRef: { type: Function as PropType<(el: HTMLElement | null) => void>, required: true }, ...dragProps<Hsv>(),
  },
  setup(props) {
    const handlers = drag((x, y) => props.onMove({ ...props.hsv, s: x, v: 1 - y }), () => props.onStart(), () => props.onEnd());
    return () => {
      const hsv = props.hsv;
      return (
        <div ref={el => props.areaRef(el as HTMLElement | null)} class="kjun-color-area" role="slider" tabindex={0} aria-label={props.label}
          aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent(hsv.s)} aria-valuetext={props.valueText}
          style={{ "--_kjun-color-picker-hue": rgb({ h: hsv.h, s: 1, v: 1 }) }}
          onKeydown={(event: KeyboardEvent) => {
            const next = colorAreaKey(event.key, event.shiftKey, hsv);
            if (!next) return;
            event.preventDefault();
            props.onPick(next);
          }}
          {...handlers}>
          {props.empty ? <span class="kjun-type-caption kjun-color-area-hint" aria-hidden="true">{props.hint}</span> : (
            <span class="kjun-color-thumb" style={place(hsv.s, 1 - hsv.v)}>
              <span style={{ background: rgb(hsv) }} />
            </span>
          )}
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
          <span class="kjun-color-thumb" style={place(props.value / props.max, null)}>
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
                aria-label={item.label} title={item.label} class="kjun-color-swatch" data-selected={checked ? "true" : undefined} data-ink={item.value ? readableInk(item.value) : undefined}
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

/** A swatch row under a caption (the swatches when recent colors show too, and the recent colors). */
export const SwatchGroup = defineComponent({
  name: "KjunColorSwatchGroup",
  props: {
    caption: { type: String, required: true },
    items: { type: Array as PropType<Item[]>, required: true }, selected: { type: Number, required: true }, label: { type: String, required: true },
    onPick: { type: Function as PropType<(value: string | null) => void>, required: true },
    swatchRef: { type: Function as PropType<(index: number, el: HTMLButtonElement | null) => void>, default: undefined },
  },
  setup(props) {
    return () => (
      <div class="kjun-color-group">
        <span class="kjun-type-caption kjun-color-group-label" aria-hidden="true">{props.caption}</span>
        <SwatchGrid items={props.items} selected={props.selected} label={props.label} onPick={props.onPick} swatchRef={props.swatchRef} />
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
    // The width the # and % take, so the digits start after them.
    const sign = ref<HTMLSpanElement | null>(null), unit = ref<HTMLSpanElement | null>(null), signWidth = ref(0), unitWidth = ref(0);
    const measure = () => {
      const s = sign.value?.offsetWidth ?? 0, u = unit.value?.offsetWidth ?? 0;
      if (s !== signWidth.value) signWidth.value = s;
      if (u !== unitWidth.value) unitWidth.value = u;
    };
    onMounted(measure);
    onUpdated(measure);
    return () => {
      const field = tokens.input.sm, pad = field.padding - tokens.border.controlWidth, gap = tokens.extensions.colorPicker.affixGap;
      const style = { height: field.height, borderRadius: field.radius, paddingInline: pad, ...inputTypeStyle("sm") };
      const affix = (side: "left" | "right") => css({ [side]: field.padding, pointerEvents: "none", ...inputTypeStyle("sm") });
      return (
        <div class="kjun-color-inputs">
          {props.eyeDropper && (
            <KjunButton variant="ghost" size="sm" prefixIcon="color-picker" class="kjun-color-eyedropper" ariaLabel={props.eyeDropper.label} {...{ title: props.eyeDropper.label }}
              onClick={props.eyeDropper.onPick} />
          )}
          {props.fields && (
            <div class="kjun-input-wrap">
              <span ref={sign} class="kjun-input-affix kjun-color-affix" aria-hidden="true" style={affix("left")}>#</span>
              <input ref={el => props.hexRef(el as HTMLInputElement | null)} class="kjun-input kjun-input-native kjun-color-hex" aria-label={props.hexLabel} value={text.value}
                maxlength={props.alpha ? 9 : 7} placeholder="RRGGBB" spellcheck={false} autocomplete="off" style={css({ ...style, paddingLeft: pad + signWidth.value + gap })}
                onInput={(event: Event) => {
                  const input = event.target as HTMLInputElement, next = hexFieldClean(input.value, props.alpha);
                  // A cut digit leaves the DOM ahead of the model: put the kept text back.
                  if (input.value !== next) input.value = next;
                  text.value = next;
                  edit("hex", hexFieldLive(next, props.alpha, props.value));
                }}
                onKeydown={keys(commitHex)} onBlur={commitHex} />
            </div>
          )}
          {props.fields && props.alpha && (
            <div class="kjun-input-wrap">
              <input class="kjun-input kjun-input-native kjun-color-alpha" aria-label={props.alphaLabel} value={pct.value} inputmode="numeric" maxlength={3}
                autocomplete="off" style={css({ ...style, paddingRight: pad + unitWidth.value + gap })}
                onInput={(event: Event) => {
                  const next = (event.target as HTMLInputElement).value;
                  pct.value = next;
                  edit("alpha", alphaFieldLive(next, props.value));
                }}
                onKeydown={keys(commitPct)} onBlur={commitPct} />
              <span ref={unit} class="kjun-input-affix kjun-color-affix" aria-hidden="true" style={affix("right")}>%</span>
            </div>
          )}
        </div>
      );
    };
  },
});
