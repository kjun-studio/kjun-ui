import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";
import { tokens } from "@kjun-ui/tokens";
import { formatColor, hsvToRgb, readableInk, type Hsv } from "../../../shared/package-runtime/color";
import { channelKey, colorAreaKey, trackFraction } from "../../../shared/package-runtime/color-picker";
import { alphaFieldLive, hexFieldCommit, hexFieldLive, hexFieldText } from "../../../shared/package-runtime/color-picker-model";
import { bindRadioKeyboard } from "../../../shared/package-runtime/radio-keyboard";
import { inputTypeStyle } from "./typography";
import { KjunButton, KjunIcon } from "./button";

const thumb = tokens.extensions.colorPicker.thumbSize;

/** Pointer drag on an element: moves report on every step, and release or cancel ends the drag once. */
function useDrag(onMove: (x: number, y: number) => void, onStart: () => void, onEnd: () => void) {
  const active = useRef(false);
  const at = (event: ReactPointerEvent<HTMLElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    // The ends lie half a thumb in, where the thumb stops: a press in that margin picks the first or last value.
    onMove(trackFraction(event.clientX, box.left, box.width, thumb), trackFraction(event.clientY, box.top, box.height, thumb));
  };
  const end = (event: ReactPointerEvent<HTMLElement>) => {
    if (!active.current) return;
    active.current = false;
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    onEnd();
  };
  return {
    onPointerDown: (event: ReactPointerEvent<HTMLElement>) => {
      if (event.button !== 0) return;
      event.preventDefault();
      active.current = true;
      event.currentTarget.setPointerCapture?.(event.pointerId);
      event.currentTarget.focus({ preventScroll: true });
      onStart();
      at(event);
    },
    onPointerMove: (event: ReactPointerEvent<HTMLElement>) => { if (active.current) at(event); },
    onPointerUp: end,
    onPointerCancel: end,
    onLostPointerCapture: end,
  };
}

const rgb = (hsv: Hsv) => formatColor(hsvToRgb(hsv), false);
const percent = (n: number) => Math.round(n * 100);
/** A thumb at fractions x, y of its box, kept inside it (see .kjun-color-thumb). */
const place = (x: number, y: number | null): CSSProperties => ({
  left: x * 100 + "%", ...(y === null ? {} : { top: y * 100 + "%" }), transform: `translate(${-x * 100}%, ${y === null ? -50 : -y * 100}%)`,
});

/** Drag reports through onMove between onStart and onEnd; a key is a whole pick through onPick. */
export interface DragHandlers<T> { onMove: (value: T) => void; onPick: (value: T) => void; onStart: () => void; onEnd: () => void }

/** The saturation/brightness area; with no value yet (empty) it shows a hint instead of a thumb. */
export function ColorArea({ hsv, label, valueText, empty, hint, areaRef, onMove, onPick, onStart, onEnd }: {
  hsv: Hsv; label: string; valueText: string; empty: boolean; hint: string; areaRef: (el: HTMLElement | null) => void;
} & DragHandlers<Hsv>) {
  const drag = useDrag((x, y) => onMove({ ...hsv, s: x, v: 1 - y }), onStart, onEnd);
  return (
    <div ref={areaRef} className="kjun-color-area" role="slider" tabIndex={0} aria-label={label} aria-roledescription={label}
      aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent(hsv.s)} aria-valuetext={valueText}
      style={{ "--_kjun-color-picker-hue": rgb({ h: hsv.h, s: 1, v: 1 }) } as CSSProperties}
      onKeyDown={(event: KeyboardEvent) => {
        const next = colorAreaKey(event.key, event.shiftKey, hsv);
        if (!next) return;
        event.preventDefault();
        onPick(next);
      }}
      {...drag}>
      {empty ? <span className="kjun-type-caption kjun-color-area-hint" aria-hidden="true">{hint}</span> : (
        <span className="kjun-color-thumb" style={place(hsv.s, 1 - hsv.v)}>
          <span style={{ background: rgb(hsv) }} />
        </span>
      )}
    </div>
  );
}

export function ColorChannel({ channel, value, max, label, valueText, color, onMove, onPick, onStart, onEnd }: {
  channel: "hue" | "alpha"; value: number; max: number; label: string; valueText: string; color: string;
} & DragHandlers<number>) {
  const drag = useDrag(x => onMove(Math.round(x * max)), onStart, onEnd);
  return (
    <div className={"kjun-color-channel" + (channel === "alpha" ? " kjun-color-checker" : "")} data-channel={channel} role="slider" tabIndex={0}
      aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={Math.round(value)} aria-valuetext={valueText}
      style={{ "--_kjun-color-picker-current": color } as CSSProperties}
      onKeyDown={(event: KeyboardEvent) => {
        const next = channelKey(event.key, event.shiftKey, value, max);
        if (next === null) return;
        event.preventDefault();
        onPick(next);
      }}
      {...drag}>
      {channel === "alpha" && <i />}
      <span className="kjun-color-thumb" style={place(value / max, null)}>
        <span className={channel === "alpha" ? "kjun-color-checker" : undefined} style={{ position: "relative", overflow: "hidden" }}>
          <span style={{ position: "absolute", inset: 0, background: color, opacity: channel === "alpha" ? value / max : 1 }} />
        </span>
      </span>
    </div>
  );
}

/** One radio group of color items; "no color" is the item whose value is null. */
export function SwatchGrid({ items, selected, label, onPick, swatchRef }: {
  items: { value: string | null; label: string }[]; selected: number; label: string;
  onPick: (value: string | null) => void; swatchRef?: (index: number, el: HTMLButtonElement | null) => void;
}) {
  const [group, setGroup] = useState<HTMLDivElement | null>(null);
  useEffect(() => group ? bindRadioKeyboard(group) : undefined, [group]);
  const icon = tokens.extensions.colorPicker.swatchIconSize;
  return (
    <div ref={setGroup} className="kjun-color-swatches" role="radiogroup" aria-label={label}>
      {items.map((item, index) => {
        const checked = index === selected;
        return (
          <button key={index} ref={el => swatchRef?.(index, el)} type="button" role="radio" aria-checked={checked} aria-label={item.label} title={item.label}
            className="kjun-color-swatch" data-selected={checked || undefined} data-ink={item.value ? readableInk(item.value) : undefined}
            onClick={() => onPick(item.value)}>
            <span className={"kjun-color-chip" + (item.value ? " kjun-color-checker" : "")} data-none={item.value ? undefined : ""}>
              <span style={item.value ? { background: item.value } : undefined} />
            </span>
            {checked && item.value && <KjunIcon name="check" size={icon} />}
          </button>
        );
      })}
    </div>
  );
}

/** A swatch row under a caption (the swatches when recent colors show too, and the recent colors). */
export function SwatchGroup({ caption, ...grid }: { caption: string } & Parameters<typeof SwatchGrid>[0]) {
  return (
    <div className="kjun-color-group">
      <span className="kjun-type-caption kjun-color-group-label" aria-hidden="true">{caption}</span>
      <SwatchGrid {...grid} />
    </div>
  );
}

/** The width an affix (# or %) takes, so the digits start after it. */
function useAffixWidth() {
  const [width, setWidth] = useState(0), el = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => { const next = el.current?.offsetWidth ?? 0; if (next !== width) setWidth(next); });
  return [el, width] as const;
}

/** The eyedropper button and the hex and % fields. Typing changes the value once a code is complete;
 * Enter or leaving a field commits it (a short code expands, a bad one reverts). */
export function ColorInputs({ fields, value, alpha, alphaPercent, clearable, hexLabel, alphaLabel, eyeDropper, onEdit, onCommit, hexRef }: {
  fields: boolean; value: string | null; alpha: boolean; alphaPercent: number; clearable: boolean; hexLabel: string; alphaLabel: string;
  eyeDropper: { label: string; onPick: () => void } | null;
  onEdit: (live: string | null) => void; onCommit: (next: string | null | "revert") => void; hexRef: (el: HTMLInputElement | null) => void;
}) {
  const shown = hexFieldText(value);
  const [text, setText] = useState(shown), [pct, setPct] = useState(String(alphaPercent));
  // editing: the field being typed in; reported: the last value the fields changed. A value from anywhere else (a swatch,
  // a drag, the app) ends the edit, so a late blur cannot write stale text over it.
  const editing = useRef<"hex" | "alpha" | null>(null), reported = useRef(value);
  useEffect(() => {
    if (value !== reported.current) { editing.current = null; reported.current = value; }
    if (editing.current !== "hex") setText(shown);
    if (editing.current !== "alpha") setPct(String(alphaPercent));
  }, [value, alphaPercent]);
  const edit = (field: "hex" | "alpha", live: string | null) => { editing.current = field; if (live !== null) reported.current = live; onEdit(live); };
  const commitHex = () => {
    // Nothing typed (or already committed by Enter): leaving the field changes nothing.
    if (editing.current !== "hex") return;
    editing.current = null;
    const next = hexFieldCommit(text, alpha, value, clearable);
    setText(next === "revert" ? shown : hexFieldText(next));
    if (next !== "revert") reported.current = next;
    onCommit(next);
  };
  const commitPct = () => {
    if (editing.current !== "alpha") return;
    editing.current = null;
    const next = alphaFieldLive(pct, value);
    if (next === null) setPct(String(alphaPercent)); else reported.current = next;
    onCommit(next ?? "revert");
  };
  const field = tokens.input.sm, pad = field.padding - tokens.border.controlWidth, gap = tokens.extensions.colorPicker.affixGap;
  const [sign, signWidth] = useAffixWidth(), [unit, unitWidth] = useAffixWidth();
  const style: CSSProperties = { height: field.height, borderRadius: field.radius, paddingInline: pad, ...inputTypeStyle("sm") };
  const keys = (commit: () => void) => (event: KeyboardEvent<HTMLInputElement>) => { if (event.key === "Enter") { event.preventDefault(); commit(); } };
  const affix = (side: "left" | "right"): CSSProperties => ({ [side]: field.padding, pointerEvents: "none", ...inputTypeStyle("sm") });
  return (
    <div className="kjun-color-inputs">
      {eyeDropper && (
        <KjunButton variant="ghost" size="sm" prefixIcon="color-picker" className="kjun-color-eyedropper" ariaLabel={eyeDropper.label} title={eyeDropper.label}
          onClick={eyeDropper.onPick} />
      )}
      {fields && (
        <div className="kjun-input-wrap">
          <span ref={sign} className="kjun-input-affix kjun-color-affix" aria-hidden="true" style={affix("left")}>#</span>
          <input ref={hexRef} className="kjun-input kjun-input-native kjun-color-hex" aria-label={hexLabel} value={text} maxLength={alpha ? 9 : 7}
            placeholder="RRGGBB" spellCheck={false} autoComplete="off" style={{ ...style, paddingLeft: pad + signWidth + gap }}
            onChange={event => {
              const next = event.target.value.replace(/^#/, "");
              setText(next);
              edit("hex", hexFieldLive(next, alpha, value));
            }}
            onKeyDown={keys(commitHex)} onBlur={commitHex} />
        </div>
      )}
      {fields && alpha && (
        <div className="kjun-input-wrap">
          <input className="kjun-input kjun-input-native kjun-color-alpha" aria-label={alphaLabel} value={pct} inputMode="numeric" maxLength={3}
            autoComplete="off" style={{ ...style, paddingRight: pad + unitWidth + gap }}
            onChange={event => {
              setPct(event.target.value);
              edit("alpha", alphaFieldLive(event.target.value, value));
            }}
            onKeyDown={keys(commitPct)} onBlur={commitPct} />
          <span ref={unit} className="kjun-input-affix kjun-color-affix" aria-hidden="true" style={affix("right")}>%</span>
        </div>
      )}
    </div>
  );
}
