import { useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { tokens, type InputSize } from "@kjun-ui/tokens";
import { useKjunMessageScope } from "../../../shared/package-runtime/messages-context";
import { mergeIds } from "../../../shared/package-runtime/aria-ids";
import { normalizeColor, parseColor } from "../../../shared/package-runtime/color";
import {
  initialFocus, initialPickerState, normalizeSwatches, stateToValue, syncHsv, warnColorPicker, type ColorSwatchInput, type PickerState,
} from "../../../shared/package-runtime/color-picker";
import { inputTypeStyle } from "./typography";
import { KjunIcon } from "./button";
import { useKjunField } from "./input";
import { FloatingPanel } from "./layers";
import { ColorArea, ColorChannel, HexInputs, SwatchGrid } from "./color-picker-parts";

export type KjunColorSwatch = ColorSwatchInput;
export interface KjunColorPickerProps {
  /** Uppercase #RRGGBB (#RRGGBBAA with alpha), or null for no color. */
  value?: string | null;
  defaultValue?: string | null;
  /** Every change, also while dragging. */
  onValueChange?: (value: string | null) => void;
  /** Once per finished pick: drag released, swatch or key pressed, hex entered. */
  onChangeCommit?: (value: string | null) => void;
  /** Colors the app offers; strings or { value, label }. */
  swatches?: KjunColorSwatch[];
  /** Saturation/brightness area and hue slider. */
  custom?: boolean;
  /** Opacity slider and % field; the value always carries AA. */
  alpha?: boolean;
  /** Hex field. */
  input?: boolean;
  /** A "no color" swatch that sets the value to null. */
  clearable?: boolean;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  size?: InputSize;
  placeholder?: string;
  ariaLabel?: string;
  error?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  /** Trigger id for an outside <label for>; defaults to the FormGroup's id. */
  id?: string;
  /** Submits the value with a form through a hidden input. */
  name?: string;
  /** Draws the trigger's content; the trigger button and its accessibility stay KJUN's. */
  renderTrigger?: (state: { value: string | null; open: boolean }) => ReactNode;
  className?: string;
  style?: CSSProperties;
}

const pct = (a: number) => Math.round(a * 100);

export function KjunColorPicker({
  value: given, defaultValue = null, onValueChange, onChangeCommit, swatches: rawSwatches, custom = false, alpha = false, input = false,
  clearable = false, open: openGiven, defaultOpen = false, onOpenChange, size = "md", placeholder, ariaLabel, error, disabled, readOnly,
  id, name, renderTrigger, className, style,
}: KjunColorPickerProps) {
  const scope = useKjunMessageScope(), m = scope.messages, field = useKjunField(), spec = tokens.input[size];
  const [inner, setInner] = useState(() => normalizeColor(defaultValue, alpha));
  const value = given !== undefined ? normalizeColor(given, alpha) : inner;
  const raw = given !== undefined ? given : defaultValue;
  const warned = useRef(false);
  useEffect(() => {
    if (warned.current || alpha || typeof raw !== "string") return;
    const c = parseColor(raw);
    if (c && /^#?([0-9a-f]{4}|[0-9a-f]{8})$/i.test(raw.trim())) { warned.current = true; warnColorPicker("the value has alpha but alpha is off; it is drawn and reported without it."); }
  }, [raw, alpha]);
  const swatches = normalizeSwatches(rawSwatches ?? [], alpha);
  const nothing = !custom && !input && !swatches.length && !clearable;
  useEffect(() => { if (nothing) warnColorPicker("turn on custom, input or clearable, or give swatches; showing the hex field."); }, [nothing]);
  const showInput = input || nothing;

  const [openInner, setOpenInner] = useState(defaultOpen);
  const open = (openGiven ?? openInner) && !disabled && !readOnly;
  const setOpen = (next: boolean) => { if (openGiven === undefined) setOpenInner(next); onOpenChange?.(next); };

  const [state, setState] = useState<PickerState>(() => syncHsv(initialPickerState, value, alpha));
  useLayoutEffect(() => setState(prev => syncHsv(prev, value, alpha)), [value, alpha]);
  // The latest value, so a drag's moves compare against what they reported, not against a render behind.
  const latest = useRef(value), dragStart = useRef<string | null>(null);
  latest.current = value;
  const change = (next: string | null) => {
    if (next === latest.current) return false;
    latest.current = next;
    if (given === undefined) setInner(next);
    onValueChange?.(next);
    return true;
  };
  const pick = (next: string | null) => { if (change(next)) onChangeCommit?.(next); };
  const moveTo = (next: PickerState) => { setState(next); change(stateToValue(next, alpha)); };
  const pickState = (next: PickerState) => { setState(next); pick(stateToValue(next, alpha)); };
  const drag = {
    onStart: () => { dragStart.current = latest.current; },
    onEnd: () => { if (latest.current !== dragStart.current) onChangeCommit?.(latest.current); },
  };

  const selected = (() => {
    const at = value === null ? -1 : swatches.findIndex(s => s.value === value);
    return clearable ? (value === null ? 0 : at < 0 ? -1 : at + 1) : at;
  })();
  const shownHex = value ? value.slice(0, 7) : "", shownAlpha = value && alpha ? pct(parseColor(value)!.a) : undefined;
  const spoken = value ? m.colorValue(shownHex, shownAlpha) : m.colorNone;
  const label = ariaLabel || placeholder || m.colorPlaceholder;

  const trigger = useRef<HTMLButtonElement>(null), valueId = "kjun-color-" + useId();
  const focusTargets = useRef<{ swatches: (HTMLButtonElement | null)[]; area: HTMLElement | null; hex: HTMLInputElement | null }>({ swatches: [], area: null, hex: null });
  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => {
      const t = focusTargets.current;
      const where = initialFocus({ selectedSwatch: selected >= 0, custom, input: showInput });
      const target = where === "swatch" ? t.swatches[selected] : where === "area" ? t.area : where === "hex" ? t.hex : t.swatches[0];
      target?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [open]);

  const chip = tokens.extensions.colorPicker.triggerSwatch[size];
  const current = stateToValue(state, false);
  return (
    <>
      <div className={"kjun-select-shell kjun-color-picker" + (className ? " " + className : "")} style={style}>
        <button ref={trigger} id={id ?? field?.id} type="button" className="kjun-input kjun-select-trigger kjun-color-trigger"
          disabled={disabled} aria-haspopup="dialog" aria-expanded={open}
          aria-label={field?.labelId ? undefined : label + ", " + spoken}
          aria-labelledby={field?.labelId ? mergeIds(field.labelId, valueId) : undefined}
          aria-describedby={field?.describedBy} aria-invalid={error || !!field?.error || undefined} aria-required={field?.required || undefined}
          aria-readonly={readOnly || undefined}
          style={{ height: spec.height, borderRadius: spec.radius, ...inputTypeStyle(size), paddingInline: spec.padding - tokens.border.controlWidth, gap: spec.affixGap }}
          onClick={() => { if (!readOnly) setOpen(!open); }}
          onKeyDown={event => { if (!readOnly && (event.key === "ArrowDown" || event.key === "ArrowUp")) { event.preventDefault(); setOpen(true); } }}>
          {renderTrigger ? renderTrigger({ value, open }) : <>
            <span className={"kjun-color-chip" + (value ? " kjun-color-checker" : "")} data-none={value ? undefined : ""} aria-hidden="true" style={{ width: chip, height: chip }}>
              <span style={value ? { background: value.slice(0, 7), opacity: alpha ? parseColor(value)!.a : 1 } : undefined} />
            </span>
            <span id={valueId} className={value ? undefined : "kjun-placeholder"}>
              {value ? <span aria-hidden="true">{shownHex}{shownAlpha !== undefined && shownAlpha < 100 && <span className="kjun-color-trigger-alpha">{shownAlpha}%</span>}</span> : placeholder ?? m.colorPlaceholder}
              <span className="kjun-sr-only">{spoken}</span>
            </span>
            <KjunIcon name="chevron-down" size={spec.iconSize} style={{ flexShrink: 0, color: disabled ? "var(--_kjun-color-text-disabled)" : "var(--_kjun-color-text-tertiary)" }} />
          </>}
        </button>
        {name && <input type="hidden" name={name} value={value ?? ""} />}
      </div>
      <FloatingPanel field open={open} onOpenChange={setOpen} triggerRef={trigger} placement="bottom-start" className="kjun-color-panel"
        maxHeight={tokens.extensions.floating.maxHeight}>
        {custom && <ColorArea hsv={state.hsv} label={m.colorArea} valueText={m.colorAreaValue(pct(state.hsv.s), pct(state.hsv.v))}
          onMove={hsv => moveTo({ ...state, hsv })} onPick={hsv => pickState({ ...state, hsv })} {...drag}
          areaRef={el => { focusTargets.current.area = el; }} />}
        {custom && <ColorChannel channel="hue" value={state.hsv.h} max={360} label={m.hue} valueText={m.hueValue(Math.round(state.hsv.h))} color={stateToValue({ hsv: { h: state.hsv.h, s: 1, v: 1 }, a: 1 }, false)}
          onMove={h => moveTo({ ...state, hsv: { ...state.hsv, h } })} onPick={h => pickState({ ...state, hsv: { ...state.hsv, h } })} {...drag} />}
        {alpha && <ColorChannel channel="alpha" value={pct(state.a)} max={100} label={m.alpha} valueText={pct(state.a) + "%"} color={current}
          onMove={a => moveTo({ ...state, a: a / 100 })} onPick={a => pickState({ ...state, a: a / 100 })} {...drag} />}
        {showInput && <HexInputs value={value} alpha={alpha} alphaPercent={pct(state.a)} clearable={clearable} hexLabel={m.hex} alphaLabel={m.alpha}
          onPick={pick} hexRef={el => { focusTargets.current.hex = el; }} />}
        {(swatches.length > 0 || clearable) && <SwatchGrid swatches={swatches} clearable={clearable} selected={selected} label={m.swatches} noneLabel={m.colorNone}
          onPick={pick} swatchRef={(index, el) => { focusTargets.current.swatches[index] = el; }} />}
      </FloatingPanel>
    </>
  );
}
