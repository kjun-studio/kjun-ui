import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";
import { tokens } from "@kjun-ui/tokens";
import { formatColor, hsvToRgb, readableInk, type Hsv } from "../../../shared/package-runtime/color";
import { channelKey, colorAreaKey, hexDraft } from "../../../shared/package-runtime/color-picker";
import { bindRadioKeyboard } from "../../../shared/package-runtime/radio-keyboard";
import { inputTypeStyle } from "./typography";
import { KjunIcon } from "./button";

const fraction = (value: number, start: number, length: number) => Math.min(1, Math.max(0, (value - start) / length));

/** Pointer drag on an element: moves report on every step, and release or cancel ends the drag once. */
function useDrag(onMove: (x: number, y: number) => void, onStart: () => void, onEnd: () => void) {
  const active = useRef(false);
  const at = (event: ReactPointerEvent<HTMLElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    onMove(fraction(event.clientX, box.left, box.width), fraction(event.clientY, box.top, box.height));
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

/** Drag reports through onMove between onStart and onEnd; a key is a whole pick through onPick. */
export interface DragHandlers<T> { onMove: (value: T) => void; onPick: (value: T) => void; onStart: () => void; onEnd: () => void }

export function ColorArea({ hsv, label, valueText, areaRef, onMove, onPick, onStart, onEnd }: {
  hsv: Hsv; label: string; valueText: string; areaRef: (el: HTMLElement | null) => void;
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
      <span className="kjun-color-thumb" style={{ left: percent(hsv.s) + "%", top: 100 - percent(hsv.v) + "%" }}>
        <span style={{ background: rgb(hsv) }} />
      </span>
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
      <span className="kjun-color-thumb" style={{ left: (value / max) * 100 + "%" }}>
        <span className={channel === "alpha" ? "kjun-color-checker" : undefined} style={{ position: "relative", overflow: "hidden" }}>
          <span style={{ position: "absolute", inset: 0, background: color, opacity: channel === "alpha" ? value / max : 1 }} />
        </span>
      </span>
    </div>
  );
}

export function SwatchGrid({ swatches, clearable, selected, label, noneLabel, onPick, swatchRef }: {
  swatches: { value: string; label: string }[]; clearable: boolean; selected: number; label: string; noneLabel: string;
  onPick: (value: string | null) => void; swatchRef: (index: number, el: HTMLButtonElement | null) => void;
}) {
  const [group, setGroup] = useState<HTMLDivElement | null>(null);
  useEffect(() => group ? bindRadioKeyboard(group) : undefined, [group]);
  const items = [...(clearable ? [{ value: null as string | null, label: noneLabel }] : []), ...swatches];
  const size = tokens.extensions.colorPicker.swatchSize, icon = size * 2 / 3;
  return (
    <div ref={setGroup} className="kjun-color-swatches" role="radiogroup" aria-label={label}>
      {items.map((item, index) => {
        const checked = index === selected;
        return (
          <button key={index} ref={el => swatchRef(index, el)} type="button" role="radio" aria-checked={checked} aria-label={item.label}
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

/** The hex field and, with alpha, the % field. A complete code picks at once; Enter or leaving picks a short code or reverts.
 * The picker drops a pick equal to its value, so Enter after a complete code reports nothing twice. */
export function HexInputs({ value, alpha, alphaPercent, clearable, hexLabel, alphaLabel, onPick, hexRef }: {
  value: string | null; alpha: boolean; alphaPercent: number; clearable: boolean; hexLabel: string; alphaLabel: string;
  onPick: (value: string | null) => void; hexRef: (el: HTMLInputElement | null) => void;
}) {
  const shown = value ? value.slice(1, 7) : "";
  const [text, setText] = useState(shown), [pct, setPct] = useState(String(alphaPercent));
  const editing = useRef<"hex" | "alpha" | null>(null);
  useEffect(() => { if (editing.current !== "hex") setText(shown); }, [shown]);
  useEffect(() => { if (editing.current !== "alpha") setPct(String(alphaPercent)); }, [alphaPercent]);
  const withAlpha = (six: string) => alpha ? six + (value ? value.slice(7, 9) : "FF") : six;
  const commitHex = () => {
    editing.current = null;
    const draft = hexDraft(text.length === 6 ? withAlpha(text) : text, alpha);
    if (draft.commit === "revert" || (draft.commit === null && !clearable)) { setText(shown); return; }
    onPick(draft.commit);
    setText(draft.commit ? draft.commit.slice(1, 7) : "");
  };
  const alphaHex = (n: number) => Math.round(n / 100 * 255).toString(16).toUpperCase().padStart(2, "0");
  const validPct = (t: string) => /^\d{1,3}$/.test(t) && Number(t) <= 100;
  const commitPct = () => {
    editing.current = null;
    if (!validPct(pct) || !value) { setPct(String(alphaPercent)); return; }
    onPick(value.slice(0, 7) + alphaHex(Number(pct)));
  };
  const field = tokens.input.sm;
  const style: CSSProperties = { height: field.height, borderRadius: field.radius, paddingInline: field.padding - tokens.border.controlWidth, ...inputTypeStyle("sm") };
  const keys = (commit: () => void) => (event: KeyboardEvent<HTMLInputElement>) => { if (event.key === "Enter") { event.preventDefault(); commit(); } };
  return (
    <div className="kjun-color-inputs">
      <div className="kjun-input-wrap">
        <input ref={hexRef} className="kjun-input kjun-input-native kjun-color-hex" aria-label={hexLabel} value={text} maxLength={alpha ? 9 : 7}
          spellCheck={false} autoComplete="off" style={style}
          onChange={event => {
            editing.current = "hex";
            const next = event.target.value.replace(/^#/, "");
            setText(next);
            const live = hexDraft(next.length === 6 ? withAlpha(next) : next, alpha).live;
            if (live) onPick(live);
          }}
          onKeyDown={keys(commitHex)} onBlur={commitHex} />
      </div>
      {alpha && (
        <input className="kjun-input kjun-input-native kjun-color-alpha" aria-label={alphaLabel} value={pct} inputMode="numeric" maxLength={3}
          autoComplete="off" style={style}
          onChange={event => {
            editing.current = "alpha";
            setPct(event.target.value);
            if (validPct(event.target.value) && value) onPick(value.slice(0, 7) + alphaHex(Number(event.target.value)));
          }}
          onKeyDown={keys(commitPct)} onBlur={commitPct} />
      )}
    </div>
  );
}
