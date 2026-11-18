import { useKjunMessageScope, useKjunMessages } from "../../../shared/package-runtime/messages-context";
import {
  createSliderSession, sliderFillBox, sliderFormatter, sliderFractions, sliderFrontThumb, sliderGap, sliderKeepGap, sliderMarks, sliderOriginFraction,
  sliderValueAt, sliderValueText, type SliderMarks, type SliderOrientation, type SliderValueLabel,
} from "../../../shared/package-runtime/slider-view";
export type { KjunSliderMark, SliderValueLabel as KjunSliderValueLabel } from "../../../shared/package-runtime/slider-view";
import { useContext, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { Slider, SliderTrack, SliderThumb, Label, SliderOutput, SliderStateContext, useLocale } from "react-aria-components";
import { createSliderDomain } from "@kjun-ui/tokens";
export interface KjunSliderProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  label?: string;
  ariaLabel?: string;
  /** Hides the visible value only; each thumb still reports its value to assistive technology. */
  showValue?: boolean;
  /** Formats the visible value and each thumb's accessible value text. Values stay numeric. Defaults to the locale's number format with the step's decimals. */
  formatValue?: (value: number) => string;
  /** Dots on the rail: true for every step (up to 24), or values with optional labels beside the rail. Pressing a label moves the nearer thumb there. */
  marks?: SliderMarks;
  /** sm: 12px text, 4px rail, 16px thumb. The touch area stays 44px. */
  size?: "sm" | "md";
  /** vertical: the rail runs bottom (min) to top (max), `length` px long. */
  orientation?: SliderOrientation;
  length?: number;
  /** The value in a bubble on the thumb: "drag" while dragging or keyboard-focused, "always", or "off" (default). Follows formatValue. */
  valueLabel?: SliderValueLabel;
  /** The fill grows from this value instead of min, for two-way values such as -50…50; a tick marks it. Single slider only. */
  fillOrigin?: number;
  /** Submitted with a form through a hidden input; a range submits two values under the name. */
  name?: string;
  id?: string;
  className?: string;
  style?: CSSProperties;
  onValueChange?: (value: number) => void;
  onChangeCommit?: (value: number) => void;
}
export interface KjunRangeSliderProps extends Omit<KjunSliderProps, "value" | "fillOrigin" | "onValueChange" | "onChangeCommit"> {
  value: [number, number];
  /** The fewest steps the two thumbs keep between them; 0 (default) lets them meet. */
  minStepsBetweenThumbs?: number;
  thumbLabels?: [string, string];
  /** The visible text for the whole range, e.g. "20만~80만 원". Each thumb keeps formatValue. */
  formatRange?: (start: number, end: number) => string;
  onValueChange?: (value: [number, number]) => void;
  onChangeCommit?: (value: [number, number]) => void;
}
const edge = "calc(var(--_kjun-slider-thumb) / -2)";
function RangeThumb({ index, label, name, format, front, dragging, bubble, inputs }: { index: number; label?: string; name?: string; format: (value: number) => string; front: boolean; dragging: boolean; bubble: boolean; inputs: (HTMLInputElement | null)[] }) {
  const state = useContext(SliderStateContext)!;
  const input = useRef<HTMLInputElement>(null), thumb = useRef<HTMLDivElement>(null);
  const text = format(state.values[index]);
  // React Aria generates this attribute internally. Its public inputRef lets us
  // update the actual accessible input without replacing its registered state.
  // Run after every render, including formatter removal, before the next paint.
  // A drag the collapsed-range handler runs marks the thumb data-dragging too, the attribute React Aria sets for its own drags.
  useLayoutEffect(() => {
    input.current?.setAttribute("aria-valuetext", text); inputs[index] = input.current;
    thumb.current?.toggleAttribute("data-dragging", dragging || state.isThumbDragging(index));
  });
  // Overlapping thumbs: the one that can still move sits on top (data-front, as on Vue).
  // A single thumb takes its name from the slider label through React Aria; only range thumbs add their own after it.
  return <SliderThumb ref={thumb} index={index} inputRef={input} name={name} className="kjun-slider-thumb" aria-label={label} data-front={front || undefined}>
    {bubble && <span className="kjun-tooltip kjun-slider-value-label" aria-hidden="true">{text}</span>}
  </SliderThumb>;
}
function RangeInput(props: KjunRangeSliderProps | KjunSliderProps) {
  const { value, min = 0, max = 100, step = 1, disabled = false, label, ariaLabel, showValue = true, formatValue, marks, size = "md", orientation = "horizontal",
    valueLabel = "off", name, id, className, style } = props;
  const fillOrigin = "fillOrigin" in props ? props.fillOrigin : undefined;
  const gap = sliderGap("minStepsBetweenThumbs" in props ? props.minStepsBetweenThumbs : undefined, step);
  const m = useKjunMessages(), locale = useKjunMessageScope().intl;
  const { direction } = useLocale();
  const vertical = orientation === "vertical", layout = { rtl: direction === "rtl" && !vertical, vertical };
  const format = sliderFormatter(formatValue, locale, min, step);
  const formatRange = "formatRange" in props ? props.formatRange : undefined;
  const thumbLabels = "thumbLabels" in props ? props.thumbLabels || [m.minimum, m.maximum] : [m.minimum, m.maximum];
  const domain = createSliderDomain(min, max, step);
  const list = Array.isArray(value) ? value : [value];
  const valid = domain.valid && (!Array.isArray(value) || value.length === 2) && list.every(v => domain.accepts(v)) && (list.length === 1 || list[0] <= list[1]);
  const latest = useRef(value); latest.current = value;
  const active = useRef(false);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const track = useRef<HTMLDivElement>(null);
  const [ownDrag, setOwnDrag] = useState<number | null>(null);
  useEffect(() => { if (!valid) console.warn("KJUN Slider: 범위·step·값을 확인하세요."); }, [valid]);
  const emit = (result: number | [number, number]) => (props.onValueChange as ((v: typeof result) => void) | undefined)?.(result);
  const commit = (result: number | [number, number]) => (props.onChangeCommit as ((v: typeof result) => void) | undefined)?.(result);
  const change = (next: number | number[]) => {
    if (!valid || disabled) return;
    const snapped = sliderKeepGap(Array.isArray(latest.current) ? latest.current : [latest.current], (Array.isArray(next) ? next : [next]).map(domain.snap), gap);
    const result = Array.isArray(value) ? snapped as [number, number] : snapped[0];
    if (JSON.stringify(result) === JSON.stringify(latest.current)) return;
    latest.current = result; active.current = true;
    emit(result);
  };
  const top = valid ? domain.snap(max) : max;
  // A session for the gestures React Aria cannot pick right: a press on overlapping thumbs and a mark label.
  const session = () => createSliderSession(Array.isArray(latest.current) ? latest.current : [latest.current], {
    min: () => min, max: () => top, step: () => step, snap: domain.snap, blocked: () => disabled || !valid, gap: () => gap,
    emit: (next) => { const result = (next.length === 1 ? next[0] : next) as number | [number, number]; latest.current = result; emit(result); },
    commit: (next) => commit((next.length === 1 ? next[0] : next) as number | [number, number]),
    focus: (index) => { setOwnDrag(index); inputs.current[index]?.focus({ preventScroll: true }); },
  });
  const valueAt = (event: PointerEvent) => {
    const box = track.current!.getBoundingClientRect();
    return sliderValueAt(vertical ? event.clientY - box.top : event.clientX - box.left, vertical ? box.height : box.width, min, top, layout);
  };
  // React Aria drags the thumb under the pointer, which with both thumbs on one value can only move one way. A press on
  // collapsed thumbs runs here instead: the first move that changes the value picks the thumb that can follow it.
  const collapsed = valid && !disabled && list.length === 2 && list[0] === list[1];
  useEffect(() => {
    const element = track.current;
    if (!element || !collapsed) return;
    const down = (event: PointerEvent) => {
      if (event.button !== 0) return;
      event.preventDefault(); event.stopPropagation();
      const drag = session();
      drag.press(valueAt(event));
      const move = (next: PointerEvent) => drag.move(valueAt(next));
      const up = () => { drag.release(); setOwnDrag(null); removeEventListener("pointermove", move); removeEventListener("pointerup", up); removeEventListener("pointercancel", up); };
      addEventListener("pointermove", move); addEventListener("pointerup", up); addEventListener("pointercancel", up);
    };
    element.addEventListener("pointerdown", down, true);
    return () => element.removeEventListener("pointerdown", down, true);
  });
  const pickMark = (number: number) => { const drag = session(); drag.press(number); drag.release(); setOwnDrag(null); };
  // Invalid settings keep the app's numbers visible, clamped onto the rail.
  const fractions = sliderFractions(list, min, top);
  const front = valid ? sliderFrontThumb(list, min, top) : null;
  const dots = valid ? sliderMarks(marks, min, top, step, list, layout, fillOrigin) : [];
  const fill = sliderFillBox(fractions, layout, valid ? sliderOriginFraction(fillOrigin, min, top) : undefined);
  const [lead, trail] = vertical ? ["top", "bottom"] as const : ["left", "right"] as const;
  return <Slider id={id} className={"kjun-slider" + (className ? " " + className : "")} data-size={size} data-orientation={orientation} data-disabled={disabled || !valid}
    data-value-label={valueLabel === "off" ? undefined : valueLabel} orientation={orientation}
    // The visible label names the slider through <Label>; aria-label only when there is none.
    aria-label={label ? undefined : ariaLabel || m.value}
    style={vertical && props.length ? { "--_kjun-slider-length": props.length + "px", ...style } as CSSProperties : style}
    value={valid ? value : (Array.isArray(value) ? fractions.map(f => f * 100) : fractions[0] * 100)} minValue={valid ? min : 0} maxValue={valid ? top : 100}
    step={valid ? step : 1} isDisabled={disabled || !valid} onChange={change}
    onChangeEnd={() => { if (valid && !disabled && active.current) { active.current = false; commit(latest.current); } }}>
    {(label || showValue) && <div className="kjun-slider-caption">{label && <Label className="kjun-slider-label">{label}</Label>}{showValue && <SliderOutput className="kjun-slider-value">{({ state }) => sliderValueText(valid ? state.values : list, format, formatRange)}</SliderOutput>}</div>}
    <SliderTrack ref={track} className="kjun-slider-track">{() => <>
      <div className="kjun-slider-rail" />
      {/* A single slider fills from the rail's own end, half a thumb past the track; a range fills between its thumbs. */}
      <div className="kjun-slider-fill" data-origin={dots.some((dot) => dot.origin) || undefined} style={{ [lead]: fill.lead === null ? edge : fill.lead + "%", [trail]: fill.trail === null ? edge : fill.trail + "%" }} />
      {dots.filter((dot) => dot.dot).map((dot) => <span key={dot.value} className="kjun-slider-mark" data-active={dot.active || undefined} data-origin={dot.origin || undefined} style={{ [lead]: dot.position * 100 + "%" }} />)}
      {list.map((_, i) => <RangeThumb key={i} index={i} format={format} front={front === i} dragging={ownDrag === i} bubble={valueLabel !== "off"} inputs={inputs.current}
        name={name} label={list.length === 2 ? thumbLabels[i] : undefined} />)}
    </>}</SliderTrack>
    {dots.some((dot) => dot.label) && <div className="kjun-slider-marks" aria-hidden="true">
      {dots.filter((dot) => dot.label).map((dot) => <span key={dot.value} className="kjun-slider-mark-label" data-edge={dot.edge} style={{ [lead]: dot.position * 100 + "%" }}
        onClick={() => pickMark(dot.value)}>{dot.label}</span>)}
    </div>}
  </Slider>;
}
export function KjunSlider(props: KjunSliderProps) { return <RangeInput {...props} />; }
export function KjunRangeSlider(props: KjunRangeSliderProps) { return <RangeInput {...props} />; }
