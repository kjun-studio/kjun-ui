import { computed, nextTick, onBeforeUnmount, ref, shallowRef, watch, watchEffect, type ExtractPublicPropTypes, type PropType, type SlotsType, type VNodeChild } from "vue";
import { isComposingKey, type InputSize } from "@kjun-ui/tokens";
import {
  addsTooManyDigits, caretForCount, commitNumber, deleteAcrossSeparator, formatNumber, isPasteEdit, numberKeyboard, rangeIssue, rangeMessage,
  readingAid as readNumber, resolveNumberInput, sameNumber, sanitizeNumber, type NumberInputFormat,
} from "../../../shared/package-runtime/number-input";
import { defineComponent } from "./runtime/component";
import { useKjunMessageScope } from "./runtime/messages";
import { KjunInput, useKjunField, useKjunId } from "./input";

const kjunNumberInputProps = {
  /** Normalized value without group separators: "", "1250000", "-3.5", "12.50". */
  modelValue: { type: String, required: true },
  format: { type: String as PropType<NumberInputFormat>, default: undefined },
  decimals: { type: Number, default: undefined },
  grouping: { type: Boolean, default: undefined },
  allowNegative: { type: Boolean, default: undefined },
  min: { type: Number, default: undefined },
  max: { type: Number, default: undefined },
  prefix: { type: String, default: undefined },
  suffix: { type: String, default: undefined },
  /** Shows "1억 2,003만 5,000 원" under the field for integers of 10,000 or more. */
  readingAid: { type: Boolean, default: false },
  align: { type: String as PropType<"start" | "end">, default: "start" },
  size: { type: String as PropType<InputSize>, default: "md" },
  disabled: { type: Boolean, default: false },
  readOnly: { type: Boolean, default: false },
  error: { type: Boolean, default: false },
  id: { type: String, default: undefined },
  ariaLabel: { type: String, default: undefined },
  placeholder: { type: String, default: undefined },
  /** Submits the normalized value ("1250000", fraction padded) with a surrounding form under this name; not sent while disabled. */
  name: { type: String, default: undefined },
} as const;
export type KjunNumberInputProps = ExtractPublicPropTypes<typeof kjunNumberInputProps>;

type View = { text: string; caret: number | null };
type Issue = "min" | "max" | null;

/** v-model; `update:modelValue` on every edit (unpadded, and again when commit or Escape changes it), `change` on blur/Enter with the fraction padded. */
export const KjunNumberInput = defineComponent({
  name: "KjunNumberInput",
  props: kjunNumberInputProps,
  emits: { "update:modelValue": (_value: string) => true, change: (_value: string) => true },
  slots: Object as SlotsType<{ prefix?: () => VNodeChild; suffix?: () => VNodeChild }>,
  setup(props, { emit, slots }) {
    const scope = useKjunMessageScope();
    const field = useKjunField();
    // Only a text suffix reaches the messages; a slot suffix is decoration (null keeps it from falling back to the preset).
    const o = computed(() => resolveNumberInput({
      format: props.format, decimals: props.decimals, grouping: props.grouping, allowNegative: props.allowNegative,
      min: props.min, max: props.max, suffix: slots.suffix ? null : props.suffix,
    }));
    const shown = (raw: string) => formatNumber(sanitizeNumber(raw, o.value), o.value);
    const outOfRange = (raw: string) => rangeIssue(sanitizeNumber(raw, o.value), o.value);
    const view = shallowRef<View>({ text: shown(props.modelValue), caret: null });
    const issue = ref<Issue>(null);
    const input = ref<InstanceType<typeof KjunInput> | null>(null);
    let composing = false, dirty = false;
    // The text before a composition: an IME (or Firefox inserting text) that adds several characters at once is read as a paste.
    let composedFrom = "";
    // `emitted` is the last value this field reported; `accepted` the last committed one, which Escape restores.
    let emitted = props.modelValue, accepted = props.modelValue, acceptedIssue: Issue = null;
    const aidId = useKjunId("kjun-number-reading-");
    // A caller's error or the group's error wins; the built-in range message then stays out of the way. In a FormGroup the
    // message takes the group's error slot, in place of the hint.
    const message = computed(() => issue.value && !props.error && !field.value?.error ? rangeMessage(issue.value, o.value, scope.value) : "");
    const owner = useKjunId("kjun-number-");
    watchEffect(() => { field.value?.reportError?.(owner, message.value); });
    onBeforeUnmount(() => field.value?.reportError?.(owner, ""));

    // The input is controlled through KjunInput's value, which Vue only patches when the text changes; this puts back
    // the text (a rejected letter) and the caret after the DOM update.
    const apply = async (next: View) => {
      view.value = next;
      await nextTick();
      const el = input.value?.el;
      if (!el) return;
      if (el.value !== next.text) el.value = next.text;
      if (next.caret !== null && el.ownerDocument.activeElement === el) el.setSelectionRange(next.caret, next.caret);
    };
    // A new value from outside rebuilds the text and ends an edit in progress (an app's quick-amount button), unless it is the
    // same number as the draft: a parent that echoes "12" for "12." must not drop the dot.
    watch(() => props.modelValue, value => {
      if (value === emitted || (dirty && sameNumber(value, emitted))) return;
      dirty = false;
      emitted = accepted = value;
      acceptedIssue = issue.value = outOfRange(value);
      const text = shown(value);
      void apply({ text, caret: text.length });
    });
    // Options can change how the same value is written (grouping, decimals) and whether it is in range (min, max).
    watch(o, () => {
      acceptedIssue = outOfRange(accepted);
      if (dirty) return;
      issue.value = acceptedIssue;
      const text = shown(accepted);
      if (view.value.text !== text) void apply({ text, caret: null });
    });

    const report = (raw: string) => {
      if (raw === emitted) return;
      emitted = raw;
      emit("update:modelValue", raw);
    };
    // `count` is how many digits, "." and "-" of the cleaned text sit before the caret.
    const show = (raw: string, count: number) => {
      const text = formatNumber(raw, o.value);
      void apply({ text, caret: Math.min(caretForCount(text, count), text.length) });
      if (issue.value && !rangeIssue(raw, o.value)) issue.value = null;
      report(raw);
    };
    const edit = (text: string, caret: number, pasted = false) => {
      const previous = view.value.text;
      // A digit typed past the integer limit is refused: the text and the caret stay where they were.
      if (!pasted && addsTooManyDigits(previous, text, o.value)) {
        void apply({ text: previous, caret: Math.max(0, caret - (text.length - previous.length)) });
        return;
      }
      dirty = true;
      const raw = sanitizeNumber(text, o.value, { pasted });
      // Cleaning the text before the caret counts what survives there: ".5" grows to "0.5", "007" shrinks to "7", a "-" anywhere moves to the front.
      const before = sanitizeNumber(text.slice(0, caret), o.value, { pasted });
      show(raw, before.length + (raw.startsWith("-") && !before.startsWith("-") ? 1 : 0));
    };
    const change = (event: Event) => {
      const el = event.target as HTMLInputElement;
      if (composing) { dirty = true; void apply({ text: el.value, caret: null }); return; }
      edit(el.value, el.selectionStart ?? el.value.length, isPasteEdit(view.value.text, el.value, (event as InputEvent).inputType));
    };
    const commit = (text = view.value.text) => {
      if (composing || !dirty || props.disabled || props.readOnly) return;
      dirty = false;
      const next = commitNumber(sanitizeNumber(text, o.value), o.value);
      const found = rangeIssue(next, o.value);
      void apply({ text: formatNumber(next, o.value), caret: null });
      issue.value = found;
      acceptedIssue = found;
      report(next);
      if (next !== accepted) { accepted = next; emit("change", next); }
    };
    const key = (event: KeyboardEvent) => {
      if (props.disabled || props.readOnly || isComposingKey(event, composing)) return;
      if (event.key === "Escape" && dirty) {
        event.preventDefault();
        event.stopPropagation();
        dirty = false;
        void apply({ text: shown(accepted), caret: null });
        issue.value = acceptedIssue;
        report(accepted);
        return;
      }
      if ((event.key !== "Backspace" && event.key !== "Delete") || event.altKey || event.ctrlKey || event.metaKey) return;
      const el = event.currentTarget as HTMLInputElement;
      const removed = deleteAcrossSeparator(el.value, el.selectionStart ?? 0, el.selectionEnd ?? 0, event.key);
      if (!removed) return;
      event.preventDefault();
      dirty = true;
      show(sanitizeNumber(removed.text, o.value), removed.caret);
    };

    return () => {
      const resolved = o.value;
      const raw = sanitizeNumber(view.value.text, resolved);
      const aid = props.readingAid ? readNumber(raw, resolved, scope.value) : "";
      const routed = !!field.value?.reportError;
      // Attributes that reach the <input> through KjunInput's attrs pass-through.
      const attrs = {
        type: "text", inputmode: numberKeyboard(resolved).inputMode, placeholder: props.placeholder,
        "aria-describedby": aid ? aidId : undefined,
        onInput: change, onBlur: () => commit(), onKeydown: key,
        onCompositionstart: () => { composing = true; composedFrom = view.value.text; },
        onCompositionend: (event: CompositionEvent) => {
          composing = false;
          const el = event.currentTarget as HTMLInputElement;
          edit(el.value, el.selectionStart ?? el.value.length, isPasteEdit(composedFrom, el.value));
          // Some IMEs end composition after blur, when the blur commit was skipped; commit now so the field does not stay dirty.
          if (el.ownerDocument.activeElement !== el) commit(el.value);
        },
      };
      return <div class="kjun-number-input" data-format={resolved.format} data-align={props.align}>
        <KjunInput ref={input} {...attrs} modelValue={view.value.text} size={props.size}
          prefix={props.prefix} suffix={props.suffix ?? resolved.suffix} disabled={props.disabled} readOnly={props.readOnly} error={props.error || (routed && !!message.value)}
          errorMessage={routed ? "" : message.value} id={props.id} ariaLabel={props.ariaLabel} onEnter={() => commit()}>
          {{ prefix: slots.prefix, suffix: slots.suffix }}
        </KjunInput>
        {aid && <p id={aidId} class="kjun-form-hint kjun-number-input-reading">{aid}</p>}
        {props.name && <input type="hidden" name={props.name} value={commitNumber(raw, resolved)} disabled={props.disabled} />}
      </div>;
    };
  },
});
