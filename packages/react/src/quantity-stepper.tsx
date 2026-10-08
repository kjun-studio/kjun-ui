import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { createNumberDomain, quantityKeyAction, tokens, type InputSize } from "@kjun/tokens";
import { DsButton } from "./button";
import { componentIcons } from "../../../shared/package-runtime/component-icons";
import { IconFallbacks } from "../../../shared/package-runtime/icon-context";
import { useKjunField } from "./input";
export interface DsQuantityStepperProps {
  value: number; min?: number; max?: number; step?: number; precision?: number;
  disabled?: boolean; error?: boolean; size?: InputSize; block?: boolean; id?: string; ariaLabel?: string;
  onValueChange?: (value: number) => void; onChangeCommit?: (value: number) => void;
  onInvalidInput?: (draft: string) => void;
}
export function DsQuantityStepper({ value, min = 0, max, step = 1, precision = 0, disabled = false, error = false, size = "md", block = false, id, ariaLabel, onValueChange, onChangeCommit, onInvalidInput }: DsQuantityStepperProps) {
  const geometry = tokens.extensions.compound;
  const buttonStyle = { width: tokens.input[size].height, padding: 0 };
  const domain = createNumberDomain({ min, max, step, precision });
  const valid = domain.valid && domain.accepts(value), blocked = disabled || !valid;
  const [draft, setDraft] = useState(String(value));
  const field = useKjunField();
  const composing = useRef(false), dirty = useRef(false), accepted = useRef(value);
  useEffect(() => { setDraft(String(value)); accepted.current = value; dirty.current = false; }, [value, precision, min, max, step]);
  useEffect(() => { if (!valid) console.warn("KJUN QuantityStepper: 범위·step·정밀도·값을 확인하세요."); }, [valid]);
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
  const move = (direction: number) => { if (!blocked) emit(domain.move(accepted.current, direction)); };
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
  return <IconFallbacks icons={componentIcons}><div className="kjun-quantity" data-size={size} data-block={block} data-error={error || !!field?.error}>
    <DsButton size={size} style={buttonStyle} variant="ghost" ariaLabel="수량 줄이기" disabled={blocked || value <= min} onMouseDown={e => e.preventDefault()} onClick={() => move(-1)} prefixIcon="minus" />
    <input className="kjun-input" id={id || field?.id} type="text" inputMode={precision ? "decimal" : "numeric"} role="spinbutton" aria-label={ariaLabel || (field?.labelId ? undefined : "수량")} aria-labelledby={ariaLabel ? undefined : field?.labelId} aria-describedby={field?.describedBy} aria-invalid={error || !!field?.error || undefined} aria-valuemin={min} aria-valuemax={max} aria-valuenow={value} value={draft} disabled={blocked}
      onChange={event => { dirty.current = true; setDraft(event.target.value); }} onBlur={commit}
      onCompositionStart={() => { composing.current = true; }} onCompositionEnd={event => { composing.current = false; dirty.current = true; setDraft(event.currentTarget.value); }}
      onKeyDown={key} aria-required={field?.required || undefined} />
    <DsButton size={size} style={buttonStyle} variant="ghost" ariaLabel="수량 늘리기" disabled={blocked || (max !== undefined && value >= max)} onMouseDown={e => e.preventDefault()} onClick={() => move(1)} prefixIcon="plus" />
  </div></IconFallbacks>;
}
