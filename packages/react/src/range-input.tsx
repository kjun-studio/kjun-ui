import { useEffect, useRef } from "react";
import { Slider, SliderTrack, SliderThumb, Label, SliderOutput } from "react-aria-components";
import { createSliderDomain } from "@kjun-ui/tokens";
export interface DsSliderProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  label?: string;
  ariaLabel?: string;
  onValueChange?: (value: number) => void;
  onChangeCommit?: (value: number) => void;
}
export interface DsRangeSliderProps extends Omit<DsSliderProps, "value" | "onValueChange" | "onChangeCommit"> {
  value: [number, number];
  thumbLabels?: [string, string];
  onValueChange?: (value: [number, number]) => void;
  onChangeCommit?: (value: [number, number]) => void;
}
function RangeInput({ value, min = 0, max = 100, step = 1, disabled = false, label, ariaLabel, onValueChange, onChangeCommit, ...rest }: DsRangeSliderProps | DsSliderProps) {
  const thumbLabels = "thumbLabels" in rest ? rest.thumbLabels || ["최솟값", "최댓값"] : ["최솟값", "최댓값"];
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
  return <Slider className="kjun-slider" data-disabled={disabled || !valid} aria-label={ariaLabel || label || "값"} value={valid ? value : Array.isArray(value) ? [0, 100] : 0} minValue={valid ? min : 0} maxValue={valid ? domain.snap(max) : 100} step={valid ? step : 1} isDisabled={disabled || !valid} onChange={change} onChangeEnd={() => { if (valid && !disabled && active.current) { active.current = false; (onChangeCommit as (v: typeof value) => void)?.(latest.current); } }}>
    <div className="kjun-slider-caption">{label && <Label className="kjun-slider-label">{label}</Label>}<SliderOutput className="kjun-slider-value">{({ state }) => state.values.join(" – ")}</SliderOutput></div>
    <SliderTrack className="kjun-slider-track">{({ state }) => <>
      <div className="kjun-slider-rail" />
      <div className="kjun-slider-fill" style={{ left: (list.length === 2 ? state.getThumbPercent(0) * 100 : 0) + "%", width: ((state.getThumbPercent(list.length - 1) - (list.length === 2 ? state.getThumbPercent(0) : 0)) * 100) + "%" }} />
      {list.map((_, i) => <SliderThumb key={i} index={i} className="kjun-slider-thumb" aria-label={list.length === 2 ? thumbLabels[i] : ariaLabel || label || "값"} />)}
    </>}</SliderTrack>
  </Slider>;
}
export function DsSlider(props: DsSliderProps) { return <RangeInput {...props} />; }
export function DsRangeSlider(props: DsRangeSliderProps) { return <RangeInput {...props} />; }
