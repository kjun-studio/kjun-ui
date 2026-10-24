import { useKjunMessages } from "./runtime/messages";
import { computed, defineComponent, ref, watch, type PropType } from "vue";
import { createSliderDomain, sliderKey } from "@kjun-ui/tokens";
import { useFocusVisible } from "./runtime/focus-visible";

type SliderValue = number | [number, number];
const sliderProps = {
  min: { type: Number, default: 0 },
  max: { type: Number, default: 100 },
  step: { type: Number, default: 1 },
  disabled: { type: Boolean, default: false },
  label: { type: String, default: undefined },
  ariaLabel: { type: String, default: undefined },
} as const;

/**
 * React renders react-aria's Slider; this builds the same DOM: a thumb div per value with a hidden
 * range input that owns focus and keys. v-model updates while dragging; `change` commits.
 */
function defineRangeInput(name: string, range: boolean) {
  return defineComponent({
    name,
    props: {
      ...sliderProps,
      modelValue: { type: (range ? Array : Number) as PropType<SliderValue>, required: true },
      ...(range ? { thumbLabels: { type: Array as unknown as PropType<[string, string]>, default: undefined } } : {}),
    },
    emits: { "update:modelValue": (_value: SliderValue) => true, change: (_value: SliderValue) => true },
    setup(props, { emit }) {
      const m = useKjunMessages();
      const domain = computed(() => createSliderDomain(props.min, props.max, props.step));
      const list = computed(() => (Array.isArray(props.modelValue) ? props.modelValue : [props.modelValue]) as number[]);
      const valid = computed(() => domain.value.valid && (!range || (Array.isArray(props.modelValue) && props.modelValue.length === 2))
        && list.value.every(v => domain.value.accepts(v)) && (list.value.length === 1 || list.value[0] <= list.value[1]));
      watch(valid, ok => { if (!ok) console.warn("KJUN Slider: 범위·step·값을 확인하세요."); }, { immediate: true });
      const blocked = computed(() => props.disabled || !valid.value);
      const max = computed(() => valid.value ? domain.value.snap(props.max) : 100);
      const min = computed(() => valid.value ? props.min : 0);
      // The latest accepted value, ahead of the parent's v-model round trip.
      let latest = [...list.value], dirty = false;
      watch(list, value => { latest = [...value]; });
      const dragging = ref<number | null>(null), focused = ref<number | null>(null);
      const focus = useFocusVisible();
      const track = ref<HTMLElement | null>(null);
      const inputs: (HTMLInputElement | null)[] = [];
      const result = (values: number[]) => (range ? values : values[0]) as SliderValue;

      const update = (index: number, number: number) => {
        if (blocked.value) return;
        const next = [...latest];
        next[index] = Math.min(index === 0 && next.length === 2 ? next[1] : max.value,
          Math.max(index === 1 ? next[0] : min.value, domain.value.snap(number)));
        if (next[index] === latest[index]) return;
        latest = next; dirty = true;
        emit("update:modelValue", result(next));
      };
      const commit = () => {
        if (blocked.value || !dirty) return;
        dirty = false;
        emit("change", result([...latest]));
      };
      const fraction = (value: number) => valid.value && max.value > min.value
        ? Math.max(0, Math.min(1, (value - min.value) / (max.value - min.value))) : 0;
      const valueAt = (clientX: number) => {
        const box = track.value!.getBoundingClientRect();
        return min.value + Math.max(0, Math.min(1, (clientX - box.left) / box.width)) * (max.value - min.value);
      };
      const pointerDown = (event: PointerEvent) => {
        if (blocked.value || event.button !== 0) return;
        event.preventDefault();
        const number = valueAt(event.clientX);
        const index = latest.length === 2 && Math.abs(number - latest[1]) < Math.abs(number - latest[0]) ? 1 : 0;
        dragging.value = index;
        inputs[index]?.focus({ preventScroll: true });
        track.value!.setPointerCapture?.(event.pointerId);
        update(index, number);
      };
      const pointerMove = (event: PointerEvent) => { if (dragging.value !== null) update(dragging.value, valueAt(event.clientX)); };
      const pointerUp = () => { if (dragging.value === null) return; dragging.value = null; commit(); };

      return () => {
        const values = list.value;
        const label = props.ariaLabel || props.label || m.value.value;
        const start = values.length === 2 ? fraction(values[0]) : 0;
        return (
          <div class="kjun-slider" data-disabled={String(blocked.value)} role="group" aria-label={label}>
            <div class="kjun-slider-caption">
              {props.label && <label class="kjun-slider-label">{props.label}</label>}
              <output class="kjun-slider-value" aria-live="off">{values.join(" – ")}</output>
            </div>
            <div ref={track} class="kjun-slider-track" style={{ position: "relative", touchAction: "none" }}
              onPointerdown={pointerDown} onPointermove={pointerMove} onPointerup={pointerUp} onPointercancel={pointerUp}>
              <div class="kjun-slider-rail" />
              <div class="kjun-slider-fill" style={{ left: start * 100 + "%", width: (fraction(values[values.length - 1]) - start) * 100 + "%" }} />
              {values.map((value, index) => (
                <div key={index} class="kjun-slider-thumb"
                  style={{ position: "absolute", left: fraction(value) * 100 + "%", transform: "translate(-50%, -50%)" }}
                  data-dragging={dragging.value === index || undefined}
                  data-focus-visible={(focused.value === index && focus.visible.value) || undefined}>
                  <input ref={el => { inputs[index] = el as HTMLInputElement | null; }} type="range" class="kjun-sr-only"
                    aria-label={values.length === 2 ? ((props as { thumbLabels?: [string, string] }).thumbLabels ?? [m.value.minimum, m.value.maximum])[index] : label}
                    min={values.length === 2 && index === 1 ? values[0] : min.value}
                    max={values.length === 2 && index === 0 ? values[1] : max.value}
                    step={valid.value ? props.step : 1} value={valid.value ? value : index * 100} disabled={blocked.value}
                    onFocus={() => { focused.value = index; focus.onFocus(); }}
                    onBlur={() => { focused.value = null; focus.onBlur(); commit(); }}
                    onKeydown={(event: KeyboardEvent) => {
                      const next = sliderKey(event.key, latest[index], props.min, props.max, props.step);
                      if (next === null) return;
                      event.preventDefault();
                      update(index, next);
                    }}
                    onKeyup={commit}
                    // Assistive technology may set the value directly.
                    onInput={(event: Event) => {
                      const input = event.target as HTMLInputElement;
                      update(index, Number(input.value));
                      input.value = String(latest[index]);
                    }} />
                </div>
              ))}
            </div>
          </div>
        );
      };
    },
  });
}

export const KjunSlider = defineRangeInput("KjunSlider", false);
export const KjunRangeSlider = defineRangeInput("KjunRangeSlider", true);
export interface KjunSliderProps { modelValue: number; min?: number; max?: number; step?: number; disabled?: boolean; label?: string; ariaLabel?: string }
export interface KjunRangeSliderProps extends Omit<KjunSliderProps, "modelValue"> { modelValue: [number, number]; thumbLabels?: [string, string] }
