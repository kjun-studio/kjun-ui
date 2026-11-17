import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type ChangeEvent, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import { isComposingKey, type InputSize } from "@kjun-ui/tokens";
import { useKjunMessageScope } from "../../../shared/package-runtime/messages-context";
import {
  addsTooManyDigits, caretForCount, commitNumber, deleteAcrossSeparator, formatNumber, isPasteEdit, numberKeyboard, rangeIssue, rangeMessage,
  readingAid as readNumber, resolveNumberInput, sanitizeNumber, type NumberInputOptions,
} from "../../../shared/package-runtime/number-input";
import { KjunInput, useKjunField } from "./input";

export interface KjunNumberInputProps extends NumberInputOptions {
  /** Normalized value without group separators: "", "1250000", "-3.5", "12.50". */
  value: string;
  prefix?: ReactNode;
  suffix?: ReactNode;
  /** Shows "1억 2,003만 5,000 원" under the field for integers of 10,000 or more. */
  readingAid?: boolean;
  align?: "start" | "end";
  size?: InputSize;
  disabled?: boolean;
  readOnly?: boolean;
  error?: boolean;
  id?: string;
  ariaLabel?: string;
  placeholder?: string;
  /** Every edit, unpadded; also the committed value when committing or cancelling changes it. */
  onValueChange?: (value: string) => void;
  /** Blur or Enter, with the fraction padded to `decimals`. */
  onChangeCommit?: (value: string) => void;
  className?: string;
  style?: CSSProperties;
}

type View = { text: string; caret: number | null };
type Issue = "min" | "max" | null;

export function KjunNumberInput({
  value, format, decimals, grouping, allowNegative, min, max, prefix, suffix, readingAid = false, align = "start",
  size = "md", disabled = false, readOnly = false, error = false, id, ariaLabel, placeholder,
  onValueChange, onChangeCommit, className, style,
}: KjunNumberInputProps) {
  const scope = useKjunMessageScope();
  const field = useKjunField();
  // Only a text suffix reaches the messages; a node suffix is decoration (null keeps it from falling back to the preset).
  const suffixText = suffix === undefined || typeof suffix === "string" ? suffix : null;
  const o = useMemo(() => resolveNumberInput({ format, decimals, grouping, allowNegative, min, max, suffix: suffixText }),
    [format, decimals, grouping, allowNegative, min, max, suffixText]);
  const shown = (raw: string) => formatNumber(sanitizeNumber(raw, o), o);
  const [view, setView] = useState<View>(() => ({ text: shown(value), caret: null }));
  const [issue, setIssue] = useState<Issue>(null);
  const input = useRef<HTMLInputElement>(null);
  const composing = useRef(false), dirty = useRef(false);
  // `emitted` is the last value this field reported; `accepted` the last committed one, which Escape restores.
  const emitted = useRef(value), accepted = useRef(value), acceptedIssue = useRef<Issue>(null);
  const aidId = "kjun-number-reading-" + useId().replace(/:/g, "");

  // A new value from outside rebuilds the text, except while the user is editing (a parent that echoes "12" for "12." must not drop the dot).
  useEffect(() => {
    if (value === emitted.current || dirty.current) return;
    emitted.current = accepted.current = value;
    acceptedIssue.current = null;
    setIssue(null);
    setView({ text: shown(value), caret: null });
  }, [value]);
  // Options can change how the same value is written (grouping, decimals).
  useEffect(() => {
    if (dirty.current) return;
    const text = shown(accepted.current);
    setView(old => old.text === text ? old : { text, caret: null });
  }, [o]);
  useLayoutEffect(() => {
    const el = input.current;
    if (view.caret === null || !el || el.ownerDocument.activeElement !== el) return;
    el.setSelectionRange(view.caret, view.caret);
  }, [view]);

  const report = (raw: string) => {
    if (raw === emitted.current) return;
    emitted.current = raw;
    onValueChange?.(raw);
  };
  // `count` is how many digits, "." and "-" of the cleaned text sit before the caret.
  const show = (raw: string, count: number) => {
    const text = formatNumber(raw, o);
    setView({ text, caret: Math.min(caretForCount(text, count), text.length) });
    if (issue && !rangeIssue(raw, o)) setIssue(null);
    report(raw);
  };
  const edit = (text: string, caret: number, pasted = false) => {
    // A digit typed past the integer limit is refused: the text and the caret stay where they were.
    if (!pasted && addsTooManyDigits(view.text, text, o)) {
      setView({ text: view.text, caret: Math.max(0, caret - (text.length - view.text.length)) });
      return;
    }
    dirty.current = true;
    const raw = sanitizeNumber(text, o, { pasted });
    // Cleaning the text before the caret counts what survives there: ".5" grows to "0.5", "007" shrinks to "7", a "-" anywhere moves to the front.
    const before = sanitizeNumber(text.slice(0, caret), o, { pasted });
    show(raw, before.length + (raw.startsWith("-") && !before.startsWith("-") ? 1 : 0));
  };
  const change = (event: ChangeEvent<HTMLInputElement>) => {
    const el = event.target;
    if (composing.current) { dirty.current = true; setView({ text: el.value, caret: null }); return; }
    edit(el.value, el.selectionStart ?? el.value.length, isPasteEdit(view.text, el.value, (event.nativeEvent as InputEvent).inputType));
  };
  const commit = (text = view.text) => {
    if (composing.current || !dirty.current || disabled || readOnly) return;
    dirty.current = false;
    const next = commitNumber(sanitizeNumber(text, o), o);
    const found = rangeIssue(next, o);
    setView({ text: formatNumber(next, o), caret: null });
    setIssue(found);
    acceptedIssue.current = found;
    report(next);
    if (next !== accepted.current) { accepted.current = next; onChangeCommit?.(next); }
  };
  const key = (event: KeyboardEvent<HTMLInputElement>) => {
    if (disabled || readOnly || isComposingKey(event, composing.current)) return;
    if (event.key === "Escape" && dirty.current) {
      event.preventDefault();
      event.stopPropagation();
      dirty.current = false;
      setView({ text: shown(accepted.current), caret: null });
      setIssue(acceptedIssue.current);
      report(accepted.current);
      return;
    }
    if ((event.key !== "Backspace" && event.key !== "Delete") || event.altKey || event.ctrlKey || event.metaKey) return;
    const el = event.currentTarget;
    const removed = deleteAcrossSeparator(el.value, el.selectionStart ?? 0, el.selectionEnd ?? 0, event.key);
    if (!removed) return;
    event.preventDefault();
    dirty.current = true;
    show(sanitizeNumber(removed.text, o), removed.caret);
  };

  const raw = sanitizeNumber(view.text, o);
  const aid = readingAid ? readNumber(raw, o, scope) : "";
  // A caller's error or the group's error wins; the built-in range message then stays out of the way.
  const message = issue && !error && !field?.error ? rangeMessage(issue, o, scope) : "";
  return <div className={"kjun-number-input" + (className ? " " + className : "")} data-format={o.format} data-align={align} style={style}>
    <KjunInput ref={input} type="text" inputMode={numberKeyboard(o).inputMode} value={view.text} size={size}
      prefix={prefix} suffix={suffix ?? o.suffix} disabled={disabled} readOnly={readOnly} error={error} errorMessage={message}
      id={id} ariaLabel={ariaLabel} placeholder={placeholder} aria-describedby={aid ? aidId : undefined}
      onChange={change} onBlur={() => commit()} onEnter={() => commit()} onKeyDown={key}
      onCompositionStart={() => { composing.current = true; }}
      onCompositionEnd={event => {
        composing.current = false;
        const el = event.currentTarget;
        edit(el.value, el.selectionStart ?? el.value.length);
        // Some IMEs end composition after blur, when the blur commit was skipped; commit now so the field does not stay dirty.
        if (el.ownerDocument.activeElement !== el) commit(el.value);
      }} />
    {aid && <p id={aidId} className="kjun-form-hint kjun-number-input-reading">{aid}</p>}
  </div>;
}
