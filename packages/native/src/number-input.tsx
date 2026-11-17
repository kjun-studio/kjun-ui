import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { Platform, View, type KeyboardTypeOptions, type NativeSyntheticEvent, type StyleProp, type TextInputKeyPressEventData, type TextInputSelectionChangeEventData, type ViewStyle } from "react-native";
import { isComposingKey, tokens, type InputSize } from "@kjun-ui/tokens";
import { useKjunMessageScope } from "../../../shared/package-runtime/messages-context";
import {
  addsTooManyDigits, caretAfterEdit, caretForCount, commitNumber, deleteAcrossSeparator, formatNumber, isPasteEdit, numberKeyboard, rangeIssue, rangeMessage,
  readingAid as readNumber, resolveNumberInput, sameNumber, sanitizeNumber, type NumberInputOptions,
} from "../../../shared/package-runtime/number-input";
import { KjunInput, useKjunField } from "./input";
import type { KjunTextInputHandle } from "./handles";
import { FontText } from "./internal";
import { useKjunStyles } from "./provider";
import { typeStyle } from "./typography";

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
  /** Blur or submit, with the fraction padded to `decimals`. */
  onChangeCommit?: (value: string) => void;
  style?: StyleProp<ViewStyle>;
}

type Selection = { start: number; end: number };
// `selection` is set once after a reformat and released on the next selection change, so the platform owns the caret again.
type Shown = { text: string; selection?: Selection };
type Issue = "min" | "max" | null;
const web = Platform.OS === "web";

export function KjunNumberInput({
  value, format, decimals, grouping, allowNegative, min, max, prefix, suffix, readingAid = false, align = "start",
  size = "md", disabled = false, readOnly = false, error = false, id, ariaLabel, placeholder,
  onValueChange, onChangeCommit, style,
}: KjunNumberInputProps) {
  const scope = useKjunMessageScope();
  const field = useKjunField();
  const { colors, fontFamily, numericFontFamily } = useKjunStyles();
  // Only a text suffix reaches the messages; a node suffix is decoration (null keeps it from falling back to the preset).
  const suffixText = suffix === undefined || typeof suffix === "string" ? suffix : null;
  const o = useMemo(() => resolveNumberInput({ format, decimals, grouping, allowNegative, min, max, suffix: suffixText }),
    [format, decimals, grouping, allowNegative, min, max, suffixText]);
  const shown = (raw: string) => formatNumber(sanitizeNumber(raw, o), o);
  const outOfRange = (raw: string) => rangeIssue(sanitizeNumber(raw, o), o);
  const [view, setView] = useState<Shown>(() => ({ text: shown(value) }));
  const [issue, setIssue] = useState<Issue>(null);
  const input = useRef<KjunTextInputHandle | null>(null);
  const composing = useRef(false), dirty = useRef(false), cancelledEscape = useRef(false);
  // The text before a composition: an IME (or Firefox inserting text) that adds several characters at once is read as a paste.
  const composedFrom = useRef("");
  // `emitted` is the last value this field reported; `accepted` the last committed one, which Escape restores.
  const emitted = useRef(value), accepted = useRef(value), acceptedIssue = useRef<Issue>(null);
  // The text on screen and the last selection the platform reported, read by events between renders.
  const text = useRef(view.text), selection = useRef<Selection>({ start: view.text.length, end: view.text.length });
  const aidId = "kjun-number-reading-" + useId().replace(/:/g, "");
  const put = (next: Shown) => {
    text.current = next.text;
    // Without a caret of its own (commit, cancel, a new value) the text is replaced and the caret sits at its end.
    selection.current = next.selection ?? { start: next.text.length, end: next.text.length };
    setView(next);
  };

  // A new value from outside rebuilds the text and ends an edit in progress (an app's quick-amount button), unless it is the
  // same number as the draft: a parent that echoes "12" for "12." must not drop the dot.
  useEffect(() => {
    if (value === emitted.current || (dirty.current && sameNumber(value, emitted.current))) return;
    const editing = dirty.current;
    dirty.current = false;
    emitted.current = accepted.current = value;
    const found = outOfRange(value);
    acceptedIssue.current = found;
    setIssue(found);
    const next = shown(value);
    // While editing the field has focus, so the caret is placed at the end; otherwise the platform keeps its own.
    put(editing ? { text: next, selection: { start: next.length, end: next.length } } : { text: next });
  }, [value]);
  // Options can change how the same value is written (grouping, decimals) and whether it is in range (min, max).
  const options = useRef(o);
  useEffect(() => {
    if (options.current === o) return;
    options.current = o;
    const found = outOfRange(accepted.current);
    acceptedIssue.current = found;
    if (dirty.current) return;
    setIssue(found);
    const next = shown(accepted.current);
    if (next !== text.current) put({ text: next });
  }, [o]);

  const report = (raw: string) => {
    if (raw === emitted.current) return;
    emitted.current = raw;
    onValueChange?.(raw);
  };
  // `count` is how many digits, "." and "-" of the cleaned text sit before the caret.
  const show = (raw: string, count: number) => {
    const next = formatNumber(raw, o), caret = Math.min(caretForCount(next, count), next.length);
    put({ text: next, selection: { start: caret, end: caret } });
    if (issue && !rangeIssue(raw, o)) setIssue(null);
    report(raw);
  };
  const edit = (typed: string, caret: number, pasted = false) => {
    const previous = text.current;
    // A digit typed past the integer limit is refused: the text and the caret stay where they were.
    if (!pasted && addsTooManyDigits(previous, typed, o)) {
      const at = Math.max(0, caret - (typed.length - previous.length));
      put({ text: previous, selection: { start: at, end: at } });
      return;
    }
    dirty.current = true;
    const raw = sanitizeNumber(typed, o, { pasted });
    // Cleaning the text before the caret counts what survives there: ".5" grows to "0.5", "007" shrinks to "7", a "-" anywhere moves to the front.
    const before = sanitizeNumber(typed.slice(0, caret), o, { pasted });
    show(raw, before.length + (raw.startsWith("-") && !before.startsWith("-") ? 1 : 0));
  };
  // Web reads the caret from the input. Native sends onChangeText and onSelectionChange in either order, so the caret comes from the text change.
  const caretAfter = (typed: string) => web
    ? (input.current as unknown as HTMLInputElement | null)?.selectionStart ?? typed.length
    : caretAfterEdit(text.current, typed);
  // Native cannot cancel the platform's own Backspace, and onKeyPress may come before or after onChangeText. A change that removed
  // only one separator is that Backspace, so it removes the digit before the separator instead, like Web.
  const separatorBackspace = (typed: string) => {
    const before = text.current;
    if (web || typed.length !== before.length - 1) return false;
    const at = caretAfterEdit(before, typed);
    if (before[at] !== "," || before.slice(0, at) + before.slice(at + 1) !== typed) return false;
    return removeSeparator("Backspace", at + 1, at + 1);
  };
  const change = (typed: string) => {
    if (composing.current) { dirty.current = true; put({ text: typed }); return; }
    if (separatorBackspace(typed)) return;
    // Native reports only the text, so a change that grew by more than one character is read as a paste.
    edit(typed, caretAfter(typed), isPasteEdit(text.current, typed));
  };
  const commit = (typed = text.current) => {
    if (composing.current || !dirty.current || disabled || readOnly) return;
    dirty.current = false;
    const next = commitNumber(sanitizeNumber(typed, o), o);
    const found = rangeIssue(next, o);
    put({ text: formatNumber(next, o) });
    setIssue(found);
    acceptedIssue.current = found;
    report(next);
    if (next !== accepted.current) { accepted.current = next; onChangeCommit?.(next); }
  };
  const cancel = () => {
    dirty.current = false;
    put({ text: shown(accepted.current) });
    setIssue(acceptedIssue.current);
    report(accepted.current);
  };
  const removeSeparator = (key: "Backspace" | "Delete", start: number, end: number) => {
    const removed = deleteAcrossSeparator(text.current, start, end, key);
    if (!removed) return false;
    dirty.current = true;
    show(sanitizeNumber(removed.text, o), removed.caret);
    return true;
  };
  // Web: DOM keydown can prevent the browser's own deletion and see IME state, like the React package.
  const keydown = (event: KeyboardEvent) => {
    if (disabled || readOnly || isComposingKey(event, composing.current)) return;
    if (event.key === "Escape" && dirty.current) {
      event.preventDefault();
      event.stopPropagation();
      cancelledEscape.current = true;
      cancel();
      return;
    }
    if (event.key === "Enter") { commit(); return; }
    if ((event.key !== "Backspace" && event.key !== "Delete") || event.altKey || event.ctrlKey || event.metaKey) return;
    const el = event.currentTarget as HTMLInputElement;
    if (removeSeparator(event.key, el.selectionStart ?? 0, el.selectionEnd ?? 0)) event.preventDefault();
  };
  // Native: a hardware Escape cancels the edit (separator Backspace is read from the text change above).
  const keyPress = (event: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
    if (!disabled && !readOnly && event.nativeEvent.key === "Escape" && dirty.current) cancel();
  };
  // A report about text that is no longer on screen (Firefox reports the old caret on the same keydown that reformats) keeps
  // the requested caret; React Native Web sends the input's text with the selection, other platforms do not.
  const selectionChange = (event: NativeSyntheticEvent<TextInputSelectionChangeEventData>) => {
    const reported = (event.nativeEvent as { text?: string }).text;
    if (reported !== undefined && reported !== text.current) return;
    selection.current = event.nativeEvent.selection;
    setView(old => old.selection ? { text: old.text } : old);
  };
  const compositionEnd = (el: HTMLInputElement) => {
    composing.current = false;
    edit(el.value, el.selectionStart ?? el.value.length, isPasteEdit(composedFrom.current, el.value));
    // Some IMEs end composition after blur, when the blur commit was skipped; commit now so the field does not stay dirty.
    if (el.ownerDocument.activeElement !== el) commit(el.value);
  };

  const handlers = useRef({ keydown, compositionEnd });
  handlers.current = { keydown, compositionEnd };
  useEffect(() => {
    if (!web) return;
    const el = input.current as unknown as HTMLInputElement | null;
    if (!el) return;
    const down = (event: KeyboardEvent) => handlers.current.keydown(event);
    // React Native Web's Modal dismisses on keyup, after our keydown cancellation.
    const up = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || !cancelledEscape.current) return;
      cancelledEscape.current = false;
      event.preventDefault();
      event.stopPropagation();
    };
    const start = () => { composing.current = true; composedFrom.current = text.current; };
    const end = () => handlers.current.compositionEnd(el);
    el.addEventListener("keydown", down); el.addEventListener("keyup", up);
    el.addEventListener("compositionstart", start); el.addEventListener("compositionend", end);
    return () => {
      el.removeEventListener("keydown", down); el.removeEventListener("keyup", up);
      el.removeEventListener("compositionstart", start); el.removeEventListener("compositionend", end);
    };
  }, []);

  const raw = sanitizeNumber(view.text, o);
  const aid = readingAid ? readNumber(raw, o, scope) : "";
  // A caller's error or the group's error wins; the built-in range message then stays out of the way.
  const message = issue && !error && !field?.error ? rangeMessage(issue, o, scope) : "";
  const keyboard = numberKeyboard(o);
  return <View style={style} {...(web ? { dataSet: { format: o.format, align } } : {})}>
    <KjunInput ref={input} value={view.text} size={size} prefix={prefix} suffix={suffix ?? o.suffix}
      disabled={disabled} readOnly={readOnly} error={error} errorMessage={message} nativeID={id} ariaLabel={ariaLabel}
      placeholder={placeholder} accessibilityHint={aid || undefined} selection={view.selection} onSelectionChange={selectionChange}
      onChangeText={change} onBlur={() => commit()}
      {...(web
        ? { inputMode: keyboard.inputMode, "aria-describedby": aid ? aidId : undefined, blurOnSubmit: false }
        : { keyboardType: Platform.select({ ios: keyboard.ios, default: keyboard.android }) as KeyboardTypeOptions, onKeyPress: keyPress, onSubmitEditing: () => commit() })}
      style={{ fontFamily: numericFontFamily || fontFamily, fontVariant: ["tabular-nums"], textAlign: align === "end" ? "right" : undefined }} />
    {!!aid && <FontText nativeID={aidId} style={{ fontFamily, ...typeStyle("caption"), marginTop: tokens.extensions.form.messageGap, color: colors.textSecondary }}>{aid}</FontText>}
  </View>;
}
