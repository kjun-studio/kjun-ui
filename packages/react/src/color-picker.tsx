import { useEffect, useId, useRef, type CSSProperties, type ReactNode } from "react";
import { tokens, type InputSize } from "@kjun-ui/tokens";
import { useKjunMessageScope } from "../../../shared/package-runtime/messages-context";
import { mergeIds } from "../../../shared/package-runtime/aria-ids";
import { coarsePointer, colorName, initialFocusTarget, pickerSummary, stateToValue, swatchItems, type ColorSwatchInput } from "../../../shared/package-runtime/color-picker";
import { useColorPickerModel } from "../../../shared/package-runtime/use-color-picker";
import { inputTypeStyle } from "./typography";
import { KjunIcon } from "./button";
import { useKjunField } from "./input";
import { FloatingPanel } from "./layers";
import { ColorArea, ColorChannel, ColorInputs, SwatchGrid, SwatchGroup } from "./color-picker-parts";

export type KjunColorSwatch = ColorSwatchInput;
export interface KjunColorPickerProps {
  /** Uppercase #RRGGBB (#RRGGBBAA with alpha), or null for no color. */
  value?: string | null;
  defaultValue?: string | null;
  /** Every change, also while dragging. */
  onValueChange?: (value: string | null) => void;
  /** Once per finished pick: drag released, swatch, key or eyedropper, hex or % field entered (Enter or leaving it). */
  onChangeCommit?: (value: string | null) => void;
  /** Colors the app offers; strings or { value, label }. A label names the color on the trigger and in the swatch's tooltip. */
  swatches?: KjunColorSwatch[];
  /** Saturation/brightness area and hue slider. */
  custom?: boolean;
  /** Opacity slider and % field; the value always carries AA. */
  alpha?: boolean;
  /** Hex field. */
  input?: boolean;
  /** A "no color" swatch that sets the value to null. */
  clearable?: boolean;
  /** Recent colors the app keeps (strings or { value, label }); giving it shows a "recent" row of up to 8 under the swatches,
   * leaving out colors the swatches already offer. */
  recentColors?: KjunColorSwatch[];
  /** The next recent colors, once the panel closes on a new value: that value first, at most 8. Store it to keep the row. */
  onRecentColorsChange?: (colors: string[]) => void;
  /** A button that picks a color from the screen, where the browser has an EyeDropper (Chromium desktop); hidden elsewhere. */
  eyeDropper?: boolean;
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
/** After the name or code: the code when a name leads, and the opacity below 100%. */
function TriggerDetail({ summary }: { summary: ReturnType<typeof pickerSummary> }) {
  const percent = summary.percent !== undefined && summary.percent < 100 ? summary.percent + "%" : "";
  const detail = summary.name ? summary.hex + (percent && " " + percent) : percent;
  return detail ? <span className="kjun-color-trigger-alpha">{detail}</span> : null;
}

export function KjunColorPicker({
  value, defaultValue = null, onValueChange, onChangeCommit, swatches: rawSwatches, custom = false, alpha = false, input = false,
  clearable = false, recentColors, onRecentColorsChange, eyeDropper = false, open: openGiven, defaultOpen = false, onOpenChange, size = "md",
  placeholder, ariaLabel, error, disabled, readOnly, id, name, renderTrigger, className, style,
}: KjunColorPickerProps) {
  const scope = useKjunMessageScope(), m = scope.messages, field = useKjunField(), spec = tokens.input[size];
  const model = useColorPickerModel({
    value, defaultValue, onValueChange, onChangeCommit, swatches: rawSwatches, custom, alpha, input, clearable,
    open: openGiven, defaultOpen, onOpenChange, disabled, readOnly, recentColors, onRecentColorsChange, eyeDropper,
  });
  const { value: current, open, setOpen, state, selected } = model;
  const summary = pickerSummary(current, alpha, m, colorName(current, [model.swatches, model.recent ?? []]));
  const label = ariaLabel || placeholder || m.colorPlaceholder;
  const grid = (model.swatches.length > 0 || clearable) && { items: swatchItems(model.swatches, clearable, m.colorNone), selected, label: m.swatches, onPick: model.pick,
    swatchRef: (index: number, el: HTMLButtonElement | null) => { targets.current.swatches[index] = el; } };
  const recent = model.recent && model.recent.length > 0 && { items: model.recent, selected: model.recentSelected, label: m.recentColors, onPick: model.pick };

  const trigger = useRef<HTMLButtonElement>(null), valueId = "kjun-color-" + useId();
  const targets = useRef<{ swatches: (HTMLButtonElement | null)[]; area: HTMLElement | null; hex: HTMLInputElement | null }>({ swatches: [], area: null, hex: null });
  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => {
      // Someone already put focus on a control (clicked a field in the panel): leave it there.
      if (trigger.current?.ownerDocument.activeElement?.matches('input, textarea, [role="slider"], [role="radio"]')) return;
      initialFocusTarget(targets.current, { selected, custom, input: model.showInput })?.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [open]);

  const chip = tokens.extensions.colorPicker.triggerSwatch[size];
  return (
    <>
      <div className={"kjun-select-shell kjun-color-picker" + (className ? " " + className : "")} style={style}>
        <button ref={trigger} id={id ?? field?.id} type="button" className="kjun-input kjun-select-trigger kjun-color-trigger"
          disabled={disabled} aria-haspopup="dialog" aria-expanded={open}
          aria-label={field?.labelId ? undefined : label + ", " + summary.spoken}
          aria-labelledby={field?.labelId ? mergeIds(field.labelId, valueId) : undefined}
          aria-describedby={field?.describedBy} aria-invalid={error || !!field?.error || undefined} aria-required={field?.required || undefined}
          aria-readonly={readOnly || undefined}
          style={{ height: spec.height, borderRadius: spec.radius, ...inputTypeStyle(size), paddingInline: spec.padding - tokens.border.controlWidth, gap: spec.affixGap }}
          onClick={() => { if (!readOnly) setOpen(!open); }}
          onKeyDown={event => { if (!readOnly && (event.key === "ArrowDown" || event.key === "ArrowUp")) { event.preventDefault(); setOpen(true); } }}>
          {renderTrigger ? <>{renderTrigger({ value: current, open })}<span id={valueId} className="kjun-sr-only">{summary.spoken}</span></> : <>
            <span className={"kjun-color-chip" + (current ? " kjun-color-checker" : "")} data-none={current ? undefined : ""} aria-hidden="true" style={{ width: chip, height: chip }}>
              <span style={current ? { background: summary.hex, opacity: summary.opacity } : undefined} />
            </span>
            <span id={valueId} className={current ? undefined : "kjun-placeholder"}>
              {current ? <span aria-hidden="true">{summary.name ?? summary.hex}<TriggerDetail summary={summary} /></span> : placeholder ?? m.colorPlaceholder}
              <span className="kjun-sr-only">{summary.spoken}</span>
            </span>
            <KjunIcon name="chevron-down" size={spec.iconSize} style={{ flexShrink: 0, color: disabled ? "var(--_kjun-color-text-disabled)" : "var(--_kjun-color-text-tertiary)" }} />
          </>}
        </button>
        {name && <input type="hidden" name={name} value={current ?? ""} />}
      </div>
      <FloatingPanel field open={open} onOpenChange={setOpen} triggerRef={trigger} placement="bottom-start" className="kjun-color-panel" matchTriggerWidth={coarsePointer()}
        maxHeight={tokens.extensions.floating.maxHeight}>
        {custom && <ColorArea hsv={state.hsv} label={m.colorArea} valueText={m.colorAreaValue(pct(state.hsv.s), pct(state.hsv.v))} empty={current === null} hint={m.colorAreaHint}
          onMove={hsv => model.moveTo({ ...state, hsv })} onPick={hsv => model.pickState({ ...state, hsv })} {...model.drag}
          areaRef={el => { targets.current.area = el; }} />}
        {custom && <ColorChannel channel="hue" value={state.hsv.h} max={360} label={m.hue} valueText={m.hueValue(Math.round(state.hsv.h))} color={stateToValue({ hsv: { h: state.hsv.h, s: 1, v: 1 }, a: 1 }, false)}
          onMove={h => model.moveTo({ ...state, hsv: { ...state.hsv, h } })} onPick={h => model.pickState({ ...state, hsv: { ...state.hsv, h } })} {...model.drag} />}
        {alpha && <ColorChannel channel="alpha" value={pct(state.a)} max={100} label={m.alpha} valueText={pct(state.a) + "%"} color={stateToValue(state, false)}
          onMove={a => model.moveTo({ ...state, a: a / 100 })} onPick={a => model.pickState({ ...state, a: a / 100 })} {...model.drag} />}
        {(model.showInput || model.canPickScreen) && <ColorInputs fields={model.showInput} value={current} alpha={alpha} alphaPercent={pct(state.a)} clearable={clearable}
          hexLabel={m.hex} alphaLabel={m.alpha} eyeDropper={model.canPickScreen ? { label: m.eyeDropper, onPick: model.pickFromScreen } : null}
          onEdit={model.field.onEdit} onCommit={model.field.onCommit} hexRef={el => { targets.current.hex = el; }} />}
        {(grid || recent) && <div className="kjun-color-section">
          {grid && (recent ? <SwatchGroup caption={m.swatches} {...grid} /> : <SwatchGrid {...grid} />)}
          {recent && <SwatchGroup caption={m.recentColors} {...recent} />}
        </div>}
      </FloatingPanel>
    </>
  );
}
