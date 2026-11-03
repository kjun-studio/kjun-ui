import { useKjunMessageScope, useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { sliderFormatter, sliderFrontThumb, sliderMarks, sliderValueText, type SliderMarks } from "../../../shared/package-runtime/slider-view";
export type { KjunSliderMark } from "../../../shared/package-runtime/slider-view";
import { useContext, useEffect, useLayoutEffect, useRef } from "react";
import { Slider, SliderTrack, SliderThumb, Label, SliderOutput, SliderStateContext } from "react-aria-components";
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
  /** Formats the visible value and each thumb's accessible value text. Values stay numeric. Defaults to the locale's number format. */
  formatValue?: (value: number) => string;
  /** Dots on the rail: true for every step (up to 24), or values with optional labels drawn under the rail. */
  marks?: SliderMarks;
  /** sm: 12px text, 4px rail, 16px thumb. The touch area stays 44px. */
  size?: "sm" | "md";
  onValueChange?: (value: number) => void;
  onChangeCommit?: (value: number) => void;
}
export interface KjunRangeSliderProps extends Omit<KjunSliderProps, "value" | "onValueChange" | "onChangeCommit"> {
  value: [number, number];
  thumbLabels?: [string, string];
  onValueChange?: (value: [number, number]) => void;
  onChangeCommit?: (value: [number, number]) => void;
}
function RangeThumb({ index, label, format, front }: { index: number; label: string; format: (value: number) => string; front: boolean }) {
  const state = useContext(SliderStateContext)!;
  const input = useRef<HTMLInputElement>(null);
  const text = format(state.values[index]);
  // React Aria generates this attribute internally. Its public inputRef lets us
  // update the actual accessible input without replacing its registered state.
  // Run after every render, including formatter removal, before the next paint.
  useLayoutEffect(() => { input.current?.setAttribute("aria-valuetext", text); });
  // Overlapping thumbs: the one that can still move sits on top.
  return <SliderThumb index={index} inputRef={input} className="kjun-slider-thumb" aria-label={label} style={front ? { zIndex: 1 } : undefined} />;
}
function RangeInput({ value, min = 0, max = 100, step = 1, disabled = false, label, ariaLabel, showValue = true, formatValue, marks, size = "md", onValueChange, onChangeCommit, ...rest }: KjunRangeSliderProps | KjunSliderProps) {
  const m = useKjunMessages(), locale = useKjunMessageScope().intl;
  const format = sliderFormatter(formatValue, locale);
  const thumbLabels = "thumbLabels" in rest ? rest.thumbLabels || [m.minimum, m.maximum] : [m.minimum, m.maximum];
  const domain = createSliderDomain(min, max, step);
  const list = Array.isArray(value) ? value : [value];
  const valid = domain.valid && (!Array.isArray(value) || value.length === 2) && list.every(v => domain.accepts(v)) && (list.length === 1 || list[0] <= list[1]);
  const latest = useRef(value); latest.current = value;
  const active = useRef(false);
  useEffect(() => { if (!valid) console.warn("KJUN Slider: 범위·step·값을 확인하세요."); }, [valid]);
  const change = (next: number | number[]) => {
    if (!valid || disabled) return;
    const snapped = (Array.isArray(next) ? next : [next]).map(domain.snap);
    const result = Array.isArray(value) ? snapped as [number, number] : snapped[0];
    if (JSON.stringify(result) === JSON.stringify(latest.current)) return;
    latest.current = result; active.current = true;
    (onValueChange as (v: typeof result) => void)?.(result);
  };
  const top = valid ? domain.snap(max) : 100, front = valid ? sliderFrontThumb(list, min, top) : null;
  const dots = valid ? sliderMarks(marks, min, top, step, list) : [];
  return <Slider className="kjun-slider" data-size={size} data-disabled={disabled || !valid} aria-label={ariaLabel || label || m.value} value={valid ? value : Array.isArray(value) ? [0, 100] : 0} minValue={valid ? min : 0} maxValue={valid ? domain.snap(max) : 100} step={valid ? step : 1} isDisabled={disabled || !valid} onChange={change} onChangeEnd={() => { if (valid && !disabled && active.current) { active.current = false; (onChangeCommit as (v: typeof value) => void)?.(latest.current); } }}>
    {(label || showValue) && <div className="kjun-slider-caption">{label && <Label className="kjun-slider-label">{label}</Label>}{showValue && <SliderOutput className="kjun-slider-value">{({ state }) => sliderValueText(state.values, format)}</SliderOutput>}</div>}
    <SliderTrack className="kjun-slider-track">{({ state }) => <>
      <div className="kjun-slider-rail" />
      {/* A single slider fills from the rail's own start, half a thumb before the track. */}
      <div className="kjun-slider-fill" style={list.length === 2
        ? { left: state.getThumbPercent(0) * 100 + "%", width: (state.getThumbPercent(1) - state.getThumbPercent(0)) * 100 + "%" }
        : { left: "calc(var(--_kjun-slider-thumb) / -2)", width: `calc(${state.getThumbPercent(0) * 100}% + var(--_kjun-slider-thumb) / 2)` }} />
      {dots.map((dot) => <span key={dot.value} className="kjun-slider-mark" data-active={dot.active || undefined} style={{ left: dot.fraction * 100 + "%" }} />)}
      {list.map((_, i) => <RangeThumb key={i} index={i} format={format} front={front === i} label={list.length === 2 ? thumbLabels[i] : ariaLabel || label || m.value} />)}
    </>}</SliderTrack>
    {dots.some((dot) => dot.label) && <div className="kjun-slider-marks" aria-hidden="true">
      {dots.filter((dot) => dot.label).map((dot) => <span key={dot.value} className="kjun-slider-mark-label" data-edge={dot.edge} style={{ left: dot.fraction * 100 + "%" }}>{dot.label}</span>)}
    </div>}
  </Slider>;
}
export function KjunSlider(props: KjunSliderProps) { return <RangeInput {...props} />; }
export function KjunRangeSlider(props: KjunRangeSliderProps) { return <RangeInput {...props} />; }
