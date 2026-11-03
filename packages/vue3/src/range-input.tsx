import { useKjunMessageScope, useKjunMessages } from "./runtime/messages";
import { computed, defineComponent, ref, watch, type PropType } from "vue";
import { createSliderDomain } from "@kjun-ui/tokens";
import { useFocusVisible } from "./runtime/focus-visible";
import {
  createSliderSession, localeIsRtl, sliderFillBox, sliderFormatter, sliderFractions, sliderFrontThumb, sliderMarks, sliderValueAt, sliderValueText,
  type KjunSliderMark, type SliderMarks, type SliderOrientation,
} from "../../../shared/package-runtime/slider-view";

type SliderValue = number | [number, number];
const sliderProps = {
  min: { type: Number, default: 0 },
  max: { type: Number, default: 100 },
  step: { type: Number, default: 1 },
  disabled: { type: Boolean, default: false },
  label: { type: String, default: undefined },
  ariaLabel: { type: String, default: undefined },
  /** Hides the visual output only; the native slider value remains accessible. */
  showValue: { type: Boolean, default: true },
  /** Applied to each thumb's output and aria-valuetext. Does not change numeric values. */
  formatValue: { type: Function as PropType<(value: number) => string>, default: undefined },
  /** Like React: true for a dot on every step (up to 24), or values with optional labels beside the rail. */
  marks: { type: [Boolean, Array] as PropType<SliderMarks>, default: undefined },
  size: { type: String as PropType<"sm" | "md">, default: "md" },
  /** vertical: the rail runs bottom (min) to top (max), `length` px long. */
  orientation: { type: String as PropType<SliderOrientation>, default: "horizontal" },
  length: { type: Number, default: undefined },
} as const;
const edgeOffset = "calc(var(--_kjun-slider-thumb) / -2)";

/**
 * React renders react-aria's Slider; this builds the same DOM: a thumb div per value with a hidden range input that owns
 * focus and keys. v-model updates while dragging; `change` commits. Value rules come from the shared slider session.
 */
function defineRangeInput(name: string, range: boolean) {
  return defineComponent({
    name,
    props: {
      ...sliderProps,
      modelValue: { type: (range ? Array : Number) as PropType<SliderValue>, required: true },
      ...(range ? {
        thumbLabels: { type: Array as unknown as PropType<[string, string]>, default: undefined },
        /** The visible text for the whole range, e.g. "20만~80만 원". Each thumb keeps formatValue. */
        formatRange: { type: Function as PropType<(start: number, end: number) => string>, default: undefined },
      } : {}),
    },
    emits: { "update:modelValue": (_value: SliderValue) => true, change: (_value: SliderValue) => true },
    setup(props, { emit }) {
      const m = useKjunMessages(), scope = useKjunMessageScope();
      const domain = computed(() => createSliderDomain(props.min, props.max, props.step));
      const list = computed(() => (Array.isArray(props.modelValue) ? props.modelValue : [props.modelValue]) as number[]);
      const valid = computed(() => domain.value.valid && (!range || (Array.isArray(props.modelValue) && props.modelValue.length === 2))
        && list.value.every(v => domain.value.accepts(v)) && (list.value.length === 1 || list.value[0] <= list.value[1]));
      watch(valid, ok => { if (!ok) console.warn("KJUN Slider: 범위·step·값을 확인하세요."); }, { immediate: true });
      const blocked = computed(() => props.disabled || !valid.value);
      const max = computed(() => valid.value ? domain.value.snap(props.max) : props.max);
      const vertical = computed(() => props.orientation === "vertical");
      const dragging = ref<number | null>(null), focused = ref<number | null>(null);
      // Like React (React Aria reads the Provider locale): right-to-left languages run the rail the other way.
      const rtl = computed(() => localeIsRtl(scope.value.intl) && !vertical.value);
      const focus = useFocusVisible();
      const track = ref<HTMLElement | null>(null);
      const inputs: (HTMLInputElement | null)[] = [];
      const result = (values: number[]) => (range ? values : values[0]) as SliderValue;
      const session = createSliderSession(list.value, {
        min: () => props.min, max: () => max.value, step: () => props.step, snap: value => domain.value.snap(value), blocked: () => blocked.value,
        emit: values => emit("update:modelValue", result(values)),
        commit: values => emit("change", result(values)),
        focus: index => { dragging.value = index; inputs[index]?.focus({ preventScroll: true }); },
      });
      watch(list, value => session.sync(value));
      const valueAt = (event: PointerEvent) => {
        const box = track.value!.getBoundingClientRect();
        return sliderValueAt(vertical.value ? event.clientY - box.top : event.clientX - box.left, vertical.value ? box.height : box.width,
          props.min, max.value, { rtl: rtl.value, vertical: vertical.value });
      };
      const pointerDown = (event: PointerEvent) => {
        if (blocked.value || event.button !== 0) return;
        event.preventDefault();
        track.value!.setPointerCapture?.(event.pointerId);
        dragging.value = session.press(valueAt(event));
      };
      const pointerMove = (event: PointerEvent) => { if (session.active !== null) dragging.value = session.move(valueAt(event)); };
      const pointerUp = () => { if (session.active === null) return; session.release(); dragging.value = null; };
      // A mark label moves the nearer thumb to its value and commits, like a click on the rail.
      const pickMark = (value: number) => { if (blocked.value) return; session.press(value); session.release(); dragging.value = null; };

      return () => {
        const values = list.value, layout = { rtl: rtl.value, vertical: vertical.value };
        const label = props.ariaLabel || props.label || m.value.value;
        const format = sliderFormatter(props.formatValue, scope.value.intl, props.min, props.step);
        const front = valid.value ? sliderFrontThumb(values, props.min, max.value) : null;
        const dots = valid.value ? sliderMarks(props.marks, props.min, max.value, props.step, values, layout) : [];
        // Invalid settings keep the app's numbers visible, clamped onto the rail.
        const fractions = sliderFractions(values, props.min, max.value);
        const fill = sliderFillBox(fractions, layout);
        const axis = vertical.value ? ["top", "bottom"] as const : ["left", "right"] as const;
        const at = (fraction: number) => ({ [axis[0]]: (layout.vertical || layout.rtl ? 1 - fraction : fraction) * 100 + "%" });
        const formatRange = (props as { formatRange?: (start: number, end: number) => string }).formatRange;
        return (
          <div class="kjun-slider" data-size={props.size} data-orientation={props.orientation} data-disabled={String(blocked.value)}
            role="group" aria-label={label}
            style={vertical.value && props.length ? { "--_kjun-slider-length": props.length + "px" } : undefined}>
            {(props.label || props.showValue) && <div class="kjun-slider-caption">
              {props.label && <label class="kjun-slider-label">{props.label}</label>}
              {props.showValue && <output class="kjun-slider-value" aria-live="off">{sliderValueText(values, format, formatRange)}</output>}
            </div>}
            <div ref={track} class="kjun-slider-track" style={{ position: "relative", touchAction: "none" }}
              onPointerdown={pointerDown} onPointermove={pointerMove} onPointerup={pointerUp} onPointercancel={pointerUp}>
              <div class="kjun-slider-rail" />
              <div class="kjun-slider-fill" style={{ [axis[0]]: fill.lead === null ? edgeOffset : fill.lead + "%", [axis[1]]: fill.trail === null ? edgeOffset : fill.trail + "%" }} />
              {dots.filter(dot => dot.dot).map(dot => <span key={dot.value} class="kjun-slider-mark" data-active={dot.active || undefined} style={{ [axis[0]]: dot.position * 100 + "%" }} />)}
              {values.map((value, index) => (
                <div key={index} class="kjun-slider-thumb"
                  style={{ position: "absolute", ...at(fractions[index]), transform: "translate(-50%, -50%)" }}
                  data-dragging={dragging.value === index || undefined} data-front={front === index || undefined}
                  data-focus-visible={(focused.value === index && focus.visible.value) || undefined}>
                  <input ref={el => { inputs[index] = el as HTMLInputElement | null; }} type="range" class="kjun-sr-only"
                    aria-label={values.length === 2 ? ((props as { thumbLabels?: [string, string] }).thumbLabels ?? [m.value.minimum, m.value.maximum])[index] : label}
                    aria-valuetext={format(value)} aria-orientation={props.orientation}
                    min={values.length === 2 && index === 1 ? values[0] : props.min}
                    max={values.length === 2 && index === 0 ? values[1] : max.value}
                    step={valid.value ? props.step : 1} value={value} disabled={blocked.value}
                    onFocus={() => { focused.value = index; focus.onFocus(); }}
                    onBlur={() => { focused.value = null; focus.onBlur(); session.commit(); }}
                    onKeydown={(event: KeyboardEvent) => {
                      if (session.key(index, event.key, rtl.value)) event.preventDefault();
                    }}
                    onKeyup={() => session.commit()}
                    // Assistive technology may set the value directly.
                    onInput={(event: Event) => {
                      const input = event.target as HTMLInputElement;
                      session.update(index, Number(input.value));
                      input.value = String(session.values[index]);
                    }} />
                </div>
              ))}
            </div>
            {dots.some(dot => dot.label) && <div class="kjun-slider-marks" aria-hidden="true">
              {dots.filter(dot => dot.label).map(dot => <span key={dot.value} class="kjun-slider-mark-label" data-edge={dot.edge}
                style={{ [axis[0]]: dot.position * 100 + "%" }} onClick={() => pickMark(dot.value)}>{dot.label}</span>)}
            </div>}
          </div>
        );
      };
    },
  });
}

export const KjunSlider = defineRangeInput("KjunSlider", false);
export const KjunRangeSlider = defineRangeInput("KjunRangeSlider", true);
export type { KjunSliderMark };
export interface KjunSliderProps { modelValue: number; min?: number; max?: number; step?: number; disabled?: boolean; label?: string; ariaLabel?: string; showValue?: boolean; formatValue?: (value: number) => string; marks?: SliderMarks; size?: "sm" | "md"; orientation?: SliderOrientation; length?: number }
export interface KjunRangeSliderProps extends Omit<KjunSliderProps, "modelValue"> { modelValue: [number, number]; thumbLabels?: [string, string]; formatRange?: (start: number, end: number) => string }
