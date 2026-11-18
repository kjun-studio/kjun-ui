import { useKjunMessages } from "../../../shared/package-runtime/messages-context";
import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { createNumberDomain, quantityKeyAction, tokens, type InputSize } from "@kjun-ui/tokens";
import { KjunButton } from "./button";
import { componentIcons } from "../../../shared/package-runtime/component-icons";
import { IconFallbacks } from "../../../shared/package-runtime/icon-context";
import { numberKeyboard } from "../../../shared/package-runtime/number-input";
import { createPressRepeat } from "../../../shared/package-runtime/press-repeat";
import { useKjunField } from "./input";
export interface KjunQuantityStepperProps {
  value: number; min?: number; max?: number; step?: number; precision?: number;
  disabled?: boolean; error?: boolean; size?: InputSize; block?: boolean; id?: string; ariaLabel?: string;
  /** Submits the value with a surrounding form under this name (a hidden input); not sent while disabled. */
  name?: string;
  onValueChange?: (value: number) => void; onChangeCommit?: (value: number) => void;
  onInvalidInput?: (draft: string) => void;
}
export function KjunQuantityStepper({ value, min = 0, max, step = 1, precision = 0, disabled = false, error = false, size = "md", block = false, id, ariaLabel, name, onValueChange, onChangeCommit, onInvalidInput }: KjunQuantityStepperProps) {
  const m = useKjunMessages();
  const buttonStyle = { width: tokens.input[size].height, padding: 0 };
  const domain = createNumberDomain({ min, max, step, precision });
  // Only a broken setup (range, step, precision) or a value the precision cannot hold locks the field. A value outside the
  // range (stock fell under the cart quantity) stays editable and shows as invalid; a step or a commit brings it back in range.
  const usable = domain.fits(value), blocked = disabled || !usable, outside = usable && !domain.inRange(value);
  const [draft, setDraft] = useState(String(value));
  const field = useKjunField();
  const invalid = error || !!field?.error || outside;
  const composing = useRef(false), dirty = useRef(false), accepted = useRef(value);
  useEffect(() => { setDraft(String(value)); accepted.current = value; dirty.current = false; }, [value, precision, min, max, step]);
  useEffect(() => { if (!usable) console.warn("KJUN QuantityStepper: 범위·step·정밀도·값을 확인하세요."); }, [usable]);
  const emit = (next: number) => {
    setDraft(String(value)); dirty.current = false;
    if (next === accepted.current) return;
    onValueChange?.(next); onChangeCommit?.(next);
  };
  const commit = () => {
    if (blocked || composing.current || !dirty.current) return;
    const next = domain.fromDraft(draft);
    if (next === null) { onInvalidInput?.(draft); setDraft(String(accepted.current)); dirty.current = false; }
    else emit(next);
  };
  // Returns whether the value moved, so a held button stops at the end of the range.
  const move = (direction: number) => {
    if (blocked) return false;
    const next = domain.move(accepted.current, direction);
    emit(next);
    return next !== accepted.current;
  };
  const latest = useRef(move);
  latest.current = move;
  const [decrease] = useState(() => createPressRepeat(() => latest.current(-1), tokens.extensions.compound.repeatDelay, tokens.extensions.compound.repeatInterval));
  const [increase] = useState(() => createPressRepeat(() => latest.current(1), tokens.extensions.compound.repeatDelay, tokens.extensions.compound.repeatInterval));
  useEffect(() => () => { decrease.stop(); increase.stop(); }, []);
  const key = (event: KeyboardEvent<HTMLInputElement>) => {
    if (blocked) return;
    const action = quantityKeyAction(event, composing.current, dirty.current);
    if (!action) return;
    event.preventDefault();
    if (action === "cancel") {
      event.stopPropagation();
      dirty.current = false;
      setDraft(String(accepted.current));
    } else if (action === "commit") commit();
    else move(action === "increment" ? 1 : -1);
  };
  // Pressing a step button keeps focus in the input; holding it repeats the step.
  const press = (repeat: typeof increase) => (event: PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return;
    repeat.start(event.currentTarget.ownerDocument.defaultView ?? undefined);
  };
  const atMin = value <= min, atMax = max !== undefined && value >= max;
  return <IconFallbacks icons={componentIcons}><div className="kjun-quantity" data-size={size} data-block={block} data-error={invalid}>
    <KjunButton size={size} style={buttonStyle} variant="ghost" ariaLabel={m.decreaseQuantity} disabled={blocked || atMin} onMouseDown={e => e.preventDefault()} onPointerDown={press(decrease)}
      onClick={() => { if (!decrease.takeRepeated()) move(-1); }} prefixIcon="minus" />
    <input className="kjun-input" id={id || field?.id} type="text" inputMode={numberKeyboard({ allowNegative: min < 0, decimals: precision }).inputMode} role="spinbutton" aria-label={ariaLabel || (field?.labelId ? undefined : m.quantity)} aria-labelledby={ariaLabel ? undefined : field?.labelId} aria-describedby={field?.describedBy} aria-invalid={invalid || undefined} aria-valuemin={min} aria-valuemax={max} aria-valuenow={value} value={draft} disabled={blocked}
      onChange={event => { dirty.current = true; setDraft(event.target.value); }} onBlur={commit}
      onCompositionStart={() => { composing.current = true; }} onCompositionEnd={event => { composing.current = false; dirty.current = true; setDraft(event.currentTarget.value); }}
      onKeyDown={key} aria-required={field?.required || undefined} />
    <KjunButton size={size} style={buttonStyle} variant="ghost" ariaLabel={m.increaseQuantity} disabled={blocked || atMax} onMouseDown={e => e.preventDefault()} onPointerDown={press(increase)}
      onClick={() => { if (!increase.takeRepeated()) move(1); }} prefixIcon="plus" />
    {name && <input type="hidden" name={name} value={String(value)} disabled={disabled} />}
  </div></IconFallbacks>;
}
